package com.albelt.gestionstock.shared.enums;

/**
 * Waste piece status tracking for reuse management
 */
public enum WasteStatus {
    AVAILABLE("Can be reused in future cuts"),
    USED_IN_ORDER("Already consumed in a cutting operation"),
    RESERVED("Allocated for future use"),
    SCRAP("Too small to reuse, ready for disposal"),
    EXHAUSTED("Fully consumed, cannot be reused");

    private final String description;

    WasteStatus(String description) {
        this.description = description;
    }

    public String getDescription() {
        return description;
    }
}
