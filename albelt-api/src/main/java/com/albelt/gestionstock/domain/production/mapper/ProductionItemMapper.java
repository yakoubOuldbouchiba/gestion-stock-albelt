package com.albelt.gestionstock.domain.production.mapper;

import com.albelt.gestionstock.domain.commandes.entity.CommandeItem;
import com.albelt.gestionstock.domain.production.dto.ProductionItemRequest;
import com.albelt.gestionstock.domain.production.dto.ProductionItemResponse;
import com.albelt.gestionstock.domain.production.entity.ProductionItem;
import com.albelt.gestionstock.domain.rolls.entity.Roll;
import com.albelt.gestionstock.domain.waste.entity.WastePiece;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;

/**
 * Mapper for ProductionItem entity and DTOs
 */
@Component
public class ProductionItemMapper {

    public ProductionItem toEntity(ProductionItemRequest request,
                                   CommandeItem commandeItem,
                                   Roll roll,
                                   WastePiece wastePiece,
                                   BigDecimal areaPerPiece,
                                   BigDecimal totalArea) {
        if (request == null) {
            return null;
        }

        return ProductionItem.builder()
                .commandeItem(commandeItem)
                .roll(roll)
                .wastePiece(wastePiece)
                .pieceLengthM(request.getPieceLengthM())
                .pieceWidthMm(request.getPieceWidthMm())
                .quantity(request.getQuantity())
                .areaPerPieceM2(areaPerPiece)
                .totalAreaM2(totalArea)
                .notes(request.getNotes())
                .build();
    }

    public ProductionItemResponse toResponse(ProductionItem entity) {
        if (entity == null) {
            return null;
        }

        return ProductionItemResponse.builder()
                .id(entity.getId())
                .commandeItemId(entity.getCommandeItem() != null ? entity.getCommandeItem().getId() : null)
                .rollId(entity.getRoll() != null ? entity.getRoll().getId() : null)
                .wastePieceId(entity.getWastePiece() != null ? entity.getWastePiece().getId() : null)
                .pieceLengthM(entity.getPieceLengthM())
                .pieceWidthMm(entity.getPieceWidthMm())
                .quantity(entity.getQuantity())
                .areaPerPieceM2(entity.getAreaPerPieceM2())
                .totalAreaM2(entity.getTotalAreaM2())
                .notes(entity.getNotes())
                .goodProduction(entity.getGoodProduction())
                .productionMiss(entity.getProductionMiss())
                .createdAt(entity.getCreatedAt())
                .updatedAt(entity.getUpdatedAt())
                .build();
    }
}
