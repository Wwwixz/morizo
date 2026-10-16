package ru.morizo.backend.config;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/** Описание API: OpenAPI 3 + Swagger UI доступен на /swagger-ui.html */
@Configuration
public class OpenApiConfig {

    @Bean
    public OpenAPI morizoOpenApi() {
        final String scheme = "bearerAuth";
        return new OpenAPI()
                .info(new Info()
                        .title("MORIZO API")
                        .description("""
                                Платформа городских квестов: пользователи создают маршруты с заданиями,
                                другие — проходят их соло или командами (2–6 человек). Модерация контента,
                                рейтинг команд, достижения.

                                Демо-аккаунты:
                                - модератор: `moderator@morizo.ru` / `demo123`
                                - игрок: `artem@morizo.ru` / `demo123`
                                """)
                        .version("1.0.0")
                        .contact(new Contact().name("Команда MORIZO")))
                .components(new Components().addSecuritySchemes(scheme,
                        new SecurityScheme()
                                .name(scheme)
                                .type(SecurityScheme.Type.HTTP)
                                .scheme("bearer")
                                .bearerFormat("JWT")))
                .addSecurityItem(new SecurityRequirement().addList(scheme));
    }
}
