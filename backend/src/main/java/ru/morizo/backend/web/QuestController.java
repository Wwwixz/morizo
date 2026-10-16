package ru.morizo.backend.web;

import com.fasterxml.jackson.databind.ObjectMapper;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.MediaType;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;
import ru.morizo.backend.entity.UserEntity;
import ru.morizo.backend.service.CurrentUser;
import ru.morizo.backend.service.ModerationService;
import ru.morizo.backend.service.PlaySessionService;
import ru.morizo.backend.service.QuestService;
import ru.morizo.backend.web.dto.PlayDtos.SessionDto;
import ru.morizo.backend.web.dto.QuestDtos.ComplaintRequest;
import ru.morizo.backend.web.dto.QuestDtos.ComplaintDto;
import ru.morizo.backend.web.dto.QuestDtos.CreateQuestRequest;
import ru.morizo.backend.web.dto.QuestDtos.QuestDto;
import ru.morizo.backend.web.dto.QuestDtos.StatsDto;

import java.util.List;

@Tag(name = "Quests", description = "Лента квестов, создание, просмотр, жалобы")
@RestController
@RequestMapping("/api/quests")
public class QuestController {

    private final QuestService quests;
    private final ModerationService moderation;
    private final PlaySessionService play;
    private final CurrentUser currentUser;
    private final ObjectMapper json = new ObjectMapper();

    public QuestController(QuestService quests, ModerationService moderation,
                           PlaySessionService play, CurrentUser currentUser) {
        this.quests = quests;
        this.moderation = moderation;
        this.play = play;
        this.currentUser = currentUser;
    }

    @Operation(summary = """
            Лента квестов: пагинация (10 на страницу по умолчанию), фильтры:
            status, district, maxDuration, difficultyGroup (easy|medium|pro), lat/lng/radiusKm («рядом со мной»)
            """)
    @GetMapping
    public List<QuestDto> feed(
            @RequestParam(defaultValue = "published") String status,
            @RequestParam(required = false) String district,
            @RequestParam(name = "max_duration", required = false) Integer maxDuration,
            @RequestParam(name = "difficulty_group", required = false) String difficultyGroup,
            @RequestParam(required = false) Double lat,
            @RequestParam(required = false) Double lng,
            @RequestParam(name = "radius_km", required = false) Double radiusKm,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        return quests.feed(status, district, maxDuration, difficultyGroup, lat, lng, radiusKm, page, size);
    }

    @Operation(summary = "Мои квесты (автора)")
    @GetMapping("/my")
    public List<QuestDto> my(Authentication authentication) {
        return quests.getMyQuests(currentUser.require(authentication));
    }

    @Operation(summary = "Квест по id со всеми чекпоинтами (без правильных ответов)")
    @GetMapping("/{id}")
    public QuestDto get(@PathVariable Long id) {
        return quests.getQuest(id);
    }

    @Operation(summary = "Создать квест: multipart, части quest (JSON) и cover (картинка ≤5 МБ)")
    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public QuestDto create(Authentication authentication,
                           @RequestPart("quest") String questJson,
                           @RequestPart(value = "cover", required = false) MultipartFile cover) throws Exception {
        CreateQuestRequest request = json.readValue(questJson, CreateQuestRequest.class);
        return quests.create(currentUser.require(authentication), request, cover);
    }

    @Operation(summary = "Пожаловаться на квест/точку")
    @PostMapping("/complaints")
    public ComplaintDto complain(Authentication authentication, @Valid @RequestBody ComplaintRequest request) {
        return moderation.createComplaint(currentUser.require(authentication), request);
    }

    @Operation(summary = "Активная сессия прохождения по квесту (если есть)")
    @GetMapping("/{id}/active-session")
    public SessionDto activeSession(Authentication authentication, @PathVariable Long id) {
        currentUser.require(authentication);
        return play.activeForQuest(currentUser.require(authentication), id);
    }
}
