package ru.morizo.backend.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;

@Entity
@Table(name = "checkpoints", indexes = {
        @Index(name = "idx_checkpoints_quest", columnList = "quest_id")
})
public class Checkpoint {

    /** Тип задания (ТЗ 3.3) */
    public enum TaskType {
        /** код-слово — игрок вводит слово */
        WORD("Код-слово"),
        /** вопрос с вариантами — 1 правильный из 4 */
        CHOICE("Вопрос с вариантами");

        private final String label;

        TaskType(String label) {
            this.label = label;
        }

        public String getLabel() {
            return label;
        }
    }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "quest_id", nullable = false)
    private Quest quest;

    /** порядок точки в маршруте (0-based, строгий порядок прохождения) */
    @Column(name = "position", nullable = false)
    private int position;

    @Column(nullable = false)
    private double lat;

    @Column(nullable = false)
    private double lng;

    @NotBlank
    @Column(nullable = false, length = 120)
    private String title;

    @NotBlank
    @Column(nullable = false, length = 1000)
    private String task;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 10)
    private TaskType type = TaskType.WORD;

    /**
     * Для WORD — правильное слово.
     * Для CHOICE — текст правильного варианта (должен входить в options).
     */
    @Column(nullable = false, length = 300)
    private String answer;

    /** варианты для CHOICE, JSON-массив строк */
    @Column(length = 1000)
    private String optionsJson;

    @Column(length = 500)
    private String hint;

    /** «правила точки» — например «не заходить за ограждение» */
    @Column(length = 500)
    private String pointRules;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Quest getQuest() { return quest; }
    public void setQuest(Quest quest) { this.quest = quest; }

    public int getPosition() { return position; }
    public void setPosition(int position) { this.position = position; }

    public double getLat() { return lat; }
    public void setLat(double lat) { this.lat = lat; }

    public double getLng() { return lng; }
    public void setLng(double lng) { this.lng = lng; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getTask() { return task; }
    public void setTask(String task) { this.task = task; }

    public TaskType getType() { return type; }
    public void setType(TaskType type) { this.type = type; }

    public String getAnswer() { return answer; }
    public void setAnswer(String answer) { this.answer = answer; }

    public String getOptionsJson() { return optionsJson; }
    public void setOptionsJson(String optionsJson) { this.optionsJson = optionsJson; }

    public String getHint() { return hint; }
    public void setHint(String hint) { this.hint = hint; }

    public String getPointRules() { return pointRules; }
    public void setPointRules(String pointRules) { this.pointRules = pointRules; }
}
