package ru.morizo.backend.config;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

/** Раздача загруженных файлов (обложки квестов) из локальной папки. */
@Configuration
public class WebConfig implements WebMvcConfigurer {

    private final AppProperties props;

    @Autowired
    public WebConfig(AppProperties props) {
        this.props = props;
    }

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        registry.addResourceHandler("/uploads/**")
                .addResourceLocations("file:" + props.getUploads().getDir() + "/");
    }
}
