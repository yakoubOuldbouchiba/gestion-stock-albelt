package com.albelt.gestionstock.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.License;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * OpenAPI/Swagger Configuration
 * Generates interactive API documentation available at /swagger-ui.html
 */
@Configuration
public class OpenApiConfig {

    @Bean
    public OpenAPI customOpenAPI() {
        return new OpenAPI()
                .info(new Info()
                        .title("ALBEL Stock Management System API")
                        .version("1.0.0")
                        .description("REST API for ALBEL stock management with FIFO inventory control and waste reduction")
                        .contact(new Contact()
                                .name("ALBEL Development Team")
                                .email("dev@albel.com")
                                .url("https://albel.com"))
                        .license(new License()
                                .name("All Rights Reserved")
                                .url("https://albel.com")));
    }
}
