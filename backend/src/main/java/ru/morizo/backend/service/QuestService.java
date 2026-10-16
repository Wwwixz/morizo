package ru.morizo.backend.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import ru.morizo.backend.entity.Checkpoint;
import ru.morizo.backend.entity.Quest;
import ru.morizo.backend.entity.UserEntity;
import ru.morizo.backend.repo.PlaySessionRepository;
import ru.morizo.backend.repo.QuestRepository;
import ru.morizo.backend.web.dto.QuestDtos.CheckpointCreateDto;
import ru.morizo.backend.web.dto.QuestDtos.CreateQuestRequest;
import ru.morizo.backend.web.dto.QuestDtos.QuestDto;

import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class QuestService {

    private final QuestRepository quests;
    private final PlaySessionRepository sessions;
    private final GeoService geo;
    private final QuestMapper mapper;
    private final FileStorageService files;
    private final ObjectMapper json = new ObjectMapper();

    public QuestService(QuestRepository quests, PlaySessionRepository sessions,
                        GeoService geo, QuestMapper mapper, FileStorageService files) {
        this.quests = quests;
        this.sessions = sessions;
        this.geo = geo;
        this.mapper = mapper;
        this.files = files;
    }

    // ============ Создание ============

    /**
     * Создание квеста (ТЗ 3.2): валидация полей, минимум 3 чекпоинта,
     * сохранение как ON_MODERATION (уходит модератору).
     */
    @Transactional
    public QuestDto create(UserEntity author, CreateQuestRequest req, MultipartFile cover) {
        validate(req);

        Quest quest = new Quest();
        quest.setAuthor(author);
        quest.setTitle(req.title().trim());
        quest.setDescription(req.description().trim());
        quest.setDistrict(req.district().trim());
        quest.setDifficulty(req.difficulty());
        quest.setDurationMin(req.durationMin() <= 0 ? 60 : req.durationMin());
        quest.setPlayersMin(req.playersMin() == null ? 1 : req.playersMin());
        quest.setPlayersMax(req.playersMax() == null ? 6 : req.playersMax());
        quest.setRules(req.rules());
        quest.setTransportMode(parseTransport(req.transportMode()));
        if (cover != null && !cover.isEmpty()) {
            quest.setImage(files.store(cover));
        }

        for (CheckpointCreateDto p : req.points()) {
            quest.addCheckpoint(toEntity(p));
        }
        quest.setDistanceKm(geo.routeLengthKm(quest.orderedCheckpoints()));
        quest.setStatus(Quest.Status.ON_MODERATION);

        quests.save(quest);
        return mapper.toDto(quest, false, 0, true);
    }

    private void validate(CreateQuestRequest req) {
        if (req.playersMin() != null && req.playersMax() != null && req.playersMin() > req.playersMax()) {
            throw BusinessException.badRequest("Минимум игроков не может быть больше максимума");
        }
        long word = req.points().stream().filter(p -> p.type() == null || p.type().equalsIgnoreCase("WORD")).count();
        long choice = req.points().stream().filter(p -> p.type() != null && p.type().equalsIgnoreCase("CHOICE")).count();
        if (word == 0 && choice == 0) {
            throw BusinessException.badRequest("Добавьте минимум 3 чекпоинта");
        }
        for (int i = 0; i < req.points().size(); i++) {
            CheckpointCreateDto p = req.points().get(i);
            if (p.type() != null && p.type().equalsIgnoreCase("CHOICE")) {
                List<String> options = p.options() == null ? List.of() : p.options();
                if (options.size() != 4) {
                    throw BusinessException.badRequest("Вопрос с вариантами (точка %d): нужно ровно 4 варианта".formatted(i + 1));
                }
                if (options.stream().noneMatch(o -> normalize(o).equals(normalize(p.answer())))) {
                    throw BusinessException.badRequest("Вопрос с вариантами (точка %d): правильный ответ должен совпадать с одним из вариантов".formatted(i + 1));
                }
            }
        }
    }

    private Checkpoint toEntity(CheckpointCreateDto p) {
        Checkpoint c = new Checkpoint();
        c.setLat(p.lat());
        c.setLng(p.lng());
        c.setTitle(p.title().trim());
        c.setTask(p.task().trim());
        boolean choice = p.type() != null && p.type().equalsIgnoreCase("CHOICE");
        c.setType(choice ? Checkpoint.TaskType.CHOICE : Checkpoint.TaskType.WORD);
        c.setAnswer(p.answer().trim());
        if (choice && p.options() != null) {
            try {
                c.setOptionsJson(json.writeValueAsString(p.options()));
            } catch (Exception e) {
                throw BusinessException.badRequest("Не удалось прочитать варианты ответа");
            }
        }
        c.setHint(p.hint());
        c.setPointRules(p.pointRules());
        return c;
    }

    private Quest.TransportMode parseTransport(String mode) {
        if (mode == null || mode.isBlank()) {
            return Quest.TransportMode.FOOT;
        }
        try {
            return Quest.TransportMode.valueOf(mode.toUpperCase().replace('-', '_'));
        } catch (IllegalArgumentException e) {
            throw BusinessException.badRequest("Неизвестный способ передвижения: " + mode);
        }
    }

    // ============ Просмотр ============

    @Transactional(readOnly = true)
    public QuestDto getQuest(Long id) {
        Quest quest = findQuest(id);
        long completions = countCompletions(quest.getId());
        boolean popular = completions >= 3;
        return mapper.toDto(quest, popular, completions, true);
    }

    @Transactional(readOnly = true)
    public List<QuestDto> getMyQuests(UserEntity author) {
        Map<Long, Long> completions = completionCounts();
        return quests.findByAuthorIdOrderByCreatedAtDesc(author.getId()).stream()
                .map(q -> mapper.toDto(q, completions.getOrDefault(q.getId(), 0L) >= 3,
                        completions.getOrDefault(q.getId(), 0L), true))
                .toList();
    }

    /**
     * Лента опубликованных квестов (ТЗ 3.2):
     * пагинация (по умолчанию 10 на страницу), фильтры по длительности, сложности, району
     * и «рядом со мной» (радиус от координат, расчёт расстояния в коде).
     */
    @Transactional(readOnly = true)
    public List<QuestDto> feed(String statusStr, String district, Integer maxDuration,
                               String difficultyGroup, Double lat, Double lng, Double radiusKm,
                               int page, int size) {
        Quest.Status status = switch (statusStr == null ? "published" : statusStr) {
            case "published" -> Quest.Status.PUBLISHED;
            case "pending" -> Quest.Status.ON_MODERATION;
            case "draft" -> Quest.Status.DRAFT;
            case "rejected" -> Quest.Status.REJECTED;
            case "archived" -> Quest.Status.ARCHIVED;
            default -> throw BusinessException.badRequest("Неизвестный статус: " + statusStr);
        };

        int[] diffRange = switch (difficultyGroup == null ? "" : difficultyGroup) {
            case "", "all" -> new int[]{1, 5};
            case "easy" -> new int[]{1, 2};   // «мне только спросить»
            case "medium" -> new int[]{3, 3}; // «я бы ещё поиграл»
            case "pro" -> new int[]{4, 5};    // «работают профи»
            default -> throw BusinessException.badRequest("Неизвестная группа сложности: " + difficultyGroup);
        };

        Pageable pageable = PageRequest.of(Math.max(0, page), Math.min(100, Math.max(1, size)),
                Sort.by(Sort.Direction.DESC, "createdAt"));

        Page<Quest> result = quests.search(status,
                district == null || district.isBlank() ? null : district,
                maxDuration == null || maxDuration <= 0 ? null : maxDuration,
                diffRange[0], diffRange[1], pageable);

        Map<Long, Long> completions = completionCounts();
        List<QuestDto> dtos = result.stream()
                .map(q -> mapper.toDto(q, completions.getOrDefault(q.getId(), 0L) >= 3,
                        completions.getOrDefault(q.getId(), 0L), true))
                .collect(Collectors.toList());

        // «начало рядом со мной»: фильтр по радиусу + сортировка по расстоянию
        if (lat != null && lng != null) {
            double radius = radiusKm == null || radiusKm <= 0 ? 10.0 : radiusKm;
            dtos = dtos.stream()
                    .filter(q -> distanceToQuest(lat, lng, q) <= radius)
                    .sorted(Comparator.comparingDouble(q -> distanceToQuest(lat, lng, q)))
                    .collect(Collectors.toList());
        }
        return dtos;
    }

    @Transactional(readOnly = true)
    public List<QuestDto> questsForModeration(Quest.Status status) {
        Map<Long, Long> completions = completionCounts();
        return quests.findByStatusOrderByCreatedAtDesc(status).stream()
                .map(q -> mapper.toDto(q, false, completions.getOrDefault(q.getId(), 0L), true))
                .toList();
    }

    // ============ Вспомогательное ============

    private double distanceToQuest(double lat, double lng, QuestDto q) {
        if (q.points().isEmpty()) {
            return Double.MAX_VALUE;
        }
        return q.points().stream().mapToDouble(p -> geo.distanceKm(lat, lng, p.lat(), p.lng()))
                .min().orElse(Double.MAX_VALUE);
    }

    private Map<Long, Long> completionCounts() {
        return sessions.findByStatusAndCountedForRatingTrue(ru.morizo.backend.entity.PlaySession.Status.COMPLETED)
                .stream().collect(Collectors.groupingBy(s -> s.getQuest().getId(), Collectors.counting()));
    }

    private long countCompletions(Long questId) {
        return completionCounts().getOrDefault(questId, 0L);
    }

    @Transactional(readOnly = true)
    public Quest findQuest(Long id) {
        Quest q = quests.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Квест #%d не найден".formatted(id)));
        q.getCheckpoints().size(); // lazy load
        return q;
    }

    public static String normalize(String s) {
        return s == null ? "" : s.trim().toLowerCase().replace('ё', 'е').replaceAll("\\s+", " ");
    }
}
