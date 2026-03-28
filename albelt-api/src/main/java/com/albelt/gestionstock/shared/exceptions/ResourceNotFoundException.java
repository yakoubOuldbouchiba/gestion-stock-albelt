package com.albelt.gestionstock.shared.exceptions;

/**
 * Exception thrown when a requested resource is not found
 */
public class ResourceNotFoundException extends RuntimeException {
    public ResourceNotFoundException(String message) {
        super(message);
    }

    public ResourceNotFoundException(String message, Throwable cause) {
        super(message, cause);
    }

    public static ResourceNotFoundException supplier(String identifier) {
        return new ResourceNotFoundException("Supplier not found: " + identifier);
    }

    public static ResourceNotFoundException roll(String identifier) {
        return new ResourceNotFoundException("Roll not found: " + identifier);
    }

    public static ResourceNotFoundException user(String identifier) {
        return new ResourceNotFoundException("User not found: " + identifier);
    }
}
