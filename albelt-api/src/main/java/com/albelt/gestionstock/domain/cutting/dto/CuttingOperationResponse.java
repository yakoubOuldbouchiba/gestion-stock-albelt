package com.albelt.gestionstock.domain.cutting.dto;

import com.albelt.gestionstock.shared.enums.MaterialType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * DTO for returning cutting operation data in API responses
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CuttingOperationResponse {

    private UUID id;
    private UUID rollId;
    private UUID commandeItemId; // Link to order item (NEW)
    private MaterialType materialType;
    private String piecesRequested; // JSON
    private String nestingResult; // JSON
    private BigDecimal finalUtilizationPct;
    private BigDecimal finalWasteAreaM2; // in m²
    private BigDecimal finalWasteKg;
    private String status; // PREPARED, IN_PROGRESS, COMPLETED, ON_HOLD, CANCELLED
    private UUID operatorId;
    private LocalDateTime timestamp;
    private String visualizationSvg;
    private String notes;
    private LocalDateTime createdAt;

    // Convenience flags
    private boolean highEfficiency;
    private boolean significantWaste;
}
