package ru.morizo.backend.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Component;
import ru.morizo.backend.entity.Checkpoint;
import ru.morizo.backend.entity.Quest;
import ru.morizo.backend.web.dto.QuestDtos.QuestDto;
import ru.morizo.backend.web.dto.QuestDtos.QuestPointDto;

import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

/** Маппинг сущностей в DTO (ответы чекпоинтов наружу не отдаются). */
@Component
public class QuestMapper {

    private final ObjectMapper json = new ObjectMapper();

    public QuestDto toDto(Quest q, boolean popular, long completions, boolean withPoints) {
        List<QuestPointDto> points = withPoints
                ? q.orderedCheckpoints().stream().map(this::toPointDto).toList()
                : List.of();
        boolean isNew = q.getPublishedAt() != null
                ? Duration.between(q.getPublishedAt(), Instant.now()).toDays() < 14
                : Duration.between(q.getCreatedAt(), Instant.now()).toDays() < 14;
        String tag = isNew ? "Новинка"
                : popular ? "Популярное"
                : q.getDifficulty() <= 1 ? "Для первого раза"
                : "Для компании";
        return new QuestDto(
                q.getId(),
                q.getTitle(),
                q.getDescription(),
                q.getDistrict(),
                q.getDifficulty(),
                q.getDistanceKm(),
                q.getDurationMin(),
                q.getPlayersMin(),
                q.getPlayersMax(),
                q.getCheckpoints().size(),
                q.getImage(),
                q.getGallery() == null ? List.of() : q.getGallery(),
                frontStatus(q.getStatus()),
                popular,
                isNew,
                q.getRating(),
                tag,
                q.getRules(),
                q.getTransportMode().name(),
                q.getTransportMode().getLabel(),
                q.getAuthor().getNickname(),
                q.getAuthor().getId(),
                q.getRejectionReason(),
                points
        );
    }

    public QuestPointDto toPointDto(Checkpoint c) {
        return new QuestPointDto(
                c.getLat(),
                c.getLng(),
                c.getTitle(),
                c.getTask(),
                c.getHint(),
                c.getPointRules(),
                c.getType().name(),
                parseOptions(c.getOptionsJson())
        );
    }

    public List<String> parseOptions(String optionsJson) {
        if (optionsJson == null || optionsJson.isBlank()) {
            return null;
        }
        try {
            return json.readValue(optionsJson, new TypeReference<List<String>>() {});
        } catch (Exception e) {
            return null;
        }
    }

    /** Внутренние статусы -> строки фронтенда. */
    public static String frontStatus(Quest.Status status) {
        return switch (status) {
            case DRAFT -> "draft";
            case ON_MODERATION -> "pending";
            case PUBLISHED -> "published";
            case REJECTED -> "rejected";
            case ARCHIVED -> "archived";
        };
    }
}
