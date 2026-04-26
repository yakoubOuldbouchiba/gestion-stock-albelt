package com.albelt.gestionstock.domain.returns.service;

import com.albelt.gestionstock.domain.commandes.entity.Commande;
import com.albelt.gestionstock.domain.commandes.entity.CommandeItem;
import com.albelt.gestionstock.domain.commandes.repository.CommandeItemRepository;
import com.albelt.gestionstock.domain.commandes.service.CommandeService;
import com.albelt.gestionstock.domain.production.entity.ProductionItem;
import com.albelt.gestionstock.domain.production.repository.ProductionItemRepository;
import com.albelt.gestionstock.domain.returns.dto.ReturnBonItemRequest;
import com.albelt.gestionstock.domain.returns.dto.ReturnBonResponse;
import com.albelt.gestionstock.domain.returns.dto.ReturnBonRequest;
import com.albelt.gestionstock.domain.returns.entity.ReturnBon;
import com.albelt.gestionstock.domain.returns.entity.ReturnBonItem;
import com.albelt.gestionstock.domain.returns.mapper.ReturnBonMapper;
import com.albelt.gestionstock.domain.returns.repository.ReturnBonItemRepository;
import com.albelt.gestionstock.domain.returns.repository.ReturnBonRepository;
import com.albelt.gestionstock.domain.rolls.entity.Roll;
import com.albelt.gestionstock.domain.users.entity.User;
import com.albelt.gestionstock.domain.users.service.UserService;
import com.albelt.gestionstock.domain.waste.dto.WastePieceRequest;
import com.albelt.gestionstock.domain.waste.entity.WastePiece;
import com.albelt.gestionstock.domain.waste.service.WastePieceService;
import com.albelt.gestionstock.shared.enums.MaterialType;
import com.albelt.gestionstock.shared.enums.WasteType;
import com.albelt.gestionstock.shared.exceptions.BusinessException;
import com.albelt.gestionstock.shared.exceptions.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class ReturnBonService {

    private final ReturnBonRepository returnBonRepository;
    private final ReturnBonItemRepository returnBonItemRepository;
    private final ReturnBonMapper returnBonMapper;
    private final CommandeService commandeService;
    private final CommandeItemRepository commandeItemRepository;
    private final ProductionItemRepository productionItemRepository;
    private final WastePieceService wastePieceService;
    private final UserService userService;

    public ReturnBonResponse create(ReturnBonRequest request, UUID userId) {
        log.info("Creating return bon for commande {}", request.getCommandeId());

        Commande commande = commandeService.getById(request.getCommandeId());
        assertCommandeNotLocked(commande);
        User createdBy = userService.getById(userId);

        ReturnBon bon = ReturnBon.builder()
                .commande(commande)
                .returnMode(normalizeUpper(request.getReturnMode()))
                .reason(request.getReason())
                .reasonDetails(request.getReasonDetails())
                .notes(request.getNotes())
                .createdBy(createdBy)
                .build();

        bon = returnBonRepository.save(bon);

        validateTotalReturnCoverage(bon.getReturnMode(), commande, request.getItems());

        List<ReturnBonItem> items = new ArrayList<>();
        for (ReturnBonItemRequest itemRequest : request.getItems()) {
            ReturnBonItem item = buildReturnItem(bon, itemRequest);
            items.add(item);
            createWastePiecesIfNeeded(itemRequest, item, createdBy.getId());
        }

        if (!items.isEmpty()) {
            returnBonItemRepository.saveAll(items);
            bon.setItems(items);
        }

        return returnBonMapper.toDetailsDTO(bon);
    }

    private void assertCommandeNotLocked(Commande commande) {
        String normalizedStatus = Optional.ofNullable(commande)
                .map(Commande::getStatus)
                .map(String::trim)
                .map(String::toUpperCase)
                .orElse("");
        if ("COMPLETED".equals(normalizedStatus) || "CANCELLED".equals(normalizedStatus)) {
            throw new BusinessException("Commande is locked (COMPLETED/CANCELLED) and cannot be modified");
        }
    }

    @Transactional(readOnly = true)
    public List<ReturnBonResponse> getByCommandeId(UUID commandeId) {
        return returnBonRepository.findByCommande_IdOrderByCreatedAtDesc(commandeId)
                .stream()
                .map(returnBonMapper::toDetailsDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public ReturnBonResponse getById(UUID id) {
        ReturnBon bon = returnBonRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Return bon not found: " + id));
        return returnBonMapper.toDetailsDTO(bon);
    }

    private ReturnBonItem buildReturnItem(ReturnBon bon, ReturnBonItemRequest request) {
        String returnType = normalizeUpper(request.getReturnType());
        String measureAction = request.getMeasureAction() != null ? normalizeUpper(request.getMeasureAction()) : null;

        if ("MESURE".equals(returnType) && measureAction == null) {
            throw new IllegalArgumentException("Measure action is required for MESURE returns");
        }

        CommandeItem commandeItem = commandeItemRepository.findById(request.getCommandeItemId())
                .orElseThrow(() -> new ResourceNotFoundException("Commande item not found: " + request.getCommandeItemId()));

        ProductionItem productionItem = productionItemRepository.findByIdWithSources(request.getProductionItemId())
                .orElseThrow(() -> new ResourceNotFoundException("Production item not found: " + request.getProductionItemId()));

        ensureProductionItemMatchesCommandeItem(productionItem, commandeItem);
        validateReturnQuantity(productionItem, request.getQuantity());

        if ("AJUST".equals(measureAction)) {
            validateAdjustment(request, productionItem);
            applyAdjustment(commandeItem, request);
        }

        return ReturnBonItem.builder()
                .returnBon(bon)
                .commandeItem(commandeItem)
                .productionItem(productionItem)
                .quantity(request.getQuantity())
                .returnType(returnType)
                .measureAction(measureAction)
                .adjustedWidthMm(request.getAdjustedWidthMm())
                .adjustedLengthM(request.getAdjustedLengthM())
                .build();
    }

    private void validateReturnQuantity(ProductionItem productionItem, Integer quantity) {
        if (quantity == null || quantity <= 0) {
            throw new IllegalArgumentException("Return quantity must be positive");
        }
        Integer returned = returnBonItemRepository.sumReturnedQuantityByProductionItemId(productionItem.getId());
        int alreadyReturned = returned != null ? returned : 0;
        int remaining = productionItem.getQuantity() - alreadyReturned;
        if (quantity > remaining) {
            throw new IllegalArgumentException("Return quantity exceeds remaining production quantity");
        }
    }

    private void validateAdjustment(ReturnBonItemRequest request, ProductionItem productionItem) {
        Integer adjustedWidth = request.getAdjustedWidthMm();
        BigDecimal adjustedLength = request.getAdjustedLengthM();

        if (adjustedWidth == null || adjustedLength == null) {
            throw new IllegalArgumentException("Adjusted width and length are required for AJUST");
        }
        if (adjustedWidth <= 0 || adjustedLength.compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("Adjusted dimensions must be positive");
        }

        if (adjustedWidth > productionItem.getPieceWidthMm()) {
            throw new IllegalArgumentException("Adjusted width cannot exceed original width");
        }
        if (adjustedLength.compareTo(productionItem.getPieceLengthM()) > 0) {
            throw new IllegalArgumentException("Adjusted length cannot exceed original length");
        }
    }

    private void applyAdjustment(CommandeItem commandeItem, ReturnBonItemRequest request) {
        if (request.getAdjustedWidthMm() != null) {
            commandeItem.setLargeurMm(request.getAdjustedWidthMm());
        }
        if (request.getAdjustedLengthM() != null) {
            commandeItem.setLongueurM(request.getAdjustedLengthM());
        }
        commandeItemRepository.save(commandeItem);
    }

    private void createWastePiecesIfNeeded(ReturnBonItemRequest request, ReturnBonItem item, UUID userId) {
        String returnType = item.getReturnType();
        String measureAction = item.getMeasureAction();

        boolean shouldCreateWaste = "MATIERE".equals(returnType)
                || ("MESURE".equals(returnType) && ("DECHET".equals(measureAction) || "AJUST".equals(measureAction)));

        if (!shouldCreateWaste) {
            return;
        }

        ProductionItem productionItem = item.getProductionItem();
        WasteSpec spec = buildWasteSpec(productionItem, request, measureAction);
        if (spec == null) {
            return;
        }

        for (int i = 0; i < item.getQuantity(); i++) {
            WastePieceRequest wasteRequest = buildWasteRequest(productionItem, item.getCommandeItem(), spec);
            wastePieceService.recordWaste(wasteRequest, userId);
        }
    }

    private WasteSpec buildWasteSpec(ProductionItem productionItem, ReturnBonItemRequest request, String measureAction) {
        int originalWidth = productionItem.getPieceWidthMm();
        BigDecimal originalLength = productionItem.getPieceLengthM();

        if (!"AJUST".equals(measureAction)) {
            return new WasteSpec(originalWidth, originalLength);
        }

        Integer adjustedWidth = request.getAdjustedWidthMm();
        BigDecimal adjustedLength = request.getAdjustedLengthM();
        if (adjustedWidth == null || adjustedLength == null) {
            return null;
        }

        BigDecimal originalArea = calculateAreaM2(originalWidth, originalLength);
        BigDecimal adjustedArea = calculateAreaM2(adjustedWidth, adjustedLength);
        BigDecimal diffArea = originalArea.subtract(adjustedArea);
        if (diffArea.compareTo(BigDecimal.ZERO) <= 0) {
            return null;
        }

        BigDecimal widthM = BigDecimal.valueOf(originalWidth)
                .divide(BigDecimal.valueOf(1000), 6, RoundingMode.HALF_UP);
        BigDecimal diffLength = diffArea.divide(widthM, 6, RoundingMode.HALF_UP);
        return new WasteSpec(originalWidth, diffLength.setScale(2, RoundingMode.HALF_UP));
    }

    private WastePieceRequest buildWasteRequest(ProductionItem productionItem, CommandeItem commandeItem, WasteSpec spec) {
        Roll roll = productionItem.getPlacedRectangle() != null ? productionItem.getPlacedRectangle().getRoll() : null;
        WastePiece sourceWaste = productionItem.getPlacedRectangle() != null ? productionItem.getPlacedRectangle().getWastePiece() : null;

        MaterialType materialType = roll != null ? roll.getMaterialType()
                : sourceWaste != null ? sourceWaste.getMaterialType() : null;

        Integer nbPlis = roll != null ? roll.getNbPlis() : sourceWaste != null ? sourceWaste.getNbPlis() : null;
        BigDecimal thickness = roll != null ? roll.getThicknessMm() : sourceWaste != null ? sourceWaste.getThicknessMm() : null;
        UUID colorId = roll != null && roll.getArticle().getColor() != null
                ? roll.getArticle().getColor().getId()
                : sourceWaste != null && sourceWaste.getArticle().getColor() != null ? sourceWaste.getArticle().getColor().getId() : null;
        UUID altierId = roll != null && roll.getAltier() != null
                ? roll.getAltier().getId()
                : sourceWaste != null && sourceWaste.getAltier() != null ? sourceWaste.getAltier().getId() : null;

        if (materialType == null || nbPlis == null || thickness == null) {
            throw new IllegalArgumentException("Source material specifications are required to create waste pieces");
        }

        BigDecimal areaM2 = calculateAreaM2(spec.widthMm(), spec.lengthM());

        return WastePieceRequest.builder()
                .rollId(roll != null ? roll.getId() : null)
                .parentWastePieceId(sourceWaste != null ? sourceWaste.getId() : null)
                .materialType(materialType)
                .nbPlis(nbPlis)
                .thicknessMm(thickness)
                .widthMm(spec.widthMm())
                .lengthM(spec.lengthM())
                .areaM2(areaM2)
                .wasteType(WasteType.DECHET)
                .altierID(altierId)
                .colorId(colorId)
                .commandeItemId(commandeItem.getId())
                .build();
    }

    private BigDecimal calculateAreaM2(Integer widthMm, BigDecimal lengthM) {
        BigDecimal widthM = BigDecimal.valueOf(widthMm)
                .divide(BigDecimal.valueOf(1000), 6, RoundingMode.HALF_UP);
        return widthM.multiply(lengthM).setScale(4, RoundingMode.HALF_UP);
    }

    private void ensureProductionItemMatchesCommandeItem(ProductionItem productionItem, CommandeItem commandeItem) {
        if (productionItem.getPlacedRectangle() == null || productionItem.getPlacedRectangle().getCommandeItemId() == null) {
            throw new IllegalArgumentException("Production item must be linked to a commande item");
        }
        if (!productionItem.getPlacedRectangle().getCommandeItemId().equals(commandeItem.getId())) {
            throw new IllegalArgumentException("Production item does not belong to the commande item");
        }
    }

    private void validateTotalReturnCoverage(String returnMode, Commande commande, List<ReturnBonItemRequest> items) {
        if (!"TOTAL".equals(normalizeUpper(returnMode))) {
            return;
        }

        Map<UUID, Integer> requestedByItem = new HashMap<>();
        for (ReturnBonItemRequest request : items) {
            requestedByItem.merge(request.getCommandeItemId(), request.getQuantity(), Integer::sum);
        }

        for (CommandeItem item : commande.getItems()) {
            Integer returned = returnBonItemRepository.sumReturnedQuantityByCommandeItemId(item.getId());
            int alreadyReturned = returned != null ? returned : 0;
            int remaining = item.getQuantite() - alreadyReturned;
            int requested = requestedByItem.getOrDefault(item.getId(), 0);
            if (remaining > 0 && requested != remaining) {
                throw new IllegalArgumentException("Total return must cover remaining quantity for all items");
            }
        }
    }

    private String normalizeUpper(String value) {
        if (value == null) return null;
        return value.trim().toUpperCase(Locale.ROOT);
    }

    private record WasteSpec(Integer widthMm, BigDecimal lengthM) {
    }
}
