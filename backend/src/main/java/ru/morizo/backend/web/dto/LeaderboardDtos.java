package ru.morizo.backend.web.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.databind.PropertyNamingStrategies;
import com.fasterxml.jackson.databind.annotation.JsonNaming;

public final class LeaderboardDtos {

    private LeaderboardDtos() {}

    /** Строка таблицы лидеров (команды или игроки). */
    @JsonNaming(PropertyNamingStrategies.SnakeCaseStrategy.class)
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public record LeaderboardEntryDto(
            int place,
            Long id,
            String name,
            String avatar,
            int members,
            long quests,
            long points,
            boolean isMine
    ) {}
}
