package com.albelt.gestionstock.domain.commandes.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.*;

import java.math.BigDecimal;
import java.util.UUID;

/**
 * CommandeItemRequest DTO - Input for order line items
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CommandeItemRequest {
    
    @NotBlank(message = "Material type is required")
    private String materialType;  // PU, PVC, CAOUTCHOUC
    
    @NotNull(message = "Number of plies is required")
    @Positive(message = "Number of plies must be positive")
    private Integer nbPlis;
    
    @NotNull(message = "Thickness is required")
    @Positive(message = "Thickness must be positive")
    private BigDecimal thicknessMm;
    
    @NotNull(message = "Length is required")
    @Positive(message = "Length must be positive")
    private BigDecimal longueurM;
    
    private BigDecimal longueurToleranceM;
    
    @NotNull(message = "Width is required")
    @Positive(message = "Width must be positive")
    private Integer largeurMm;
    
    @NotNull(message = "Quantity is required")
    @Positive(message = "Quantity must be positive")
    private Integer quantite;
    
    @NotNull(message = "Surface consumed is required")
    private BigDecimal surfaceConsommeeM2;
    
    @NotBlank(message = "Movement type is required")
    private String typeMouvement;  // ENCOURS, COUPE, SORTIE, RETOUR
    
    private String observations;

    private String reference;

    private UUID colorId;
    
    @NotNull(message = "Line number is required")
    @Positive(message = "Line number must be positive")
    private Integer lineNumber;
}
