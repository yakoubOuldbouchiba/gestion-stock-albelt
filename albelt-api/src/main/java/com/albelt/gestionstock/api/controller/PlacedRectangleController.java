package com.albelt.gestionstock.api.controller;

import com.albelt.gestionstock.api.response.ApiResponse;
import com.albelt.gestionstock.domain.placement.dto.PlacedRectangleRequest;
import com.albelt.gestionstock.domain.placement.dto.PlacedRectangleResponse;
import com.albelt.gestionstock.domain.placement.service.PlacedRectangleService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/placed-rectangles")
@RequiredArgsConstructor
@Slf4j
public class PlacedRectangleController {

    private final PlacedRectangleService placedRectangleService;

    @PostMapping
    public ResponseEntity<ApiResponse<PlacedRectangleResponse>> create(
            @Valid @RequestBody PlacedRectangleRequest request) {
        log.info("POST /api/placed-rectangles - Create placed rectangle");

        var placed = placedRectangleService.create(request);
        var response = placedRectangleService.toResponse(placed);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(response, "Placed rectangle created successfully"));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<PlacedRectangleResponse>> update(
            @PathVariable UUID id,
            @Valid @RequestBody PlacedRectangleRequest request) {
        log.info("PUT /api/placed-rectangles/{} - Update placed rectangle", id);

        var placed = placedRectangleService.update(id, request);
        var response = placedRectangleService.toResponse(placed);
        return ResponseEntity.ok(ApiResponse.success(response, "Placed rectangle updated successfully"));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<PlacedRectangleResponse>> getById(@PathVariable UUID id) {
        log.info("GET /api/placed-rectangles/{} - Fetch placed rectangle", id);

        var placed = placedRectangleService.getById(id);
        var response = placedRectangleService.toResponse(placed);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/by-roll/{rollId}")
    public ResponseEntity<ApiResponse<List<PlacedRectangleResponse>>> getByRollId(@PathVariable UUID rollId) {
        log.info("GET /api/placed-rectangles/by-roll/{} - Fetch placed rectangles", rollId);

        var placed = placedRectangleService.getByRollId(rollId);
        var responses = placedRectangleService.toResponseList(placed);
        return ResponseEntity.ok(ApiResponse.success(responses));
    }

    @GetMapping("/by-waste-piece/{wastePieceId}")
    public ResponseEntity<ApiResponse<List<PlacedRectangleResponse>>> getByWastePieceId(@PathVariable UUID wastePieceId) {
        log.info("GET /api/placed-rectangles/by-waste-piece/{} - Fetch placed rectangles", wastePieceId);

        var placed = placedRectangleService.getByWastePieceId(wastePieceId);
        var responses = placedRectangleService.toResponseList(placed);
        return ResponseEntity.ok(ApiResponse.success(responses));
    }

    @GetMapping("/by-commande-item/{commandeItemId}")
    public ResponseEntity<ApiResponse<List<PlacedRectangleResponse>>> getByCommandeItemId(@PathVariable UUID commandeItemId) {
        log.info("GET /api/placed-rectangles/by-commande-item/{} - Fetch placed rectangles", commandeItemId);

        var placed = placedRectangleService.getByCommandeItemId(commandeItemId);
        var responses = placedRectangleService.toResponseList(placed);
        return ResponseEntity.ok(ApiResponse.success(responses));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable UUID id) {
        log.info("DELETE /api/placed-rectangles/{} - Delete placed rectangle", id);

        placedRectangleService.delete(id);
        return ResponseEntity.ok(ApiResponse.success(null, "Placed rectangle deleted successfully"));
    }

    @DeleteMapping("/by-roll/{rollId}")
    public ResponseEntity<ApiResponse<Long>> clearByRoll(@PathVariable UUID rollId) {
        log.info("DELETE /api/placed-rectangles/by-roll/{} - Clear placed rectangles", rollId);

        long deleted = placedRectangleService.clearByRollId(rollId);
        return ResponseEntity.ok(ApiResponse.success(deleted, "Placements cleared successfully"));
    }

    @DeleteMapping("/by-waste-piece/{wastePieceId}")
    public ResponseEntity<ApiResponse<Long>> clearByWastePiece(@PathVariable UUID wastePieceId) {
        log.info("DELETE /api/placed-rectangles/by-waste-piece/{} - Clear placed rectangles", wastePieceId);

        long deleted = placedRectangleService.clearByWastePieceId(wastePieceId);
        return ResponseEntity.ok(ApiResponse.success(deleted, "Placements cleared successfully"));
    }
}
