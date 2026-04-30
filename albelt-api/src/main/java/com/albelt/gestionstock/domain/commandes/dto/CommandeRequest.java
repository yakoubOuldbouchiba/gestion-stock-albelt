package com.albelt.gestionstock.domain.commandes.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.UUID;

/**
 * CommandeRequest DTO - Input for creating or updating an order
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CommandeRequest {
    
    @NotBlank(message = "Order number is required")
    private String numeroCommande;
    
    @NotNull(message = "Client ID is required")
    private UUID clientId;

    private UUID altierId;
    
    private String status = "PENDING";
    
    private String description;
    
    private String notes;
    
    @Valid
    private List<CommandeItemRequest> items;
}
