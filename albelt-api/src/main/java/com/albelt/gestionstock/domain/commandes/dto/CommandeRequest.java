package com.albelt.gestionstock.domain.commandes.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.math.BigDecimal;
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
    
    private String status = "PENDING";
    
    private String description;
    
    private String notes;
    
    @Valid
    private List<CommandeItemRequest> items;
}
