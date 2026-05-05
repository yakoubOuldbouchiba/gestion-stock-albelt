package com.albelt.gestionstock.shared.database;

import lombok.RequiredArgsConstructor;
import org.flywaydb.core.api.ErrorCode;
import org.flywaydb.core.api.ErrorDetails;
import org.flywaydb.core.api.FlywayException;
import org.flywaydb.core.api.output.ValidateOutput;
import org.flywaydb.core.api.output.ValidateResult;
import org.springframework.dao.DataAccessException;
import org.springframework.stereotype.Component;

import java.sql.SQLException;
import java.util.ArrayList;
import java.util.Collections;
import java.util.IdentityHashMap;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Component
@RequiredArgsConstructor
public class DatabaseErrorMapper {

    private static final Pattern ERROR_PATTERN = Pattern.compile("(?im)error:\\s*(.+)$");
    private static final Pattern DETAIL_PATTERN = Pattern.compile("(?im)detail:\\s*(.+)$");
    private static final Pattern HINT_PATTERN = Pattern.compile("(?im)(?:hint|indice):\\s*(.+)$");
    private static final Pattern FUNCTION_PATTERN = Pattern.compile("(?i)pl/pgsql function\\s+([\\w.\"]+)\\s*\\(");
    private static final Pattern CONSTRAINT_PATTERN = Pattern.compile("(?i)constraint\\s+\"?([\\w.-]+)\"?");
    private static final Pattern SCHEMA_PATTERN = Pattern.compile("(?i)schema\\s+\"?([\\w.-]+)\"?");

    private final DatabaseTriggerRegistry databaseTriggerRegistry;

    public List<DatabaseError> mapValidationErrors(ValidateResult validateResult) {
        Objects.requireNonNull(validateResult, "validateResult must not be null");

        Set<DatabaseError> errors = new LinkedHashSet<>();
        if (validateResult.invalidMigrations != null) {
            for (ValidateOutput invalidMigration : validateResult.invalidMigrations) {
                errors.add(mapInvalidMigration(invalidMigration));
            }
        }

        if (errors.isEmpty()) {
            errors.add(mapValidationTopLevel(validateResult.errorDetails));
        }

        return List.copyOf(errors);
    }

    public List<DatabaseError> mapExecutionErrors(Throwable throwable) {
        Set<DatabaseError> errors = new LinkedHashSet<>();

        for (SQLException sqlException : collectSqlExceptions(throwable)) {
            errors.add(mapSqlException(sqlException));
        }

        if (!errors.isEmpty()) {
            return List.copyOf(errors);
        }

        for (Throwable candidate : collectThrowables(throwable)) {
            if (candidate instanceof DataAccessException dataAccessException) {
                errors.add(mapDataAccessException(dataAccessException));
            } else if (candidate instanceof FlywayException flywayException) {
                errors.add(mapFlywayException(flywayException));
            }
        }

        if (errors.isEmpty()) {
            errors.add(new DatabaseError(
                    "DB_ERROR",
                    "db.error",
                    Map.of("detail", "Database operation failed")
            ));
        }

        return List.copyOf(errors);
    }

    private DatabaseError mapInvalidMigration(ValidateOutput invalidMigration) {
        ErrorCode errorCode = extractErrorCode(invalidMigration.errorDetails);
        Map<String, Object> params = new LinkedHashMap<>();
        params.put("version", defaultText(invalidMigration.version, "repeatable"));
        params.put("description", defaultText(invalidMigration.description, "-"));
        params.put("filePath", defaultText(invalidMigration.filepath, "-"));
        params.put("detail", defaultText(errorMessage(invalidMigration.errorDetails), errorCode.name()));

        return new DatabaseError(validationCode(errorCode), validationMessageKey(errorCode), params);
    }

    private DatabaseError mapValidationTopLevel(ErrorDetails errorDetails) {
        ErrorCode errorCode = extractErrorCode(errorDetails);
        Map<String, Object> params = new LinkedHashMap<>();
        params.put("detail", defaultText(errorMessage(errorDetails), "Flyway validation failed"));
        return new DatabaseError(validationCode(errorCode), validationMessageKey(errorCode), params);
    }

    private DatabaseError mapSqlException(SQLException sqlException) {
        String sqlState = defaultText(sqlException.getSQLState(), "UNKNOWN");
        String rawMessage = defaultText(sqlException.getMessage(), "");
        String detail = defaultText(extractPrimaryDetail(rawMessage), "Database operation failed");
        String hint = extractHint(rawMessage);
        String functionName = extractFunctionName(rawMessage);
        Optional<DatabaseTriggerDefinition> triggerDefinition = databaseTriggerRegistry.findByFunctionName(functionName);

        if (isTriggerError(sqlState, rawMessage, functionName, triggerDefinition)) {
            Map<String, Object> params = buildTriggerParams(detail, hint, sqlState, functionName, triggerDefinition);

            if (isTriggerDefinitionError(sqlState, rawMessage)) {
                return new DatabaseError("TRIGGER_DEFINITION_ERROR", "db.trigger.definitionError", params);
            }
            if (isBusinessRuleTrigger(sqlState, rawMessage)) {
                return new DatabaseError("TRIGGER_ERROR", "db.trigger.businessRuleFailed", params);
            }
            return new DatabaseError("TRIGGER_ERROR", "db.trigger.error", params);
        }

        if (isConstraintViolation(sqlState, rawMessage)) {
            Map<String, Object> params = new LinkedHashMap<>();
            params.put("constraint", defaultText(extractConstraintName(rawMessage), "unknown"));
            params.put("detail", detail);
            if (hint != null) {
                params.put("hint", hint);
            }
            return new DatabaseError("CONSTRAINT_ERROR", "db.constraint.violation", params);
        }

        if (isMissingSchema(sqlState, rawMessage)) {
            Map<String, Object> params = new LinkedHashMap<>();
            params.put("schema", defaultText(extractSchemaName(rawMessage), "unknown"));
            params.put("detail", detail);
            return new DatabaseError("SCHEMA_ERROR", "db.schema.missing", params);
        }

        if (isConnectionError(sqlState, rawMessage)) {
            return new DatabaseError(
                    "DB_CONNECTION_ERROR",
                    "db.connection.error",
                    Map.of("detail", detail)
            );
        }

        return new DatabaseError(
                "DB_ERROR",
                "db.error",
                Map.of("detail", detail)
        );
    }

    private Map<String, Object> buildTriggerParams(String detail,
                                                   String hint,
                                                   String sqlState,
                                                   String functionName,
                                                   Optional<DatabaseTriggerDefinition> triggerDefinition) {
        Map<String, Object> params = new LinkedHashMap<>();
        params.put("detail", detail);
        params.put("triggerFunction", defaultText(functionName, "unknown"));
        params.put("triggerName", triggerDefinition.map(DatabaseTriggerDefinition::triggerName).orElse("unknown"));
        params.put("tableName", triggerDefinition.map(DatabaseTriggerDefinition::tableName).orElse("unknown"));
        params.put("timing", triggerDefinition.map(DatabaseTriggerDefinition::timing).orElse("unknown"));
        params.put("events", triggerDefinition.map(DatabaseTriggerDefinition::events).orElse("unknown"));
        params.put("sqlState", sqlState);
        if (hint != null) {
            params.put("hint", hint);
        }
        return params;
    }

    private DatabaseError mapDataAccessException(DataAccessException dataAccessException) {
        Throwable mostSpecificCause = dataAccessException.getMostSpecificCause();
        String detail = defaultText(
                extractPrimaryDetail(mostSpecificCause == null ? dataAccessException.getMessage() : mostSpecificCause.getMessage()),
                "A data access error occurred"
        );
        return new DatabaseError(
                "DATA_ACCESS_ERROR",
                "db.dataAccess.error",
                Map.of("detail", detail)
        );
    }

    private DatabaseError mapFlywayException(FlywayException flywayException) {
        ErrorCode errorCode = flywayException.getErrorCode();
        String detail = defaultText(extractPrimaryDetail(flywayException.getMessage()), "Flyway migration failed");

        if (errorCode == ErrorCode.CHECKSUM_MISMATCH || detail.toLowerCase(Locale.ROOT).contains("checksum mismatch")) {
            return new DatabaseError(
                    "FLYWAY_CHECKSUM_MISMATCH",
                    "flyway.validation.checksumMismatch",
                    Map.of(
                            "version", "unknown",
                            "description", "unknown",
                            "filePath", "-",
                            "detail", detail
                    )
            );
        }

        return new DatabaseError(
                "FLYWAY_ERROR",
                "migration.execution.flywayError",
                Map.of("detail", detail)
        );
    }

    private List<Throwable> collectThrowables(Throwable throwable) {
        List<Throwable> throwables = new ArrayList<>();
        Set<Throwable> visited = Collections.newSetFromMap(new IdentityHashMap<>());
        collectThrowable(throwable, throwables, visited);
        return throwables;
    }

    private void collectThrowable(Throwable throwable, List<Throwable> throwables, Set<Throwable> visited) {
        if (throwable == null || !visited.add(throwable)) {
            return;
        }

        throwables.add(throwable);
        if (throwable instanceof SQLException sqlException) {
            SQLException next = sqlException.getNextException();
            while (next != null && visited.add(next)) {
                throwables.add(next);
                next = next.getNextException();
            }
        }

        for (Throwable suppressed : throwable.getSuppressed()) {
            collectThrowable(suppressed, throwables, visited);
        }

        collectThrowable(throwable.getCause(), throwables, visited);
    }

    private List<SQLException> collectSqlExceptions(Throwable throwable) {
        List<SQLException> sqlExceptions = new ArrayList<>();
        for (Throwable candidate : collectThrowables(throwable)) {
            if (candidate instanceof SQLException sqlException) {
                sqlExceptions.add(sqlException);
            }
        }
        return sqlExceptions;
    }

    private ErrorCode extractErrorCode(ErrorDetails errorDetails) {
        if (errorDetails == null || errorDetails.errorCode == null) {
            return ErrorCode.VALIDATE_ERROR;
        }
        return errorDetails.errorCode;
    }

    private String validationCode(ErrorCode errorCode) {
        return switch (errorCode) {
            case CHECKSUM_MISMATCH -> "FLYWAY_CHECKSUM_MISMATCH";
            case APPLIED_REPEATABLE_MIGRATION_NOT_RESOLVED,
                    APPLIED_VERSIONED_MIGRATION_NOT_RESOLVED -> "FLYWAY_MISSING_MIGRATION";
            case RESOLVED_REPEATABLE_MIGRATION_NOT_APPLIED,
                    RESOLVED_VERSIONED_MIGRATION_NOT_APPLIED -> "FLYWAY_NOT_APPLIED";
            case FAILED_REPEATABLE_MIGRATION,
                    FAILED_VERSIONED_MIGRATION -> "FLYWAY_FAILED_MIGRATION";
            case SCHEMA_DOES_NOT_EXIST -> "FLYWAY_MISSING_SCHEMA";
            default -> "FLYWAY_VALIDATION_ERROR";
        };
    }

    private String validationMessageKey(ErrorCode errorCode) {
        return switch (errorCode) {
            case CHECKSUM_MISMATCH -> "flyway.validation.checksumMismatch";
            case APPLIED_REPEATABLE_MIGRATION_NOT_RESOLVED,
                    APPLIED_VERSIONED_MIGRATION_NOT_RESOLVED -> "flyway.validation.missingMigration";
            case RESOLVED_REPEATABLE_MIGRATION_NOT_APPLIED,
                    RESOLVED_VERSIONED_MIGRATION_NOT_APPLIED -> "flyway.validation.notApplied";
            case FAILED_REPEATABLE_MIGRATION,
                    FAILED_VERSIONED_MIGRATION -> "flyway.validation.failedMigration";
            case SCHEMA_DOES_NOT_EXIST -> "flyway.validation.missingSchema";
            default -> "flyway.validation.error";
        };
    }

    private String errorMessage(ErrorDetails errorDetails) {
        return errorDetails == null ? null : errorDetails.errorMessage;
    }

    private boolean isTriggerError(String sqlState,
                                   String rawMessage,
                                   String functionName,
                                   Optional<DatabaseTriggerDefinition> triggerDefinition) {
        String normalized = rawMessage.toLowerCase(Locale.ROOT);
        return triggerDefinition.isPresent()
                || "P0001".equalsIgnoreCase(sqlState)
                || "45000".equalsIgnoreCase(sqlState)
                || functionName != null && normalized.contains("pl/pgsql function")
                || normalized.contains("raise exception")
                || normalized.contains(" at raise")
                || normalized.contains("before insert")
                || normalized.contains("before update")
                || normalized.contains("after insert")
                || normalized.contains("after update")
                || normalized.contains("trigger");
    }

    private boolean isBusinessRuleTrigger(String sqlState, String rawMessage) {
        String normalized = rawMessage.toLowerCase(Locale.ROOT);
        return "P0001".equalsIgnoreCase(sqlState)
                || "45000".equalsIgnoreCase(sqlState)
                || normalized.contains("raise exception")
                || normalized.contains(" at raise")
                || normalized.contains("violat");
    }

    private boolean isTriggerDefinitionError(String sqlState, String rawMessage) {
        String normalized = rawMessage.toLowerCase(Locale.ROOT);
        return sqlState.startsWith("42")
                || normalized.contains("column") && normalized.contains("does not exist")
                || normalized.contains("function") && normalized.contains("does not exist")
                || normalized.contains("record \"new\" has no field")
                || normalized.contains("sql statement") && normalized.contains("pl/pgsql function");
    }

    private boolean isConstraintViolation(String sqlState, String rawMessage) {
        String normalized = rawMessage.toLowerCase(Locale.ROOT);
        return sqlState.startsWith("23")
                || normalized.contains("constraint")
                || normalized.contains("duplicate key")
                || normalized.contains("foreign key")
                || normalized.contains("check constraint");
    }

    private boolean isMissingSchema(String sqlState, String rawMessage) {
        String normalized = rawMessage.toLowerCase(Locale.ROOT);
        return "3F000".equalsIgnoreCase(sqlState)
                || normalized.contains("schema") && normalized.contains("does not exist");
    }

    private boolean isConnectionError(String sqlState, String rawMessage) {
        String normalized = rawMessage.toLowerCase(Locale.ROOT);
        return sqlState.startsWith("08")
                || normalized.contains("connection refused")
                || normalized.contains("unable to obtain connection");
    }

    private String extractPrimaryDetail(String rawMessage) {
        if (rawMessage == null || rawMessage.isBlank()) {
            return null;
        }

        Matcher errorMatcher = ERROR_PATTERN.matcher(rawMessage);
        if (errorMatcher.find()) {
            return cleanValue(errorMatcher.group(1));
        }

        Matcher detailMatcher = DETAIL_PATTERN.matcher(rawMessage);
        if (detailMatcher.find()) {
            return cleanValue(detailMatcher.group(1));
        }

        return cleanValue(rawMessage);
    }

    private String extractHint(String rawMessage) {
        Matcher hintMatcher = HINT_PATTERN.matcher(defaultText(rawMessage, ""));
        return hintMatcher.find() ? cleanValue(hintMatcher.group(1)) : null;
    }

    private String extractFunctionName(String rawMessage) {
        Matcher matcher = FUNCTION_PATTERN.matcher(defaultText(rawMessage, ""));
        if (!matcher.find()) {
            return null;
        }

        String rawFunctionName = matcher.group(1).replace("\"", "").trim();
        int dotIndex = rawFunctionName.lastIndexOf('.');
        if (dotIndex >= 0 && dotIndex < rawFunctionName.length() - 1) {
            rawFunctionName = rawFunctionName.substring(dotIndex + 1);
        }
        return rawFunctionName.toLowerCase(Locale.ROOT);
    }

    private String extractConstraintName(String rawMessage) {
        Matcher matcher = CONSTRAINT_PATTERN.matcher(defaultText(rawMessage, ""));
        return matcher.find() ? matcher.group(1) : null;
    }

    private String extractSchemaName(String rawMessage) {
        Matcher matcher = SCHEMA_PATTERN.matcher(defaultText(rawMessage, ""));
        return matcher.find() ? matcher.group(1) : null;
    }

    private String cleanValue(String value) {
        return defaultText(value, "")
                .replaceAll("\\s+", " ")
                .replace(" Call getNextException to see other errors in the batch.", "")
                .trim();
    }

    private String defaultText(String value, String fallback) {
        if (value == null || value.isBlank()) {
            return fallback;
        }
        return value;
    }
}