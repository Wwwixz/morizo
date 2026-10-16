package ru.morizo.backend;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.ConfigurationPropertiesScan;

@SpringBootApplication
@ConfigurationPropertiesScan
public class MorizoBackendApplication {

    public static void main(String[] args) {
        SpringApplication.run(MorizoBackendApplication.class, args);
    }
}
