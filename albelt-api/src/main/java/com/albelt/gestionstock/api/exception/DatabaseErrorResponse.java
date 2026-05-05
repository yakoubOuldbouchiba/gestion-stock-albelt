package com.albelt.gestionstock.api.exception;

import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.Map;

public record DatabaseErrorResponse(
        String code,
        String messageKey,
        Map<String, Object> params,
        String message
) {

    public DatabaseErrorResponse {
        params = params == null
                ? Collections.emptyMap()
                : Collections.unmodifiableMap(new LinkedHashMap<>(params));
    }
}