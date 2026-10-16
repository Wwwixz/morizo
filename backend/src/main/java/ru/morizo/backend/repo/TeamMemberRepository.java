package ru.morizo.backend.repo;

import org.springframework.data.jpa.repository.JpaRepository;
import ru.morizo.backend.entity.Team;
import ru.morizo.backend.entity.TeamMember;
import ru.morizo.backend.entity.UserEntity;

import java.util.List;
import java.util.Optional;

public interface TeamMemberRepository extends JpaRepository<TeamMember, Long> {

    List<TeamMember> findByTeamId(Long teamId);

    List<TeamMember> findByUserId(Long userId);

    Optional<TeamMember> findByTeamIdAndUserId(Long teamId, Long userId);

    boolean existsByTeamIdAndUserId(Long teamId, Long userId);

    long countByTeamId(Long teamId);

    default boolean isMember(Team team, UserEntity user) {
        return existsByTeamIdAndUserId(team.getId(), user.getId());
    }
}
