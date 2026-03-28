package com.albelt.gestionstock.domain.altier.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * DTO for Altier - minimal representation
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AltierDTO {
    private UUID id;
    private String libelle;
    private String adresse;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
