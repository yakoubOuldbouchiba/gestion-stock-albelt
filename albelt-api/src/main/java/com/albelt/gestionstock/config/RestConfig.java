package com.albelt.gestionstock.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

/**
 * REST API Configuration
 * Configures CORS, interceptors, and other REST-specific settings
 */
@Configuration
public class RestConfig implements WebMvcConfigurer {

    private final List<String> allowedOrigins;

    public RestConfig(
            @Value("${albel.api.cors.allowed-origins:http://localhost:3000,http://localhost:5173,http://127.0.0.1:3000}")
            String allowedOriginsCsv
    ) {
        this.allowedOrigins = Arrays.stream(allowedOriginsCsv.split(","))
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .collect(Collectors.toList());
    }

    /**
     * Configure CORS settings for API endpoints
     * Allows frontend (React) to communicate with backend
     */
    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/api/**")
                .allowedOrigins(allowedOrigins.toArray(new String[0]))
                .allowedMethods("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS")
                .allowedHeaders("*")
                .allowCredentials(true)
                .maxAge(86400);  // 24 hours
    }
}
