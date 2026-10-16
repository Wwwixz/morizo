package ru.morizo.backend.entity;

import jakarta.persistence.*;

import java.time.Instant;

/**
 * Сессия прохождения квеста (ТЗ 3.4).
 * Создаётся, когда соло-игрок или команда нажимает «Начать квест».
 */
@Entity
@Table(name = "play_sessions", indexes = {
        @Index(name = "idx_sessions_quest", columnList = "quest_id"),
        @Index(name = "idx_sessions_team", columnList = "team_id"),
        @Index(name = "idx_sessions_user", columnList = "user_id"),
        @Index(name = "idx_sessions_status", columnList = "status"),
        @Index(name = "idx_sessions_finished", columnList = "finished_at")
})
public class PlaySession {

    public enum Status { STARTED, IN_PROGRESS, COMPLETED, ABANDONED }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "quest_id", nullable = false)
    private Quest quest;

    /** null => соло-прохождение */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "team_id")
    private Team team;

    /** кто создал сессию (в командном прохождении — любой участник) */
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private UserEntity user;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 15)
    private Status status = Status.STARTED;

    /** индекс текущего чекпоинта (порядок строгий) */
    @Column(nullable = false)
    private int currentPosition = 0;

    /** сколько чекпоинтов успешно пройдено */
    @Column(nullable = false)
    private int completedCount = 0;

    @Column(nullable = false)
    private Instant startedAt = Instant.now();

    @Column
    private Instant finishedAt;

    /** начисленные очки */
    @Column(nullable = false)
    private int score = 0;

    /** засчитано ли прохождение в рейтинг (античит: не чаще 1 раза в 24 ч) */
    @Column(nullable = false)
    private boolean countedForRating = true;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Quest getQuest() { return quest; }
    public void setQuest(Quest quest) { this.quest = quest; }

    public Team getTeam() { return team; }
    public void setTeam(Team team) { this.team = team; }

    public UserEntity getUser() { return user; }
    public void setUser(UserEntity user) { this.user = user; }

    public Status getStatus() { return status; }
    public void setStatus(Status status) { this.status = status; }

    public int getCurrentPosition() { return currentPosition; }
    public void setCurrentPosition(int currentPosition) { this.currentPosition = currentPosition; }

    public int getCompletedCount() { return completedCount; }
    public void setCompletedCount(int completedCount) { this.completedCount = completedCount; }

    public Instant getStartedAt() { return startedAt; }
    public void setStartedAt(Instant startedAt) { this.startedAt = startedAt; }

    public Instant getFinishedAt() { return finishedAt; }
    public void setFinishedAt(Instant finishedAt) { this.finishedAt = finishedAt; }

    public int getScore() { return score; }
    public void setScore(int score) { this.score = score; }

    public boolean isCountedForRating() { return countedForRating; }
    public void setCountedForRating(boolean countedForRating) { this.countedForRating = countedForRating; }

    public boolean isActive() {
        return status == Status.STARTED || status == Status.IN_PROGRESS;
    }
}
