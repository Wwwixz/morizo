package ru.morizo.backend.web.dto;

import com.fasterxml.jackson.databind.PropertyNamingStrategies;
import com.fasterxml.jackson.databind.annotation.JsonNaming;

import java.util.List;

public final class ProfileDtos {

    private ProfileDtos() {}

    @JsonNaming(PropertyNamingStrategies.SnakeCaseStrategy.class)
    public record AchievementDto(Long id, String title, String description, String color) {}

    /** Профиль игрока (контракт фронтенда). */
    @JsonNaming(PropertyNamingStrategies.SnakeCaseStrategy.class)
    public record ProfileDto(
            String name,
            String ageLabel,
            String avatar,
            int level,
            long xp,
            long xpNext,
            long questsDone,
            long teams,
            long score,
            List<AchievementDto> achievements
    ) {}
}
