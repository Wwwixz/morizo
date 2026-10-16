package ru.morizo.backend.service;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import ru.morizo.backend.entity.PlaySession;
import ru.morizo.backend.entity.TeamMember;
import ru.morizo.backend.entity.UserEntity;
import ru.morizo.backend.repo.PlaySessionRepository;
import ru.morizo.backend.repo.TeamMemberRepository;
import ru.morizo.backend.repo.TeamRepository;
import ru.morizo.backend.repo.UserRepository;
import ru.morizo.backend.web.dto.LeaderboardDtos.LeaderboardEntryDto;

import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Рейтинг команд и участников (ТЗ 3.5).
 * Очки начисляются за завершённые квесты; период — всё время / месяц / неделя.
 */
@Service
public class RatingService {

    private final PlaySessionRepository sessions;
    private final TeamMemberRepository members;
    private final TeamRepository teams;
    private final UserRepository users;

    public RatingService(PlaySessionRepository sessions, TeamMemberRepository members,
                         TeamRepository teams, UserRepository users) {
        this.sessions = sessions;
        this.members = members;
        this.teams = teams;
        this.users = users;
    }

    /** Начало периода: null = «за всё время». */
    public Instant since(String period) {
        return switch (period == null ? "all" : period) {
            case "week" -> Instant.now().minus(Duration.ofDays(7));
            case "month" -> Instant.now().minus(Duration.ofDays(30));
            default -> null;
        };
    }

    /** Сумма зачётных очков команды за период (для карточки команды). */
    @Transactional(readOnly = true)
    public long teamPoints(Long teamId, Instant from) {
        return sessions.completedByTeamSince(teamId, from).stream()
                .filter(s -> s.getFinishedAt() != null && (from == null || s.getFinishedAt().isAfter(from)))
                .mapToLong(PlaySession::getScore)
                .sum();
    }

    /** Таблица лидеров: команды. */
    @Transactional(readOnly = true)
    public List<LeaderboardEntryDto> teamLeaderboard(Instant from, UserEntity viewer) {
        record Row(long points, long quests) {}

        Map<Long, Row> byTeam = new HashMap<>();
        for (PlaySession s : sessions.findByStatusAndCountedForRatingTrue(PlaySession.Status.COMPLETED)) {
            if (s.getTeam() == null || s.getFinishedAt() == null) continue;
            if (from != null && !s.getFinishedAt().isAfter(from)) continue;
            Row prev = byTeam.getOrDefault(s.getTeam().getId(), new Row(0, 0));
            byTeam.put(s.getTeam().getId(), new Row(prev.points() + s.getScore(), prev.quests() + 1));
        }

        List<LeaderboardEntryDto> rows = new ArrayList<>();
        int place = 1;
        for (var e : byTeam.entrySet().stream()
                .sorted(Map.Entry.<Long, Row>comparingByValue(Comparator.comparingLong(Row::points).reversed()))
                .toList()) {
            Long teamId = e.getKey();
            var team = teams.findById(teamId).orElse(null);
            if (team == null) continue;
            boolean mine = viewer != null && members.existsByTeamIdAndUserId(teamId, viewer.getId());
            rows.add(new LeaderboardEntryDto(place++, teamId, team.getName(), team.getAvatar(),
                    (int) members.countByTeamId(teamId), e.getValue().quests(), e.getValue().points(), mine));
        }
        return rows;
    }

    /** Таблица лидеров: участники (соло-очки + очки командных прохождений). */
    @Transactional(readOnly = true)
    public List<LeaderboardEntryDto> playerLeaderboard(Instant from, UserEntity viewer) {
        Map<Long, Long> points = new HashMap<>();
        for (PlaySession s : sessions.findByStatusAndCountedForRatingTrue(PlaySession.Status.COMPLETED)) {
            if (s.getFinishedAt() == null) continue;
            if (from != null && !s.getFinishedAt().isAfter(from)) continue;
            if (s.getTeam() != null) {
                for (TeamMember m : members.findByTeamId(s.getTeam().getId())) {
                    points.merge(m.getUser().getId(), (long) s.getScore(), Long::sum);
                }
            } else if (s.getUser() != null) {
                points.merge(s.getUser().getId(), (long) s.getScore(), Long::sum);
            }
        }
        List<LeaderboardEntryDto> rows = new ArrayList<>();
        int place = 1;
        for (var e : points.entrySet().stream()
                .sorted(Map.Entry.<Long, Long>comparingByValue(Comparator.reverseOrder()))
                .toList()) {
            UserEntity u = users.findById(e.getKey()).orElse(null);
            if (u == null) continue;
            rows.add(new LeaderboardEntryDto(place++, u.getId(), u.getNickname(), u.getAvatar(),
                    1, 0, e.getValue(), viewer != null && viewer.getId().equals(u.getId())));
        }
        return rows;
    }
}
