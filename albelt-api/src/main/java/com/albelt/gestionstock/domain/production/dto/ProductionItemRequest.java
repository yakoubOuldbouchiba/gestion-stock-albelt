package com.albelt.gestionstock.domain.production.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.UUID;

/**
 * ProductionItemRequest DTO - Input for production items
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProductionItemRequest {

    @NotNull(message = "Placed rectangle ID is required")
    private UUID placedRectangleId;

    @NotNull(message = "Piece length is required")
    @DecimalMin(value = "0.0", inclusive = false, message = "Piece length must be greater than 0")
    private BigDecimal pieceLengthM;

    @NotNull(message = "Piece width is required")
    @Positive(message = "Piece width must be greater than 0")
    private Integer pieceWidthMm;

    @NotNull(message = "Quantity is required")
    @Positive(message = "Quantity must be greater than 0")
    private Integer quantity;

    private String notes;
}
