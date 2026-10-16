package ru.morizo.backend.web;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import ru.morizo.backend.entity.Quest;
import ru.morizo.backend.repo.QuestRepository;
import ru.morizo.backend.repo.TeamRepository;
import ru.morizo.backend.repo.UserRepository;
import ru.morizo.backend.web.dto.QuestDtos.StatsDto;

@Tag(name = "Stats", description = "Публичная статистика платформы")
@RestController
@RequestMapping("/api/stats")
public class StatsController {

    private final QuestRepository quests;
    private final TeamRepository teams;
    private final UserRepository users;

    public StatsController(QuestRepository quests, TeamRepository teams, UserRepository users) {
        this.quests = quests;
        this.teams = teams;
        this.users = users;
    }

    @Operation(summary = "Счётчики для главной: квесты (опубликованные), команды, участники")
    @GetMapping
    public StatsDto stats() {
        return new StatsDto(
                quests.countByStatus(Quest.Status.PUBLISHED),
                teams.count(),
                users.count()
        );
    }
}
