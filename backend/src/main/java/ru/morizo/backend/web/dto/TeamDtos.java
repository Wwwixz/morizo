package ru.morizo.backend.web.dto;

import com.fasterxml.jackson.databind.PropertyNamingStrategies;
import com.fasterxml.jackson.databind.annotation.JsonNaming;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public final class TeamDtos {

    private TeamDtos() {}

    @JsonNaming(PropertyNamingStrategies.SnakeCaseStrategy.class)
    public record CreateTeamRequest(
            @NotBlank @Size(min = 2, max = 80) String name,
            @Size(max = 500) String description
    ) {}

    @JsonNaming(PropertyNamingStrategies.SnakeCaseStrategy.class)
    public record JoinTeamRequest(@NotBlank String code) {}

    /** Команда в списке (контракт фронтенда + код приглашения для своих). */
    @JsonNaming(PropertyNamingStrategies.SnakeCaseStrategy.class)
    public record TeamDto(
            Long id,
            String name,
            String description,
            String avatar,
            int members,
            long quests,
            long points,
            boolean isMine,
            boolean isCreator,
            String inviteCode
    ) {}
}
