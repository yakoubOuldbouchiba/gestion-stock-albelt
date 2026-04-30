package com.albelt.gestionstock.domain.commandes.service;

import com.albelt.gestionstock.domain.altier.service.AltierService;
import com.albelt.gestionstock.domain.clients.repository.ClientRepository;
import com.albelt.gestionstock.domain.commandes.dto.CommandeRequest;
import com.albelt.gestionstock.domain.commandes.dto.OrderSummaryStatsDto;
import com.albelt.gestionstock.domain.commandes.entity.Commande;
import com.albelt.gestionstock.domain.commandes.entity.CommandeItem;
import com.albelt.gestionstock.domain.commandes.mapper.CommandeMapper;
import com.albelt.gestionstock.domain.commandes.repository.CommandeItemRepository;
import com.albelt.gestionstock.domain.commandes.repository.CommandeRepository;
import com.albelt.gestionstock.domain.production.entity.ProductionItem;
import com.albelt.gestionstock.domain.production.repository.ProductionItemRepository;
import com.albelt.gestionstock.domain.users.repository.UserRepository;
import com.albelt.gestionstock.domain.waste.dto.WastePieceRequest;
import com.albelt.gestionstock.domain.waste.entity.WastePiece;
import com.albelt.gestionstock.domain.waste.service.WastePieceService;
import com.albelt.gestionstock.shared.enums.WasteType;
import com.albelt.gestionstock.shared.exceptions.BusinessException;
import com.albelt.gestionstock.shared.exceptions.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * CommandeService - Business logic for order management
 */
@Service
@Transactional
@RequiredArgsConstructor
@Slf4j
public class CommandeService {

    private final CommandeRepository commandeRepository;
    private final CommandeItemRepository itemRepository;
    private final CommandeMapper commandeMapper;
    private final ClientRepository clientRepository;
    private final UserRepository userRepository;
    private final CommandeItemService itemService;
    private final ProductionItemRepository productionItemRepository;
    private final WastePieceService wastePieceService;
    private final AltierService altierService;

    @Value("${waste.scrap-threshold-area-m2:3.0}")
    private BigDecimal scrapThresholdAreaM2;

    // ==================== COMMANDE CRUD ====================

    /**
     * Create a new order
     */
    public Commande create(CommandeRequest request, UUID userId) {
        log.info("Creating new order: {}", request.getNumeroCommande());

        // Check if order number already exists
        if (commandeRepository.existsByNumeroCommande(request.getNumeroCommande())) {
            throw new IllegalArgumentException("Order number already exists: " + request.getNumeroCommande());
        }

        // Get client and user
        var client = clientRepository.findById(request.getClientId())
                .orElseThrow(() -> new ResourceNotFoundException("Client not found: " + request.getClientId()));

        var user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + userId));

        var altier = request.getAltierId() != null ? altierService.getById(request.getAltierId()) : null;

        // Create order
        Commande commande = commandeMapper.toEntity(request, client, altier, user);

        // Save order FIRST before adding items (items reference the order)
        Commande savedCommande = commandeRepository.save(commande);

        // Add items if provided (after order is persisted)
        if (request.getItems() != null && !request.getItems().isEmpty()) {
            List<CommandeItem> items = request.getItems().stream()
                    .map((itemReq) -> itemService.createItem(itemReq, savedCommande))
                    .collect(Collectors.toList());
            savedCommande.setItems(items);
        }

        log.info("Order created successfully: {}", savedCommande.getId());
        return savedCommande;
    }

    /**
     * Get order by ID
     */
    @Transactional(readOnly = true)
    public Commande getById(UUID id) {
        log.info("Fetching order with ID: {}", id);
        return commandeRepository.findWithAllAssociationsById(id)
                .orElseThrow(() -> {
                    log.warn("Order not found: {}", id);
                    return new ResourceNotFoundException("Order not found with id: " + id);
                });
    }

    /**
     * Get order by order number
     */
    @Transactional(readOnly = true)
    public Commande getByNumeroCommande(String numeroCommande) {
        log.info("Fetching order: {}", numeroCommande);
        return commandeRepository.findByNumeroCommande(numeroCommande)
                .orElseThrow(() -> {
                    log.warn("Order not found: {}", numeroCommande);
                    return new ResourceNotFoundException("Order not found: " + numeroCommande);
                });
    }

    /**
     * Get all orders
     */
    @Transactional(readOnly = true)
    public List<Commande> getAll() {
        log.info("Fetching all orders");
        return commandeRepository.findAllOrderByCreatedAtDesc();
    }

    /**
     * Get orders with pagination and optional filters
     */
    @Transactional(readOnly = true)
    public Page<Commande> getAllPaged(String status, UUID clientId, java.time.LocalDateTime fromDate,
                                      java.time.LocalDateTime toDate, String search, int page, int size) {
        String normalizedStatus = normalizeNullable(status);
        String normalizedSearch = normalizeSearch(search);
        java.time.LocalDateTime safeFromDate = fromDate != null ? fromDate : java.time.LocalDateTime.of(1970, 1, 1, 0, 0);
        java.time.LocalDateTime safeToDate = toDate != null ? toDate : java.time.LocalDateTime.of(2100, 1, 1, 0, 0);
        var pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        return commandeRepository.findFiltered(normalizedStatus, clientId, safeFromDate, safeToDate, normalizedSearch, pageable);
    }

    /**
     * Get orders by client
     */
    @Transactional(readOnly = true)
    public List<Commande> getByClientId(UUID clientId) {
        log.info("Fetching orders for client: {}", clientId);
        return commandeRepository.findByClientId(clientId);
    }

    /**
     * Get orders by status
     */
    @Transactional(readOnly = true)
    public List<Commande> getByStatus(String status) {
        log.info("Fetching orders with status: {}", status);
        return commandeRepository.findByStatus(status);
    }

    /**
     * Search orders by number pattern
     */
    @Transactional(readOnly = true)
    public List<Commande> searchByNumero(String pattern) {
        log.info("Searching orders by pattern: {}", pattern);
        return commandeRepository.searchByNumeroPattern(pattern);
    }

    /**
     * Update order
     */
    public Commande update(UUID id, CommandeRequest request, UUID userId) {
        log.info("Updating order: {}", id);

        Commande commande = getById(id);
        assertCommandeNotLocked(commande);
        String previousStatus = commande.getStatus();

        // Update basic fields
        if (request.getAltierId() != null) {
            commande.setAltier(altierService.getById(request.getAltierId()));
        }
        if (request.getDescription() != null) {
            commande.setDescription(request.getDescription());
        }
        if (request.getNotes() != null) {
            commande.setNotes(request.getNotes());
        }
        if (request.getStatus() != null) {
            commande.setStatus(request.getStatus());
            if (isCancellationTransition(previousStatus, request.getStatus())) {
                createChutesFromProductionItems(commande, userId);
            }
            if (isCompletionTransition(previousStatus, request.getStatus())) {
                createChutesFromCompletedCommande(commande, userId);
            }
        }

        // Update user if provided
        if (userId != null) {
            var updatedBy = userRepository.findById(userId)
                    .orElseThrow(() -> new ResourceNotFoundException("User not found: " + userId));
            commande.setUpdatedBy(updatedBy);
        }

        Commande updated = commandeRepository.save(commande);
        log.info("Order updated successfully: {}", id);
        return updated;
    }

    /**
     * Delete order
     */
    public void delete(UUID id) {
        log.info("Deleting order: {}", id);

        if (!commandeRepository.existsById(id)) {
            throw new ResourceNotFoundException("Order not found: " + id);
        }

        commandeRepository.deleteById(id);
        log.info("Order deleted successfully: {}", id);
    }

    /**
     * Update order status
     */
    public Commande updateStatus(UUID id, String newStatus, UUID userId) {
        log.info("Updating order status: {} -> {}", id, newStatus);

        Commande commande = getById(id);
        assertCommandeNotLocked(commande);
        String previousStatus = commande.getStatus();


        if (isCancellationTransition(previousStatus, newStatus)) {
            createChutesFromProductionItems(commande, userId);
        }
        if (isCompletionTransition(previousStatus, newStatus)) {
            createChutesFromCompletedCommande(commande, userId);
        }

        if (userId != null) {
            var updatedBy = userRepository.findById(userId)
                    .orElseThrow(() -> new ResourceNotFoundException("User not found: " + userId));
            commande.setUpdatedBy(updatedBy);
        }
        commande.setStatus(newStatus);
        return commandeRepository.save(commande);
    }

    private void assertCommandeNotLocked(Commande commande) {
        if (commande == null) {
            return;
        }
        String status = commande.getStatus();
        if (status == null) {
            return;
        }
        String normalized = status.trim().toUpperCase();
        if ("COMPLETED".equals(normalized) || "CANCELLED".equals(normalized)) {
            throw new BusinessException("Order cannot be edited when it is COMPLETED or CANCELLED");
        }
    }

    private boolean isCancellationTransition(String previousStatus, String nextStatus) {
        if (nextStatus == null) {
            return false;
        }
        boolean isCancelled = "CANCELLED".equalsIgnoreCase(nextStatus.trim());
        boolean wasCancelled = previousStatus != null && "CANCELLED".equalsIgnoreCase(previousStatus.trim());
        return isCancelled && !wasCancelled;
    }

    private boolean isCompletionTransition(String previousStatus, String nextStatus) {
        if (nextStatus == null) {
            return false;
        }
        boolean isCompleted = "COMPLETED".equalsIgnoreCase(nextStatus.trim());
        boolean wasCompleted = previousStatus != null && "COMPLETED".equalsIgnoreCase(previousStatus.trim());
        return isCompleted && !wasCompleted;
    }

    private void createChutesFromProductionItems(Commande commande, UUID userId) {
        if (commande == null) {
            return;
        }

        List<CommandeItem> items = commande.getItems();
        if (items == null || items.isEmpty()) {
            items = itemRepository.findByCommandeId(commande.getId());
        }
        if (items == null || items.isEmpty()) {
            return;
        }

        UUID effectiveUserId = resolveWasteUserId(commande, userId);
        if (effectiveUserId == null) {
            log.warn("Skipping chute creation: no user id available for commande {}", commande.getId());
            return;
        }

        for (CommandeItem item : items) {
            List<ProductionItem> productionItems = productionItemRepository.findByCommandeItemIdWithSources(item.getId());
            if (productionItems == null || productionItems.isEmpty()) {
                continue;
            }

            for (ProductionItem productionItem : productionItems) {
                Integer quantity = productionItem.getQuantity();
                if (quantity == null || quantity <= 0) {
                    continue;
                }

                var placement = productionItem.getPlacedRectangle();
                if (placement == null) {
                    continue;
                }

                var sourceRoll = placement.getRoll();
                WastePiece sourceWaste = placement.getWastePiece();
                if (sourceRoll == null && sourceWaste == null) {
                    continue;
                }

                var materialType = sourceWaste != null ? sourceWaste.getMaterialType() : sourceRoll.getMaterialType();
                Integer nbPlis = sourceWaste != null ? sourceWaste.getNbPlis() : sourceRoll.getNbPlis();
                var thicknessMm = sourceWaste != null ? sourceWaste.getThicknessMm() : sourceRoll.getThicknessMm();
                UUID altierId = null;
                UUID colorId = null;
                String reference = null;

                if (sourceWaste != null) {
                    if (sourceWaste.getAltier() != null) {
                        altierId = sourceWaste.getAltier().getId();
                    }
                    if (sourceWaste.getArticle().getColor() != null) {
                        colorId = sourceWaste.getArticle().getColor().getId();
                    }
                    reference = sourceWaste.getReference();
                } else if (sourceRoll != null) {
                    if (sourceRoll.getAltier() != null) {
                        altierId = sourceRoll.getAltier().getId();
                    }
                    if (sourceRoll.getArticle().getColor() != null) {
                        colorId = sourceRoll.getArticle().getColor().getId();
                    }
                    reference = sourceRoll.getReference();
                }

                WastePieceRequest.WastePieceRequestBuilder requestBuilder = WastePieceRequest.builder()
                        .materialType(materialType)
                        .nbPlis(nbPlis)
                        .thicknessMm(thicknessMm)
                        .widthMm(productionItem.getPieceWidthMm())
                        .lengthM(productionItem.getPieceLengthM())
                        .areaM2(productionItem.getAreaPerPieceM2())
                    .wasteType(classifyWasteType(productionItem))
                        .altierId(altierId)
                        .colorId(colorId)
                        .reference(reference)
                        .commandeItemId(item.getId());

                if (sourceWaste != null) {
                    requestBuilder.parentWastePieceId(sourceWaste.getId());
                    if (sourceWaste.getRoll() != null) {
                        requestBuilder.rollId(sourceWaste.getRoll().getId());
                    }
                } else {
                    requestBuilder.rollId(sourceRoll.getId());
                }

                WastePieceRequest wasteRequest = requestBuilder.build();
                for (int i = 0; i < quantity; i++) {
                    wastePieceService.recordWaste(wasteRequest, effectiveUserId);
                }
            }
        }
    }

    private void createChutesFromCompletedCommande(Commande commande, UUID userId) {
        if (commande == null) {
            return;
        }

        List<CommandeItem> items = commande.getItems();
        if (items == null || items.isEmpty()) {
            items = itemRepository.findByCommandeId(commande.getId());
        }
        if (items == null || items.isEmpty()) {
            return;
        }

        UUID effectiveUserId = resolveWasteUserId(commande, userId);
        if (effectiveUserId == null) {
            log.warn("Skipping chute creation: no user id available for commande {}", commande.getId());
            return;
        }

        for (CommandeItem item : items) {
            List<ProductionItem> productionItems = productionItemRepository.findByCommandeItemIdWithSources(item.getId());
            if (productionItems == null || productionItems.isEmpty()) {
                continue;
            }

            long totalProduced = 0L;
            long nonConformingQty = 0L;
            for (ProductionItem productionItem : productionItems) {
                Integer quantity = productionItem.getQuantity();
                if (quantity == null || quantity <= 0) {
                    continue;
                }
                totalProduced += quantity;
                if (Boolean.FALSE.equals(productionItem.getGoodProduction())) {
                    nonConformingQty += quantity;
                }
            }

            long ordered = item.getQuantite() != null ? item.getQuantite() : 0L;
            long extraOver = Math.max(0L, totalProduced - ordered);
            long remainingExtra = Math.max(0L, extraOver - nonConformingQty);

            for (ProductionItem productionItem : productionItems) {
                if (!Boolean.FALSE.equals(productionItem.getGoodProduction())) {
                    continue;
                }
                Integer quantity = productionItem.getQuantity();
                if (quantity == null || quantity <= 0) {
                    continue;
                }
                createChutesFromProductionItem(productionItem, item, effectiveUserId, quantity);
            }

            if (remainingExtra > 0) {
                for (ProductionItem productionItem : productionItems) {
                    if (Boolean.FALSE.equals(productionItem.getGoodProduction())) {
                        continue;
                    }
                    Integer quantity = productionItem.getQuantity();
                    if (quantity == null || quantity <= 0) {
                        continue;
                    }
                    long toCreate = Math.min(remainingExtra, quantity.longValue());
                    if (toCreate > 0) {
                        createChutesFromProductionItem(productionItem, item, effectiveUserId, toCreate);
                        remainingExtra -= toCreate;
                        if (remainingExtra <= 0) {
                            break;
                        }
                    }
                }
            }
        }
    }

    private void createChutesFromProductionItem(
            ProductionItem productionItem,
            CommandeItem item,
            UUID effectiveUserId,
            long quantityOverride
    ) {
        if (productionItem == null || item == null || effectiveUserId == null) {
            return;
        }
        if (quantityOverride <= 0) {
            return;
        }

        var placement = productionItem.getPlacedRectangle();
        if (placement == null) {
            return;
        }

        var sourceRoll = placement.getRoll();
        WastePiece sourceWaste = placement.getWastePiece();
        if (sourceRoll == null && sourceWaste == null) {
            return;
        }

        var materialType = sourceWaste != null ? sourceWaste.getMaterialType() : sourceRoll.getMaterialType();
        Integer nbPlis = sourceWaste != null ? sourceWaste.getNbPlis() : sourceRoll.getNbPlis();
        var thicknessMm = sourceWaste != null ? sourceWaste.getThicknessMm() : sourceRoll.getThicknessMm();
        UUID altierId = null;
        UUID colorId = null;
        String reference = null;

        if (sourceWaste != null) {
            if (sourceWaste.getAltier() != null) {
                altierId = sourceWaste.getAltier().getId();
            }
            if (sourceWaste.getArticle().getColor() != null) {
                colorId = sourceWaste.getArticle().getColor().getId();
            }
            reference = sourceWaste.getReference();
        } else if (sourceRoll != null) {
            if (sourceRoll.getAltier() != null) {
                altierId = sourceRoll.getAltier().getId();
            }
            if (sourceRoll.getArticle().getColor() != null) {
                colorId = sourceRoll.getArticle().getColor().getId();
            }
            reference = sourceRoll.getReference();
        }

        WastePieceRequest.WastePieceRequestBuilder requestBuilder = WastePieceRequest.builder()
                .materialType(materialType)
                .nbPlis(nbPlis)
                .thicknessMm(thicknessMm)
                .widthMm(productionItem.getPieceWidthMm())
                .lengthM(productionItem.getPieceLengthM())
                .areaM2(productionItem.getAreaPerPieceM2())
                .wasteType(classifyWasteType(productionItem))
                .altierId(altierId)
                .colorId(colorId)
                .reference(reference)
                .commandeItemId(item.getId());

        if (sourceWaste != null) {
            requestBuilder.parentWastePieceId(sourceWaste.getId());
            if (sourceWaste.getRoll() != null) {
                requestBuilder.rollId(sourceWaste.getRoll().getId());
            }
        } else {
            requestBuilder.rollId(sourceRoll.getId());
        }

        WastePieceRequest wasteRequest = requestBuilder.build();
        for (long i = 0; i < quantityOverride; i++) {
            wastePieceService.recordWaste(wasteRequest, effectiveUserId);
        }
    }

    private UUID resolveWasteUserId(Commande commande, UUID userId) {
        if (userId != null) {
            return userId;
        }
        if (commande.getUpdatedBy() != null) {
            return commande.getUpdatedBy().getId();
        }
        if (commande.getCreatedBy() != null) {
            return commande.getCreatedBy().getId();
        }
        return null;
    }

    private WasteType classifyWasteType(ProductionItem productionItem) {
        if (productionItem == null) {
            return WasteType.DECHET;
        }

        BigDecimal area = productionItem.getAreaPerPieceM2();
        if (area == null) {
            Integer widthMm = productionItem.getPieceWidthMm();
            BigDecimal lengthM = productionItem.getPieceLengthM();
            if (widthMm != null && lengthM != null) {
                area = BigDecimal.valueOf(widthMm)
                        .divide(BigDecimal.valueOf(1000), 6, java.math.RoundingMode.HALF_UP)
                        .multiply(lengthM);
            }
        }

        if (area == null || scrapThresholdAreaM2 == null) {
            return WasteType.DECHET;
        }

        return area.compareTo(scrapThresholdAreaM2) >= 0
                ? WasteType.CHUTE_EXPLOITABLE
                : WasteType.DECHET;
    }

    private String normalizeNullable(String value) {
        if (value == null) return null;
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    private String normalizeSearch(String value) {
        if (value == null) return "";
        String trimmed = value.trim();
        return trimmed.isEmpty() ? "" : trimmed.toLowerCase();
    }

    public OrderSummaryStatsDto getOrderSummaryStats() {
        long totals = commandeRepository.count();
        long waitingItems = commandeRepository.countByStatus("PENDING");
        long cuttingItems = commandeRepository.countByStatus("ENCOURS");
        long completedItems = commandeRepository.countByStatus("COMPLETED");
        long cancelled  = commandeRepository.countByStatus("CANCELLED");
        long activeOrders = totals - completedItems - cancelled ;
        return new OrderSummaryStatsDto(activeOrders, waitingItems, cuttingItems, completedItems);
    }
}
