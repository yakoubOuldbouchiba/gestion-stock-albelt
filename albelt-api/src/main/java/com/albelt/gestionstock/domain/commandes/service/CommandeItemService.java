package com.albelt.gestionstock.domain.commandes.service;

import com.albelt.gestionstock.shared.exceptions.ResourceNotFoundException;
import com.albelt.gestionstock.shared.exceptions.BusinessException;
import com.albelt.gestionstock.domain.commandes.dto.*;
import com.albelt.gestionstock.domain.commandes.entity.*;
import com.albelt.gestionstock.domain.commandes.mapper.CommandeItemMapper;
import com.albelt.gestionstock.domain.commandes.repository.*;
import com.albelt.gestionstock.domain.colors.entity.Color;
import com.albelt.gestionstock.domain.colors.service.ColorService;
import com.albelt.gestionstock.domain.optimization.service.OptimizationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * CommandeItemService - Business logic for order line items
 */
@Service
@Transactional
@RequiredArgsConstructor
@Slf4j
public class CommandeItemService {

    private final CommandeItemRepository itemRepository;
    private final CommandeItemMapper itemMapper;
    private final ColorService colorService;
    private final OptimizationService optimizationService;

    // ==================== ITEM CRUD ====================

    /**
     * Create a new order item
     */
    public CommandeItem createItem(CommandeItemRequest request, Commande commande) {
        log.info("Creating new order item for order: {} with line: {}", commande.getId(), request.getLineNumber());

        assertCommandeNotLocked(commande);

        CommandeItem item = itemMapper.toEntity(request, commande);

        if (request.getColorId() != null) {
            Color color = colorService.getById(request.getColorId());
            item.setColor(color);
        }

        CommandeItem saved = itemRepository.save(item);

        try {
            optimizationService.generateAndSaveSuggestion(saved);
        } catch (Exception e) {
            log.warn("Optimization suggestion generation failed for item {}: {}", saved.getId(), e.getMessage());
        }

        log.info("Order item created successfully: {}", saved.getId());
        return saved;
    }

    /**
     * Get order item by ID
     */
    @Transactional(readOnly = true)
    public CommandeItem getById(UUID id) {
        log.info("Fetching order item with ID: {}", id);
        return itemRepository.findById(id)
                .orElseThrow(() -> {
                    log.warn("Order item not found: {}", id);
                    return new ResourceNotFoundException("Order item not found with id: " + id);
                });
    }

    /**
     * Get all items for an order
     */
    @Transactional(readOnly = true)
    public List<CommandeItem> getByCommandeId(UUID commandeId) {
        log.info("Fetching items for order: {}", commandeId);
        return itemRepository.findByCommandeId(commandeId);
    }

    /**
     * Get items by movement type
     */
    @Transactional(readOnly = true)
    public List<CommandeItem> getByTypeMouvement(String typeMouvement) {
        log.info("Fetching items with movement type: {}", typeMouvement);
        return itemRepository.findByTypeMouvement(typeMouvement);
    }

    /**
     * Get items by status
     */
    @Transactional(readOnly = true)
    public List<CommandeItem> getByStatus(String status) {
        log.info("Fetching items with status: {}", status);
        return itemRepository.findByStatus(status);
    }

    /**
     * Get items by material type
     */
    @Transactional(readOnly = true)
    public List<CommandeItem> getByMaterialType(String materialType) {
        log.info("Fetching items with material type: {}", materialType);
        return itemRepository.findByMaterialType(materialType);
    }

    /**
     * Update order item
     */
    public CommandeItem update(UUID id, CommandeItemRequest request) {
        log.info("Updating order item: {}", id);

        CommandeItem item = getById(id);
        assertCommandeNotLocked(item.getCommande());

        // Update fields
        if (request.getMaterialType() != null) {
            item.setMaterialType(request.getMaterialType());
        }
        if (request.getNbPlis() != null) {
            item.setNbPlis(request.getNbPlis());
        }
        if (request.getThicknessMm() != null) {
            item.setThicknessMm(request.getThicknessMm());
        }
        if (request.getLongueurM() != null) {
            item.setLongueurM(request.getLongueurM());
        }
        if (request.getLongueurToleranceM() != null) {
            item.setLongueurToleranceM(request.getLongueurToleranceM());
        }
        if (request.getLargeurMm() != null) {
            item.setLargeurMm(request.getLargeurMm());
        }
        if (request.getQuantite() != null) {
            item.setQuantite(request.getQuantite());
        }
        if (request.getSurfaceConsommeeM2() != null) {
            item.setSurfaceConsommeeM2(request.getSurfaceConsommeeM2());
        }
        if (request.getTypeMouvement() != null) {
            item.setTypeMouvement(request.getTypeMouvement());
        }
        if (request.getObservations() != null) {
            item.setObservations(request.getObservations());
        }
        if (request.getReference() != null) {
            item.setReference(request.getReference());
        }
        if (request.getColorId() != null) {
            Color color = colorService.getById(request.getColorId());
            item.setColor(color);
        }

        CommandeItem updated = itemRepository.save(item);
        try {
            optimizationService.generateAndSaveSuggestion(updated);
        } catch (Exception e) {
            log.warn("Optimization suggestion generation failed for item {}: {}", updated.getId(), e.getMessage());
        }
        log.info("Order item updated successfully: {}", id);
        return updated;
    }

    /**
     * Update item status
     */
    public CommandeItem updateStatus(UUID id, String newStatus) {
        log.info("Updating item status: {} -> {}", id, newStatus);

        CommandeItem item = getById(id);
        assertCommandeNotLocked(item.getCommande());
        item.setStatus(newStatus);

        return itemRepository.save(item);
    }

    /**
     * Delete order item
     */
    public void delete(UUID id) {
        log.info("Deleting order item: {}", id);

        CommandeItem item = getById(id);
        assertCommandeNotLocked(item.getCommande());
        itemRepository.delete(item);
        log.info("Order item deleted successfully: {}", id);
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

    /**
     * Delete all items for an order
     */
    public void deleteByCommandeId(UUID commandeId) {
        log.info("Deleting all items for order: {}", commandeId);

        List<CommandeItem> items = getByCommandeId(commandeId);
        itemRepository.deleteAll(items);

        log.info("All items deleted for order: {}", commandeId);
    }
}
