package com.albelt.gestionstock.shared.enums;

/**
 * User roles and access levels
 */
public enum UserRole {
    ADMIN("Full system access and configuration"),
    OPERATOR("Cutting operations and inventory management"),
    READONLY("Report viewing only, no modifications");

    private final String description;

    UserRole(String description) {
        this.description = description;
    }

    public String getDescription() {
        return description;
    }
}
