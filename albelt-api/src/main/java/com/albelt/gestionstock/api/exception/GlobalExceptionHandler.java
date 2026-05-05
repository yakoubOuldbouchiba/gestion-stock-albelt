package com.albelt.gestionstock.api.exception;

import com.albelt.gestionstock.api.response.ApiResponse;
import com.albelt.gestionstock.shared.database.DatabaseError;
import com.albelt.gestionstock.shared.database.DatabaseErrorMapper;
import com.albelt.gestionstock.shared.exceptions.BusinessException;
import com.albelt.gestionstock.shared.exceptions.MigrationExecutionException;
import com.albelt.gestionstock.shared.exceptions.ResourceNotFoundException;
import jakarta.persistence.PersistenceException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.MessageSource;
import org.springframework.context.i18n.LocaleContextHolder;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.AuthenticationCredentialsNotFoundException;
import org.springframework.dao.DataAccessException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.context.request.WebRequest;

import java.sql.SQLException;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

/**
 * Global exception handler for REST controllers
 * Provides consistent error response format across all endpoints
 */
@RestControllerAdvice
@Slf4j
@RequiredArgsConstructor
public class GlobalExceptionHandler {

        private final MessageSource messageSource;
        private final DatabaseErrorMapper databaseErrorMapper;

    /**
     * Handle ResourceNotFoundException
     * Used when entity is not found by ID
     */
    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<ApiResponse<Void>> handleResourceNotFound(
            ResourceNotFoundException ex,
            WebRequest request) {
        log.warn("Resource not found: {}", ex.getMessage());
        return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(ApiResponse.error(ex.getMessage()));
    }

    @ExceptionHandler(AuthenticationCredentialsNotFoundException.class)
    public ResponseEntity<ApiResponse<Void>> handleAuthenticationException(
            AuthenticationCredentialsNotFoundException ex,
            WebRequest request) {
        log.warn("Authentication required: {}", ex.getMessage());
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(ApiResponse.error("Authentication is required to access this resource"));
    }

    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<ApiResponse<Void>> handleAccessDeniedException(
            AccessDeniedException ex,
            WebRequest request) {
        log.warn("Access denied: {}", ex.getMessage());
        return ResponseEntity.status(HttpStatus.FORBIDDEN)
                .body(ApiResponse.error("You do not have permission to access this resource"));
    }

    /**
     * Handle BusinessException
     * Used for business logic violations
     */
    @ExceptionHandler(BusinessException.class)
    public ResponseEntity<ApiResponse<Void>> handleBusinessException(
            BusinessException ex,
            WebRequest request) {
        log.warn("Business rule violation: {}", ex.getMessage());
        return ResponseEntity.status(HttpStatus.CONFLICT)
                .body(ApiResponse.error(ex.getMessage()));
    }

        @ExceptionHandler(MigrationExecutionException.class)
        public ResponseEntity<ApiResponse<List<DatabaseErrorResponse>>> handleMigrationExecutionException(
                        MigrationExecutionException ex,
                        WebRequest request) {
                log.error("Migration execution failure: code={}, issues={}", ex.getCode(), ex.getErrors().size(), ex);
                return buildDatabaseResponse(ex.getErrors(), ex.getMessageKey(), ex.getParams(), HttpStatus.INTERNAL_SERVER_ERROR);
        }

        @ExceptionHandler({DataAccessException.class, PersistenceException.class, SQLException.class})
        public ResponseEntity<ApiResponse<List<DatabaseErrorResponse>>> handleDatabaseException(
                        Exception ex,
                        WebRequest request) {
                List<DatabaseError> errors = databaseErrorMapper.mapExecutionErrors(ex);
                HttpStatus status = resolveDatabaseStatus(errors);
                log.error("Database operation failed with {} mapped issue(s)", errors.size(), ex);
                return buildDatabaseResponse(errors, "db.operation.failed", Map.of("issueCount", errors.size()), status);
        }

    /**
     * Handle MethodArgumentNotValidException
     * Used for @Valid validation failures on request DTOs
     */
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiResponse<Map<String, String>>> handleValidationException(
            MethodArgumentNotValidException ex,
            WebRequest request) {
        log.warn("Validation error: {}", ex.getMessage());

        Map<String, String> errors = new HashMap<>();
        ex.getBindingResult().getAllErrors().forEach((error) -> {
            String fieldName = ((FieldError) error).getField();
            String errorMessage = error.getDefaultMessage();
            errors.put(fieldName, errorMessage);
        });

        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(ApiResponse.<Map<String, String>>builder()
                        .success(false)
                        .message("Validation failed")
                        .data(errors)
                        .timestamp(java.time.LocalDateTime.now().toString())
                        .build());
    }

    /**
     * Handle IllegalArgumentException
     * Used for invalid arguments passed to services
     */
    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<ApiResponse<Void>> handleIllegalArgument(
            IllegalArgumentException ex,
            WebRequest request) {
        log.warn("Illegal argument: {}", ex.getMessage());
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(ApiResponse.error(ex.getMessage()));
    }

    /**
     * Handle generic Exception
     * Catch-all for unexpected errors
     */
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiResponse<Void>> handleGlobalException(
            Exception ex,
            WebRequest request) {
        log.error("Unexpected error: {}", ex.getMessage(), ex);
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ApiResponse.error("An unexpected error occurred"));
    }

    private ResponseEntity<ApiResponse<List<DatabaseErrorResponse>>> buildDatabaseResponse(List<DatabaseError> errors,
                                                                                           String messageKey,
                                                                                           Map<String, Object> params,
                                                                                           HttpStatus status) {
        Locale locale = LocaleContextHolder.getLocale();
        String message = resolveMessage(messageKey, params, locale);

        List<DatabaseErrorResponse> errorResponses = errors.stream()
                .map(error -> new DatabaseErrorResponse(
                        error.code(),
                        error.messageKey(),
                        error.params(),
                        resolveMessage(error.messageKey(), error.params(), locale)
                ))
                .toList();

        return ResponseEntity.status(status)
                .body(ApiResponse.<List<DatabaseErrorResponse>>builder()
                        .success(false)
                        .message(message)
                        .data(errorResponses)
                        .timestamp(java.time.LocalDateTime.now().toString())
                        .build());
    }

    private HttpStatus resolveDatabaseStatus(List<DatabaseError> errors) {
        boolean conflict = errors.stream().allMatch(error -> "TRIGGER_ERROR".equals(error.code()) || "CONSTRAINT_ERROR".equals(error.code()));
        return conflict ? HttpStatus.CONFLICT : HttpStatus.INTERNAL_SERVER_ERROR;
    }

    private String resolveMessage(String messageKey, Map<String, Object> params, Locale locale) {
        Object[] args = params == null || params.isEmpty() ? new Object[0] : params.values().toArray();
        return messageSource.getMessage(messageKey, args, messageKey, locale);
    }
}
