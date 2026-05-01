package com.albelt.gestionstock.domain.commandes.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

/**
 * CommandeResponse DTO - Output for order data
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CommandeResponse {

    private UUID id;

    private String numeroCommande;

    private UUID clientId;

    private String clientName;

    private UUID altierId;

    private String altierLibelle;

    private String status;

    private String description;

    private String notes;

    private UUID createdBy;

    private String createdByName;

    private UUID updatedBy;

    private String updatedByName;

    private List<CommandeItemResponse> items;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;
}
