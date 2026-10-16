package ru.morizo.backend.service;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import ru.morizo.backend.entity.PlaySession;
import ru.morizo.backend.entity.UserEntity;
import ru.morizo.backend.repo.PlaySessionRepository;
import ru.morizo.backend.repo.TeamMemberRepository;
import ru.morizo.backend.repo.UserRepository;
import ru.morizo.backend.web.dto.ProfileDtos.ProfileDto;
import ru.morizo.backend.web.dto.ProfileDtos.UpdateProfileRequest;

import java.util.HashSet;
import java.util.Set;

/** Профиль игрока: уровень, очки, прогресс, достижения (контракт фронтенда). */
@Service
public class ProfileService {

    private final PlaySessionRepository sessions;
    private final TeamMemberRepository members;
    private final AchievementService achievements;
    private final UserRepository users;

    public ProfileService(PlaySessionRepository sessions, TeamMemberRepository members,
                          AchievementService achievements, UserRepository users) {
        this.sessions = sessions;
        this.members = members;
        this.achievements = achievements;
        this.users = users;
    }

    @Transactional
    public ProfileDto update(UserEntity user, UpdateProfileRequest req) {
        user.setNickname(req.name().trim());
        user.setAvatar(req.avatar());
        users.save(user);
        return profile(user);
    }

    @Transactional(readOnly = true)
    public ProfileDto profile(UserEntity user) {
        Set<Long> completedQuests = new HashSet<>();
        long score = 0;

        // соло-прохождения
        for (PlaySession s : sessions.completedByUserSince(user.getId(), null)) {
            completedQuests.add(s.getQuest().getId());
            score += s.getScore();
        }
        // командные прохождения
        for (var m : members.findByUserId(user.getId())) {
            for (PlaySession s : sessions.completedByTeamSince(m.getTeam().getId(), null)) {
                completedQuests.add(s.getQuest().getId());
                score += s.getScore();
            }
        }

        int level = (int) (score / Scoring.XP_PER_LEVEL) + 1;
        long xp = score % Scoring.XP_PER_LEVEL;
        return new ProfileDto(
                user.getNickname(),
                user.getAgeGroup().getLabel(),
                user.getAvatar(),
                level,
                xp,
                Scoring.XP_PER_LEVEL,
                completedQuests.size(),
                members.findByUserId(user.getId()).size(),
                score,
                achievements.forUser(user.getId())
        );
    }
}
