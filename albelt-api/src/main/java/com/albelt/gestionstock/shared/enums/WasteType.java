package com.albelt.gestionstock.shared.enums;

/**
 * Waste Type classification for rolls and scrap
 * Distinguishes between usable scrap and waste material
 */
public enum WasteType {
    CHUTE_EXPLOITABLE("Usable scrap - can be reused in cutting operations"),
    DECHET("Waste - too small or unusable for cutting"),
    NORMAL("Standard material - regular inventory");

    private final String description;

    WasteType(String description) {
        this.description = description;
    }

    public String getDescription() {
        return description;
    }
}
