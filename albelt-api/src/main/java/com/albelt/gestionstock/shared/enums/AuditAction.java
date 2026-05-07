package com.albelt.gestionstock.shared.enums;

/**
 * Enumeration of all auditable actions tracked in audit_logs.
 */
public enum AuditAction {

    // Authentication
    LOGIN_SUCCESS,
    LOGIN_FAILURE,
    LOGOUT,

    // User management
    USER_CREATED,
    USER_UPDATED,
    USER_DEACTIVATED,
    USER_ACTIVATED,
    USER_DELETED,
    USER_PASSWORD_CHANGED,
    USER_PASSWORD_RESET,
    USER_ROLE_CHANGED,

    // Role management
    ROLE_PERMISSION_UPDATED,

    // Generic
    ACCESS_DENIED,
    DATA_VIEWED,
    DATA_EXPORTED
}
