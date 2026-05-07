package com.albelt.gestionstock.shared.security;

/**
 * Centralized role and SpEL expression constants for @PreAuthorize.
 * <p>
 * Use these compile-time constants in every @PreAuthorize annotation so that
 * role names are never duplicated as magic strings across the codebase.
 * <p>
 * Example:
 * <pre>
 *   @PreAuthorize(Roles.ADMIN_OR_ABOVE)
 *   public void deleteUser(...) { ... }
 * </pre>
 */
public final class Roles {

    private Roles() {}

    // ----------------------------------------------------------------
    // Raw role names (without ROLE_ prefix)
    // ----------------------------------------------------------------

    public static final String SUPER_ADMIN = "SUPER_ADMIN";
    public static final String ADMIN       = "ADMIN";
    public static final String OPERATOR    = "OPERATOR";
    public static final String READONLY    = "READONLY";

    // ----------------------------------------------------------------
    // Pre-built SpEL expressions for @PreAuthorize
    // ----------------------------------------------------------------

    /** Only SUPER_ADMIN may proceed. */
    public static final String SUPER_ADMIN_ONLY = "hasRole('SUPER_ADMIN')";

    /** Requires ADMIN or SUPER_ADMIN (management operations). */
    public static final String ADMIN_OR_ABOVE = "hasAnyRole('ADMIN','SUPER_ADMIN')";

    /**
     * Requires OPERATOR, ADMIN, or SUPER_ADMIN.
     * READONLY users are excluded — they may only read data.
     */
    public static final String OPERATOR_OR_ABOVE = "hasAnyRole('OPERATOR','ADMIN','SUPER_ADMIN')";

    /** Any authenticated user (used to explicitly permit self-service actions). */
    public static final String AUTHENTICATED = "isAuthenticated()";
}
