package com.albelt.gestionstock.config;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.env.EnvironmentPostProcessor;
import org.springframework.core.Ordered;
import org.springframework.core.env.ConfigurableEnvironment;
import org.springframework.core.env.MapPropertySource;

import java.net.URI;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.util.HashMap;
import java.util.Map;

/**
 * Render provides DATABASE_URL in the form: postgres://user:pass@host:port/dbname
 * Spring Boot expects a JDBC URL (jdbc:postgresql://host:port/dbname) plus username/password.
 *
 * This post-processor runs before the ApplicationContext is created and maps DATABASE_URL
 * into spring.datasource.* if those properties are not already set.
 */
public class DatabaseUrlEnvironmentPostProcessor implements EnvironmentPostProcessor, Ordered {

    @Override
    public void postProcessEnvironment(ConfigurableEnvironment environment, SpringApplication application) {
        // Prefer JDBC_DATABASE_URL if provided (already in JDBC format).
        String jdbcDatabaseUrl = environment.getProperty("JDBC_DATABASE_URL");
        String databaseUrl = environment.getProperty("DATABASE_URL");

        // If neither is present, do nothing.
        if (!hasText(jdbcDatabaseUrl) && !hasText(databaseUrl)) {
            return;
        }

        // Respect explicit Spring datasource configuration unless it's the local default.
        // (application.yml provides defaults like localhost:5432 which must be overridden on Render.)
        String currentDatasourceUrl = environment.getProperty("spring.datasource.url");
        if (hasText(currentDatasourceUrl) && !looksLikeLocalDefault(currentDatasourceUrl)) {
            return;
        }

        ParsedDbUrl parsed = null;

        if (hasText(jdbcDatabaseUrl)) {
            parsed = ParsedDbUrl.fromJdbcUrl(jdbcDatabaseUrl);
        } else if (hasText(databaseUrl)) {
            parsed = ParsedDbUrl.fromDatabaseUrl(databaseUrl);
            jdbcDatabaseUrl = parsed != null ? parsed.jdbcUrl : null;
        }

        if (!hasText(jdbcDatabaseUrl)) {
            return;
        }

        Map<String, Object> mapped = new HashMap<>();
        mapped.put("spring.datasource.url", jdbcDatabaseUrl);

        if (parsed != null && hasText(parsed.username)) {
            mapped.put("spring.datasource.username", parsed.username);
        }

        if (parsed != null && parsed.password != null) {
            mapped.put("spring.datasource.password", parsed.password);
        }

        environment.getPropertySources().addFirst(new MapPropertySource("databaseUrlMapping", mapped));
    }

    @Override
    public int getOrder() {
        // Ensure this runs as early as possible.
        return Ordered.HIGHEST_PRECEDENCE;
    }

    private static boolean hasText(String value) {
        return value != null && !value.trim().isEmpty();
    }

    private static boolean looksLikeLocalDefault(String jdbcUrl) {
        String normalized = jdbcUrl.trim().toLowerCase();
        return normalized.contains("jdbc:postgresql://localhost")
                || normalized.contains("jdbc:postgresql://127.0.0.1")
                || normalized.contains("jdbc:postgresql://0.0.0.0");
    }

    private static final class ParsedDbUrl {
        private final String jdbcUrl;
        private final String username;
        private final String password;

        private ParsedDbUrl(String jdbcUrl, String username, String password) {
            this.jdbcUrl = jdbcUrl;
            this.username = username;
            this.password = password;
        }

        static ParsedDbUrl fromJdbcUrl(String jdbcUrl) {
            // We can't reliably parse username/password from a generic JDBC URL.
            return new ParsedDbUrl(jdbcUrl, null, null);
        }

        static ParsedDbUrl fromDatabaseUrl(String databaseUrl) {
            try {
                URI uri = URI.create(databaseUrl);
                String scheme = uri.getScheme();
                if (scheme == null) {
                    return null;
                }

                // Accept postgres:// and postgresql://
                if (!scheme.equalsIgnoreCase("postgres") && !scheme.equalsIgnoreCase("postgresql")) {
                    return null;
                }

                String host = uri.getHost();
                int port = uri.getPort() == -1 ? 5432 : uri.getPort();
                String path = uri.getPath();
                String databaseName = (path != null && path.startsWith("/")) ? path.substring(1) : path;
                if (!hasText(host) || !hasText(databaseName)) {
                    return null;
                }

                String query = uri.getQuery();
                String jdbcUrl = "jdbc:postgresql://" + host + ":" + port + "/" + databaseName;
                if (hasText(query)) {
                    jdbcUrl += "?" + query;
                }

                String username = null;
                String password = null;

                String userInfo = uri.getUserInfo();
                if (hasText(userInfo)) {
                    String decoded = URLDecoder.decode(userInfo, StandardCharsets.UTF_8);
                    int colonIndex = decoded.indexOf(':');
                    if (colonIndex >= 0) {
                        username = decoded.substring(0, colonIndex);
                        password = decoded.substring(colonIndex + 1);
                    } else {
                        username = decoded;
                    }
                }

                return new ParsedDbUrl(jdbcUrl, username, password);
            } catch (Exception ignored) {
                return null;
            }
        }
    }
}
