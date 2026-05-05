package com.albelt.gestionstock.shared.database;

import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.Map;

public record DatabaseError(String code, String messageKey, Map<String, Object> params) {

    public DatabaseError {
        params = params == null
                ? Collections.emptyMap()
                : Collections.unmodifiableMap(new LinkedHashMap<>(params));
    }
}