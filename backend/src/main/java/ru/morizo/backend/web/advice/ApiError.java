package ru.morizo.backend.web.advice;

import com.fasterxml.jackson.annotation.JsonInclude;

import java.time.Instant;
import java.util.Map;

/** Формат ошибки API: 400/401/403/404/409 c понятным сообщением. */
@JsonInclude(JsonInclude.Include.NON_NULL)
public record ApiError(
        int status,
        String error,
        String message,
        Map<String, String> fieldErrors,
        Instant timestamp
) {
    public static ApiError of(int status, String error, String message) {
        return new ApiError(status, error, message, null, Instant.now());
    }
}
