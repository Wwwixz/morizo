package ru.morizo.backend.web.dto;

import com.fasterxml.jackson.databind.PropertyNamingStrategies;
import com.fasterxml.jackson.databind.annotation.JsonNaming;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import ru.morizo.backend.entity.AgeGroup;

public final class AuthDtos {

    private AuthDtos() {}

    @JsonNaming(PropertyNamingStrategies.SnakeCaseStrategy.class)
    public record LoginRequest(
            // email или короткое имя демо-аккаунта (moderator -> moderator@morizo.ru)
            @NotBlank String email,
            @NotBlank String password
    ) {}

    @JsonNaming(PropertyNamingStrategies.SnakeCaseStrategy.class)
    public record RegisterRequest(
            @Email @NotBlank String email,
            @NotBlank @Size(min = 4, max = 72, message = "Пароль — минимум 4 символа") String password,
            @NotBlank @Size(min = 2, max = 60, message = "Никнейм — минимум 2 символа") String nickname,
            /** "14_15" или "16_17" */
            AgeGroup ageGroup,
            String avatar
    ) {}

    /** Ответ login/register: user (контракт фронтенда) + токен. */
    @JsonNaming(PropertyNamingStrategies.SnakeCaseStrategy.class)
    public record AuthResponse(
            String token,
            Long id,
            String email,
            String name,
            String avatar,
            String role,
            String ageLabel
    ) {}
}
