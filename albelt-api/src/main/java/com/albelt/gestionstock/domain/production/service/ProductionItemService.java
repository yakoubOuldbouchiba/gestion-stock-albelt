package com.albelt.gestionstock.domain.production.service;

import com.albelt.gestionstock.domain.commandes.entity.CommandeItem;
import com.albelt.gestionstock.domain.commandes.repository.CommandeItemRepository;
import com.albelt.gestionstock.domain.placement.entity.PlacedRectangle;
import com.albelt.gestionstock.domain.placement.repository.PlacedRectangleRepository;
import com.albelt.gestionstock.domain.production.dto.ProductionItemRequest;
import com.albelt.gestionstock.domain.production.entity.ProductionItem;
import com.albelt.gestionstock.domain.production.mapper.ProductionItemMapper;
import com.albelt.gestionstock.domain.production.repository.ProductionItemRepository;
import com.albelt.gestionstock.domain.rolls.entity.Roll;
import com.albelt.gestionstock.domain.waste.entity.WastePiece;
import com.albelt.gestionstock.shared.exceptions.ResourceNotFoundException;
import com.albelt.gestionstock.shared.exceptions.BusinessException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;
import java.util.UUID;

/**
 * Service for ProductionItem management with validation
 */
@Service
@Transactional
@RequiredArgsConstructor
@Slf4j
public class ProductionItemService {

    private final ProductionItemRepository productionItemRepository;
    private final CommandeItemRepository commandeItemRepository;
    private final PlacedRectangleRepository placedRectangleRepository;
    private final ProductionItemMapper productionItemMapper;

    public ProductionItem create(ProductionItemRequest request) {
        log.info("Creating production item for placed rectangle: {}", request.getPlacedRectangleId());

        PlacedRectangle placedRectangle = getPlacedRectangle(request.getPlacedRectangleId());
        CommandeItem commandeItem = getCommandeItemFromPlacement(placedRectangle);
        assertCommandeNotLocked(commandeItem);
        Roll roll = placedRectangle.getRoll();
        WastePiece wastePiece = placedRectangle.getWastePiece();

        BigDecimal areaPerPiece = calculateAreaPerPiece(request.getPieceWidthMm(), request.getPieceLengthM());
        BigDecimal totalArea = calculateTotalArea(areaPerPiece, request.getQuantity());

        validatePlacementFit(placedRectangle, request.getPieceWidthMm(), request.getPieceLengthM());
        validateArea(placedRectangle, totalArea, null);

        ProductionMatchResult matchResult = evaluateProductionMatch(
            commandeItem,
            roll,
            wastePiece,
            request.getPieceLengthM(),
            request.getPieceWidthMm()
        );

        ProductionItem item = productionItemMapper.toEntity(
                request,
            placedRectangle,
                areaPerPiece,
                totalArea
        );
        item.setGoodProduction(matchResult.goodProduction());
        item.setProductionMiss(matchResult.productionMiss());

        return productionItemRepository.save(item);
    }

    public ProductionItem update(UUID id, ProductionItemRequest request) {
        log.info("Updating production item: {}", id);

        ProductionItem existing = getById(id);
        PlacedRectangle placedRectangle = existing.getPlacedRectangle();

        if (request.getPlacedRectangleId() != null
                && !request.getPlacedRectangleId().equals(placedRectangle.getId())) {
            throw new IllegalArgumentException("Placed rectangle cannot be changed");
        }

        CommandeItem commandeItem = getCommandeItemFromPlacement(placedRectangle);
        assertCommandeNotLocked(commandeItem);
        Roll roll = placedRectangle.getRoll();
        WastePiece wastePiece = placedRectangle.getWastePiece();

        BigDecimal areaPerPiece = calculateAreaPerPiece(request.getPieceWidthMm(), request.getPieceLengthM());
        BigDecimal totalArea = calculateTotalArea(areaPerPiece, request.getQuantity());

        validatePlacementFit(placedRectangle, request.getPieceWidthMm(), request.getPieceLengthM());
        validateArea(placedRectangle, totalArea, existing.getId());

        ProductionMatchResult matchResult = evaluateProductionMatch(
            commandeItem,
            roll,
            wastePiece,
            request.getPieceLengthM(),
            request.getPieceWidthMm()
        );

        existing.setPlacedRectangle(placedRectangle);
        existing.setPieceLengthM(request.getPieceLengthM());
        existing.setPieceWidthMm(request.getPieceWidthMm());
        existing.setQuantity(request.getQuantity());
        existing.setAreaPerPieceM2(areaPerPiece);
        existing.setTotalAreaM2(totalArea);
        existing.setNotes(request.getNotes());
        existing.setGoodProduction(matchResult.goodProduction());
        existing.setProductionMiss(matchResult.productionMiss());

        return productionItemRepository.save(existing);
    }

    @Transactional(readOnly = true)
    public ProductionItem getById(UUID id) {
        return productionItemRepository.findByIdWithSources(id)
                .orElseThrow(() -> new ResourceNotFoundException("Production item not found: " + id));
    }

    @Transactional(readOnly = true)
    public List<ProductionItem> getByCommandeItemId(UUID commandeItemId) {
        return productionItemRepository.findByCommandeItemIdWithSources(commandeItemId);
    }

    @Transactional(readOnly = true)
    public List<ProductionItem> getByRollId(UUID rollId) {
        return productionItemRepository.findByRollIdWithSources(rollId);
    }

    @Transactional(readOnly = true)
    public List<ProductionItem> getByWastePieceId(UUID wastePieceId) {
        return productionItemRepository.findByWastePieceIdWithSources(wastePieceId);
    }

    public void delete(UUID id) {
        ProductionItem item = getById(id);
        assertCommandeNotLocked(getCommandeItemFromPlacement(item.getPlacedRectangle()));
        productionItemRepository.delete(item);
    }

    private void assertCommandeNotLocked(CommandeItem commandeItem) {
        if (commandeItem == null || commandeItem.getCommande() == null) {
            return;
        }
        String status = commandeItem.getCommande().getStatus();
        if (status == null) {
            return;
        }
        String normalized = status.trim().toUpperCase();
        if ("COMPLETED".equals(normalized) || "CANCELLED".equals(normalized)) {
            throw new BusinessException("Order cannot be edited when it is COMPLETED or CANCELLED");
        }
    }

    private CommandeItem getCommandeItem(UUID commandeItemId) {
        return commandeItemRepository.findById(commandeItemId)
                .orElseThrow(() -> new ResourceNotFoundException("Order item not found: " + commandeItemId));
    }

    private PlacedRectangle getPlacedRectangle(UUID placedRectangleId) {
        return placedRectangleRepository.findById(placedRectangleId)
                .orElseThrow(() -> new ResourceNotFoundException("Placed rectangle not found: " + placedRectangleId));
    }

    private CommandeItem getCommandeItemFromPlacement(PlacedRectangle placedRectangle) {
        UUID commandeItemId = placedRectangle.getCommandeItemId();
        if (commandeItemId == null) {
            throw new IllegalArgumentException("Placed rectangle must be linked to a commande item");
        }
        return getCommandeItem(commandeItemId);
    }

    private BigDecimal calculateAreaPerPiece(Integer widthMm, BigDecimal lengthM) {
        BigDecimal widthM = BigDecimal.valueOf(widthMm)
                .divide(BigDecimal.valueOf(1000), 6, RoundingMode.HALF_UP);
        return widthM.multiply(lengthM).setScale(4, RoundingMode.HALF_UP);
    }

    private BigDecimal calculateTotalArea(BigDecimal areaPerPiece, Integer quantity) {
        return areaPerPiece.multiply(BigDecimal.valueOf(quantity)).setScale(4, RoundingMode.HALF_UP);
    }


    private void validateArea(PlacedRectangle placedRectangle, BigDecimal totalArea, UUID excludeId) {
        if (placedRectangle == null) {
            return;
        }
        BigDecimal existingArea = productionItemRepository
                .sumTotalAreaByPlacedRectangleIdExcludingId(placedRectangle.getId(), excludeId);
        BigDecimal current = existingArea != null ? existingArea : BigDecimal.ZERO;

        BigDecimal widthM = BigDecimal.valueOf(placedRectangle.getWidthMm())
                .divide(BigDecimal.valueOf(1000), 6, RoundingMode.HALF_UP);
        BigDecimal heightM = BigDecimal.valueOf(placedRectangle.getHeightMm())
                .divide(BigDecimal.valueOf(1000), 6, RoundingMode.HALF_UP);
        BigDecimal maxAllowed = widthM.multiply(heightM).setScale(4, RoundingMode.HALF_UP);

        if (current.add(totalArea).compareTo(maxAllowed) > 0) {
            throw new IllegalArgumentException(
                    "Total production area exceeds placed rectangle area"
            );
        }
    }

    private void validatePlacementFit(PlacedRectangle placedRectangle, Integer pieceWidthMm, BigDecimal pieceLengthM) {
        if (placedRectangle == null || pieceWidthMm == null || pieceLengthM == null) {
            return;
        }
        Integer rectWidth = placedRectangle.getWidthMm();
        Integer rectHeight = placedRectangle.getHeightMm();
        if (rectWidth == null || rectHeight == null) {
            return;
        }

        if (pieceWidthMm > rectWidth) {
            throw new IllegalArgumentException("Piece width exceeds placed rectangle width");
        }

        BigDecimal lengthMm = pieceLengthM.multiply(BigDecimal.valueOf(1000));
        if (lengthMm.compareTo(BigDecimal.valueOf(rectHeight)) > 0) {
            throw new IllegalArgumentException("Piece length exceeds placed rectangle length");
        }
    }

    private ProductionMatchResult evaluateProductionMatch(
            CommandeItem commandeItem,
            Roll roll,
            WastePiece wastePiece,
            BigDecimal pieceLengthM,
            Integer pieceWidthMm
    ) {
        List<String> mismatches = new java.util.ArrayList<>();

        String sourceMaterial = roll != null
                ? roll.getMaterialType() != null ? roll.getMaterialType().name() : null
                : wastePiece != null && wastePiece.getMaterialType() != null
                ? wastePiece.getMaterialType().name()
                : null;
        if (!matchesString(sourceMaterial, commandeItem.getMaterialType())) {
            mismatches.add(buildMismatch("material_type",
                    formatStringValue(commandeItem.getMaterialType()),
                    formatStringValue(sourceMaterial)));
        }

        Integer sourcePlis = roll != null ? roll.getNbPlis() : wastePiece != null ? wastePiece.getNbPlis() : null;
        if (!matchesInteger(sourcePlis, commandeItem.getNbPlis())) {
            mismatches.add(buildMismatch("nb_plis",
                    formatInteger(commandeItem.getNbPlis()),
                    formatInteger(sourcePlis)));
        }

        BigDecimal sourceThickness = roll != null ? roll.getThicknessMm() : wastePiece != null ? wastePiece.getThicknessMm() : null;
        if (!matchesDecimal(sourceThickness, commandeItem.getThicknessMm())) {
            mismatches.add(buildMismatch("thickness_mm",
                    formatDecimal(commandeItem.getThicknessMm()),
                    formatDecimal(sourceThickness)));
        }

        String sourceReference = roll != null ? roll.getReference() : wastePiece != null ? wastePiece.getReference() : null;
        if (!matchesString(sourceReference, commandeItem.getReference())) {
            mismatches.add(buildMismatch("reference",
                    formatStringValue(commandeItem.getReference()),
                    formatStringValue(sourceReference)));
        }

        var sourceColor = roll != null ? roll.getArticle().getColor() : wastePiece != null ? wastePiece.getArticle().getColor() : null;
        var itemColor = commandeItem.getArticle().getColor();
        UUID sourceColorId = sourceColor != null ? sourceColor.getId() : null;
        UUID itemColorId = itemColor != null ? itemColor.getId() : null;
        if (!matchesUuid(sourceColorId, itemColorId)) {
            mismatches.add(buildMismatch("color",
                formatColor(itemColor),
                formatColor(sourceColor)));
        }

        if (!matchesDecimal(pieceLengthM, commandeItem.getLongueurM())) {
            mismatches.add(buildMismatch("piece_length_m",
                    formatDecimal(commandeItem.getLongueurM()),
                    formatDecimal(pieceLengthM)));
        }

        if (!matchesInteger(pieceWidthMm, commandeItem.getLargeurMm())) {
            mismatches.add(buildMismatch("piece_width_mm",
                    formatInteger(commandeItem.getLargeurMm()),
                    formatInteger(pieceWidthMm)));
        }

        boolean goodProduction = mismatches.isEmpty();
        String productionMiss = goodProduction ? null : String.join(", ", mismatches);
        return new ProductionMatchResult(goodProduction, productionMiss);
    }

    private boolean matchesInteger(Integer left, Integer right) {
        if (left == null && right == null) return true;
        if (left == null || right == null) return false;
        return left.equals(right);
    }

    private boolean matchesDecimal(BigDecimal left, BigDecimal right) {
        if (left == null && right == null) return true;
        if (left == null || right == null) return false;
        return left.compareTo(right) == 0;
    }

    private boolean matchesUuid(UUID left, UUID right) {
        if (left == null && right == null) return true;
        if (left == null || right == null) return false;
        return left.equals(right);
    }

    private boolean matchesString(String left, String right) {
        String normalizedLeft = normalizeString(left);
        String normalizedRight = normalizeString(right);
        if (normalizedLeft == null && normalizedRight == null) return true;
        if (normalizedLeft == null || normalizedRight == null) return false;
        return normalizedLeft.equalsIgnoreCase(normalizedRight);
    }

    private String normalizeString(String value) {
        if (value == null) return null;
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    private String buildMismatch(String key, String expected, String actual) {
        return key + " expected=" + expected + " actual=" + actual;
    }

    private String formatStringValue(String value) {
        String normalized = normalizeString(value);
        return normalized == null ? "null" : normalized;
    }

    private String formatInteger(Integer value) {
        return value == null ? "null" : value.toString();
    }

    private String formatDecimal(BigDecimal value) {
        if (value == null) return "null";
        return value.stripTrailingZeros().toPlainString();
    }

    private String formatColor(com.albelt.gestionstock.domain.colors.entity.Color color) {
        if (color == null) return "null";
        String name = normalizeString(color.getName());
        if (name != null) return name;
        UUID id = color.getId();
        return id != null ? id.toString() : "null";
    }


    private record ProductionMatchResult(boolean goodProduction, String productionMiss) {
    }
}
