package ru.morizo.backend.repo;

import org.springframework.data.jpa.repository.JpaRepository;
import ru.morizo.backend.entity.UserEntity;

import java.util.Optional;

public interface UserRepository extends JpaRepository<UserEntity, Long> {

    Optional<UserEntity> findByEmailIgnoreCase(String email);

    boolean existsByEmailIgnoreCase(String email);

    long countByRole(UserEntity.Role role);
}
