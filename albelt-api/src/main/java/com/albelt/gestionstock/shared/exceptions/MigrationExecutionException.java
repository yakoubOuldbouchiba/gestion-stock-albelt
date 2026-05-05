package com.albelt.gestionstock.shared.exceptions;

import com.albelt.gestionstock.shared.database.DatabaseError;
import lombok.Getter;

import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Getter
public class MigrationExecutionException extends RuntimeException {

    private final String code;
    private final String messageKey;
    private final Map<String, Object> params;
    private final List<DatabaseError> errors;

    public MigrationExecutionException(String code,
                                       String messageKey,
                                       Map<String, Object> params,
                                       List<DatabaseError> errors,
                                       String localizedMessage,
                                       Throwable cause) {
        super(localizedMessage, cause);
        this.code = code;
        this.messageKey = messageKey;
        this.params = params == null
                ? Collections.emptyMap()
                : Collections.unmodifiableMap(new LinkedHashMap<>(params));
        this.errors = errors == null ? List.of() : List.copyOf(errors);
    }
}