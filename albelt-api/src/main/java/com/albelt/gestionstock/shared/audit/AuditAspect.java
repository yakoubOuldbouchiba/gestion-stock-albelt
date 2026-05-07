package com.albelt.gestionstock.shared.audit;

import com.albelt.gestionstock.domain.admin.service.AuditLogService;
import com.albelt.gestionstock.shared.enums.AuditAction;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.aspectj.lang.JoinPoint;
import org.aspectj.lang.annotation.AfterReturning;
import org.aspectj.lang.annotation.Aspect;
import org.aspectj.lang.annotation.AfterThrowing;
import org.aspectj.lang.reflect.MethodSignature;
import org.springframework.expression.ExpressionParser;
import org.springframework.expression.spel.standard.SpelExpressionParser;
import org.springframework.expression.spel.support.StandardEvaluationContext;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import java.lang.reflect.Method;
import java.lang.reflect.Parameter;
import java.util.UUID;

/**
 * AOP aspect that intercepts methods annotated with {@link Audited} and
 * asynchronously persists an audit entry via {@link AuditLogService}.
 */
@Aspect
@Component
@RequiredArgsConstructor
@Slf4j
public class AuditAspect {

    private final AuditLogService auditLogService;
    private final ExpressionParser spel = new SpelExpressionParser();

    // ---------------------------------------------------------------- success

    @AfterReturning(pointcut = "@annotation(audited)", returning = "returnValue")
    public void afterSuccess(JoinPoint jp, Audited audited, Object returnValue) {
        try {
            AuditContext ctx = buildContext(jp, audited);
            auditLogService.log(
                    ctx.actorId(), ctx.actorUsername(), audited.action(),
                    audited.entity().isEmpty() ? null : audited.entity(),
                    ctx.targetId(),
                    buildMetadata(returnValue),
                    ctx.ipAddress(), ctx.userAgent());
        } catch (Exception e) {
            log.warn("AuditAspect afterSuccess error: {}", e.getMessage());
        }
    }

    // ---------------------------------------------------------------- failure

    @AfterThrowing(pointcut = "@annotation(audited)", throwing = "ex")
    public void afterFailure(JoinPoint jp, Audited audited, Throwable ex) {
        try {
            AuditContext ctx = buildContext(jp, audited);
            auditLogService.log(
                    ctx.actorId(), ctx.actorUsername(), AuditAction.ACCESS_DENIED,
                    audited.entity().isEmpty() ? null : audited.entity(),
                    ctx.targetId(),
                    "{\"error\":\"" + escapeJson(ex.getMessage()) + "\"}",
                    ctx.ipAddress(), ctx.userAgent());
        } catch (Exception e) {
            log.warn("AuditAspect afterFailure error: {}", e.getMessage());
        }
    }

    // ---------------------------------------------------------------- helpers

    private AuditContext buildContext(JoinPoint jp, Audited audited) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        UUID actorId = null;
        String actorUsername = "anonymous";

        if (auth != null && auth.isAuthenticated() && auth.getPrincipal() instanceof UUID uid) {
            actorId = uid;
        }
        if (auth != null && auth.getName() != null) {
            actorUsername = auth.getName();
        }

        String targetId = resolveTargetId(jp, audited.idExpression());
        String ipAddress = null;
        String userAgent = null;

        try {
            ServletRequestAttributes attrs =
                    (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
            if (attrs != null) {
                HttpServletRequest req = attrs.getRequest();
                ipAddress = getClientIp(req);
                userAgent = truncate(req.getHeader("User-Agent"), 500);
            }
        } catch (Exception ignored) { /* non-web contexts */ }

        return new AuditContext(actorId, actorUsername, targetId, ipAddress, userAgent);
    }

    private String resolveTargetId(JoinPoint jp, String idExpression) {
        if (idExpression == null || idExpression.isEmpty()) {
            // Fall back: first UUID-typed argument
            Object[] args = jp.getArgs();
            if (args != null) {
                for (Object arg : args) {
                    if (arg instanceof UUID) return arg.toString();
                }
            }
            return null;
        }

        try {
            MethodSignature sig = (MethodSignature) jp.getSignature();
            Method method = sig.getMethod();
            Parameter[] params = method.getParameters();
            Object[] args = jp.getArgs();

            StandardEvaluationContext ctx = new StandardEvaluationContext();
            for (int i = 0; i < params.length; i++) {
                ctx.setVariable(params[i].getName(), args[i]);
            }
            Object val = spel.parseExpression(idExpression).getValue(ctx);
            return val != null ? val.toString() : null;
        } catch (Exception e) {
            log.debug("SpEL evaluation for idExpression '{}' failed: {}", idExpression, e.getMessage());
            return null;
        }
    }

    private String buildMetadata(Object returnValue) {
        if (returnValue == null) return null;
        // Capture just the class and toString truncated
        String str = returnValue.toString();
        return "{\"result\":\"" + escapeJson(truncate(str, 300)) + "\"}";
    }

    private String getClientIp(HttpServletRequest request) {
        String forwarded = request.getHeader("X-Forwarded-For");
        if (forwarded != null && !forwarded.isEmpty()) {
            return forwarded.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }

    private String truncate(String value, int max) {
        if (value == null) return null;
        return value.length() <= max ? value : value.substring(0, max) + "…";
    }

    private String escapeJson(String value) {
        if (value == null) return "";
        return value.replace("\\", "\\\\").replace("\"", "\\\"");
    }

    private record AuditContext(UUID actorId, String actorUsername,
                                String targetId, String ipAddress, String userAgent) {}
}
