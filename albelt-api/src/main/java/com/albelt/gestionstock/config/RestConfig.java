package com.albelt.gestionstock.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

/**
 * REST API Configuration
 * Configures CORS, interceptors, and other REST-specific settings
 */
@Configuration
public class RestConfig implements WebMvcConfigurer {

    /**
     * Configure CORS settings for API endpoints
     * Allows frontend (React) to communicate with backend
     */
    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/api/**")
                .allowedOrigins(
                        "http://localhost:3000",      // Local React dev server
                        "http://localhost:8080",      // Local alternative
                        "http://127.0.0.1:3000"       // 127.0.0.1 variant
                )
                .allowedMethods("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS")
                .allowedHeaders("*")
                .allowCredentials(true)
                .maxAge(86400);  // 24 hours
    }
}
