package ru.morizo.backend.web;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import ru.morizo.backend.service.AuthService;
import ru.morizo.backend.service.CurrentUser;
import ru.morizo.backend.web.dto.AuthDtos.AuthResponse;
import ru.morizo.backend.web.dto.AuthDtos.LoginRequest;
import ru.morizo.backend.web.dto.AuthDtos.RegisterRequest;

@Tag(name = "Auth", description = "Регистрация и вход (email + пароль)")
@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService auth;
    private final CurrentUser currentUser;

    public AuthController(AuthService auth, CurrentUser currentUser) {
        this.auth = auth;
        this.currentUser = currentUser;
    }

    @Operation(summary = "Регистрация (email, пароль, никнейм, возрастная группа 14–15 / 16–17)")
    @PostMapping("/register")
    @ResponseStatus(HttpStatus.CREATED)
    public AuthResponse register(@Valid @RequestBody RegisterRequest request) {
        return auth.register(request);
    }

    @Operation(summary = "Вход по email и паролю")
    @PostMapping("/login")
    public AuthResponse login(@Valid @RequestBody LoginRequest request) {
        return auth.login(request);
    }

    @Operation(summary = "Текущий пользователь по JWT")
    @GetMapping("/me")
    public AuthResponse me(Authentication authentication) {
        return auth.refresh(currentUser.require(authentication).getId());
    }
}
