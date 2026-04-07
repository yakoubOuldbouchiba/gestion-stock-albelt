package com.albelt.gestionstock.domain.waste.mapper;

import com.albelt.gestionstock.domain.rolls.dto.RollGroupedStatsResponse;
import com.albelt.gestionstock.domain.waste.dto.WastePieceGroupedStatsResponse;
import com.albelt.gestionstock.domain.waste.dto.WastePieceRequest;
import com.albelt.gestionstock.domain.waste.dto.WastePieceResponse;
import com.albelt.gestionstock.domain.waste.entity.WastePiece;
import com.albelt.gestionstock.domain.colors.entity.Color;
import com.albelt.gestionstock.domain.rolls.entity.Roll;
import com.albelt.gestionstock.shared.enums.WasteStatus;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Mapper for converting between WastePiece entity and DTOs
 * Simplified to work with direct roll → waste → commande linkage
 */
@Component
public class WastePieceMapper {



    /**
     * Convert Object[] from groupByAllFields to RollGroupedStatsResponse DTO
     */
    public WastePieceGroupedStatsResponse toGroupedStatsResponse(Object[] row) {
        if (row == null || row.length < 11) return null;
        return WastePieceGroupedStatsResponse.builder()
                .colorId((java.util.UUID) row[0])
                .colorName((String) row[1])
                .colorHexCode((String) row[2])
                .nbPlis((Integer) row[3])
                .thicknessMm(row[4] instanceof java.math.BigDecimal ? ((java.math.BigDecimal) row[4]) : row[4] != null ? new java.math.BigDecimal(row[4].toString()) : null)
                .materialType((com.albelt.gestionstock.shared.enums.MaterialType) row[5])
                .altierId((java.util.UUID) row[6])
                .altierName((String) row[7])
                .status((com.albelt.gestionstock.shared.enums.WasteStatus) row[8])
                .rollCount(row[9] instanceof Long ? (Long) row[9] : row[9] != null ? Long.valueOf(row[9].toString()) : null)
                .totalAreaM2(row[10] instanceof java.math.BigDecimal ? (java.math.BigDecimal) row[10] : row[10] != null ? new java.math.BigDecimal(row[10].toString()) : null)
                .totalWasteAreaM2(row[11] instanceof java.math.BigDecimal ? (java.math.BigDecimal) row[11] : row[11] != null ? new java.math.BigDecimal(row[11].toString()) : null)
                .build();
    }

    public List<WastePieceGroupedStatsResponse> toGroupedStatsResponseList(List<Object[]> rows) {
        if (rows == null) return List.of();
        return rows.stream().map(this::toGroupedStatsResponse).collect(Collectors.toList());
    }
    /**
     * Convert WastePieceRequest DTO to WastePiece entity
     * NOTE: Roll reference must be set separately after fetching from repository
     */
    public WastePiece toEntity(WastePieceRequest request, Color color) {
        if (request == null) {
            return null;
        }
        WastePiece wastePiece = WastePiece.builder()
                .materialType(request.getMaterialType())
                .nbPlis(request.getNbPlis())
                .thicknessMm(request.getThicknessMm())
                .widthMm(request.getWidthMm())
                .lengthM(request.getLengthM())
                .areaM2(request.getAreaM2())
            .usedAreaM2(BigDecimal.ZERO)
            .availableAreaM2(request.getAreaM2())
                .widthRemainingMm(request.getWidthRemainingMm())
                .lengthRemainingM(request.getLengthRemainingM())
                .wasteType(request.getWasteType())
                .status(request.getStatus() != null ? 
                    WasteStatus.valueOf(request.getStatus()) : WasteStatus.AVAILABLE)
                .qrCode(request.getQrCode())
                .color(color)
                .commandeItemId(request.getCommandeItemId())
                .build();
        return wastePiece;
    }

    /**
     * Convert WastePieceRequest DTO to WastePiece entity with Roll reference
     */
    public WastePiece toEntity(WastePieceRequest request, Roll roll, Color color) {
        WastePiece wastePiece = toEntity(request, color);
        if (wastePiece != null && roll != null) {
            wastePiece.setRoll(roll);
        }
        return wastePiece;
    }

    /**
     * Update existing WastePiece entity with request data
     */
    public WastePiece updateEntity(WastePiece existing, WastePieceRequest request, Color color) {
        if (request == null) {
            return existing;
        }
        if(request.getReference() != null) {
            existing.setReference(request.getReference());
        }
        if (request.getMaterialType() != null) {
            existing.setMaterialType(request.getMaterialType());
        }
        if (request.getNbPlis() != null) {
            existing.setNbPlis(request.getNbPlis());
        }
        if (request.getThicknessMm() != null) {
            existing.setThicknessMm(request.getThicknessMm());
        }
        if (request.getWidthMm() != null) {
            existing.setWidthMm(request.getWidthMm());
        }
        if (request.getLengthM() != null) {
            existing.setLengthM(request.getLengthM());
        }
        if (request.getAreaM2() != null) {
            existing.setAreaM2(request.getAreaM2());
            existing.setAvailableAreaM2(request.getAreaM2());
        }
        if (request.getWidthRemainingMm() != null) {
            existing.setWidthRemainingMm(request.getWidthRemainingMm());
        }
        if (request.getLengthRemainingM() != null) {
            existing.setLengthRemainingM(request.getLengthRemainingM());
        }
        if (request.getWasteType() != null) {
            existing.setWasteType(request.getWasteType());
        }
        if (request.getStatus() != null) {
            existing.setStatus(WasteStatus.valueOf(request.getStatus()));
        }
        if (request.getQrCode() != null) {
            existing.setQrCode(request.getQrCode());
        }
        if (color != null) {
            existing.setColor(color);
        }
        return existing;
    }

    /**
     * Convert WastePiece entity to WastePieceResponse DTO
     */
    public WastePieceResponse toResponse(WastePiece entity) {
        if (entity == null) {
            return null;
        }
        return WastePieceResponse.builder()
                .id(entity.getId())
                .rollId(entity.getRoll() != null ? entity.getRoll().getId() : null)
            .parentWastePieceId(entity.getParentWastePiece() != null ? entity.getParentWastePiece().getId() : null)
                .materialType(entity.getMaterialType())
                .supplierId(entity.getRoll() != null ? entity.getRoll().getSupplier().getId() : entity.getParentWastePiece().getRoll().getSupplier().getId() )
                .supplierName(entity.getRoll() != null ? entity.getRoll().getSupplier().getName() : entity.getParentWastePiece().getRoll().getSupplier().getName() )
                .nbPlis(entity.getNbPlis())
                .thicknessMm(entity.getThicknessMm())
                .widthMm(entity.getWidthMm())
                .widthRemainingMm(entity.getWidthRemainingMm())
                .lengthM(entity.getLengthM())
                .lengthRemainingM(entity.getLengthRemainingM())
                .areaM2(entity.getAreaM2())
                .usedAreaM2(entity.getUsedAreaM2())
                .availableAreaM2(entity.getAvailableAreaM2())
                .status(entity.getStatus() != null ? entity.getStatus().name() : "AVAILABLE")
                .wasteType(entity.getWasteType())
                .altierId(entity.getAltier() != null ? entity.getAltier().getId() : null)
                .altierLibelle(entity.getAltier() != null ? entity.getAltier().getLibelle() : null)
                .qrCode(entity.getQrCode())
                .colorId(entity.getColor() != null ? entity.getColor().getId() : null)
                .colorName(entity.getColor() != null ? entity.getColor().getName() : null)
                .colorHexCode(entity.getColor() != null ? entity.getColor().getHexCode() : null)
                .totalCuts(entity.getTotalCuts())
                .totalWasteAreaM2(entity.getTotalWasteAreaM2())
                .lastProcessingDate(entity.getLastProcessingDate())
                .commandeItemId(entity.getCommandeItemId())
                .classificationDate(entity.getClassificationDate())
                .createdBy(entity.getCreatedBy())
                .createdAt(entity.getCreatedAt())
                .updatedAt(entity.getUpdatedAt())
                .reference(entity.getReference())
                .build();
    }

    /**
     * Convert list of WastePiece entities to list of responses
     */
    public List<WastePieceResponse> toResponseList(List<WastePiece> entities) {
        return entities.stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }
}
