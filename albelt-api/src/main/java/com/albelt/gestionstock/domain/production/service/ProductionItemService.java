package com.albelt.gestionstock.domain.production.service;

import com.albelt.gestionstock.domain.commandes.entity.CommandeItem;
import com.albelt.gestionstock.domain.commandes.repository.CommandeItemRepository;
import com.albelt.gestionstock.domain.production.dto.ProductionItemRequest;
import com.albelt.gestionstock.domain.production.entity.ProductionItem;
import com.albelt.gestionstock.domain.production.mapper.ProductionItemMapper;
import com.albelt.gestionstock.domain.production.repository.ProductionItemRepository;
import com.albelt.gestionstock.domain.rolls.entity.Roll;
import com.albelt.gestionstock.domain.rolls.repository.RollRepository;
import com.albelt.gestionstock.domain.waste.entity.WastePiece;
import com.albelt.gestionstock.domain.waste.repository.WastePieceRepository;
import com.albelt.gestionstock.shared.exceptions.ResourceNotFoundException;
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
    private final RollRepository rollRepository;
    private final WastePieceRepository wastePieceRepository;
    private final ProductionItemMapper productionItemMapper;

    public ProductionItem create(ProductionItemRequest request) {
        log.info("Creating production item for commande item: {}", request.getCommandeItemId());

        validateSource(request.getRollId(), request.getWastePieceId());
        CommandeItem commandeItem = getCommandeItem(request.getCommandeItemId());
        Roll roll = getRollIfPresent(request.getRollId());
        WastePiece wastePiece = getWastePieceIfPresent(request.getWastePieceId());

        BigDecimal areaPerPiece = calculateAreaPerPiece(request.getPieceWidthMm(), request.getPieceLengthM());
        BigDecimal totalArea = calculateTotalArea(areaPerPiece, request.getQuantity());

        //validateQuantity(commandeItem, request.getQuantity(), null);
        //validateArea(roll, wastePiece, totalArea, null);

        ProductionMatchResult matchResult = evaluateProductionMatch(
            commandeItem,
            roll,
            wastePiece,
            request.getPieceLengthM(),
            request.getPieceWidthMm()
        );

        ProductionItem item = productionItemMapper.toEntity(
                request,
                commandeItem,
                roll,
                wastePiece,
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
        validateSource(request.getRollId(), request.getWastePieceId());

        CommandeItem commandeItem = getCommandeItem(request.getCommandeItemId());
        Roll roll = getRollIfPresent(request.getRollId());
        WastePiece wastePiece = getWastePieceIfPresent(request.getWastePieceId());

        BigDecimal areaPerPiece = calculateAreaPerPiece(request.getPieceWidthMm(), request.getPieceLengthM());
        BigDecimal totalArea = calculateTotalArea(areaPerPiece, request.getQuantity());

        validateQuantity(commandeItem, request.getQuantity(), existing.getId());
        validateArea(roll, wastePiece, totalArea, existing.getId());

        ProductionMatchResult matchResult = evaluateProductionMatch(
            commandeItem,
            roll,
            wastePiece,
            request.getPieceLengthM(),
            request.getPieceWidthMm()
        );

        existing.setCommandeItem(commandeItem);
        existing.setRoll(roll);
        existing.setWastePiece(wastePiece);
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
        return productionItemRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Production item not found: " + id));
    }

    @Transactional(readOnly = true)
    public List<ProductionItem> getByCommandeItemId(UUID commandeItemId) {
        return productionItemRepository.findByCommandeItemId(commandeItemId);
    }

    @Transactional(readOnly = true)
    public List<ProductionItem> getByRollId(UUID rollId) {
        return productionItemRepository.findByRollId(rollId);
    }

    @Transactional(readOnly = true)
    public List<ProductionItem> getByWastePieceId(UUID wastePieceId) {
        return productionItemRepository.findByWastePieceId(wastePieceId);
    }

    public void delete(UUID id) {
        ProductionItem item = getById(id);
        productionItemRepository.delete(item);
    }

    private void validateSource(UUID rollId, UUID wastePieceId) {
        if ((rollId == null && wastePieceId == null) || (rollId != null && wastePieceId != null)) {
            throw new IllegalArgumentException("Specify exactly one of rollId or wastePieceId");
        }
    }

    private CommandeItem getCommandeItem(UUID commandeItemId) {
        return commandeItemRepository.findById(commandeItemId)
                .orElseThrow(() -> new ResourceNotFoundException("Order item not found: " + commandeItemId));
    }

    private Roll getRollIfPresent(UUID rollId) {
        if (rollId == null) {
            return null;
        }
        return rollRepository.findById(rollId)
                .orElseThrow(() -> ResourceNotFoundException.roll(rollId.toString()));
    }

    private WastePiece getWastePieceIfPresent(UUID wastePieceId) {
        if (wastePieceId == null) {
            return null;
        }
        return wastePieceRepository.findById(wastePieceId)
                .orElseThrow(() -> new ResourceNotFoundException("Waste piece not found: " + wastePieceId));
    }

    private BigDecimal calculateAreaPerPiece(Integer widthMm, BigDecimal lengthM) {
        BigDecimal widthM = BigDecimal.valueOf(widthMm)
                .divide(BigDecimal.valueOf(1000), 6, RoundingMode.HALF_UP);
        return widthM.multiply(lengthM).setScale(4, RoundingMode.HALF_UP);
    }

    private BigDecimal calculateTotalArea(BigDecimal areaPerPiece, Integer quantity) {
        return areaPerPiece.multiply(BigDecimal.valueOf(quantity)).setScale(4, RoundingMode.HALF_UP);
    }

    private void validateQuantity(CommandeItem commandeItem, Integer quantity, UUID excludeId) {
        Long existingQuantity = productionItemRepository
                .sumQuantityByCommandeItemIdExcludingId(commandeItem.getId(), excludeId);
        long current = existingQuantity != null ? existingQuantity : 0L;
        long maxAllowed = commandeItem.getQuantite() != null ? commandeItem.getQuantite() : 0L;

        if (current + quantity > maxAllowed) {
            throw new IllegalArgumentException(
                    "Total production quantity exceeds commande item quantity"
            );
        }
    }

    private void validateArea(Roll roll, WastePiece wastePiece, BigDecimal totalArea, UUID excludeId) {
        if (roll != null) {
            BigDecimal existingArea = productionItemRepository
                    .sumTotalAreaByRollIdExcludingId(roll.getId(), excludeId);
            BigDecimal current = existingArea != null ? existingArea : BigDecimal.ZERO;
            BigDecimal maxAllowed = roll.getAreaM2();

            if (maxAllowed != null && current.add(totalArea).compareTo(maxAllowed) > 0) {
                throw new IllegalArgumentException(
                        "Total production area exceeds roll area"
                );
            }
        } else if (wastePiece != null) {
            BigDecimal existingArea = productionItemRepository
                    .sumTotalAreaByWastePieceIdExcludingId(wastePiece.getId(), excludeId);
            BigDecimal current = existingArea != null ? existingArea : BigDecimal.ZERO;
            BigDecimal maxAllowed = wastePiece.getAreaM2();

            if (maxAllowed != null && current.add(totalArea).compareTo(maxAllowed) > 0) {
                throw new IllegalArgumentException(
                        "Total production area exceeds waste piece area"
                );
            }
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

        var sourceColor = roll != null ? roll.getColor() : wastePiece != null ? wastePiece.getColor() : null;
        var itemColor = commandeItem.getColor();
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
