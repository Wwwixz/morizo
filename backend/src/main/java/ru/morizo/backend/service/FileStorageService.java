package ru.morizo.backend.service;

import jakarta.annotation.PostConstruct;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import ru.morizo.backend.config.AppProperties;

import java.io.IOException;
import java.io.OutputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Locale;
import java.util.Set;

/**
 * Локальное хранение загруженных файлов (ТЗ: «загрузка файлов — локально»).
 * Обложки доступны по /uploads/&lt;имя файла&gt;.
 */
@Service
public class FileStorageService {

    private static final Set<String> ALLOWED_TYPES = Set.of("image/jpeg", "image/png", "image/webp");

    private final Path root;

    public FileStorageService(AppProperties props) {
        this.root = Paths.get(props.getUploads().getDir()).toAbsolutePath().normalize();
    }

    @PostConstruct
    void init() {
        try {
            Files.createDirectories(root);
        } catch (IOException e) {
            throw new IllegalStateException("Не удалось создать папку загрузок: " + root, e);
        }
    }

    /** @return публичный URL загруженного файла */
    public String store(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw BusinessException.badRequest("Файл не передан");
        }
        String type = file.getContentType() == null ? "" : file.getContentType().toLowerCase(Locale.ROOT);
        if (!ALLOWED_TYPES.contains(type)) {
            throw BusinessException.badRequest("Допустимы только изображения JPG, PNG, WebP");
        }
        String ext = switch (type) {
            case "image/png" -> ".png";
            case "image/webp" -> ".webp";
            default -> ".jpg";
        };
        String name = System.currentTimeMillis() + "-" + Long.toHexString(Double.doubleToLongBits(Math.random())) + ext;
        try (OutputStream out = Files.newOutputStream(root.resolve(name))) {
            out.write(file.getBytes());
        } catch (IOException e) {
            throw new IllegalStateException("Не удалось сохранить файл", e);
        }
        return "/uploads/" + name;
    }
}
