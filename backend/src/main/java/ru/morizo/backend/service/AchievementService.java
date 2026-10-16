package ru.morizo.backend.service;

import jakarta.persistence.EntityNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import ru.morizo.backend.entity.Achievement;
import ru.morizo.backend.entity.PlaySession;
import ru.morizo.backend.entity.UserAchievement;
import ru.morizo.backend.repo.AchievementRepository;
import ru.morizo.backend.repo.PlaySessionRepository;
import ru.morizo.backend.repo.UserAchievementRepository;
import ru.morizo.backend.repo.UserRepository;
import ru.morizo.backend.web.dto.ProfileDtos.AchievementDto;

import java.util.ArrayList;
import java.util.List;

/**
 * Система достижений (ТЗ 3.5, бейджи).
 * Выдаётся игроку, создавшему сессию прохождения.
 */
@Service
public class AchievementService {

    public static final String FIRST_STEPS = "FIRST_STEPS";
    public static final String SPRINTER = "SPRINTER";
    public static final String NO_HINTS = "NO_HINTS";
    public static final String FIVE_QUESTS = "FIVE_QUESTS";
    public static final String EXPLORER = "EXPLORER";

    private final AchievementRepository achievements;
    private final UserAchievementRepository userAchievements;
    private final PlaySessionRepository sessions;
    private final UserRepository users;

    public AchievementService(AchievementRepository achievements,
                              UserAchievementRepository userAchievements,
                              PlaySessionRepository sessions,
                              UserRepository users) {
        this.achievements = achievements;
        this.userAchievements = userAchievements;
        this.sessions = sessions;
        this.users = users;
    }

    /** Создаёт эталонный набор достижений (вызывается сидом). */
    @Transactional
    public void ensureDefaults() {
        upsert(FIRST_STEPS, "Первые шаги", "Завершите свой первый квест", "#FFC107");
        upsert(SPRINTER, "Спринтер", "Завершите квест быстрее половины заявленного времени", "#F59E0B");
        upsert(NO_HINTS, "Без подсказок", "Пройдите квест, не открыв ни одной подсказки", "#10B981");
        upsert(FIVE_QUESTS, "Пятёрочка", "Завершите 5 квестов", "#3B82F6");
        upsert(EXPLORER, "Исследователь НН", "Пройдите суммарно 10 чекпоинтов", "#8B5CF6");
    }

    private void upsert(String code, String title, String description, String color) {
        if (achievements.findByCode(code).isEmpty()) {
            Achievement a = new Achievement();
            a.setCode(code);
            a.setTitle(title);
            a.setDescription(description);
            a.setColor(color);
            achievements.save(a);
        }
    }

    /**
     * Проверяет условия и выдаёт новые достижения после завершения сессии.
     *
     * @return коды достижений, выданных именно сейчас
     */
    @Transactional
    public List<String> onSessionCompleted(PlaySession session, boolean fastEnough, boolean hintsUsed) {
        Long userId = session.getUser().getId();
        List<String> newly = new ArrayList<>();
        newly.addAll(award(userId, FIRST_STEPS));
        if (fastEnough) newly.addAll(award(userId, SPRINTER));
        if (!hintsUsed) newly.addAll(award(userId, NO_HINTS));

        if (completedQuestCount(userId) >= 5) {
            newly.addAll(award(userId, FIVE_QUESTS));
        }

        long checkpoints = sessions.completedByUserSince(userId, null).stream()
                .mapToLong(PlaySession::getCompletedCount)
                .sum();
        if (checkpoints >= 10) {
            newly.addAll(award(userId, EXPLORER));
        }
        return newly;
    }

    @Transactional
    public List<String> award(Long userId, String code) {
        if (userAchievements.existsByUserIdAndAchievementCode(userId, code)) {
            return List.of();
        }
        Achievement a = achievements.findByCode(code).orElse(null);
        if (a == null) {
            return List.of();
        }
        UserAchievement ua = new UserAchievement();
        ua.setUser(users.findById(userId)
                .orElseThrow(() -> new EntityNotFoundException("Пользователь не найден")));
        ua.setAchievement(a);
        userAchievements.save(ua);
        return List.of(code);
    }

    @Transactional(readOnly = true)
    public List<AchievementDto> forUser(Long userId) {
        return userAchievements.findByUserIdOrderByEarnedAtDesc(userId).stream()
                .map(ua -> new AchievementDto(ua.getAchievement().getId(),
                        ua.getAchievement().getTitle(),
                        ua.getAchievement().getDescription(),
                        ua.getAchievement().getColor()))
                .toList();
    }

    @Transactional(readOnly = true)
    public long completedQuestCount(Long userId) {
        return sessions.completedByUserSince(userId, null).size();
    }
}
