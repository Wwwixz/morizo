package ru.morizo.backend.repo;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import ru.morizo.backend.entity.Quest;

import java.util.List;

public interface QuestRepository extends JpaRepository<Quest, Long> {

    List<Quest> findByStatusOrderByCreatedAtDesc(Quest.Status status);

    Page<Quest> findByStatus(Quest.Status status, Pageable pageable);

    List<Quest> findByAuthorIdOrderByCreatedAtDesc(Long authorId);

    long countByStatus(Quest.Status status);

    /**
     * Лента квестов с фильтрами ТЗ 3.2: сложность (группа), район, длительность.
     * Группа сложности: easy = 1..2, medium = 3, pro = 4..5.
     */
    @Query("""
            SELECT q FROM Quest q
            WHERE q.status = :status
              AND (:district IS NULL OR lower(q.district) LIKE lower(concat('%', :district, '%')))
              AND (:maxDuration IS NULL OR q.durationMin <= :maxDuration)
              AND (:diffMin IS NULL OR q.difficulty >= :diffMin)
              AND (:diffMax IS NULL OR q.difficulty <= :diffMax)
            """)
    Page<Quest> search(@Param("status") Quest.Status status,
                       @Param("district") String district,
                       @Param("maxDuration") Integer maxDuration,
                       @Param("diffMin") Integer diffMin,
                       @Param("diffMax") Integer diffMax,
                       Pageable pageable);
}
