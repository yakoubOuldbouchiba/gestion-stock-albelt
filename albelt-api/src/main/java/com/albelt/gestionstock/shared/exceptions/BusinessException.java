package com.albelt.gestionstock.shared.exceptions;

/**
 * Exception thrown for business logic violations
 */
public class BusinessException extends RuntimeException {
    public BusinessException(String message) {
        super(message);
    }

    public BusinessException(String message, Throwable cause) {
        super(message, cause);
    }

    public static BusinessException supplierHasActiveRolls(String supplierName) {
        return new BusinessException("Cannot delete supplier '" + supplierName + "' with active rolls");
    }

    public static BusinessException insufficientRollSize(String material, double requiredArea) {
        return new BusinessException("No available roll with sufficient size for material: " + material);
    }
}
