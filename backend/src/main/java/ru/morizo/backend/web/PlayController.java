package ru.morizo.backend.web;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import ru.morizo.backend.entity.UserEntity;
import ru.morizo.backend.service.CurrentUser;
import ru.morizo.backend.service.PlaySessionService;
import ru.morizo.backend.web.dto.PlayDtos.AnswerRequest;
import ru.morizo.backend.web.dto.PlayDtos.AnswerResponse;
import ru.morizo.backend.web.dto.PlayDtos.SessionDto;
import ru.morizo.backend.web.dto.PlayDtos.StartSessionRequest;
import ru.morizo.backend.web.dto.QuestDtos.QuestPointDto;

@Tag(name = "Play", description = "Сессия прохождения: старт, проверка ответов, прогресс, брошено")
@RestController
@RequestMapping("/api/play")
public class PlayController {

    private final PlaySessionService play;
    private final CurrentUser currentUser;

    public PlayController(PlaySessionService play, CurrentUser currentUser) {
        this.play = play;
        this.currentUser = currentUser;
    }

    @Operation(summary = "Начать (или продолжить) квест соло или командой")
    @PostMapping("/start")
    public SessionDto start(Authentication authentication, @Valid @RequestBody StartSessionRequest request) {
        return play.start(currentUser.require(authentication), request);
    }

    @Operation(summary = "Состояние сессии: текущая точка, прогресс, очки")
    @GetMapping("/{id}")
    public SessionDto get(Authentication authentication, @PathVariable Long id) {
        return play.get(currentUser.require(authentication), id);
    }

    @Operation(summary = "Ответ на текущий чекпоинт (код-слово без регистра / вариант вопроса)")
    @PostMapping("/{id}/answer")
    public AnswerResponse answer(Authentication authentication, @PathVariable Long id,
                                 @Valid @RequestBody AnswerRequest request) {
        return play.submitAnswer(currentUser.require(authentication), id, request.answer());
    }

    @Operation(summary = "Открыть подсказку текущей точки")
    @PostMapping("/{id}/hint")
    public QuestPointDto hint(Authentication authentication, @PathVariable Long id) {
        return play.useHint(currentUser.require(authentication), id);
    }

    @Operation(summary = "Бросить квест")
    @PostMapping("/{id}/abandon")
    public SessionDto abandon(Authentication authentication, @PathVariable Long id) {
        return play.abandon(currentUser.require(authentication), id);
    }
}
