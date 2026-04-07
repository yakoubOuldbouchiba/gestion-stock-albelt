package com.albelt.gestionstock.domain.returns.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.*;

import java.math.BigDecimal;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ReturnBonItemRequest {

    @NotNull(message = "Commande item is required")
    private UUID commandeItemId;

    @NotNull(message = "Production item is required")
    private UUID productionItemId;

    @NotNull(message = "Quantity is required")
    @Positive(message = "Quantity must be positive")
    private Integer quantity;

    @NotNull(message = "Return type is required")
    private String returnType; // MATIERE, MESURE

    private String measureAction; // AJUST, DECHET

    private Integer adjustedWidthMm;

    private BigDecimal adjustedLengthM;
}
