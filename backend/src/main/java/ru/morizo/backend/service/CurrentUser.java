package ru.morizo.backend.service;

import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Component;
import ru.morizo.backend.entity.UserEntity;
import ru.morizo.backend.security.Principal;

/** Извлечение текущего пользователя из SecurityContext (JWT-принципал). */
@Component
public class CurrentUser {

    private final AuthService auth;

    public CurrentUser(AuthService auth) {
        this.auth = auth;
    }

    /** Пользователь обязателен: иначе 401. */
    public UserEntity require(Authentication authentication) {
        if (authentication == null || !(authentication.getPrincipal() instanceof Principal p)) {
            throw new BusinessException(org.springframework.http.HttpStatus.UNAUTHORIZED, "Требуется авторизация");
        }
        return auth.getById(p.userId());
    }

    /** Пользователь, если авторизован (может быть null). */
    public UserEntity optional(Authentication authentication) {
        if (authentication == null || !(authentication.getPrincipal() instanceof Principal p)) {
            return null;
        }
        return auth.getById(p.userId());
    }

    /** Только модератор. */
    public UserEntity requireModerator(Authentication authentication) {
        UserEntity user = require(authentication);
        if (user.getRole() != UserEntity.Role.MODERATOR) {
            throw BusinessException.forbidden("Доступно только модератору");
        }
        return user;
    }
}
