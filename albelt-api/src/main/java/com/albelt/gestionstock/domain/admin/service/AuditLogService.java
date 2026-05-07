package com.albelt.gestionstock.domain.admin.service;

import com.albelt.gestionstock.domain.admin.dto.AuditLogDTO;
import com.albelt.gestionstock.domain.admin.entity.AuditLog;
import com.albelt.gestionstock.domain.admin.repository.AuditLogRepository;
import com.albelt.gestionstock.shared.enums.AuditAction;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Service for writing and querying audit logs.
 * Writes are asynchronous so they never block the main request thread.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class AuditLogService {

    private final AuditLogRepository auditLogRepository;

    // ------------------------------------------------------------------ writes

    /**
     * Persist an audit event asynchronously.
     * Runs in a separate transaction so a main-tx rollback doesn't swallow the log.
     */
    @Async
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void log(UUID actorId, String actorUsername, AuditAction action,
                    String targetEntity, String targetId,
                    String metadata, String ipAddress, String userAgent) {
        try {
            AuditLog entry = AuditLog.builder()
                    .actorId(actorId)
                    .actorUsername(actorUsername != null ? actorUsername : "system")
                    .action(action)
                    .targetEntity(targetEntity)
                    .targetId(targetId)
                    .metadata(metadata)
                    .ipAddress(ipAddress)
                    .userAgent(userAgent)
                    .build();
            auditLogRepository.save(entry);
        } catch (Exception e) {
            log.error("Failed to write audit log for action={} actor={}: {}", action, actorUsername, e.getMessage());
        }
    }

    /** Shorthand without HTTP context. */
    public void log(UUID actorId, String actorUsername, AuditAction action,
                    String targetEntity, String targetId, String metadata) {
        log(actorId, actorUsername, action, targetEntity, targetId, metadata, null, null);
    }

    // ------------------------------------------------------------------ reads

    @Transactional(readOnly = true)
    public Page<AuditLogDTO> findFiltered(UUID actorId, AuditAction action,
                                          String targetEntity, String targetId,
                                          LocalDateTime fromDate, LocalDateTime toDate,
                                          int page, int size) {

        LocalDateTime from = fromDate != null ? fromDate : LocalDateTime.of(1970, 1, 1, 0, 0);
        LocalDateTime to   = toDate   != null ? toDate   : LocalDateTime.of(2100, 1, 1, 0, 0);

        var pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "timestamp"));
        return auditLogRepository
                .findFiltered(actorId, action, targetEntity, targetId, from, to, pageable)
                .map(this::toDTO);
    }

    // ------------------------------------------------------------------ mapper

    private AuditLogDTO toDTO(AuditLog entity) {
        return AuditLogDTO.builder()
                .id(entity.getId())
                .actorId(entity.getActorId())
                .actorUsername(entity.getActorUsername())
                .action(entity.getAction())
                .targetEntity(entity.getTargetEntity())
                .targetId(entity.getTargetId())
                .timestamp(entity.getTimestamp())
                .metadata(entity.getMetadata())
                .ipAddress(entity.getIpAddress())
                .userAgent(entity.getUserAgent())
                .build();
    }
}
