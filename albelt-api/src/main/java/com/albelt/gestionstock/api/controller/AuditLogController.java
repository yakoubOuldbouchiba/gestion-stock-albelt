package com.albelt.gestionstock.api.controller;

import com.albelt.gestionstock.api.response.ApiResponse;
import com.albelt.gestionstock.api.response.PagedResponse;
import com.albelt.gestionstock.domain.admin.dto.AuditLogDTO;
import com.albelt.gestionstock.domain.admin.service.AuditLogService;
import com.albelt.gestionstock.shared.enums.AuditAction;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * REST controller for audit log queries.
 * Restricted to ADMIN and SUPER_ADMIN.
 */
@RestController
@RequestMapping("/api/audit-logs")
@RequiredArgsConstructor
@Slf4j
@PreAuthorize("hasAnyRole('ADMIN','SUPER_ADMIN')")
public class AuditLogController {

    private final AuditLogService auditLogService;

    /**
     * Paginated, filterable audit log list.
     * GET /api/audit-logs
     *
     * @param actorId      filter by acting user UUID
     * @param action       filter by AuditAction enum value
     * @param targetEntity filter by entity class name (e.g. "User")
     * @param targetId     filter by entity ID string
     * @param dateFrom     ISO date (yyyy-MM-dd), inclusive
     * @param dateTo       ISO date (yyyy-MM-dd), inclusive
     */
    @GetMapping
    public ResponseEntity<ApiResponse<PagedResponse<AuditLogDTO>>> getAll(
            @RequestParam(defaultValue = "0")  int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false)    UUID        actorId,
            @RequestParam(required = false)    AuditAction action,
            @RequestParam(required = false)    String      targetEntity,
            @RequestParam(required = false)    String      targetId,
            @RequestParam(required = false)    String      dateFrom,
            @RequestParam(required = false)    String      dateTo) {

        log.debug("Fetching audit logs page={} size={}", page, size);

        LocalDateTime from = dateFrom != null ? LocalDate.parse(dateFrom).atStartOfDay()     : null;
        LocalDateTime to   = dateTo   != null ? LocalDate.parse(dateTo).atTime(23, 59, 59)   : null;

        var result = auditLogService.findFiltered(
                actorId, action, targetEntity, targetId, from, to, page, size);

        var paged = PagedResponse.<AuditLogDTO>builder()
                .items(result.getContent())
                .page(result.getNumber())
                .size(result.getSize())
                .totalElements(result.getTotalElements())
                .totalPages(result.getTotalPages())
                .build();

        return ResponseEntity.ok(ApiResponse.success(paged));
    }
}
