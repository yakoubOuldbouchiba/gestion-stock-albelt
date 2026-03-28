package com.albelt.gestionstock.shared.enums;

/**
 * Roll inventory status tracking
 */
public enum RollStatus {
    AVAILABLE("Ready for cutting operations"),
    OPENED("Partially cut, still available"),
    EXHAUSTED("Fully consumed, cannot be used"),
    ARCHIVED("Archived for records");

    private final String description;

    RollStatus(String description) {
        this.description = description;
    }

    public String getDescription() {
        return description;
    }
}
