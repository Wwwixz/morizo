package ru.morizo.backend.service;

import jakarta.persistence.EntityNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import ru.morizo.backend.entity.Checkpoint;
import ru.morizo.backend.entity.CheckpointResult;
import ru.morizo.backend.entity.PlaySession;
import ru.morizo.backend.entity.Quest;
import ru.morizo.backend.entity.Team;
import ru.morizo.backend.entity.TeamMember;
import ru.morizo.backend.entity.UserEntity;
import ru.morizo.backend.repo.CheckpointResultRepository;
import ru.morizo.backend.repo.PlaySessionRepository;
import ru.morizo.backend.repo.TeamMemberRepository;
import ru.morizo.backend.web.dto.PlayDtos.AnswerResponse;
import ru.morizo.backend.web.dto.PlayDtos.SessionDto;
import ru.morizo.backend.web.dto.PlayDtos.StartSessionRequest;
import ru.morizo.backend.web.dto.QuestDtos.QuestPointDto;

import java.time.Duration;
import java.time.Instant;
import java.util.Comparator;
import java.util.List;

/**
 * Сессия прохождения квеста (ТЗ 3.4) + античит и скоринг (ТЗ 3.5).
 *
 * Строгий порядок: доступен только текущий чекпоинт, следующий открывается
 * после успешного выполнения. Код-слово сравнивается без учёта регистра,
 * вопрос — по выбранному варианту.
 */
@Service
public class PlaySessionService {

    private final PlaySessionRepository sessions;
    private final CheckpointResultRepository results;
    private final TeamMemberRepository members;
    private final QuestService quests;
    private final TeamService teams;
    private final Scoring scoring;
    private final AchievementService achievements;
    private final QuestMapper mapper;

    public PlaySessionService(PlaySessionRepository sessions, CheckpointResultRepository results,
                              TeamMemberRepository members, QuestService quests, TeamService teams,
                              Scoring scoring, AchievementService achievements, QuestMapper mapper) {
        this.sessions = sessions;
        this.results = results;
        this.members = members;
        this.quests = quests;
        this.teams = teams;
        this.scoring = scoring;
        this.achievements = achievements;
        this.mapper = mapper;
    }

    /** «Начать квест»: соло или командой. Повторный вызов возвращает активную сессию. */
    @Transactional
    public SessionDto start(UserEntity user, StartSessionRequest req) {
        Quest quest = quests.findQuest(req.questId());
        if (quest.getStatus() != Quest.Status.PUBLISHED) {
            throw BusinessException.conflict("Квест недоступен для прохождения (не опубликован)");
        }

        Team team = null;
        if (req.teamId() != null) {
            team = teams.findTeam(req.teamId());
            if (!members.isMember(team, user)) {
                throw BusinessException.forbidden("Вы не состоите в команде «%s»".formatted(team.getName()));
            }
            // ТЗ 3.5: нельзя проходить квест, если в команде есть его создатель
            for (TeamMember m : members.findByTeamId(team.getId())) {
                if (m.getUser().getId().equals(quest.getAuthor().getId())) {
                    throw BusinessException.forbidden("Нельзя проходить квест, если в команде есть его создатель");
                }
            }
            if (members.countByTeamId(team.getId()) > 6) {
                throw BusinessException.badRequest("В команде не может быть больше 6 человек");
            }
        }

        // уже есть активная сессия — продолжаем её
        Team sessionTeam = team;
        var existing = sessions.findActiveByQuestAndUser(quest.getId(), user.getId());
        PlaySession session = existing.orElseGet(() -> createSession(user, quest, sessionTeam));
        return toDto(session, null);
    }

    private PlaySession createSession(UserEntity user, Quest quest, Team team) {
        PlaySession s = new PlaySession();
        s.setQuest(quest);
        s.setTeam(team);
        s.setUser(user);
        // античит 3.5: тот же квест засчитывается в рейтинг 1 раз в 24 ч
        s.setCountedForRating(isCountable(user, quest, team));
        return sessions.save(s);
    }

    private boolean isCountable(UserEntity user, Quest quest, Team team) {
        if (team != null) {
            return sessions.findFirstByQuestIdAndTeamIdAndStatusAndCountedForRatingTrueOrderByFinishedAtDesc(
                    quest.getId(), team.getId(), PlaySession.Status.COMPLETED)
                    .map(s -> Duration.between(s.getFinishedAt(), Instant.now()).toHours() >= Scoring.ANTI_CHEAT_COOLDOWN_HOURS)
                    .orElse(true);
        }
        return sessions.findFirstByQuestIdAndUserIdAndTeamIsNullAndStatusAndCountedForRatingTrueOrderByFinishedAtDesc(
                quest.getId(), user.getId(), PlaySession.Status.COMPLETED)
                .map(s -> Duration.between(s.getFinishedAt(), Instant.now()).toHours() >= Scoring.ANTI_CHEAT_COOLDOWN_HOURS)
                .orElse(true);
    }

    /** Текущее состояние сессии. */
    @Transactional(readOnly = true)
    public SessionDto get(UserEntity user, Long sessionId) {
        PlaySession s = findOwned(user, sessionId);
        return toDto(s, null);
    }

    /**
     * Проверка ответа на текущем чекпоинте.
     * Код-слово — без учёта регистра (и ё=е), вопрос — совпадение варианта.
     */
    @Transactional
    public AnswerResponse submitAnswer(UserEntity user, Long sessionId, String rawAnswer) {
        PlaySession s = findOwned(user, sessionId);
        if (!s.isActive()) {
            throw BusinessException.conflict("Сессия уже завершена");
        }
        if (rawAnswer == null || rawAnswer.isBlank()) {
            throw BusinessException.badRequest("Введите ответ");
        }

        List<Checkpoint> ordered = s.getQuest().orderedCheckpoints();
        Checkpoint current = ordered.get(s.getCurrentPosition());

        CheckpointResult result = results.findBySessionIdAndCheckpointId(s.getId(), current.getId())
                .orElseGet(() -> {
                    CheckpointResult r = new CheckpointResult();
                    r.setSession(s);
                    r.setCheckpoint(current);
                    return r;
                });

        // античит-лайт: задержка между попытками
        Instant now = Instant.now();
        if (result.getNextAttemptAllowedAt() != null && now.isBefore(result.getNextAttemptAllowedAt())) {
            long waitMs = Duration.between(now, result.getNextAttemptAllowedAt()).toMillis();
            throw new BusinessException(org.springframework.http.HttpStatus.TOO_MANY_REQUESTS,
                    "Слишком быстро! Подождите пару секунд перед следующей попыткой");
        }

        boolean correct = QuestService.normalize(rawAnswer).equals(QuestService.normalize(current.getAnswer()));
        if (!correct) {
            result.setAttempts(result.getAttempts() + 1);
            long delay = Math.min(Scoring.RETRY_DELAY_SECONDS * (long) result.getAttempts(), 30);
            result.setNextAttemptAllowedAt(now.plusSeconds(delay));
            results.save(result);
            if (result.getAttempts() >= Scoring.MAX_ATTEMPTS) {
                throw BusinessException.forbidden(
                        "Превышен лимит неверных попыток (%d). Подумайте ещё и загляните в подсказку!"
                                .formatted(Scoring.MAX_ATTEMPTS));
            }
            return new AnswerResponse(false, s.getCurrentPosition(), ordered.size(),
                    progress(s), false, s.getScore(), 0,
                    Scoring.MAX_ATTEMPTS - result.getAttempts(), null, List.of());
        }

        // верно: фиксируем результат и двигаемся дальше
        result.setCorrect(true);
        result.setCompletedAt(now);
        result.setNextAttemptAllowedAt(null);
        results.save(result);

        s.setCompletedCount(s.getCompletedCount() + 1);
        s.setCurrentPosition(s.getCurrentPosition() + 1);
        s.setStatus(PlaySession.Status.IN_PROGRESS);

        boolean finished = s.getCurrentPosition() >= ordered.size();
        List<String> newAchievements = List.of();
        int gained = 0;
        if (finished) {
            s.setStatus(PlaySession.Status.COMPLETED);
            s.setFinishedAt(now);

            long elapsedSec = Duration.between(s.getStartedAt(), now).getSeconds();
            boolean fastEnough = elapsedSec < s.getQuest().getDurationMin() * 60L / 2;
            double multiplier = s.getQuest().getTransportMode().getScoreMultiplier();
            s.setScore(scoring.questCompletionScore(ordered.size(), s.getQuest().getDifficulty(), fastEnough, multiplier));
            gained = s.getScore();
            newAchievements = achievements.onSessionCompleted(s, fastEnough, hintsUsed(s));
        }
        sessions.save(s);

        return new AnswerResponse(true, Math.min(s.getCurrentPosition(), ordered.size()), ordered.size(),
                progress(s), finished, s.getScore(), gained,
                Scoring.MAX_ATTEMPTS, null, newAchievements);
    }

    /** «Брошено»: игрок вышел, не завершив квест. */
    @Transactional
    public SessionDto abandon(UserEntity user, Long sessionId) {
        PlaySession s = findOwned(user, sessionId);
        if (s.isActive()) {
            s.setStatus(PlaySession.Status.ABANDONED);
            s.setFinishedAt(Instant.now());
            sessions.save(s);
        }
        return toDto(s, null);
    }

    /** Открыть подсказку текущей точки (влияет на достижение «Без подсказок»). */
    @Transactional
    public QuestPointDto useHint(UserEntity user, Long sessionId) {
        PlaySession s = findOwned(user, sessionId);
        if (!s.isActive()) {
            throw BusinessException.conflict("Сессия уже завершена");
        }
        Checkpoint current = s.getQuest().orderedCheckpoints().get(s.getCurrentPosition());
        CheckpointResult result = results.findBySessionIdAndCheckpointId(s.getId(), current.getId())
                .orElseGet(() -> {
                    CheckpointResult r = new CheckpointResult();
                    r.setSession(s);
                    r.setCheckpoint(current);
                    return r;
                });
        result.setHintUsed(true);
        results.save(result);
        return mapper.toPointDto(current);
    }

    /** Активная сессия пользователя по квесту (для возобновления). */
    @Transactional(readOnly = true)
    public SessionDto activeForQuest(UserEntity user, Long questId) {
        return sessions.findActiveByQuestAndUser(questId, user.getId())
                .map(s -> toDto(s, null))
                .orElse(null);
    }

    // ============ Вспомогательное ============

    private PlaySession findOwned(UserEntity user, Long sessionId) {
        return sessions.findByIdAndUserId(sessionId, user.getId())
                .orElseThrow(() -> new EntityNotFoundException("Сессия прохождения #%d не найдена".formatted(sessionId)));
    }

    private boolean hintsUsed(PlaySession s) {
        return results.countBySessionIdAndHintUsedTrue(s.getId()) > 0;
    }

    private String progress(PlaySession s) {
        return "%d/%d точек".formatted(s.getCompletedCount(), s.getQuest().getCheckpoints().size());
    }

    private SessionDto toDto(PlaySession s, Integer scoreGained) {
        List<Checkpoint> ordered = s.getQuest().orderedCheckpoints();
        boolean finished = s.getStatus() == PlaySession.Status.COMPLETED;

        // игрок видит только пройденные и текущую точку (строгий порядок)
        int visible = finished ? ordered.size() : s.getCurrentPosition() + 1;
        List<QuestPointDto> points = ordered.subList(0, visible).stream()
                .map(mapper::toPointDto)
                .toList();

        QuestPointDto currentPoint = finished || s.getCurrentPosition() >= ordered.size()
                ? null
                : mapper.toPointDto(ordered.get(s.getCurrentPosition()));

        return new SessionDto(
                s.getId(),
                s.getQuest().getId(),
                s.getQuest().getTitle(),
                s.getStatus().name(),
                s.getCurrentPosition(),
                ordered.size(),
                progress(s),
                s.getScore(),
                finished,
                currentPoint,
                points,
                s.getTeam() == null ? null : s.getTeam().getId(),
                s.isCountedForRating(),
                s.getStartedAt().toEpochMilli(),
                s.getFinishedAt() == null ? null : s.getFinishedAt().toEpochMilli()
        );
    }
}
