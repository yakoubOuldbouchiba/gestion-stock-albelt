package com.albelt.gestionstock.shared.database;

import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.Resource;
import org.springframework.core.io.support.PathMatchingResourcePatternResolver;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.util.Arrays;
import java.util.Collections;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Component
@Slf4j
public class DatabaseTriggerRegistry {

    private static final Pattern CREATE_TRIGGER_PATTERN = Pattern.compile(
            "(?is)create\\s+trigger\\s+([\\w\"]+)\\s+((?:before|after|instead\\s+of)\\s+.+?)\\s+on\\s+([\\w.\"]+)\\s+for\\s+each\\s+row\\s+execute\\s+function\\s+([\\w.\"]+)\\s*\\("
    );

    private final Map<String, DatabaseTriggerDefinition> triggersByFunctionName;

    public DatabaseTriggerRegistry() {
        this.triggersByFunctionName = Collections.unmodifiableMap(loadTriggerDefinitions());
    }

    public Optional<DatabaseTriggerDefinition> findByFunctionName(String functionName) {
        if (functionName == null || functionName.isBlank()) {
            return Optional.empty();
        }
        return Optional.ofNullable(triggersByFunctionName.get(normalizeFunctionName(functionName)));
    }

    private Map<String, DatabaseTriggerDefinition> loadTriggerDefinitions() {
        Map<String, DatabaseTriggerDefinition> definitions = new LinkedHashMap<>();
        PathMatchingResourcePatternResolver resolver = new PathMatchingResourcePatternResolver();

        try {
            Resource[] resources = resolver.getResources("classpath*:db/migration/*.sql");
            Arrays.sort(resources, Comparator.comparing(resource -> resource.getFilename() == null ? "" : resource.getFilename()));

            for (Resource resource : resources) {
                parseResource(resource, definitions);
            }
        } catch (IOException ex) {
            log.warn("Unable to load database trigger definitions from migrations", ex);
        }

        return definitions;
    }

    private void parseResource(Resource resource, Map<String, DatabaseTriggerDefinition> definitions) {
        try (InputStream inputStream = resource.getInputStream()) {
            String sql = new String(inputStream.readAllBytes(), StandardCharsets.UTF_8);
            Matcher matcher = CREATE_TRIGGER_PATTERN.matcher(sql);

            while (matcher.find()) {
                String triggerName = normalizeIdentifier(matcher.group(1));
                String clause = normalizeWhitespace(matcher.group(2)).toUpperCase(Locale.ROOT);
                String tableName = normalizeIdentifier(matcher.group(3));
                String functionName = normalizeFunctionName(matcher.group(4));
                String timing = clause.startsWith("INSTEAD OF") ? "INSTEAD OF" : clause.split("\\s+", 2)[0];
                String events = clause.substring(Math.min(timing.length(), clause.length())).trim();

                definitions.put(functionName, new DatabaseTriggerDefinition(
                        triggerName,
                        functionName,
                        tableName,
                        timing,
                        events,
                        resource.getFilename() == null ? "unknown" : resource.getFilename()
                ));
            }
        } catch (IOException ex) {
            log.warn("Unable to parse trigger definitions from {}", resource.getFilename(), ex);
        }
    }

    private String normalizeWhitespace(String value) {
        return value == null ? "" : value.replaceAll("\\s+", " ").trim();
    }

    private String normalizeIdentifier(String value) {
        if (value == null) {
            return "";
        }

        String normalized = value.replace("\"", "").trim();
        int dotIndex = normalized.lastIndexOf('.');
        if (dotIndex >= 0 && dotIndex < normalized.length() - 1) {
            normalized = normalized.substring(dotIndex + 1);
        }
        return normalized;
    }

    private String normalizeFunctionName(String value) {
        String normalized = normalizeIdentifier(value);
        int parenthesisIndex = normalized.indexOf('(');
        if (parenthesisIndex >= 0) {
            normalized = normalized.substring(0, parenthesisIndex);
        }
        return normalized.toLowerCase(Locale.ROOT);
    }
}