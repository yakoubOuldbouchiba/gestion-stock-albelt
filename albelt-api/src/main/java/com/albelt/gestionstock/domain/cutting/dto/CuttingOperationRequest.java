package com.albelt.gestionstock.domain.cutting.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

/**
 * DTO for requesting a cutting operation
 * Supports both:
 * 1. Nesting algorithm workflow (piecesRequested)
 * 2. UI simple recording workflow (quantity, utilization, wasteArea)
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CuttingOperationRequest {

    @NotNull(message = "Roll ID is required")
    private UUID rollId;

    @NotNull(message = "Operator ID is required")
    private UUID operatorId;

    // Link to order item (NEW - for workflow integration)
    private UUID commandeItemId;

    // Status for workflow tracking (NEW)
    @Builder.Default
    private String status = "COMPLETED"; // PREPARED, IN_PROGRESS, COMPLETED, ON_HOLD, CANCELLED

    // For nesting algorithm workflow
    @Valid
    private List<PieceRequirement> piecesRequested;

    // For simple UI recording workflow
    @Min(value = 0, message = "Quantity must be non-negative")
    private Integer quantity;

    @DecimalMin(value = "0.0", message = "Utilization must be non-negative")
    @DecimalMax(value = "100.0", message = "Utilization must not exceed 100")
    private BigDecimal utilization;

    @DecimalMin(value = "0.0", message = "Waste area must be non-negative")
    private BigDecimal wasteArea;

    private String visualizationSvg; // SVG rendering of cut pattern

    private String notes;

    /**
     * Inner class for piece requirements
     */
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class PieceRequirement {
        @NotNull(message = "Piece width is required")
        @Positive(message = "Width must be positive")
        private Integer widthMm;

        @NotNull(message = "Piece length is required")
        @DecimalMin(value = "0.0", inclusive = false, message = "Length must be positive")
        private BigDecimal lengthM;

        @NotNull(message = "Quantity is required")
        @Positive(message = "Quantity must be positive")
        private Integer quantity;
    }
}
