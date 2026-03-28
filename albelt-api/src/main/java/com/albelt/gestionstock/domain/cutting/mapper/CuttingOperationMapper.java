package com.albelt.gestionstock.domain.cutting.mapper;

import com.albelt.gestionstock.domain.cutting.dto.CuttingOperationRequest;
import com.albelt.gestionstock.domain.cutting.dto.CuttingOperationResponse;
import com.albelt.gestionstock.domain.cutting.entity.CuttingOperation;
import com.albelt.gestionstock.domain.rolls.entity.Roll;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.stream.Collectors;

/**
 * Mapper for converting between CuttingOperation entity and DTOs
 */
@Component
public class CuttingOperationMapper {

    private final ObjectMapper objectMapper = new ObjectMapper();

    /**
     * Convert CuttingOperationRequest DTO to CuttingOperation entity
     * Supports both nesting algorithm workflow (piecesRequested) 
     * and UI recording workflow (quantity, utilization, wasteArea)
     */
    public CuttingOperation toEntity(CuttingOperationRequest request, Roll roll, java.util.UUID operatorId) {
        if (request == null) {
            return null;
        }
        try {
            String piecesJson = "{}";
            if (request.getPiecesRequested() != null && !request.getPiecesRequested().isEmpty()) {
                piecesJson = objectMapper.writeValueAsString(request.getPiecesRequested());
            }
            
            CuttingOperation.CuttingOperationBuilder builder = CuttingOperation.builder()
                    .roll(roll)
                    .piecesRequested(piecesJson)
                    .nestingResult("{}") // Will be populated by nesting algorithm
                    .operatorId(operatorId)
                    .notes(request.getNotes());
            
            // If UI sends simplified metrics, set them directly
            if (request.getUtilization() != null) {
                builder.finalUtilizationPct(request.getUtilization());
            }
            
            if (request.getWasteArea() != null) {
                builder.finalWasteAreaM2(request.getWasteArea());
            }
            
            return builder.build();
        } catch (Exception e) {
            throw new RuntimeException("Failed to serialize pieces requested", e);
        }
    }

    /**
     * Convert CuttingOperation entity to CuttingOperationResponse DTO
     */
    public CuttingOperationResponse toResponse(CuttingOperation entity) {
        if (entity == null) {
            return null;
        }
        return CuttingOperationResponse.builder()
                .id(entity.getId())
                .rollId(entity.getRoll() != null ? entity.getRoll().getId() : null)
                .materialType(entity.getRoll() != null ? entity.getRoll().getMaterialType() : null)
                .piecesRequested(entity.getPiecesRequested())
                .nestingResult(entity.getNestingResult())
                .finalUtilizationPct(entity.getFinalUtilizationPct())
                .finalWasteAreaM2(entity.getFinalWasteAreaM2())
                .finalWasteKg(entity.getFinalWasteKg())
                .operatorId(entity.getOperatorId())
                .timestamp(entity.getTimestamp())
                .visualizationSvg(entity.getVisualizationSvg())
                .notes(entity.getNotes())
                .createdAt(entity.getCreatedAt())
                .highEfficiency(entity.isHighEfficiency())
                .significantWaste(entity.hasSignificantWaste())
                .build();
    }

    /**
     * Convert list of entities to list of responses
     */
    public List<CuttingOperationResponse> toResponseList(List<CuttingOperation> entities) {
        if (entities == null) {
            return List.of();
        }
        return entities.stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }
}
