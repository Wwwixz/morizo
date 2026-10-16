package ru.morizo.backend.entity;

import jakarta.persistence.*;

import java.util.ArrayList;
import java.util.List;

/** Достижение (ТЗ 3.5: «1М шагов», «лесник», «горожанин» и т.д.). */
@Entity
@Table(name = "achievements", indexes = {
        @Index(name = "idx_achievements_code", columnList = "code", unique = true)
})
public class Achievement {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 40)
    private String code;

    @Column(nullable = false, length = 80)
    private String title;

    @Column(nullable = false, length = 200)
    private String description;

    @Column(nullable = false, length = 10)
    private String color = "#3B82F6";

    @OneToMany(mappedBy = "achievement")
    private List<UserAchievement> awarded = new ArrayList<>();

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getCode() { return code; }
    public void setCode(String code) { this.code = code; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getColor() { return color; }
    public void setColor(String color) { this.color = color; }

    public List<UserAchievement> getAwarded() { return awarded; }
    public void setAwarded(List<UserAchievement> awarded) { this.awarded = awarded; }
}
