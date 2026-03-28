package com.albelt.gestionstock.shared.enums;

/**
 * Material types used in ALBEL stock management system
 */
public enum MaterialType {
    PU("Polyurea", "#D4A574"),           // Warm tan/brown
    PVC("Polyvinyl Chloride", "#4A90E2"), // Blue
    CAOUTCHOUC("Natural Rubber", "#2C3E50"); // Dark charcoal

    private final String displayName;
    private final String color;

    MaterialType(String displayName, String color) {
        this.displayName = displayName;
        this.color = color;
    }

    public String getDisplayName() {
        return displayName;
    }

    public String getColor() {
        return color;
    }
}
