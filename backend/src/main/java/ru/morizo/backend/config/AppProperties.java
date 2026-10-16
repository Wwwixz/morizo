package ru.morizo.backend.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

/** Параметры приложения из application.yml (префикс app). */
@ConfigurationProperties(prefix = "app")
public class AppProperties {

    private final Jwt jwt = new Jwt();
    private final Uploads uploads = new Uploads();

    /** Базовый URL бэкенда (для ссылок на загруженные файлы). */
    private String url = "http://localhost:8080";

    public Jwt getJwt() { return jwt; }
    public Uploads getUploads() { return uploads; }
    public String getUrl() { return url; }
    public void setUrl(String url) { this.url = url; }

    public static class Jwt {
        private String secret = "change-me";
        private long ttlHours = 168;

        public String getSecret() { return secret; }
        public void setSecret(String secret) { this.secret = secret; }
        public long getTtlHours() { return ttlHours; }
        public void setTtlHours(long ttlHours) { this.ttlHours = ttlHours; }
    }

    public static class Uploads {
        private String dir = "./uploads";

        public String getDir() { return dir; }
        public void setDir(String dir) { this.dir = dir; }
    }
}
