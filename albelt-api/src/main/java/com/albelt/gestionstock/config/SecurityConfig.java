package com.albelt.gestionstock.config;

import com.albelt.gestionstock.shared.security.JwtAuthenticationFilter;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Spring Security Configuration
 * - JWT-based authentication
 * - Stateless sessions
 * - CORS support for frontend
 */
@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class SecurityConfig {

    private final List<String> allowedOrigins;

    public SecurityConfig(
            @Value("${albel.api.cors.allowed-origins:http://localhost:3000,http://localhost:5173,http://127.0.0.1:3000}")
            String allowedOriginsCsv
    ) {
        this.allowedOrigins = Arrays.stream(allowedOriginsCsv.split(","))
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .collect(Collectors.toList());
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http, JwtAuthenticationFilter jwtFilter) throws Exception {
        http
                // CORS configuration
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))

                // Disable CSRF for stateless API
                .csrf(csrf -> csrf.disable())

                // Use stateless session management (JWT)
                .sessionManagement(session -> session
                        .sessionCreationPolicy(SessionCreationPolicy.STATELESS)
                )

                // Permit public endpoints
                .authorizeHttpRequests(auth -> auth
                        // ── Fully public ─────────────────────────────────────────────────────
                        .requestMatchers("/api/auth/login", "/api/auth/health").permitAll()
                        .requestMatchers("/actuator/health").permitAll()
                        // Swagger: restrict to admins in production to avoid leaking API details
                        .requestMatchers("/swagger-ui/**", "/v3/api-docs/**").hasAnyRole("ADMIN", "SUPER_ADMIN")

                        // ── Authenticated-only shortcuts (override broader rules below) ────────
                        .requestMatchers(HttpMethod.GET,   "/api/users/operators").authenticated()
                        .requestMatchers(HttpMethod.GET,   "/api/auth/me").authenticated()
                        // Users may change their own password regardless of role
                        .requestMatchers(HttpMethod.PATCH, "/api/users/me/password").authenticated()

                        // ── Admin-only management areas ───────────────────────────────────────
                        .requestMatchers("/api/users/**",       "/api/user-altiers/**").hasAnyRole("ADMIN", "SUPER_ADMIN")
                        .requestMatchers("/api/admin/**").hasAnyRole("ADMIN", "SUPER_ADMIN")
                        .requestMatchers("/api/audit-logs/**").hasAnyRole("ADMIN", "SUPER_ADMIN")

                        // ── Global HTTP-verb rules (defence-in-depth; controllers add @PreAuthorize too)
                        // DELETE always requires ADMIN or above — no OPERATOR/READONLY deletion
                        .requestMatchers(HttpMethod.DELETE, "/api/**").hasAnyRole("ADMIN", "SUPER_ADMIN")
                        // Write operations (create / update) require at least OPERATOR
                        .requestMatchers(HttpMethod.POST,  "/api/**").hasAnyRole("OPERATOR", "ADMIN", "SUPER_ADMIN")
                        .requestMatchers(HttpMethod.PUT,   "/api/**").hasAnyRole("OPERATOR", "ADMIN", "SUPER_ADMIN")
                        .requestMatchers(HttpMethod.PATCH, "/api/**").hasAnyRole("OPERATOR", "ADMIN", "SUPER_ADMIN")

                        // ── All other requests require authentication ─────────────────────────
                        .anyRequest().authenticated()
                )

                // Add JWT filter
                .addFilterBefore(jwtFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();

        boolean hasWildcard = allowedOrigins.stream().anyMatch(o -> o.contains("*"));
        if (hasWildcard) {
            configuration.setAllowedOriginPatterns(allowedOrigins);
        } else {
            configuration.setAllowedOrigins(allowedOrigins);
        }

        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"));
        configuration.setAllowedHeaders(Arrays.asList("*"));
        configuration.setAllowCredentials(true);
        configuration.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}
