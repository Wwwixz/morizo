package ru.morizo.backend.web.advice;

import jakarta.persistence.EntityNotFoundException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.multipart.MaxUploadSizeExceededException;
import ru.morizo.backend.service.BusinessException;

import java.util.HashMap;
import java.util.Map;

@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    /** Ошибки бизнес-логики: код и сообщение задаёт сервис. */
    @ExceptionHandler(BusinessException.class)
    public ResponseEntity<ApiError> business(BusinessException e) {
        return ResponseEntity.status(e.getStatus())
                .body(ApiError.of(e.getStatus().value(), e.getStatus().getReasonPhrase(), e.getMessage()));
    }

    /** 401 — неверный email/пароль */
    @ExceptionHandler(BadCredentialsException.class)
    public ResponseEntity<ApiError> badCredentials(BadCredentialsException e) {
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(ApiError.of(401, "Unauthorized", "Неверный email или пароль"));
    }

    /** 403 */
    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<ApiError> forbidden(AccessDeniedException e) {
        return ResponseEntity.status(HttpStatus.FORBIDDEN)
                .body(ApiError.of(403, "Forbidden", "Недостаточно прав"));
    }

    /** 404 */
    @ExceptionHandler(EntityNotFoundException.class)
    public ResponseEntity<ApiError> notFound(EntityNotFoundException e) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(ApiError.of(404, "Not Found", e.getMessage()));
    }

    /** 400 — невалидные поля @Valid */
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiError> validation(MethodArgumentNotValidException e) {
        Map<String, String> fields = new HashMap<>();
        for (FieldError fe : e.getBindingResult().getFieldErrors()) {
            fields.put(fe.getField(), fe.getDefaultMessage());
        }
        return ResponseEntity.badRequest().body(new ApiError(
                400, "Bad Request", "Проверьте правильность заполнения полей", fields, java.time.Instant.now()));
    }

    /** 400 — битый/нечитаемый JSON в запросе */
    @ExceptionHandler(org.springframework.http.converter.HttpMessageNotReadableException.class)
    public ResponseEntity<ApiError> unreadable(org.springframework.http.converter.HttpMessageNotReadableException e) {
        return ResponseEntity.badRequest()
                .body(ApiError.of(400, "Bad Request", "Некорректное тело запроса"));
    }

    /** 400 — прочие некорректные запросы */
    @ExceptionHandler({IllegalArgumentException.class, IllegalStateException.class})
    public ResponseEntity<ApiError> badRequest(RuntimeException e) {
        return ResponseEntity.badRequest()
                .body(ApiError.of(400, "Bad Request", e.getMessage()));
    }

    /** 413 — обложка больше 5 МБ */
    @ExceptionHandler(MaxUploadSizeExceededException.class)
    public ResponseEntity<ApiError> tooLarge(MaxUploadSizeExceededException e) {
        return ResponseEntity.status(HttpStatus.PAYLOAD_TOO_LARGE)
                .body(ApiError.of(413, "Payload Too Large", "Файл обложки слишком большой (максимум 5 МБ)"));
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiError> internal(Exception e) {
        log.error("Unhandled error", e);
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ApiError.of(500, "Internal Server Error", "Внутренняя ошибка сервера"));
    }
}
