package ru.morizo.backend.web;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import ru.morizo.backend.entity.UserEntity;
import ru.morizo.backend.service.CurrentUser;
import ru.morizo.backend.service.TeamService;
import ru.morizo.backend.web.dto.TeamDtos.CreateTeamRequest;
import ru.morizo.backend.web.dto.TeamDtos.JoinTeamRequest;
import ru.morizo.backend.web.dto.TeamDtos.TeamDto;

import java.util.List;

@Tag(name = "Teams", description = "Команды 2–6 человек: создание, вступление по коду")
@RestController
@RequestMapping("/api/teams")
public class TeamController {

    private final TeamService teams;
    private final CurrentUser currentUser;

    public TeamController(TeamService teams, CurrentUser currentUser) {
        this.teams = teams;
        this.currentUser = currentUser;
    }

    @Operation(summary = "Список команд (is_mine — состоит ли зритель)")
    @GetMapping
    public List<TeamDto> list(Authentication authentication) {
        return teams.list(currentUser.require(authentication));
    }

    @Operation(summary = "Создать команду (название, описание); код приглашения генерируется автоматически")
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public TeamDto create(Authentication authentication, @Valid @RequestBody CreateTeamRequest request) {
        return teams.create(currentUser.require(authentication), request);
    }

    @Operation(summary = "«Вступить по коду команды»")
    @PostMapping("/join")
    public TeamDto joinByCode(Authentication authentication, @Valid @RequestBody JoinTeamRequest request) {
        return teams.joinByCode(currentUser.require(authentication), request);
    }

    @Operation(summary = "Вступить в команду по id")
    @PostMapping("/{id}/join")
    public TeamDto join(Authentication authentication, @PathVariable Long id) {
        return teams.joinTeam(currentUser.require(authentication), teams.findTeam(id));
    }

    @Operation(summary = "Выйти из команды")
    @DeleteMapping("/{id}/leave")
    public void leave(Authentication authentication, @PathVariable Long id) {
        teams.leave(currentUser.require(authentication), id);
    }
}
