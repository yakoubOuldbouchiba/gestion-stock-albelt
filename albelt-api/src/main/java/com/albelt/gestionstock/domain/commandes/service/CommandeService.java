package com.albelt.gestionstock.domain.commandes.service;

import com.albelt.gestionstock.shared.exceptions.ResourceNotFoundException;
import com.albelt.gestionstock.domain.commandes.dto.*;
import com.albelt.gestionstock.domain.commandes.entity.*;
import com.albelt.gestionstock.domain.commandes.mapper.CommandeMapper;
import com.albelt.gestionstock.domain.commandes.repository.*;
import com.albelt.gestionstock.domain.clients.repository.ClientRepository;
import com.albelt.gestionstock.domain.users.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

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

        // Create order
        Commande commande = commandeMapper.toEntity(request, client, user);

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
        return commandeRepository.findById(id)
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

        // Update basic fields
        if (request.getDescription() != null) {
            commande.setDescription(request.getDescription());
        }
        if (request.getNotes() != null) {
            commande.setNotes(request.getNotes());
        }
        if (request.getStatus() != null) {
            commande.setStatus(request.getStatus());
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
        commande.setStatus(newStatus);

        if (userId != null) {
            var updatedBy = userRepository.findById(userId)
                    .orElseThrow(() -> new ResourceNotFoundException("User not found: " + userId));
            commande.setUpdatedBy(updatedBy);
        }

        return commandeRepository.save(commande);
    }
}
