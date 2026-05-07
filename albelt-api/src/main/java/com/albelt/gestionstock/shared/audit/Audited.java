package com.albelt.gestionstock.shared.audit;

import com.albelt.gestionstock.shared.enums.AuditAction;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

/**
 * Marks a service or controller method for audit logging.
 *
 * <p>Example:
 * <pre>
 *   &#64;Audited(action = AuditAction.USER_CREATED, entity = "User")
 *   public User createUser(CreateUserRequest req) { ... }
 * </pre>
 */
@Target(ElementType.METHOD)
@Retention(RetentionPolicy.RUNTIME)
public @interface Audited {
    AuditAction action();
    String entity() default "";
    /** SpEL expression evaluated against the first method argument to extract the target ID. */
    String idExpression() default "";
}
