package com.albelt.gestionstock.shared.enums;

import java.util.EnumSet;
import java.util.Set;

/**
 * Defines which permissions each role holds.
 * This is the source-of-truth; the role_permissions DB table mirrors it.
 */
public enum Permission {
    USER_VIEW,
    USER_CREATE,
    USER_UPDATE,
    USER_DELETE,
    ROLE_MANAGE;

    public static Set<Permission> forRole(UserRole role) {
        return switch (role) {
            case SUPER_ADMIN -> EnumSet.allOf(Permission.class);
            case ADMIN       -> EnumSet.of(USER_VIEW, USER_CREATE, USER_UPDATE, USER_DELETE);
            case OPERATOR    -> EnumSet.of(USER_VIEW);
            case READONLY    -> EnumSet.of(USER_VIEW);
        };
    }

    public static boolean hasPermission(UserRole role, Permission permission) {
        return forRole(role).contains(permission);
    }
}
