package com.albelt.gestionstock.shared.database;

public record DatabaseTriggerDefinition(
        String triggerName,
        String functionName,
        String tableName,
        String timing,
        String events,
        String sourceFile
) {
}