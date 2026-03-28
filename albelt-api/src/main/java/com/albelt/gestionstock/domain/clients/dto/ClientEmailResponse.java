package com.albelt.gestionstock.domain.clients.dto;

import lombok.*;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * ClientEmailResponse DTO
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ClientEmailResponse {
    
    private UUID id;
    
    private String emailAddress;
    
    private Boolean isMain;
    
    private String emailType;
    
    private String notes;
    
    private LocalDateTime createdAt;
    
    private LocalDateTime updatedAt;
}
