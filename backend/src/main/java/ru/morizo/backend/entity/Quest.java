package ru.morizo.backend.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;

import java.time.Instant;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

@Entity
@Table(name = "quests", indexes = {
        @Index(name = "idx_quests_status", columnList = "status"),
        @Index(name = "idx_quests_district", columnList = "district"),
        @Index(name = "idx_quests_difficulty", columnList = "difficulty"),
        @Index(name = "idx_quests_created_at", columnList = "created_at"),
        @Index(name = "idx_quests_author", columnList = "author_id")
})
public class Quest {

    public enum Status {
        DRAFT, ON_MODERATION, PUBLISHED, ARCHIVED, REJECTED
    }

    /** Способ передвижения — влияет на бонус к очкам (ТЗ 3.5) */
    public enum TransportMode {
        FOOT("Пешком", 1.00),
        PUBLIC_TRANSPORT("Общественный транспорт", 1.10),
        CAR("Транспорт", 1.05),
        DIRT_ROADS("Только по грунтовкам", 1.15),
        NO_ROADS("Без дорог", 1.20);

        private final String label;
        private final double scoreMultiplier;

        TransportMode(String label, double scoreMultiplier) {
            this.label = label;
            this.scoreMultiplier = scoreMultiplier;
        }

        public String getLabel() { return label; }
        public double getScoreMultiplier() { return scoreMultiplier; }
    }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "author_id", nullable = false)
    private UserEntity author;

    @NotBlank
    @Column(nullable = false, length = 120)
    private String title;

    @NotBlank
    @Column(nullable = false, length = 2000)
    private String description;

    @Column(nullable = false, length = 120)
    private String district;

    @Column(length = 250)
    private String image = "/img/quest-street.jpg";

    @Min(1)
    @Column(nullable = false)
    private int difficulty = 1;

    @Column(nullable = false)
    private int durationMin = 60;

    /** длина маршрута, км (вычисляется по чекпоинтам) */
    @Column(nullable = false)
    private double distanceKm = 0;

    @Column(nullable = false)
    private int playersMin = 1;

    @Column(nullable = false)
    private int playersMax = 6;

    @Column(length = 1000)
    private String rules;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 25)
    private TransportMode transportMode = TransportMode.FOOT;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private Status status = Status.DRAFT;

    @Column(length = 1000)
    private String rejectionReason;

    /** средняя оценка квеста игроками (0, если нет оценок) */
    @Column(nullable = false)
    private double rating = 0;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "quest_gallery", joinColumns = @JoinColumn(name = "quest_id"))
    @Column(name = "image_url", length = 250)
    private List<String> gallery = new ArrayList<>();

    @OneToMany(mappedBy = "quest", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("position ASC")
    private List<Checkpoint> checkpoints = new ArrayList<>();

    @Column(nullable = false)
    private Instant createdAt = Instant.now();

    @Column
    private Instant publishedAt;

    public void addCheckpoint(Checkpoint c) {
        c.setQuest(this);
        c.setPosition(checkpoints.size());
        checkpoints.add(c);
    }

    public List<Checkpoint> orderedCheckpoints() {
        return checkpoints.stream().sorted(Comparator.comparingInt(Checkpoint::getPosition)).toList();
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public UserEntity getAuthor() { return author; }
    public void setAuthor(UserEntity author) { this.author = author; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getDistrict() { return district; }
    public void setDistrict(String district) { this.district = district; }

    public String getImage() { return image; }
    public void setImage(String image) { this.image = image; }

    public int getDifficulty() { return difficulty; }
    public void setDifficulty(int difficulty) { this.difficulty = difficulty; }

    public int getDurationMin() { return durationMin; }
    public void setDurationMin(int durationMin) { this.durationMin = durationMin; }

    public double getDistanceKm() { return distanceKm; }
    public void setDistanceKm(double distanceKm) { this.distanceKm = distanceKm; }

    public int getPlayersMin() { return playersMin; }
    public void setPlayersMin(int playersMin) { this.playersMin = playersMin; }

    public int getPlayersMax() { return playersMax; }
    public void setPlayersMax(int playersMax) { this.playersMax = playersMax; }

    public String getRules() { return rules; }
    public void setRules(String rules) { this.rules = rules; }

    public TransportMode getTransportMode() { return transportMode; }
    public void setTransportMode(TransportMode transportMode) { this.transportMode = transportMode; }

    public Status getStatus() { return status; }
    public void setStatus(Status status) { this.status = status; }

    public String getRejectionReason() { return rejectionReason; }
    public void setRejectionReason(String rejectionReason) { this.rejectionReason = rejectionReason; }

    public double getRating() { return rating; }
    public void setRating(double rating) { this.rating = rating; }

    public List<String> getGallery() { return gallery; }
    public void setGallery(List<String> gallery) { this.gallery = gallery; }

    public List<Checkpoint> getCheckpoints() { return checkpoints; }
    public void setCheckpoints(List<Checkpoint> checkpoints) { this.checkpoints = checkpoints; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }

    public Instant getPublishedAt() { return publishedAt; }
    public void setPublishedAt(Instant publishedAt) { this.publishedAt = publishedAt; }
}
