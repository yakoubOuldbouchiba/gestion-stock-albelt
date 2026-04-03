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

        validateQuantity(commandeItem, request.getQuantity(), null);
        validateArea(roll, wastePiece, totalArea, null);

        ProductionItem item = productionItemMapper.toEntity(
                request,
                commandeItem,
                roll,
                wastePiece,
                areaPerPiece,
                totalArea
        );

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

        existing.setCommandeItem(commandeItem);
        existing.setRoll(roll);
        existing.setWastePiece(wastePiece);
        existing.setPieceLengthM(request.getPieceLengthM());
        existing.setPieceWidthMm(request.getPieceWidthMm());
        existing.setQuantity(request.getQuantity());
        existing.setAreaPerPieceM2(areaPerPiece);
        existing.setTotalAreaM2(totalArea);
        existing.setNotes(request.getNotes());

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
}
