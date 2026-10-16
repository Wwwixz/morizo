package ru.morizo.backend.service;

import jakarta.persistence.EntityNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import ru.morizo.backend.entity.Team;
import ru.morizo.backend.entity.TeamMember;
import ru.morizo.backend.entity.UserEntity;
import ru.morizo.backend.repo.PlaySessionRepository;
import ru.morizo.backend.repo.TeamMemberRepository;
import ru.morizo.backend.repo.TeamRepository;
import ru.morizo.backend.web.dto.TeamDtos.CreateTeamRequest;
import ru.morizo.backend.web.dto.TeamDtos.JoinTeamRequest;
import ru.morizo.backend.web.dto.TeamDtos.TeamDto;

import java.security.SecureRandom;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/** Команды (ТЗ 3.1): создание, вступление по коду, 2–6 человек. */
@Service
public class TeamService {

    private static final String CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    private static final SecureRandom RANDOM = new SecureRandom();
    private static final int MIN_MEMBERS = 2;
    private static final int MAX_MEMBERS = 6;

    private final TeamRepository teams;
    private final TeamMemberRepository members;
    private final PlaySessionRepository sessions;
    private final RatingService rating;

    public TeamService(TeamRepository teams, TeamMemberRepository members,
                       PlaySessionRepository sessions, RatingService rating) {
        this.teams = teams;
        this.members = members;
        this.sessions = sessions;
        this.rating = rating;
    }

    @Transactional
    public TeamDto create(UserEntity creator, CreateTeamRequest req) {
        Team team = new Team();
        team.setName(req.name().trim());
        team.setDescription(req.description());
        team.setCreator(creator);
        team.setAvatar(creator.getAvatar());
        team.setInviteCode(generateCode());
        teams.save(team);

        TeamMember m = new TeamMember();
        m.setTeam(team);
        m.setUser(creator);
        members.save(m);
        return toDto(team, creator);
    }

    /** «Вступить по коду команды» (ТЗ 3.1). */
    @Transactional
    public TeamDto joinByCode(UserEntity user, JoinTeamRequest req) {
        Team team = teams.findByInviteCodeIgnoreCase(req.code().trim())
                .orElseThrow(() -> new EntityNotFoundException("Команда с кодом «%s» не найдена".formatted(req.code())));
        return joinTeam(user, team);
    }

    @Transactional
    public TeamDto joinTeam(UserEntity user, Team team) {
        if (members.isMember(team, user)) {
            throw BusinessException.conflict("Вы уже состоите в команде «%s»".formatted(team.getName()));
        }
        long count = members.countByTeamId(team.getId());
        if (count >= MAX_MEMBERS) {
            throw BusinessException.conflict("В команде уже максимум участников (%d)".formatted(MAX_MEMBERS));
        }
        TeamMember m = new TeamMember();
        m.setTeam(team);
        m.setUser(user);
        members.save(m);
        return toDto(team, user);
    }

    @Transactional
    public void leave(UserEntity user, Long teamId) {
        Team team = findTeam(teamId);
        TeamMember m = members.findByTeamIdAndUserId(teamId, user.getId())
                .orElseThrow(() -> new EntityNotFoundException("Вы не состоите в этой команде"));
        members.delete(m);
    }

    @Transactional(readOnly = true)
    public List<TeamDto> list(UserEntity viewer) {
        return teams.findAllByOrderByIdAsc().stream()
                .map(t -> toDto(t, viewer))
                .toList();
    }

    @Transactional(readOnly = true)
    public Team findTeam(Long id) {
        return teams.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Команда #%d не найдена".formatted(id)));
    }

    private TeamDto toDto(Team team, UserEntity viewer) {
        long memberCount = members.countByTeamId(team.getId());
        boolean mine = members.existsByTeamIdAndUserId(team.getId(), viewer.getId());
        long completed = sessions.completedByTeamSince(team.getId(), null).size();
        long points = rating.teamPoints(team.getId(), null);
        return new TeamDto(
                team.getId(),
                team.getName(),
                team.getDescription(),
                team.getAvatar(),
                (int) memberCount,
                completed,
                points,
                mine,
                team.getCreator().getId().equals(viewer.getId()),
                mine ? team.getInviteCode() : null
        );
    }

    /** Проверка ТЗ 3.1: команда 2–6 человек — для старта командной сессии достаточно 1 на старте, но не больше 6. */
    public void assertTeamSize(int size) {
        if (size > MAX_MEMBERS) {
            throw BusinessException.badRequest("В команде не может быть больше %d человек".formatted(MAX_MEMBERS));
        }
    }

    private String generateCode() {
        for (int tries = 0; tries < 100; tries++) {
            StringBuilder sb = new StringBuilder(6);
            for (int i = 0; i < 6; i++) {
                sb.append(CODE_ALPHABET.charAt(RANDOM.nextInt(CODE_ALPHABET.length())));
            }
            String code = sb.toString();
            if (teams.findByInviteCodeIgnoreCase(code).isEmpty()) {
                return code;
            }
        }
        throw new IllegalStateException("Не удалось сгенерировать код команды");
    }
}
