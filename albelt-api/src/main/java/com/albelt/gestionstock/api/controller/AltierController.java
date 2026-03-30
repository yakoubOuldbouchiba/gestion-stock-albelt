package com.albelt.gestionstock.api.controller;

import com.albelt.gestionstock.api.response.ApiResponse;
import com.albelt.gestionstock.api.response.PagedResponse;
import com.albelt.gestionstock.domain.altier.dto.AltierRequest;
import com.albelt.gestionstock.domain.altier.dto.AltierResponse;
import com.albelt.gestionstock.domain.altier.mapper.AltierMapper;
import com.albelt.gestionstock.domain.altier.service.AltierService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

/**
 * REST Controller for Altier management
 * Base path: /api/altiers
 */
@RestController
@RequestMapping("/api/altiers")
@RequiredArgsConstructor
@Slf4j
public class AltierController {

    private final AltierService altierService;
    private final AltierMapper altierMapper;

    /**
     * Create a new altier
     * POST /api/altiers
     */
    @PostMapping
    public ResponseEntity<ApiResponse<AltierResponse>> create(@Valid @RequestBody AltierRequest request) {
        log.info("Creating altier: {}", request.getLibelle());
        var altier = altierService.create(request);
        var response = altierMapper.toResponse(altier);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(response, "Altier created successfully"));
    }

    /**
     * Get all altiers
     * GET /api/altiers
     */
    @GetMapping
    public ResponseEntity<ApiResponse<PagedResponse<AltierResponse>>> getAll(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String dateFrom,
            @RequestParam(required = false) String dateTo) {
        log.debug("Fetching all altiers");
        var fromDate = parseDateStart(dateFrom);
        var toDate = parseDateEnd(dateTo);
        var altiers = altierService.getAllPaged(search, fromDate, toDate, page, size);
        var responses = altierMapper.toResponseList(altiers.getContent());
        var paged = PagedResponse.<AltierResponse>builder()
                .items(responses)
                .page(altiers.getNumber())
                .size(altiers.getSize())
                .totalElements(altiers.getTotalElements())
                .totalPages(altiers.getTotalPages())
                .build();
        return ResponseEntity.ok(ApiResponse.success(paged, "Altiers retrieved successfully"));
    }

    /**
     * Get altier by ID
     * GET /api/altiers/{id}
     */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<AltierResponse>> getById(@PathVariable UUID id) {
        log.debug("Fetching altier: {}", id);
        var altier = altierService.getById(id);
        var response = altierMapper.toResponse(altier);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    /**
     * Get altier by libelle
     * GET /api/altiers/search/libelle?libelle={libelle}
     */
    @GetMapping("/search/libelle")
    public ResponseEntity<ApiResponse<AltierResponse>> getByLibelle(@RequestParam String libelle) {
        log.debug("Searching altier by libelle: {}", libelle);
        var altier = altierService.getByLibelle(libelle);
        var response = altierMapper.toResponse(altier);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    /**
     * Update an altier
     * PUT /api/altiers/{id}
     */
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<AltierResponse>> update(
            @PathVariable UUID id,
            @Valid @RequestBody AltierRequest request) {
        log.info("Updating altier: {}", id);
        var altier = altierService.update(id, request);
        var response = altierMapper.toResponse(altier);
        return ResponseEntity.ok(ApiResponse.success(response, "Altier updated successfully"));
    }

    /**
     * Delete an altier
     * DELETE /api/altiers/{id}
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable UUID id) {
        log.info("Deleting altier: {}", id);
        altierService.delete(id);
        return ResponseEntity.ok(ApiResponse.success(null, "Altier deleted successfully"));
    }

    private java.time.LocalDateTime parseDateStart(String value) {
        if (value == null || value.trim().isEmpty()) return null;
        return java.time.LocalDate.parse(value.trim()).atStartOfDay();
    }

    private java.time.LocalDateTime parseDateEnd(String value) {
        if (value == null || value.trim().isEmpty()) return null;
        return java.time.LocalDate.parse(value.trim()).atTime(23, 59, 59);
    }
}
