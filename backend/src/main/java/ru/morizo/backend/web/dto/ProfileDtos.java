package ru.morizo.backend.web.dto;

import com.fasterxml.jackson.databind.PropertyNamingStrategies;
import com.fasterxml.jackson.databind.annotation.JsonNaming;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.util.List;

public final class ProfileDtos {

    private ProfileDtos() {}

    @JsonNaming(PropertyNamingStrategies.SnakeCaseStrategy.class)
    public record AchievementDto(Long id, String title, String description, String color) {}

    /** Редактирование профиля: имя и аватар (из списка демо-аватаров). */
    @JsonNaming(PropertyNamingStrategies.SnakeCaseStrategy.class)
    public record UpdateProfileRequest(
            @NotBlank @Size(min = 2, max = 60, message = "Никнейм — от 2 до 60 символов") String name,
            @NotBlank @Pattern(regexp = "/img/avatars/u[1-8]\\.jpg", message = "Недоступный аватар") String avatar
    ) {}

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
