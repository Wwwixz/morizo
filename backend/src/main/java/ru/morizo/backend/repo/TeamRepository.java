package ru.morizo.backend.repo;

import org.springframework.data.jpa.repository.JpaRepository;
import ru.morizo.backend.entity.Team;

import java.util.List;
import java.util.Optional;

public interface TeamRepository extends JpaRepository<Team, Long> {

    Optional<Team> findByInviteCodeIgnoreCase(String inviteCode);

    List<Team> findAllByOrderByIdAsc();

    long countByCreatorId(Long creatorId);
}
