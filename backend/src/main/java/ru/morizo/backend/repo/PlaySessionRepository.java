package ru.morizo.backend.repo;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import ru.morizo.backend.entity.PlaySession;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

public interface PlaySessionRepository extends JpaRepository<PlaySession, Long> {

    List<PlaySession> findByQuestId(Long questId);

    List<PlaySession> findByUserId(Long userId);

    List<PlaySession> findByTeamId(Long teamId);

    Optional<PlaySession> findByIdAndUserId(Long id, Long userId);

    /** активная (незавершённая и не брошенная) сессия игрока по квесту */
    @Query("""
            SELECT s FROM PlaySession s
            WHERE s.quest.id = :questId AND s.user.id = :userId AND s.status IN (ru.morizo.backend.entity.PlaySession.Status.STARTED, ru.morizo.backend.entity.PlaySession.Status.IN_PROGRESS)
            """)
    Optional<PlaySession> findActiveByQuestAndUser(@Param("questId") Long questId, @Param("userId") Long userId);

    /** все завершённые сессии (для рейтинга и статистики) */
    List<PlaySession> findByStatusAndCountedForRatingTrue(PlaySession.Status status);

    /** завершённые сессии команды за период — очки команды в рейтинге */
    @Query("""
            SELECT s FROM PlaySession s
            WHERE s.team.id = :teamId AND s.status = 'COMPLETED' AND s.countedForRating = true
              AND (:from IS NULL OR s.finishedAt >= :from)
            """)
    List<PlaySession> completedByTeamSince(@Param("teamId") Long teamId, @Param("from") Instant from);

    /** завершённые сессии игрока (соло + командные) за период — очки игрока в рейтинге */
    @Query("""
            SELECT s FROM PlaySession s
            WHERE s.user.id = :userId AND s.status = 'COMPLETED' AND s.countedForRating = true
              AND (:from IS NULL OR s.finishedAt >= :from)
            """)
    List<PlaySession> completedByUserSince(@Param("userId") Long userId, @Param("from") Instant from);

    /** последнее зачётное прохождение квеста командой — для античита «1 раз в 24 ч» */
    Optional<PlaySession> findFirstByQuestIdAndTeamIdAndStatusAndCountedForRatingTrueOrderByFinishedAtDesc(
            Long questId, Long teamId, PlaySession.Status status);

    /** последнее зачётное соло-прохождение квеста игроком — для античита «1 раз в 24 ч» */
    Optional<PlaySession> findFirstByQuestIdAndUserIdAndTeamIsNullAndStatusAndCountedForRatingTrueOrderByFinishedAtDesc(
            Long questId, Long userId, PlaySession.Status status);
}
