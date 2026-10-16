package ru.morizo.backend.entity;

import jakarta.persistence.*;

import java.time.Instant;

/** Жалоба на квест/точку (ТЗ 3.6). */
@Entity
@Table(name = "complaints", indexes = {
        @Index(name = "idx_complaints_quest", columnList = "quest_id"),
        @Index(name = "idx_complaints_status", columnList = "status")
})
public class Complaint {

    public enum Status { NEW, RESOLVED }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "quest_id", nullable = false)
    private Quest quest;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "author_id", nullable = false)
    private UserEntity author;

    @Column(nullable = false, length = 1000)
    private String reason;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 10)
    private Status status = Status.NEW;

    @Column(nullable = false)
    private Instant createdAt = Instant.now();

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Quest getQuest() { return quest; }
    public void setQuest(Quest quest) { this.quest = quest; }

    public UserEntity getAuthor() { return author; }
    public void setAuthor(UserEntity author) { this.author = author; }

    public String getReason() { return reason; }
    public void setReason(String reason) { this.reason = reason; }

    public Status getStatus() { return status; }
    public void setStatus(Status status) { this.status = status; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
}
