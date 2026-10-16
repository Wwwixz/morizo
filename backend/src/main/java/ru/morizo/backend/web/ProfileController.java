package ru.morizo.backend.web;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import ru.morizo.backend.entity.UserEntity;
import ru.morizo.backend.service.AuthService;
import ru.morizo.backend.service.CurrentUser;
import ru.morizo.backend.service.ProfileService;
import ru.morizo.backend.web.dto.ProfileDtos.ProfileDto;
import ru.morizo.backend.web.dto.ProfileDtos.UpdateProfileRequest;

@Tag(name = "Profile", description = "Профиль: уровень, очки, достижения")
@RestController
@RequestMapping("/api/profile")
public class ProfileController {

    private final ProfileService profile;
    private final AuthService auth;
    private final CurrentUser currentUser;

    public ProfileController(ProfileService profile, AuthService auth, CurrentUser currentUser) {
        this.profile = profile;
        this.auth = auth;
        this.currentUser = currentUser;
    }

    @Operation(summary = "Мой профиль (нужен JWT)")
    @GetMapping
    public ProfileDto me(Authentication authentication) {
        UserEntity user = currentUser.require(authentication);
        return profile.profile(user);
    }

    @Operation(summary = "Обновить имя и аватар (нужен JWT)")
    @PutMapping
    public ProfileDto update(Authentication authentication, @Valid @RequestBody UpdateProfileRequest request) {
        UserEntity user = currentUser.require(authentication);
        return profile.update(user, request);
    }

    @Operation(summary = "Профиль игрока по id")
    @GetMapping("/{id}")
    public ProfileDto byId(@PathVariable Long id) {
        return profile.profile(auth.getById(id));
    }
}
