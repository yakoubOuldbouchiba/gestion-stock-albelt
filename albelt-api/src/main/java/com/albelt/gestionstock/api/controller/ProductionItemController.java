package com.albelt.gestionstock.api.controller;

import com.albelt.gestionstock.api.response.ApiResponse;
import com.albelt.gestionstock.domain.production.dto.ProductionItemRequest;
import com.albelt.gestionstock.domain.production.dto.ProductionItemResponse;
import com.albelt.gestionstock.domain.production.mapper.ProductionItemMapper;
import com.albelt.gestionstock.domain.production.service.ProductionItemService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

/**
 * REST Controller for Production Items
 * Base path: /api/production-items
 */
@RestController
@RequestMapping("/api/production-items")
@RequiredArgsConstructor
@Slf4j
public class ProductionItemController {

    private final ProductionItemService productionItemService;
    private final ProductionItemMapper productionItemMapper;

    @PostMapping
    public ResponseEntity<ApiResponse<ProductionItemResponse>> create(
            @Valid @RequestBody ProductionItemRequest request) {
        log.info("POST /api/production-items - Create production item");

        var item = productionItemService.create(request);
        var response = productionItemMapper.toResponse(item);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(response, "Production item created successfully"));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<ProductionItemResponse>> update(
            @PathVariable UUID id,
            @Valid @RequestBody ProductionItemRequest request) {
        log.info("PUT /api/production-items/{} - Update production item", id);

        var item = productionItemService.update(id, request);
        var response = productionItemMapper.toResponse(item);
        return ResponseEntity.ok(ApiResponse.success(response, "Production item updated successfully"));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<ProductionItemResponse>> getById(@PathVariable UUID id) {
        log.info("GET /api/production-items/{} - Fetch production item", id);

        var item = productionItemService.getById(id);
        var response = productionItemMapper.toResponse(item);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/by-commande-item/{commandeItemId}")
    public ResponseEntity<ApiResponse<List<ProductionItemResponse>>> getByCommandeItemId(
            @PathVariable UUID commandeItemId) {
        log.info("GET /api/production-items/by-commande-item/{} - Fetch production items", commandeItemId);

        var items = productionItemService.getByCommandeItemId(commandeItemId);
        var responses = items.stream().map(productionItemMapper::toResponse).toList();
        return ResponseEntity.ok(ApiResponse.success(responses));
    }

    @GetMapping("/by-roll/{rollId}")
    public ResponseEntity<ApiResponse<List<ProductionItemResponse>>> getByRollId(@PathVariable UUID rollId) {
        log.info("GET /api/production-items/by-roll/{} - Fetch production items", rollId);

        var items = productionItemService.getByRollId(rollId);
        var responses = items.stream().map(productionItemMapper::toResponse).toList();
        return ResponseEntity.ok(ApiResponse.success(responses));
    }

    @GetMapping("/by-waste-piece/{wastePieceId}")
    public ResponseEntity<ApiResponse<List<ProductionItemResponse>>> getByWastePieceId(
            @PathVariable UUID wastePieceId) {
        log.info("GET /api/production-items/by-waste-piece/{} - Fetch production items", wastePieceId);

        var items = productionItemService.getByWastePieceId(wastePieceId);
        var responses = items.stream().map(productionItemMapper::toResponse).toList();
        return ResponseEntity.ok(ApiResponse.success(responses));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable UUID id) {
        log.info("DELETE /api/production-items/{} - Delete production item", id);

        productionItemService.delete(id);
        return ResponseEntity.ok(ApiResponse.success(null, "Production item deleted successfully"));
    }
}
