package ru.morizo.backend.repo;

import org.springframework.data.jpa.repository.JpaRepository;
import ru.morizo.backend.entity.CheckpointResult;

import java.util.List;
import java.util.Optional;

public interface CheckpointResultRepository extends JpaRepository<CheckpointResult, Long> {

    List<CheckpointResult> findBySessionId(Long sessionId);

    Optional<CheckpointResult> findBySessionIdAndCheckpointId(Long sessionId, Long checkpointId);

    long countBySessionIdAndCorrectTrue(Long sessionId);

    long countBySessionIdAndHintUsedTrue(Long sessionId);
}
