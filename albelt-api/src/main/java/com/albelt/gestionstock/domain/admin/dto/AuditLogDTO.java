package com.albelt.gestionstock.domain.admin.dto;

import com.albelt.gestionstock.shared.enums.AuditAction;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AuditLogDTO {
    private UUID         id;
    private UUID         actorId;
    private String       actorUsername;
    private AuditAction  action;
    private String       targetEntity;
    private String       targetId;
    private LocalDateTime timestamp;
    private String       metadata;
    private String       ipAddress;
    private String       userAgent;
}
