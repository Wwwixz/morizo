package ru.morizo.backend.security;

import ru.morizo.backend.entity.UserEntity;

/** Упрощённый принципал, кладётся в SecurityContext после разбора JWT. */
public record Principal(Long userId, String email, UserEntity.Role role) {

    public boolean isModerator() {
        return role == UserEntity.Role.MODERATOR;
    }
}
