package com.albelt.gestionstock.domain.placement.mapper;

import com.albelt.gestionstock.domain.colors.entity.Color;
import com.albelt.gestionstock.domain.commandes.dto.CommandeItemSummaryResponse;
import com.albelt.gestionstock.domain.commandes.entity.CommandeItem;
import com.albelt.gestionstock.domain.placement.dto.PlacedRectangleRequest;
import com.albelt.gestionstock.domain.placement.dto.PlacedRectangleResponse;
import com.albelt.gestionstock.domain.placement.entity.PlacedRectangle;
import com.albelt.gestionstock.domain.rolls.dto.RollSummaryResponse;
import com.albelt.gestionstock.domain.rolls.entity.Roll;
import com.albelt.gestionstock.domain.waste.dto.WastePieceSummaryResponse;
import com.albelt.gestionstock.domain.waste.entity.WastePiece;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class PlacedRectangleMapper {

    public PlacedRectangle toEntity(PlacedRectangleRequest request, Roll roll, WastePiece wastePiece, Color color) {
        if (request == null) {
            return null;
        }
        return PlacedRectangle.builder()
                .roll(roll)
                .wastePiece(wastePiece)
                .commandeItemId(request.getCommandeItemId())
                .color(color)
                .xMm(request.getXMm())
                .yMm(request.getYMm())
                .widthMm(request.getWidthMm())
                .heightMm(request.getHeightMm())
                .build();
    }

    public PlacedRectangleResponse toResponse(PlacedRectangle entity) {
        return toResponse(entity, null);
    }

    public PlacedRectangleResponse toResponse(PlacedRectangle entity, CommandeItem commandeItem) {
        if (entity == null) {
            return null;
        }
        Roll roll = entity.getRoll();
        WastePiece wastePiece = entity.getWastePiece();
        Color entityColor = entity.getColor();
        boolean colorInitialized = entityColor != null && org.hibernate.Hibernate.isInitialized(entityColor);

        return PlacedRectangleResponse.builder()
                .id(entity.getId())
                .rollId(roll != null ? roll.getId() : null)
                .wastePieceId(wastePiece != null ? wastePiece.getId() : null)
                .commandeItemId(entity.getCommandeItemId())
                .roll(toRollSummary(roll))
                .wastePiece(toWastePieceSummary(wastePiece))
                .commandeItem(toCommandeItemSummary(commandeItem))
                .xMm(entity.getXMm())
                .yMm(entity.getYMm())
                .widthMm(entity.getWidthMm())
                .heightMm(entity.getHeightMm())
                .colorId(entityColor != null ? entityColor.getId() : null)
                .colorName(colorInitialized ? entityColor.getName() : null)
                .colorHexCode(colorInitialized ? entityColor.getHexCode() : null)
                .createdAt(entity.getCreatedAt())
                .updatedAt(entity.getUpdatedAt())
                .build();
    }

    public List<PlacedRectangleResponse> toResponseList(List<PlacedRectangle> entities) {
        if (entities == null) {
            return List.of();
        }
        return entities.stream().map(this::toResponse).toList();
    }

    public List<PlacedRectangleResponse> toResponseList(
            List<PlacedRectangle> entities,
            java.util.Map<java.util.UUID, CommandeItem> commandeItemsById) {
        if (entities == null) {
            return List.of();
        }
        if (commandeItemsById == null) {
            return entities.stream().map(this::toResponse).toList();
        }
        return entities.stream()
                .map(entity -> {
                    java.util.UUID commandeItemId = entity.getCommandeItemId();
                    CommandeItem commandeItem = commandeItemId != null
                            ? commandeItemsById.get(commandeItemId)
                            : null;
                    return toResponse(entity, commandeItem);
                })
                .toList();
    }

    private RollSummaryResponse toRollSummary(Roll roll) {
        if (roll == null) {
            return null;
        }
        Color color = roll.getArticle() != null ? roll.getArticle().getColor() : null;
        boolean colorInitialized = color != null && org.hibernate.Hibernate.isInitialized(color);

        return RollSummaryResponse.builder()
                .id(roll.getId())
                .reference(roll.getReference())
                .materialType(roll.getMaterialType())
                .nbPlis(roll.getNbPlis())
                .thicknessMm(roll.getThicknessMm())
                .widthMm(roll.getWidthMm())
                .widthRemainingMm(roll.getWidthRemainingMm())
                .lengthM(roll.getLengthM())
                .lengthRemainingM(roll.getLengthRemainingM())
                .areaM2(roll.getAreaM2())
                .usedAreaM2(roll.getUsedAreaM2())
                .availableAreaM2(roll.getAvailableAreaM2())
                .status(roll.getStatus())
                .colorId(color != null ? color.getId() : null)
                .colorName(colorInitialized ? color.getName() : null)
                .colorHexCode(colorInitialized ? color.getHexCode() : null)
                .build();
    }

    private WastePieceSummaryResponse toWastePieceSummary(WastePiece wastePiece) {
        if (wastePiece == null) {
            return null;
        }
        Color color = wastePiece.getArticle() != null ? wastePiece.getArticle().getColor() : null;
        boolean colorInitialized = color != null && org.hibernate.Hibernate.isInitialized(color);

        return WastePieceSummaryResponse.builder()
                .id(wastePiece.getId())
                .rollId(wastePiece.getRoll() != null ? wastePiece.getRoll().getId() : null)
                .parentWastePieceId(wastePiece.getParentWastePiece() != null
                        ? wastePiece.getParentWastePiece().getId()
                        : null)
                .reference(wastePiece.getReference())
                .materialType(wastePiece.getMaterialType())
                .nbPlis(wastePiece.getNbPlis())
                .thicknessMm(wastePiece.getThicknessMm())
                .widthMm(wastePiece.getWidthMm())
                .widthRemainingMm(wastePiece.getWidthRemainingMm())
                .lengthM(wastePiece.getLengthM())
                .lengthRemainingM(wastePiece.getLengthRemainingM())
                .areaM2(wastePiece.getAreaM2())
                .usedAreaM2(wastePiece.getUsedAreaM2())
                .availableAreaM2(wastePiece.getAvailableAreaM2())
                .status(wastePiece.getStatus())
                .wasteType(wastePiece.getWasteType())
                .colorId(color != null ? color.getId() : null)
                .colorName(colorInitialized ? color.getName() : null)
                .colorHexCode(colorInitialized ? color.getHexCode() : null)
                .build();
    }

    private CommandeItemSummaryResponse toCommandeItemSummary(CommandeItem item) {
        if (item == null) {
            return null;
        }
        Color color = item.getArticle() != null ? item.getArticle().getColor() : null;
        boolean colorInitialized = color != null && org.hibernate.Hibernate.isInitialized(color);

        return CommandeItemSummaryResponse.builder()
                .id(item.getId())
                .lineNumber(item.getLineNumber())
                .materialType(item.getMaterialType())
                .nbPlis(item.getNbPlis())
                .thicknessMm(item.getThicknessMm())
                .longueurM(item.getLongueurM())
                .longueurToleranceM(item.getLongueurToleranceM())
                .largeurMm(item.getLargeurMm())
                .quantite(item.getQuantite())
                .status(item.getStatus())
                .typeMouvement(item.getTypeMouvement())
                .reference(item.getReference())
                .colorId(color != null ? color.getId() : null)
                .colorName(colorInitialized ? color.getName() : null)
                .colorHexCode(colorInitialized ? color.getHexCode() : null)
                .build();
    }
}
