package ru.morizo.backend.web.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.databind.PropertyNamingStrategies;
import com.fasterxml.jackson.databind.annotation.JsonNaming;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;

import java.util.List;

public final class QuestDtos {

    private QuestDtos() {}

    /** Чекпоинт в публичных ответах — без правильного ответа. */
    @JsonNaming(PropertyNamingStrategies.SnakeCaseStrategy.class)
    public record QuestPointDto(
            double lat,
            double lng,
            String title,
            String task,
            String hint,
            String pointRules,
            String type,
            List<String> options
    ) {}

    /** Квест в ответах API (контракт совпадает с типом Quest фронтенда). */
    @JsonNaming(PropertyNamingStrategies.SnakeCaseStrategy.class)
    public record QuestDto(
            Long id,
            String title,
            String description,
            String district,
            int difficulty,
            double distanceKm,
            int durationMin,
            int playersMin,
            int playersMax,
            int pointsCount,
            String image,
            List<String> gallery,
            String status,
            boolean popular,
            boolean isNew,
            double rating,
            String tag,
            String rules,
            String transportMode,
            String transportLabel,
            String author,
            Long authorId,
            String rejectionReason,
            List<QuestPointDto> points
    ) {}

    /** Чекпоинт при создании квеста — с правильным ответом. */
    @JsonNaming(PropertyNamingStrategies.SnakeCaseStrategy.class)
    public record CheckpointCreateDto(
            double lat,
            double lng,
            @NotBlank String title,
            @NotBlank @Size(min = 20, message = "Задание — минимум 20 символов") String task,
            String type,
            @NotBlank String answer,
            String hint,
            List<String> options,
            String pointRules
    ) {}

    /** Создание квеста (multipart part "quest"). */
    @JsonNaming(PropertyNamingStrategies.SnakeCaseStrategy.class)
    public record CreateQuestRequest(
            @NotBlank @Size(min = 5, message = "Название — минимум 5 символов") String title,
            @NotBlank @Size(min = 30, message = "Описание — минимум 30 символов") String description,
            @NotBlank String district,
            @Min(1) @Max(5) int difficulty,
            @Min(5) int durationMin,
            @Min(1) @Max(6) Integer playersMin,
            @Min(1) @Max(6) Integer playersMax,
            String rules,
            String transportMode,
            @NotEmpty @Size(min = 3, message = "У квеста минимум 3 чекпоинта") @Valid List<CheckpointCreateDto> points
    ) {}

    /** Публичная статистика для главной. */
    @JsonNaming(PropertyNamingStrategies.SnakeCaseStrategy.class)
    public record StatsDto(long quests, long teams, long users) {}

    /** Запрос на модерационное решение. */
    @JsonNaming(PropertyNamingStrategies.SnakeCaseStrategy.class)
    public record ModerationDecisionRequest(String reason) {}

    /** Жалоба на квест. */
    @JsonNaming(PropertyNamingStrategies.SnakeCaseStrategy.class)
    public record ComplaintRequest(@NotNull Long questId, @NotBlank @Size(min = 5) String reason) {}

    /** Жалоба в списке модератора. */
    @JsonNaming(PropertyNamingStrategies.SnakeCaseStrategy.class)
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public record ComplaintDto(Long id, String questTitle, String author, String reason, String date, String status) {}
}
