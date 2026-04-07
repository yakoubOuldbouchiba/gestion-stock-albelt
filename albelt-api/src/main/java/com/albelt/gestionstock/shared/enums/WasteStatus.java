package com.albelt.gestionstock.shared.enums;

/**
 * Waste piece status tracking for reuse management
 */
public enum WasteStatus {
    AVAILABLE("Ready for cutting operations"),
    OPENED("Partially cut, still available"),
    EXHAUSTED("Fully consumed, cannot be reused"),
    ARCHIVED("Archived for records");

    private final String description;

    WasteStatus(String description) {
        this.description = description;
    }

    public String getDescription() {
        return description;
    }
}
