package com.albelt.gestionstock.domain.commandes.api.controller;

import com.albelt.gestionstock.api.response.ApiResponse;
import com.albelt.gestionstock.api.response.PagedResponse;
import com.albelt.gestionstock.domain.commandes.dto.*;
import com.albelt.gestionstock.domain.commandes.entity.Commande;
import com.albelt.gestionstock.domain.commandes.entity.CommandeItem;
import com.albelt.gestionstock.domain.commandes.mapper.CommandeItemMapper;
import com.albelt.gestionstock.domain.commandes.mapper.CommandeMapper;
import com.albelt.gestionstock.domain.commandes.service.CommandeItemService;
import com.albelt.gestionstock.domain.commandes.service.CommandeService;
import com.albelt.gestionstock.domain.optimization.dto.AltierScoreResponse;
import com.albelt.gestionstock.domain.optimization.service.OptimizationService;
import com.albelt.gestionstock.domain.users.entity.User;
import com.albelt.gestionstock.domain.users.service.UserAltierService;
import com.albelt.gestionstock.shared.security.AltierSecurityContext;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

/**
 * CommandeController - REST API for order management
 */
@RestController
@RequestMapping("/api/commandes")
@RequiredArgsConstructor
@Validated
@Slf4j
public class CommandeController {

    private final CommandeService commandeService;
    private final CommandeItemService itemService;
    private final CommandeMapper commandeMapper;
    private final CommandeItemMapper itemMapper;
    private final OptimizationService optimizationService;
    private final UserAltierService userAltierService;
    private final AltierSecurityContext altierSecurityContext;

    // ==================== ORDER ENDPOINTS ====================

    /**
     * Create a new order
     * POST /api/commandes
     */
    @PostMapping
    public ResponseEntity<ApiResponse<CommandeResponse>> createOrder(@Valid @RequestBody CommandeRequest request) {
        log.info("POST /api/commandes - Create order: {}", request.getNumeroCommande());

        UUID userId = getCurrentUserId();
        Commande commande = commandeService.create(request, userId);
        CommandeResponse response = commandeMapper.toResponse(commande);

        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(response, "Order created successfully"));
    }

    /**
     * Get all orders
     * GET /api/commandes
     */
    @GetMapping
    public ResponseEntity<ApiResponse<PagedResponse<CommandeResponse>>> getAllOrders(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) UUID clientId,
            @RequestParam(required = false) String dateFrom,
            @RequestParam(required = false) String dateTo) {
        log.info("GET /api/commandes - Fetch all orders");

        UUID currentUser = getCurrentUserId();
        boolean unrestricted = altierSecurityContext.isUnrestricted(currentUser);
        var altierIds = userAltierService.getAccessibleAltiers(currentUser);

        var fromDate = parseDateStart(dateFrom);
        var toDate = parseDateEnd(dateTo);
        var result = commandeService.getAllPaged(unrestricted, altierIds, status, clientId, fromDate, toDate, search, page, size);
        var responses = commandeMapper.toResponseList(result.getContent());
        var paged = PagedResponse.<CommandeResponse>builder()
                .items(responses)
                .page(result.getNumber())
                .size(result.getSize())
                .totalElements(result.getTotalElements())
                .totalPages(result.getTotalPages())
                .build();

        return ResponseEntity.ok(ApiResponse.success(paged, "Orders retrieved successfully"));
    }

    /**
     * Get order by ID
     * GET /api/commandes/{id}
     */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<CommandeResponse>> getOrderById(@PathVariable UUID id) {
        log.info("GET /api/commandes/{} - Fetch order", id);

        Commande commande = commandeService.getById(id);
        CommandeResponse response = commandeMapper.toResponse(commande);

        return ResponseEntity.ok(ApiResponse.success(response, "Order retrieved successfully"));
    }

    /**
     * Get altiers ranked by score for fulfilling this order.
     * GET /api/commandes/{id}/altier-scores
     */
    @GetMapping("/{id}/altier-scores")
    public ResponseEntity<ApiResponse<List<AltierScoreResponse>>> getAltierScores(@PathVariable UUID id) {
        log.info("GET /api/commandes/{}/altier-scores - Rank workshops by fulfillment score", id);
        var scores = optimizationService.scoreAltiersForCommande(id);
        return ResponseEntity.ok(ApiResponse.success(scores, "Altier scores retrieved"));
    }

    /**
     * Get order by order number
     * GET /api/commandes/numero/{numeroCommande}
     */
    @GetMapping("/numero/{numeroCommande}")
    public ResponseEntity<ApiResponse<CommandeResponse>> getOrderByNumero(@PathVariable String numeroCommande) {
        log.info("GET /api/commandes/numero/{} - Fetch order", numeroCommande);

        Commande commande = commandeService.getByNumeroCommande(numeroCommande);
        CommandeResponse response = commandeMapper.toResponse(commande);

        return ResponseEntity.ok(ApiResponse.success(response, "Order retrieved successfully"));
    }

    /**
     * Get orders by client
     * GET /api/commandes/client/{clientId}
     */
    @GetMapping("/client/{clientId}")
    public ResponseEntity<ApiResponse<List<CommandeResponse>>> getOrdersByClient(@PathVariable UUID clientId) {
        log.info("GET /api/commandes/client/{} - Fetch orders", clientId);

        List<Commande> commandes = commandeService.getByClientId(clientId);
        List<CommandeResponse> responses = commandeMapper.toResponseList(commandes);

        return ResponseEntity.ok(ApiResponse.success(responses, "Orders retrieved successfully"));
    }

    /**
     * Get orders by status
     * GET /api/commandes/status/{status}
     */
    @GetMapping("/status/{status}")
    public ResponseEntity<ApiResponse<List<CommandeResponse>>> getOrdersByStatus(@PathVariable String status) {
        log.info("GET /api/commandes/status/{} - Fetch orders", status);

        List<Commande> commandes = commandeService.getByStatus(status);
        List<CommandeResponse> responses = commandeMapper.toResponseList(commandes);

        return ResponseEntity.ok(ApiResponse.success(responses, "Orders retrieved successfully"));
    }

    /**
     * Search orders by number
     * GET /api/commandes/search?q={pattern}
     */
    @GetMapping("/search")
    public ResponseEntity<ApiResponse<List<CommandeResponse>>> searchOrders(@RequestParam String q) {
        log.info("GET /api/commandes/search?q={} - Search orders", q);

        List<Commande> commandes = commandeService.searchByNumero(q);
        List<CommandeResponse> responses = commandeMapper.toResponseList(commandes);

        return ResponseEntity.ok(ApiResponse.success(responses, "Search completed successfully"));
    }

    /**
     * Update order
     * PUT /api/commandes/{id}
     */
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<CommandeResponse>> updateOrder(
            @PathVariable UUID id,
            @Valid @RequestBody CommandeRequest request) {
        log.info("PUT /api/commandes/{} - Update order", id);

        UUID userId = getCurrentUserId();
        Commande commande = commandeService.update(id, request, userId);
        CommandeResponse response = commandeMapper.toResponse(commande);

        return ResponseEntity.ok(ApiResponse.success(response, "Order updated successfully"));
    }

    /**
     * Update order status
     * PATCH /api/commandes/{id}/status
     */
    @PatchMapping("/{id}/status")
    public ResponseEntity<ApiResponse<CommandeResponse>> updateOrderStatus(
            @PathVariable UUID id,
            @RequestBody StatusUpdateRequest request) {
        log.info("PATCH /api/commandes/{}/status - Update status to {}", id, request.getStatus());

        UUID userId = getCurrentUserId();
        Commande commande = commandeService.updateStatus(id, request.getStatus(), userId);
        CommandeResponse response = commandeMapper.toResponse(commande);

        return ResponseEntity.ok(ApiResponse.success(response, "Order status updated successfully"));
    }

    /**
     * Delete order
     * DELETE /api/commandes/{id}
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteOrder(@PathVariable UUID id) {
        log.info("DELETE /api/commandes/{} - Delete order", id);

        commandeService.delete(id);
        return ResponseEntity.noContent().build();
    }

    // ==================== ITEM ENDPOINTS ====================

    /**
     * Get all items for an order
     * GET /api/commandes/{commandeId}/items
     */
    @GetMapping("/{commandeId}/items")
    public ResponseEntity<ApiResponse<List<CommandeItemResponse>>> getOrderItems(@PathVariable UUID commandeId) {
        log.info("GET /api/commandes/{}/items - Fetch items", commandeId);

        List<CommandeItem> items = itemService.getByCommandeId(commandeId);
        List<CommandeItemResponse> responses = items.stream()
                .map(itemMapper::toResponse)
                .toList();

        return ResponseEntity.ok(ApiResponse.success(responses, "Items retrieved successfully"));
    }

    /**
     * Create item for an order
     * POST /api/commandes/{commandeId}/items
     */
    @PostMapping("/{commandeId}/items")
    public ResponseEntity<ApiResponse<CommandeItemResponse>> createOrderItem(
            @PathVariable UUID commandeId,
            @Valid @RequestBody CommandeItemRequest request) {
        log.info("POST /api/commandes/{}/items - Create item", commandeId);

        Commande commande = commandeService.getById(commandeId);
        CommandeItem item = itemService.createItem(request, commande);
        CommandeItemResponse response = itemMapper.toResponse(item);

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(response, "Item created successfully"));
    }

    /**
     * Update item
     * PUT /api/commandes/items/{itemId}
     */
    @PutMapping("/items/{itemId}")
    public ResponseEntity<ApiResponse<CommandeItemResponse>> updateOrderItem(
            @PathVariable UUID itemId,
            @Valid @RequestBody CommandeItemRequest request) {
        log.info("PUT /api/commandes/items/{} - Update item", itemId);

        CommandeItem item = itemService.update(itemId, request);
        CommandeItemResponse response = itemMapper.toResponse(item);

        return ResponseEntity.ok(ApiResponse.success(response, "Item updated successfully"));
    }

    /**
     * Get item by ID
     * GET /api/commandes/items/{itemId}
     */
    @GetMapping("/items/{itemId}")
    public ResponseEntity<ApiResponse<CommandeItemResponse>> getItemById(@PathVariable UUID itemId) {
        log.info("GET /api/commandes/items/{} - Fetch item", itemId);

        CommandeItem item = itemService.getById(itemId);
        CommandeItemResponse response = itemMapper.toResponse(item);

        return ResponseEntity.ok(ApiResponse.success(response, "Item retrieved successfully"));
    }

    /**
     * Get items by movement type
     * GET /api/commandes/items/mouvement/{typeMouvement}
     */
    @GetMapping("/items/mouvement/{typeMouvement}")
    public ResponseEntity<ApiResponse<List<CommandeItemResponse>>> getItemsByMovement(@PathVariable String typeMouvement) {
        log.info("GET /api/commandes/items/mouvement/{} - Fetch items", typeMouvement);

        List<CommandeItem> items = itemService.getByTypeMouvement(typeMouvement);
        List<CommandeItemResponse> responses = items.stream()
                .map(itemMapper::toResponse)
                .toList();

        return ResponseEntity.ok(ApiResponse.success(responses, "Items retrieved successfully"));
    }

    /**
     * Update item status
     * PATCH /api/commandes/items/{itemId}/status
     */
    @PatchMapping("/items/{itemId}/status")
    public ResponseEntity<ApiResponse<CommandeItemResponse>> updateItemStatus(
            @PathVariable UUID itemId,
            @RequestBody StatusUpdateRequest request) {
        log.info("PATCH /api/commandes/items/{}/status - Update status to {}", itemId, request.getStatus());

        CommandeItem item = itemService.updateStatus(itemId, request.getStatus());
        CommandeItemResponse response = itemMapper.toResponse(item);

        return ResponseEntity.ok(ApiResponse.success(response, "Item status updated successfully"));
    }

    /**
     * Delete item
     * DELETE /api/commandes/items/{itemId}
     */
    @DeleteMapping("/items/{itemId}")
    public ResponseEntity<Void> deleteItem(@PathVariable UUID itemId) {
        log.info("DELETE /api/commandes/items/{} - Delete item", itemId);

        itemService.delete(itemId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/summary-stats")
    public ResponseEntity<ApiResponse<OrderSummaryStatsDto>> getOrderSummaryStats() {
        return ResponseEntity.ok(ApiResponse.success(commandeService.getOrderSummaryStats(), "Summary stats retrieved successfully"));
    }

    private java.time.LocalDateTime parseDateStart(String value) {
        if (value == null || value.trim().isEmpty()) return null;
        return java.time.LocalDate.parse(value.trim()).atStartOfDay();
    }

    private java.time.LocalDateTime parseDateEnd(String value) {
        if (value == null || value.trim().isEmpty()) return null;
        return java.time.LocalDate.parse(value.trim()).atTime(23, 59, 59);
    }

    // ==================== HELPER METHODS ====================

    /**
     * Get current user ID from security context
     */
    private UUID getCurrentUserId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null) {
            Object principal = auth.getPrincipal();
            if (principal instanceof UUID) {
                return (UUID) principal;
            } else if (principal instanceof String) {
                try {
                    return UUID.fromString((String) principal);
                } catch (IllegalArgumentException e) {
                    log.warn("Unable to parse principal as UUID: {}", principal);
                }
            } else if (principal instanceof User) {
                return ((User) principal).getId();
            }
        }
        throw new IllegalStateException("Cannot determine current user");
    }

    /**
     * Helper DTO for status update requests
     */
    @lombok.Data
    public static class StatusUpdateRequest {
        private String status;
    }
}
