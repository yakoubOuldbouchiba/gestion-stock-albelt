package com.albelt.gestionstock.domain.commandes.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

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

    @NotNull(message = "Article is required")
    private UUID articleId;

    private String materialType;

    private Integer nbPlis;

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

    @jakarta.validation.constraints.NotBlank(message = "Movement type is required")
    private String typeMouvement;  // ENCOURS, COUPE, SORTIE, RETOUR

    private String observations;

    private String reference;

    private UUID colorId;

    @NotNull(message = "Line number is required")
    @Positive(message = "Line number must be positive")
    private Integer lineNumber;
}
