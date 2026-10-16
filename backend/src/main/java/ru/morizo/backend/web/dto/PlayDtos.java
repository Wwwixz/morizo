package ru.morizo.backend.web.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.databind.PropertyNamingStrategies;
import com.fasterxml.jackson.databind.annotation.JsonNaming;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import ru.morizo.backend.web.dto.QuestDtos.QuestPointDto;

import java.util.List;

public final class PlayDtos {

    private PlayDtos() {}

    @JsonNaming(PropertyNamingStrategies.SnakeCaseStrategy.class)
    public record StartSessionRequest(@NotNull Long questId, Long teamId) {}

    @JsonNaming(PropertyNamingStrategies.SnakeCaseStrategy.class)
    public record AnswerRequest(@NotBlank String answer) {}

    /**
     * Состояние сессии прохождения.
     * currentPoint — задание текущей точки (без ответа); null, если квест завершён.
     */
    @JsonNaming(PropertyNamingStrategies.SnakeCaseStrategy.class)
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public record SessionDto(
            Long sessionId,
            Long questId,
            String questTitle,
            String status,
            int current,
            int total,
            String progress,
            int score,
            boolean finished,
            QuestPointDto currentPoint,
            List<QuestPointDto> points,
            Long teamId,
            boolean countedForRating,
            Long startedAt,
            Long finishedAt
    ) {}

    /** Результат проверки ответа. */
    @JsonNaming(PropertyNamingStrategies.SnakeCaseStrategy.class)
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public record AnswerResponse(
            boolean correct,
            int current,
            int total,
            String progress,
            boolean finished,
            int score,
            Integer scoreGained,
            int attemptsLeft,
            Long retryAfterMs,
            List<String> newAchievements
    ) {}
}
