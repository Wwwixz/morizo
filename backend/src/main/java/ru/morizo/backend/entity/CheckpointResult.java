package ru.morizo.backend.entity;

import jakarta.persistence.*;

import java.time.Instant;

/** Результат прохождения конкретного чекпоинта в сессии (античит-лайт: счётчик попыток). */
@Entity
@Table(name = "checkpoint_results", indexes = {
        @Index(name = "idx_results_session", columnList = "session_id"),
        @Index(name = "idx_results_unique", columnList = "session_id, checkpoint_id", unique = true)
})
public class CheckpointResult {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "session_id", nullable = false)
    private PlaySession session;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "checkpoint_id", nullable = false)
    private Checkpoint checkpoint;

    @Column(nullable = false)
    private boolean correct = false;

    /** число неверных попыток (лимит — Scoring.MAX_ATTEMPTS) */
    @Column(nullable = false)
    private int attempts = 0;

    /** была ли использована подсказка (для достижений «без подсказок») */
    @Column(nullable = false)
    private boolean hintUsed = false;

    /** раньше этого момента новая попытка не принимается (античит-лайт) */
    @Column
    private Instant nextAttemptAllowedAt;

    @Column
    private Instant completedAt;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public PlaySession getSession() { return session; }
    public void setSession(PlaySession session) { this.session = session; }

    public Checkpoint getCheckpoint() { return checkpoint; }
    public void setCheckpoint(Checkpoint checkpoint) { this.checkpoint = checkpoint; }

    public boolean isCorrect() { return correct; }
    public void setCorrect(boolean correct) { this.correct = correct; }

    public int getAttempts() { return attempts; }
    public void setAttempts(int attempts) { this.attempts = attempts; }

    public boolean isHintUsed() { return hintUsed; }
    public void setHintUsed(boolean hintUsed) { this.hintUsed = hintUsed; }

    public Instant getNextAttemptAllowedAt() { return nextAttemptAllowedAt; }
    public void setNextAttemptAllowedAt(Instant nextAttemptAllowedAt) { this.nextAttemptAllowedAt = nextAttemptAllowedAt; }

    public Instant getCompletedAt() { return completedAt; }
    public void setCompletedAt(Instant completedAt) { this.completedAt = completedAt; }
}
