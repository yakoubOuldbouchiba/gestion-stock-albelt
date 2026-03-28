package com.albelt.gestionstock.shared.enums;

/**
 * Material types used in ALBEL stock management system
 */
public enum MaterialType {
    PU("Polyurea"),
    PVC("Polyvinyl Chloride"),
    CAOUTCHOUC("Natural Rubber");

    private final String displayName;

    MaterialType(String displayName) {
        this.displayName = displayName;
    }

    public String getDisplayName() {
        return displayName;
    }
}
