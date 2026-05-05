package com.albelt.gestionstock.shared.migration;

import com.albelt.gestionstock.shared.database.DatabaseError;
import com.albelt.gestionstock.shared.database.DatabaseErrorMapper;
import com.albelt.gestionstock.shared.exceptions.MigrationExecutionException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.flywaydb.core.Flyway;
import org.flywaydb.core.api.FlywayException;
import org.flywaydb.core.api.output.ValidateResult;
import org.springframework.context.MessageSource;
import org.springframework.context.i18n.LocaleContextHolder;
import org.springframework.dao.DataAccessException;
import org.springframework.stereotype.Service;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class MigrationService {

    private static final String VALIDATION_FAILURE_CODE = "MIGRATION_VALIDATION_ERROR";
    private static final String EXECUTION_FAILURE_CODE = "MIGRATION_EXECUTION_ERROR";
    private static final String VALIDATION_FAILURE_MESSAGE_KEY = "migration.validation.failed";
    private static final String EXECUTION_FAILURE_MESSAGE_KEY = "migration.execution.failed";

    private final DatabaseErrorMapper databaseErrorMapper;
    private final MessageSource messageSource;

    public void executeMigrations(Flyway flyway) {
        ValidateResult validateResult = validate(flyway);
        if (!validateResult.validationSuccessful) {
            throw buildException(
                    VALIDATION_FAILURE_CODE,
                    VALIDATION_FAILURE_MESSAGE_KEY,
                    databaseErrorMapper.mapValidationErrors(validateResult),
                    null
            );
        }

        try {
            flyway.migrate();
        } catch (DataAccessException ex) {
            throw buildException(EXECUTION_FAILURE_CODE, EXECUTION_FAILURE_MESSAGE_KEY, databaseErrorMapper.mapExecutionErrors(ex), ex);
        } catch (FlywayException ex) {
            throw buildException(EXECUTION_FAILURE_CODE, EXECUTION_FAILURE_MESSAGE_KEY, databaseErrorMapper.mapExecutionErrors(ex), ex);
        } catch (RuntimeException ex) {
            throw buildException(EXECUTION_FAILURE_CODE, EXECUTION_FAILURE_MESSAGE_KEY, databaseErrorMapper.mapExecutionErrors(ex), ex);
        }
    }

    private ValidateResult validate(Flyway flyway) {
        try {
            return flyway.validateWithResult();
        } catch (DataAccessException ex) {
            throw buildException(VALIDATION_FAILURE_CODE, VALIDATION_FAILURE_MESSAGE_KEY, databaseErrorMapper.mapExecutionErrors(ex), ex);
        } catch (FlywayException ex) {
            throw buildException(VALIDATION_FAILURE_CODE, VALIDATION_FAILURE_MESSAGE_KEY, databaseErrorMapper.mapExecutionErrors(ex), ex);
        } catch (RuntimeException ex) {
            throw buildException(VALIDATION_FAILURE_CODE, VALIDATION_FAILURE_MESSAGE_KEY, databaseErrorMapper.mapExecutionErrors(ex), ex);
        }
    }

    private MigrationExecutionException buildException(String code,
                                                       String messageKey,
                                                       List<DatabaseError> errors,
                                                       Throwable cause) {
        Map<String, Object> params = new LinkedHashMap<>();
        params.put("issueCount", errors.size());

        Locale locale = LocaleContextHolder.getLocale();
        String summary = resolveMessage(messageKey, params, locale);
        List<String> localizedErrors = errors.stream()
            .map(error -> resolveMessage(error.messageKey(), error.params(), locale))
            .toList();
        String localizedMessage = localizedErrors.isEmpty()
            ? summary
            : summary + System.lineSeparator() + localizedErrors.stream().collect(Collectors.joining(System.lineSeparator()));

        log.error("Migration failure detected. code={}, issues={}", code, errors.size(), cause);
        for (int index = 0; index < localizedErrors.size(); index++) {
            log.error("Migration issue [{}]: {}", index + 1, localizedErrors.get(index));
        }

        return new MigrationExecutionException(code, messageKey, params, errors, localizedMessage, cause);
    }

    private String resolveMessage(String messageKey, Map<String, Object> params, Locale locale) {
        Object[] args = params == null || params.isEmpty() ? new Object[0] : params.values().toArray();
        return messageSource.getMessage(messageKey, args, messageKey, locale);
    }
}