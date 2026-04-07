package com.albelt.gestionstock.api.controller;

import com.albelt.gestionstock.api.response.ApiResponse;
import com.albelt.gestionstock.api.response.PagedResponse;
import com.albelt.gestionstock.domain.waste.dto.WastePieceGroupedStatsResponse;
import com.albelt.gestionstock.domain.waste.dto.WastePieceRequest;
import com.albelt.gestionstock.domain.waste.dto.WastePieceResponse;
import com.albelt.gestionstock.domain.waste.service.WastePieceService;
import com.albelt.gestionstock.domain.waste.mapper.WastePieceMapper;
import com.albelt.gestionstock.shared.enums.MaterialType;
import com.albelt.gestionstock.shared.enums.WasteStatus;
import com.albelt.gestionstock.shared.enums.WasteType;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

/**
 * REST Controller for Waste Piece management
 * Base path: /api/waste-pieces
 * Reuse tracking and waste analytics
 */
@RestController
@RequestMapping("/api/waste-pieces")
@RequiredArgsConstructor
@Slf4j
public class WastePieceController {

    /**
     * Get grouped waste piece statistics by color, nbPlis, thicknessMm, materialType, altierId, status
     * GET /api/waste-pieces/grouped
     */
    @GetMapping("/grouped")
    public ResponseEntity<ApiResponse<List<WastePieceGroupedStatsResponse>>> getGroupedByAllFields(@RequestParam(required = false) WasteType type) {
        var grouped = wastePieceService.getGroupedByAllFields(type);
        return ResponseEntity.ok(ApiResponse.success(grouped));
    }

    private final WastePieceService wastePieceService;
    private final WastePieceMapper wastePieceMapper;

    /**
     * Get all waste pieces (paginated)
     * GET /api/waste-pieces?page={page}&size={size}
     */
    @GetMapping
    @Transactional(readOnly = true)
    public ResponseEntity<ApiResponse<PagedResponse<WastePieceResponse>>> getAll(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) MaterialType materialType,
            @RequestParam(required = false) WasteStatus status,
            @RequestParam(required = false) UUID altierId,
            @RequestParam(required = false) String dateFrom,
            @RequestParam(required = false) String dateTo) {
        log.debug("Fetching all waste pieces: page={}, size={}", page, size);
        var fromDate = parseDateStart(dateFrom);
        var toDate = parseDateEnd(dateTo);
        var wastePieces = wastePieceService.getAllPaged(materialType, status, altierId, fromDate, toDate, search, page, size);
        var responses = wastePieceMapper.toResponseList(wastePieces.getContent());
        var paged = PagedResponse.<WastePieceResponse>builder()
                .items(responses)
                .page(wastePieces.getNumber())
                .size(wastePieces.getSize())
                .totalElements(wastePieces.getTotalElements())
                .totalPages(wastePieces.getTotalPages())
                .build();
        return ResponseEntity.ok(ApiResponse.success(paged));
    }

    /**
     * Record a new waste piece from roll processing
     * POST /api/waste-pieces
     */
    @PostMapping
    public ResponseEntity<ApiResponse<WastePieceResponse>> recordWaste(
            @RequestBody WastePieceRequest request) {
        log.info("Recording waste piece: material={}, area_m2={}", 
                 request.getMaterialType(), request.getLengthM());
        
        // Get current user from SecurityContext (JWT token)
        var authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null) {
            log.error("No authentication found in SecurityContext!");
            throw new IllegalStateException("User not authenticated");
        }
        
        UUID currentUser = (UUID) authentication.getPrincipal();
        log.info("Waste piece request: currentUser={}", currentUser);
        
        var wastePiece = wastePieceService.recordWaste(request, currentUser);
        var response = wastePieceMapper.toResponse(wastePiece);
        return ResponseEntity.ok(ApiResponse.success(response, "Waste piece recorded successfully"));
    }

    /**
     * Get waste piece by ID
     * GET /api/waste-pieces/{id}
     */
    @GetMapping("/{id}")
    @Transactional(readOnly = true)
    public ResponseEntity<ApiResponse<WastePieceResponse>> getById(@PathVariable UUID id) {
        log.debug("Fetching waste piece: {}", id);
        var wastePiece = wastePieceService.getById(id);
        var response = wastePieceMapper.toResponse(wastePiece);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    /**
     * Get waste pieces by roll ID
     * GET /api/waste-pieces/by-roll/{rollId}
     */
    @GetMapping("/by-roll/{rollId}")
    @Transactional(readOnly = true)
    public ResponseEntity<ApiResponse<List<WastePieceResponse>>> getByRollId(@PathVariable UUID rollId) {
        log.debug("Fetching waste pieces for roll: {}", rollId);
        var wastePieces = wastePieceService.getByRollId(rollId);
        var responses = wastePieceMapper.toResponseList(wastePieces);
        return ResponseEntity.ok(ApiResponse.success(responses));
    }

    /**
     * Find reuse candidate waste piece
     * GET /api/waste-pieces/reuse/find?material={material}&requiredArea={area}
     */
    @GetMapping("/reuse/find")
    @Transactional(readOnly = true)
    public ResponseEntity<ApiResponse<WastePieceResponse>> findReuseCandidate(
            @RequestParam MaterialType material,
            @RequestParam BigDecimal requiredArea) {
        log.debug("Finding reuse candidate: material={}, area={}", material, requiredArea);
        var wasteOpt = wastePieceService.findReuseCandidate(material, requiredArea);
        
        if (wasteOpt.isPresent()) {
            var response = wastePieceMapper.toResponse(wasteOpt.get());
            return ResponseEntity.ok(ApiResponse.success(response, "Reuse candidate found"));
        }
        
        return ResponseEntity.ok(ApiResponse.error("No suitable waste piece found for reuse"));
    }

    /**
     * Get large available waste pieces
     * GET /api/waste-pieces/reuse/large?page={page}&size={size}
     */
    @GetMapping("/reuse/large")
    @Transactional(readOnly = true)
    public ResponseEntity<ApiResponse<List<WastePieceResponse>>> getLargeAvailablePieces(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        log.debug("Fetching large available waste pieces");
        var wastePieces = wastePieceService.findLargeAvailablePieces(page, size);
        var responses = wastePieceMapper.toResponseList(wastePieces);
        return ResponseEntity.ok(ApiResponse.success(responses));
    }

    /**
     * Get available waste pieces by material
     * GET /api/waste-pieces/available?material={material}&page={page}&size={size}
     */
    @GetMapping("/available")
    @Transactional(readOnly = true)
    public ResponseEntity<ApiResponse<List<WastePieceResponse>>> getAvailableByMaterial(
            @RequestParam MaterialType material,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        log.debug("Fetching available waste pieces for material: {}", material);
        var wastePieces = wastePieceService.getAvailableByMaterial(material, page, size);
        var responses = wastePieceMapper.toResponseList(wastePieces);
        return ResponseEntity.ok(ApiResponse.success(responses));
    }

    /**
    * Archive waste piece
    * PATCH /api/waste-pieces/{id}/mark-scrap
     */
    @PatchMapping("/{id}/mark-scrap")
    public ResponseEntity<ApiResponse<WastePieceResponse>> markAsScrap(@PathVariable UUID id) {
        log.info("Archiving waste piece: {}", id);
        var wastePiece = wastePieceService.markAsScrap(id);
        var response = wastePieceMapper.toResponse(wastePiece);
        return ResponseEntity.ok(ApiResponse.success(response, "Waste piece archived"));
    }

    /**
     * Get waste count by status
     * GET /api/waste-pieces/stats/count?status={status}
     */
    @GetMapping("/stats/count")
    @Transactional(readOnly = true)
    public ResponseEntity<ApiResponse<Long>> countByStatus(@RequestParam WasteStatus status) {
        log.debug("Getting waste count for status: {}", status);
        long count = wastePieceService.countByStatus(status);
        return ResponseEntity.ok(ApiResponse.success(count));
    }

    /**
     * Get waste reuse efficiency
     * GET /api/waste-pieces/stats/reuse-efficiency?material={material}
     */
    @GetMapping("/stats/reuse-efficiency")
    @Transactional(readOnly = true)
    public ResponseEntity<ApiResponse<Double>> getWasteReuseEfficiency(@RequestParam MaterialType material) {
        log.debug("Calculating waste reuse efficiency for material: {}", material);
        double efficiency = wastePieceService.getWasteReuseEfficiency(material);
        return ResponseEntity.ok(ApiResponse.success(efficiency, "Reuse efficiency: " + String.format("%.2f%%", efficiency)));
    }

    /**
     * Get total waste area by material
     * GET /api/waste-pieces/stats/total-area
     */
    @GetMapping("/stats/total-area")
    @Transactional(readOnly = true)
    public ResponseEntity<ApiResponse<List<Object[]>>> getTotalWasteAreaByMaterial() {
        log.debug("Getting total waste area by material");
        var areas = wastePieceService.getTotalWasteAreaByMaterial();
        return ResponseEntity.ok(ApiResponse.success(areas));
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
