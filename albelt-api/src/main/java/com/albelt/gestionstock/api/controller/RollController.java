package com.albelt.gestionstock.api.controller;

import com.albelt.gestionstock.api.response.ApiResponse;
import com.albelt.gestionstock.api.response.PagedResponse;
import com.albelt.gestionstock.domain.rolls.dto.RollRequest;
import com.albelt.gestionstock.domain.rolls.dto.RollResponse;
import com.albelt.gestionstock.domain.rolls.dto.RollStatusRequest;
import com.albelt.gestionstock.domain.rolls.service.RollService;
import com.albelt.gestionstock.domain.rolls.mapper.RollMapper;
import com.albelt.gestionstock.domain.users.service.UserAltierService;
import com.albelt.gestionstock.shared.enums.MaterialType;
import com.albelt.gestionstock.shared.enums.RollStatus;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * REST Controller for Roll management
 * Base path: /api/rolls
 * Focus on FIFO inventory operations
 */
@RestController
@RequestMapping("/api/rolls")
@RequiredArgsConstructor
@Slf4j
public class RollController {

    /**
     * Get grouped roll statistics by color, nbPlis, thicknessMm, materialType, altierId, status
     * GET /api/rolls/grouped
     */
    @GetMapping("/grouped")
    public ResponseEntity<ApiResponse<List<com.albelt.gestionstock.domain.rolls.dto.RollGroupedStatsResponse>>> getGroupedByAllFields() {
        var grouped = rollService.getGroupedByAllFields();
        return ResponseEntity.ok(ApiResponse.success(grouped));
    }

    private final RollService rollService;
    private final RollMapper rollMapper;
    private final UserAltierService userAltierService;

    /**
     * Get all rolls
     * GET /api/rolls
     * - Admin: returns all rolls
     * - Other roles: returns only rolls from assigned altiers
     */
    @GetMapping
    public ResponseEntity<ApiResponse<PagedResponse<RollResponse>>> getAll(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) RollStatus status,
            @RequestParam(required = false) UUID articleId,
            @RequestParam(required = false) MaterialType materialType,
            @RequestParam(required = false) UUID supplierId,
            @RequestParam(required = false) UUID altierId,
            @RequestParam(required = false) UUID colorId,
            @RequestParam(required = false) Integer nbPlis,
            @RequestParam(required = false) BigDecimal thicknessMm,
            @RequestParam(required = false) String dateFrom,
            @RequestParam(required = false) String dateTo) {
        UUID currentUser = (UUID) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        log.debug("Fetching rolls for user: {}", currentUser);
        
        // Get accessible altiers for current user
        var accessibleAltierIds = userAltierService.getAccessibleAltiers(currentUser);
        
        // If user has no accessible altiers, return empty list
        if (accessibleAltierIds.isEmpty()) {
            log.warn("User {} has no accessible altiers", currentUser);
            var empty = PagedResponse.<RollResponse>builder()
                    .items(List.of())
                    .page(page)
                    .size(size)
                    .totalElements(0)
                    .totalPages(0)
                    .build();
            return ResponseEntity.ok(ApiResponse.success(empty, "No accessible rolls"));
        }
        
        var fromDate = parseDate(dateFrom);
        var toDate = parseDate(dateTo);

        var rolls = rollService.getByUserAltiersPaged(
                accessibleAltierIds,
                status,
                articleId,
                materialType,
                supplierId,
                altierId,
            colorId,
            nbPlis,
            thicknessMm,
                fromDate,
                toDate,
                search,
                page,
                size
        );
        var responses = rollMapper.toResponseList(rolls.getContent());
        var paged = PagedResponse.<RollResponse>builder()
                .items(responses)
                .page(rolls.getNumber())
                .size(rolls.getSize())
                .totalElements(rolls.getTotalElements())
                .totalPages(rolls.getTotalPages())
                .build();
        return ResponseEntity.ok(ApiResponse.success(paged, "Rolls retrieved"));
    }

    /**
     * Get available rolls for a material type, scoped to the current user's accessible altiers.
     * Status is restricted to AVAILABLE/OPENED.
     * GET /api/rolls/available?articleId={articleId}
     */
    @GetMapping("/available")
    public ResponseEntity<ApiResponse<List<RollResponse>>> getAvailableByArticle(
            @RequestParam UUID articleId) {
        UUID currentUser = (UUID) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        var accessibleAltierIds = userAltierService.getAccessibleAltiers(currentUser);
        if (accessibleAltierIds.isEmpty()) {
            return ResponseEntity.ok(ApiResponse.success(List.of(), "No accessible rolls"));
        }

        var rolls = rollService.getAvailableByUserAltiersAndArticle(accessibleAltierIds, articleId);
        var responses = rollMapper.toResponseList(rolls);
        return ResponseEntity.ok(ApiResponse.success(responses, "Available rolls retrieved"));
    }

    /**
     * Get transfer source rolls for a given from-altier.
     * Returns only AVAILABLE/OPENED rolls and excludes items already reserved by a pending transfer bon.
     * GET /api/rolls/transfer-sources?fromAltierId={id}&page={page}&size={size}
     */
    @GetMapping("/transfer-sources")
    public ResponseEntity<ApiResponse<PagedResponse<RollResponse>>> getTransferSources(
            @RequestParam UUID fromAltierId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "200") int size) {
        UUID currentUser = (UUID) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        var accessibleAltierIds = userAltierService.getAccessibleAltiers(currentUser);

        if (accessibleAltierIds.isEmpty() || !accessibleAltierIds.contains(fromAltierId)) {
            var empty = PagedResponse.<RollResponse>builder()
                    .items(List.of())
                    .page(page)
                    .size(size)
                    .totalElements(0)
                    .totalPages(0)
                    .build();
            return ResponseEntity.ok(ApiResponse.success(empty, "No accessible rolls"));
        }

        var rolls = rollService.getTransferSourcesPaged(accessibleAltierIds, fromAltierId, page, size);
        var responses = rollMapper.toResponseList(rolls.getContent());
        var paged = PagedResponse.<RollResponse>builder()
                .items(responses)
                .page(rolls.getNumber())
                .size(rolls.getSize())
                .totalElements(rolls.getTotalElements())
                .totalPages(rolls.getTotalPages())
                .build();
        return ResponseEntity.ok(ApiResponse.success(paged, "Transfer source rolls retrieved"));
    }

    /**
     * Receive a new roll (stock in)
     * POST /api/rolls/receive
     */
    @PostMapping("/receive")
    public ResponseEntity<ApiResponse<RollResponse>> receive(
            @Valid @RequestBody RollRequest request) {
        log.info("Receiving roll: material={}", request.getMaterialType());
        
        // Get current user from SecurityContext (JWT token)
        var authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null) {
            log.error("No authentication found in SecurityContext!");
            throw new IllegalStateException("User not authenticated");
        }
        
        UUID currentUser = (UUID) authentication.getPrincipal();
        log.info("Roll receive request: currentUser={}, type={}", currentUser, authentication.getPrincipal().getClass().getName());
        
        var roll = rollService.receive(request, currentUser);
        var response = rollMapper.toResponse(roll);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(response, "Roll received successfully"));
    }

    /**
     * FIFO Selection - Get oldest available roll for a material
     * GET /api/rolls/fifo/select?material={material}
     */
    @GetMapping("/fifo/select")
    public ResponseEntity<ApiResponse<RollResponse>> selectByFifo(@RequestParam MaterialType material) {
        log.info("FIFO Selection for material: {}", material);
        var rollOpt = rollService.selectByFifo(material);
        
        if (rollOpt.isPresent()) {
            var response = rollMapper.toResponse(rollOpt.get());
            return ResponseEntity.ok(ApiResponse.success(response, "FIFO roll selected"));
        }
        
        return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(ApiResponse.error("No available rolls for material: " + material));
    }

    /**
     * Get FIFO queue for a material
     * GET /api/rolls/fifo/queue?material={material}
     */
    @GetMapping("/fifo/queue")
    public ResponseEntity<ApiResponse<List<RollResponse>>> getFifoQueue(@RequestParam MaterialType material) {
        log.debug("Fetching FIFO queue for material: {}", material);
        var rolls = rollService.getFifoQueue(material);
        var responses = rollMapper.toResponseList(rolls);
        return ResponseEntity.ok(ApiResponse.success(responses, "FIFO queue retrieved"));
    }

    /**
     * Find rolls by size requirement
     * GET /api/rolls/search/by-size?material={material}&area={area}
     */
    @GetMapping("/search/by-size")
    public ResponseEntity<ApiResponse<List<RollResponse>>> findBySize(
            @RequestParam MaterialType material,
            @RequestParam BigDecimal area) {
        log.debug("Finding rolls: material={}, required_area={}", material, area);
        var rolls = rollService.findRollsBySize(material, area);
        var responses = rollMapper.toResponseList(rolls);
        return ResponseEntity.ok(ApiResponse.success(responses, "Rolls retrieved"));
    }

    /**
     * Get roll by ID
     * GET /api/rolls/{id}
     */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<RollResponse>> getById(@PathVariable UUID id) {
        log.debug("Fetching roll: {}", id);
        var roll = rollService.getById(id);
        var response = rollMapper.toResponse(roll);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PostMapping("/{id}/qr-code/regenerate")
    public ResponseEntity<ApiResponse<RollResponse>> regenerateQrCode(@PathVariable UUID id) {
        log.info("Regenerating QR code for roll: {}", id);
        var roll = rollService.regenerateQrCode(id);
        var response = rollMapper.toResponse(roll);
        return ResponseEntity.ok(ApiResponse.success(response, "QR code regenerated"));
    }

    /**
     * Get all rolls by supplier
     * GET /api/rolls/supplier/{supplierId}
     */
    @GetMapping("/supplier/{supplierId}")
    public ResponseEntity<ApiResponse<List<RollResponse>>> getBySupplier(@PathVariable UUID supplierId) {
        log.debug("Fetching rolls by supplier: {}", supplierId);
        var rolls = rollService.getBySupplier(supplierId);
        var responses = rollMapper.toResponseList(rolls);
        return ResponseEntity.ok(ApiResponse.success(responses));
    }

    /**
     * Get all rolls by altier (workshop)
     * GET /api/rolls/altier/filter?altier={altierName}
     */
    @GetMapping("/altier/filter")
    public ResponseEntity<ApiResponse<List<RollResponse>>> getByAltierFilter(@RequestParam(required = false) String altier) {
        log.debug("Filtering rolls by altier: {}", altier);
        // This is a client-side filtering approach - all rolls are returned and filtered by altier name
        var rolls = rollService.getAll();
        var responses = rollMapper.toResponseList(rolls);
        return ResponseEntity.ok(ApiResponse.success(responses, "Rolls retrieved"));
    }

    /**
     * Update roll status
     * PATCH /api/rolls/{id}/status
     * Body: { "status": "AVAILABLE" }
     */
    @PatchMapping("/{id}/status")
    public ResponseEntity<ApiResponse<RollResponse>> updateStatus(
            @PathVariable UUID id,
            @RequestBody RollStatusRequest request) {
        log.info("Updating roll status: id={}, newStatus={}", id, request.getStatus());
        var roll = rollService.updateStatus(id, request.getStatus());
        var response = rollMapper.toResponse(roll);
        return ResponseEntity.ok(ApiResponse.success(response, "Roll status updated"));
    }

    /**
     * Get inventory count by material
     * GET /api/rolls/stats/count?material={material}
     */
    @GetMapping("/stats/count")
    public ResponseEntity<ApiResponse<Long>> getCountByMaterial(@RequestParam MaterialType material) {
        log.debug("Getting roll count for material: {}", material);
        long count = rollService.getCountByMaterial(material);
        return ResponseEntity.ok(ApiResponse.success(count));
    }

    /**
     * Get total available area by material
     * GET /api/rolls/stats/area?material={material}
     */
    @GetMapping("/stats/area")
    public ResponseEntity<ApiResponse<BigDecimal>> getTotalAreaByMaterial(@RequestParam MaterialType material) {
        log.debug("Getting total area for material: {}", material);
        BigDecimal area = rollService.getTotalAreaByMaterial(material);
        return ResponseEntity.ok(ApiResponse.success(area));
    }

    /**
     * Record waste consumption on a roll after cutting operation
     * POST /api/rolls/{id}/record-consumption
     * Body: { "wasteAreaM2": 2.50 }
     * 
     * Updates:
     * - Total waste area
     * - Cut count (incremented)
     * - Last processing date
     * - Status (AVAILABLE → OPENED on first cut, → EXHAUSTED at 90% waste)
     */
    @PostMapping("/{id}/record-consumption")
    public ResponseEntity<ApiResponse<RollResponse>> recordConsumption(
            @PathVariable UUID id,
            @RequestBody Map<String, BigDecimal> payload) {
        log.info("Recording consumption for roll: {}", id);
        
        BigDecimal wasteArea = payload.getOrDefault("wasteAreaM2", BigDecimal.ZERO);
        if (wasteArea == null || wasteArea.compareTo(BigDecimal.ZERO) < 0) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("wasteAreaM2 must be a non-negative value"));
        }
        
        var roll = rollService.recordConsumption(id, wasteArea);
        var response = rollMapper.toResponse(roll);
        return ResponseEntity.ok(ApiResponse.success(response, "Consumption recorded successfully"));
    }

    /**
     * Get available rolls by supplier and material type
     * Used for chute form dropdown filtering
     * GET /api/rolls/filter/by-supplier-material?supplierId={id}&material={type}
     */
    @GetMapping("/filter/by-supplier-material")
    public ResponseEntity<ApiResponse<List<RollResponse>>> getBySupplierMaterial(
            @RequestParam UUID supplierId,
            @RequestParam MaterialType material) {
        log.debug("Finding rolls: supplier={}, material={}", supplierId, material);

        var rolls = rollService.getRollsBySupplierAndMaterial(supplierId, material);
        var responses = rollMapper.toResponseList(rolls);
        return ResponseEntity.ok(ApiResponse.success(responses, "Rolls retrieved"));
    }

    /**
     * Get inventory statistics grouped by material type only
     * GET /api/rolls/stats/by-material
     */
    @GetMapping("/stats/by-material")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getStatsByMaterial() {
        log.debug("Fetching stats by material type");
        
        var stats = rollService.getStatsByMaterial();
        return ResponseEntity.ok(ApiResponse.success(stats, "Stats retrieved"));
    }

    private java.time.LocalDate parseDate(String value) {
        if (value == null || value.trim().isEmpty()) return null;
        return java.time.LocalDate.parse(value.trim());
    }
}
