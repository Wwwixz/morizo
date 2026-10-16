package ru.morizo.backend.web;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import ru.morizo.backend.entity.Quest;
import ru.morizo.backend.entity.UserEntity;
import ru.morizo.backend.service.CurrentUser;
import ru.morizo.backend.service.ModerationService;
import ru.morizo.backend.web.dto.QuestDtos.ComplaintDto;
import ru.morizo.backend.web.dto.QuestDtos.ModerationDecisionRequest;
import ru.morizo.backend.web.dto.QuestDtos.QuestDto;

import java.util.List;

@Tag(name = "Moderation", description = "Роль модератора: очередь, одобрение/отклонение с причиной, жалобы")
@RestController
@RequestMapping("/api/moderation")
@PreAuthorize("hasRole('MODERATOR')")
public class ModerationController {

    private final ModerationService moderation;
    private final CurrentUser currentUser;

    public ModerationController(ModerationService moderation, CurrentUser currentUser) {
        this.moderation = moderation;
        this.currentUser = currentUser;
    }

    @Operation(summary = "Очередь квестов: status=pending (на модерации) / rejected / archived")
    @GetMapping("/quests")
    public List<QuestDto> queue(@RequestParam(defaultValue = "pending") String status) {
        Quest.Status s = switch (status) {
            case "pending" -> Quest.Status.ON_MODERATION;
            case "rejected" -> Quest.Status.REJECTED;
            case "archived" -> Quest.Status.ARCHIVED;
            default -> Quest.Status.ON_MODERATION;
        };
        return moderation.queue(s);
    }

    @Operation(summary = "Подтвердить публикацию")
    @PostMapping("/quests/{id}/approve")
    public QuestDto approve(Authentication authentication, @PathVariable Long id) {
        return moderation.approve(currentUser.requireModerator(authentication), id);
    }

    @Operation(summary = "Отклонить с причиной (обязательна)")
    @PostMapping("/quests/{id}/reject")
    public QuestDto reject(Authentication authentication, @PathVariable Long id,
                           @RequestBody ModerationDecisionRequest request) {
        return moderation.reject(currentUser.requireModerator(authentication), id, request);
    }

    @Operation(summary = "Скрыть квест (например, по жалобам)")
    @PostMapping("/quests/{id}/hide")
    public QuestDto hide(Authentication authentication, @PathVariable Long id) {
        return moderation.hide(currentUser.requireModerator(authentication), id);
    }

    @Operation(summary = "Список жалоб")
    @GetMapping("/complaints")
    public List<ComplaintDto> complaints() {
        return moderation.listComplaints();
    }

    @Operation(summary = "Отметить жалобу обработанной")
    @PostMapping("/complaints/{id}/resolve")
    public void resolve(@PathVariable Long id) {
        moderation.resolveComplaint(id);
    }
}
