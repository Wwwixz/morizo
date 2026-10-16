package ru.morizo.backend.service;

import jakarta.persistence.EntityNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import ru.morizo.backend.entity.Complaint;
import ru.morizo.backend.entity.PlaySession;
import ru.morizo.backend.entity.Quest;
import ru.morizo.backend.entity.UserEntity;
import ru.morizo.backend.repo.ComplaintRepository;
import ru.morizo.backend.repo.PlaySessionRepository;
import ru.morizo.backend.repo.QuestRepository;
import ru.morizo.backend.web.dto.QuestDtos.ComplaintDto;
import ru.morizo.backend.web.dto.QuestDtos.ComplaintRequest;
import ru.morizo.backend.web.dto.QuestDtos.ModerationDecisionRequest;
import ru.morizo.backend.web.dto.QuestDtos.QuestDto;

import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.List;

/** Модерация квестов и жалоб (ТЗ 3.6). Все операции — только для роли MODERATOR. */
@Service
public class ModerationService {

    private static final DateTimeFormatter DATE_FMT =
            DateTimeFormatter.ofPattern("dd.MM.yyyy").withZone(ZoneId.systemDefault());

    private final QuestRepository quests;
    private final ComplaintRepository complaints;
    private final QuestMapper mapper;
    private final PlaySessionRepository sessions;

    public ModerationService(QuestRepository quests, ComplaintRepository complaints,
                             QuestMapper mapper, PlaySessionRepository sessions) {
        this.quests = quests;
        this.complaints = complaints;
        this.mapper = mapper;
        this.sessions = sessions;
    }

    @Transactional(readOnly = true)
    public List<QuestDto> queue(Quest.Status status) {
        return quests.findByStatusOrderByCreatedAtDesc(status).stream()
                .map(q -> mapper.toDto(q, false, 0, true))
                .toList();
    }

    /** Подтвердить публикацию: ON_MODERATION -> PUBLISHED. */
    @Transactional
    public QuestDto approve(UserEntity moderator, Long questId) {
        Quest quest = findQuest(questId);
        requireStatus(quest, Quest.Status.ON_MODERATION, "Одобрить можно только квест на модерации");
        quest.setStatus(Quest.Status.PUBLISHED);
        quest.setPublishedAt(java.time.Instant.now());
        quest.setRejectionReason(null);
        quests.save(quest);
        return mapper.toDto(quest, false, 0, true);
    }

    /** Отклонить с причиной: ON_MODERATION -> REJECTED. */
    @Transactional
    public QuestDto reject(UserEntity moderator, Long questId, ModerationDecisionRequest req) {
        if (req == null || req.reason() == null || req.reason().isBlank()) {
            throw BusinessException.badRequest("Укажите причину отклонения");
        }
        Quest quest = findQuest(questId);
        requireStatus(quest, Quest.Status.ON_MODERATION, "Отклонить можно только квест на модерации");
        quest.setStatus(Quest.Status.REJECTED);
        quest.setRejectionReason(req.reason().trim());
        quests.save(quest);
        return mapper.toDto(quest, false, 0, true);
    }

    /** Скрыть квест (например, по жалобам): -> ARCHIVED. */
    @Transactional
    public QuestDto hide(UserEntity moderator, Long questId) {
        Quest quest = findQuest(questId);
        if (quest.getStatus() != Quest.Status.PUBLISHED && quest.getStatus() != Quest.Status.ON_MODERATION) {
            throw BusinessException.conflict("Скрыть можно только опубликованный квест или квест на модерации");
        }
        quest.setStatus(Quest.Status.ARCHIVED);
        quests.save(quest);
        return mapper.toDto(quest, false, 0, true);
    }

    @Transactional
    public ComplaintDto createComplaint(UserEntity author, ComplaintRequest req) {
        Quest quest = findQuest(req.questId());
        Complaint complaint = new Complaint();
        complaint.setQuest(quest);
        complaint.setAuthor(author);
        complaint.setReason(req.reason().trim());
        complaints.save(complaint);
        return toDto(complaint);
    }

    @Transactional(readOnly = true)
    public List<ComplaintDto> listComplaints() {
        return complaints.findAllByOrderByCreatedAtDesc().stream().map(this::toDto).toList();
    }

    /** Жалоба обработана. */
    @Transactional
    public void resolveComplaint(Long id) {
        Complaint complaint = complaints.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Жалоба #%d не найдена".formatted(id)));
        complaint.setStatus(Complaint.Status.RESOLVED);
        complaints.save(complaint);
    }

    private void requireStatus(Quest quest, Quest.Status expected, String message) {
        if (quest.getStatus() != expected) {
            throw BusinessException.conflict(message + " (текущий статус: " + quest.getStatus() + ")");
        }
    }

    private ComplaintDto toDto(Complaint c) {
        return new ComplaintDto(
                c.getId(),
                c.getQuest().getTitle(),
                c.getAuthor().getNickname(),
                c.getReason(),
                DATE_FMT.format(c.getCreatedAt()),
                c.getStatus().name()
        );
    }

    private Quest findQuest(Long id) {
        Quest q = quests.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Квест #%d не найден".formatted(id)));
        q.getCheckpoints().size();
        return q;
    }

    long countCompletions(Long questId) {
        return sessions.findByQuestId(questId).stream()
                .filter(s -> s.getStatus() == PlaySession.Status.COMPLETED)
                .count();
    }
}
