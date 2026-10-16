package ru.morizo.backend.web;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import ru.morizo.backend.entity.UserEntity;
import ru.morizo.backend.service.CurrentUser;
import ru.morizo.backend.service.RatingService;
import ru.morizo.backend.web.dto.LeaderboardDtos.LeaderboardEntryDto;

import java.util.List;

@Tag(name = "Leaderboard", description = "Таблица лидеров по очкам за завершённые квесты")
@RestController
@RequestMapping("/api/leaderboard")
public class LeaderboardController {

    private final RatingService rating;
    private final CurrentUser currentUser;

    public LeaderboardController(RatingService rating, CurrentUser currentUser) {
        this.rating = rating;
        this.currentUser = currentUser;
    }

    @Operation(summary = """
            Рейтинг: tab=teams|players, period=all|month|week.
            Очки = за каждый чекпоинт + бонус за завершение + бонус за сложность/скорость × множитель транспорта
            """)
    @GetMapping
    public List<LeaderboardEntryDto> leaderboard(
            @RequestParam(defaultValue = "teams") String tab,
            @RequestParam(defaultValue = "all") String period,
            Authentication authentication
    ) {
        UserEntity viewer = currentUser.optional(authentication);
        java.time.Instant from = rating.since(period);
        return "players".equalsIgnoreCase(tab)
                ? rating.playerLeaderboard(from, viewer)
                : rating.teamLeaderboard(from, viewer);
    }
}
