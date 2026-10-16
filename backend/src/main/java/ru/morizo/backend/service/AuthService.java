package ru.morizo.backend.service;

import jakarta.persistence.EntityNotFoundException;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import ru.morizo.backend.entity.AgeGroup;
import ru.morizo.backend.entity.UserEntity;
import ru.morizo.backend.repo.UserRepository;
import ru.morizo.backend.security.JwtService;
import ru.morizo.backend.web.dto.AuthDtos.AuthResponse;
import ru.morizo.backend.web.dto.AuthDtos.LoginRequest;
import ru.morizo.backend.web.dto.AuthDtos.RegisterRequest;

@Service
public class AuthService {

    private final UserRepository users;
    private final PasswordEncoder encoder;
    private final JwtService jwt;

    public AuthService(UserRepository users, PasswordEncoder encoder, JwtService jwt) {
        this.users = users;
        this.encoder = encoder;
        this.jwt = jwt;
    }

    @Transactional
    public AuthResponse register(RegisterRequest req) {
        if (users.existsByEmailIgnoreCase(req.email())) {
            throw BusinessException.conflict("Пользователь с таким email уже зарегистрирован");
        }
        UserEntity user = new UserEntity();
        user.setEmail(req.email().trim().toLowerCase());
        user.setPasswordHash(encoder.encode(req.password()));
        user.setNickname(req.nickname().trim());
        user.setAgeGroup(req.ageGroup() == null ? AgeGroup.AGE_16_17 : req.ageGroup());
        user.setAvatar(req.avatar() == null || req.avatar().isBlank()
                ? "/img/avatars/u" + (1 + (int) (Math.random() * 8)) + ".jpg"
                : req.avatar());
        user.setRole(UserEntity.Role.USER);
        users.save(user);
        return toResponse(user);
    }

    @Transactional(readOnly = true)
    public AuthResponse login(LoginRequest req) {
        String email = req.email().trim();
        // «moderator» / «demo123» из ТЗ: логин без домена = <логин>@morizo.ru
        if (!email.contains("@")) {
            email = email + "@morizo.ru";
        }
        UserEntity user = users.findByEmailIgnoreCase(email)
                .orElseThrow(() -> new BadCredentialsException("invalid credentials"));
        if (!encoder.matches(req.password(), user.getPasswordHash())) {
            throw new BadCredentialsException("invalid credentials");
        }
        return toResponse(user);
    }

    @Transactional(readOnly = true)
    public UserEntity getById(Long id) {
        return users.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Пользователь не найден"));
    }

    @Transactional(readOnly = true)
    public AuthResponse refresh(Long id) {
        return toResponse(getById(id));
    }

    private AuthResponse toResponse(UserEntity user) {
        String token = jwt.issue(user.getId(), user.getEmail(), user.getRole().name());
        return new AuthResponse(token, user.getId(), user.getEmail(), user.getNickname(),
                user.getAvatar(), user.getRole().name(), user.getAgeGroup().getLabel());
    }
}
