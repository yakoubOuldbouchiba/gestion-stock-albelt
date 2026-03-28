package com.albelt.gestionstock.domain.rolls.mapper;

import com.albelt.gestionstock.domain.rolls.dto.RollRequest;
import com.albelt.gestionstock.domain.rolls.dto.RollResponse;
import com.albelt.gestionstock.domain.rolls.entity.Roll;
import com.albelt.gestionstock.domain.suppliers.entity.Supplier;
import com.albelt.gestionstock.domain.altier.entity.Altier;
import com.albelt.gestionstock.shared.enums.WasteType;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Mapper for converting between Roll entity and DTOs
 * Aligned with clean schema (no initial/remaining duplication)
 */
@Component
public class RollMapper {

    /**
     * Convert RollRequest DTO to Roll entity
     */
    public Roll toEntity(RollRequest request, Supplier supplier, Altier altier, java.util.UUID createdBy) {
        if (request == null) {
            return null;
        }
        
        Roll roll = Roll.builder()
                .receivedDate(request.getReceivedDate())
                .supplier(supplier)
                .altier(altier)
                .materialType(request.getMaterialType())
                .nbPlis(request.getNbPlis())
                .thicknessMm(request.getThicknessMm())
                .widthMm(request.getWidthMm())
                .widthRemainingMm(request.getWidthRemainingMm())
                .lengthM(request.getLengthM())
                .lengthRemainingM(request.getLengthRemainingM())
                .areaM2(request.getAreaM2())
                .status(request.getStatus())
                .wasteType(request.getWasteType() != null ? request.getWasteType() : WasteType.NORMAL)
                .qrCode(request.getQrCode())
                .originalQuantity(request.getOriginalQuantity())
                .totalCuts(0)
                .totalWasteAreaM2(BigDecimal.ZERO)
                .createdBy(createdBy)
                .build();
        return roll;
    }

    /**
     * Update existing Roll entity with request data
     */
    public Roll updateEntity(Roll existing, RollRequest request, Supplier supplier, Altier altier) {
        if (request == null) {
            return existing;
        }
        
        if (request.getReceivedDate() != null) {
            existing.setReceivedDate(request.getReceivedDate());
        }
        if (supplier != null) {
            existing.setSupplier(supplier);
        }
        if (altier != null) {
            existing.setAltier(altier);
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
        if (request.getWidthRemainingMm() != null) {
            existing.setWidthRemainingMm(request.getWidthRemainingMm());
        }
        if (request.getLengthM() != null) {
            existing.setLengthM(request.getLengthM());
        }
        if (request.getLengthRemainingM() != null) {
            existing.setLengthRemainingM(request.getLengthRemainingM());
        }
        if (request.getAreaM2() != null) {
            existing.setAreaM2(request.getAreaM2());
        }
        if (request.getStatus() != null) {
            existing.setStatus(request.getStatus());
        }
        if (request.getWasteType() != null) {
            existing.setWasteType(request.getWasteType());
        }
        if (request.getQrCode() != null) {
            existing.setQrCode(request.getQrCode());
        }
        if (request.getOriginalQuantity() != null) {
            existing.setOriginalQuantity(request.getOriginalQuantity());
        }
        
        return existing;
    }

    /**
     * Convert Roll entity to RollResponse DTO
     */
    public RollResponse toResponse(Roll entity) {
        if (entity == null) {
            return null;
        }
        return RollResponse.builder()
                .id(entity.getId())
                .receivedDate(entity.getReceivedDate())
                .supplierId(entity.getSupplier() != null ? entity.getSupplier().getId() : null)
                .supplierName(entity.getSupplier() != null ? entity.getSupplier().getName() : null)
                .materialType(entity.getMaterialType())
                .nbPlis(entity.getNbPlis())
                .thicknessMm(entity.getThicknessMm())
                .widthMm(entity.getWidthMm())
                .widthRemainingMm(entity.getWidthRemainingMm())
                .lengthM(entity.getLengthM())
                .lengthRemainingM(entity.getLengthRemainingM())
                .areaM2(entity.getAreaM2())
                .status(entity.getStatus())
                .wasteType(entity.getWasteType())
                .altierId(entity.getAltier() != null ? entity.getAltier().getId() : null)
                .altierLibelle(entity.getAltier() != null ? entity.getAltier().getLibelle() : null)
                .qrCode(entity.getQrCode())
                .originalQuantity(entity.getOriginalQuantity())
                .totalCuts(entity.getTotalCuts())
                .totalWasteAreaM2(entity.getTotalWasteAreaM2())
                .lastProcessingDate(entity.getLastProcessingDate())
                .createdBy(entity.getCreatedBy())
                .createdAt(entity.getCreatedAt())
                .updatedAt(entity.getUpdatedAt())
                .availableForCutting(entity.getStatus().toString().equals("AVAILABLE"))
                .build();
    }

    /**
     * Convert list of entities to list of responses
     */
    public List<RollResponse> toResponseList(List<Roll> entities) {
        if (entities == null) {
            return List.of();
        }
        return entities.stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }
}
