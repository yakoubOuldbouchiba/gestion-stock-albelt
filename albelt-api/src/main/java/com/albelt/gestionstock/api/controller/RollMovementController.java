package com.albelt.gestionstock.api.controller;

import com.albelt.gestionstock.domain.rolls.dto.RollMovementDTO;
import com.albelt.gestionstock.domain.rolls.service.RollMovementService;
import com.albelt.gestionstock.api.response.ApiResponse;
import com.albelt.gestionstock.api.response.PagedResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.List;
import java.util.UUID;

/**
 * REST Controller for Roll Movement Operations
 * Base path: /api/roll-movements
 */
@RestController
@RequestMapping("/api/roll-movements")
@RequiredArgsConstructor
@Slf4j
public class RollMovementController {

    private final RollMovementService rollMovementService;

    /**
     * Record a new roll movement
     * POST /api/roll-movements
     */
    @PostMapping
    public ResponseEntity<ApiResponse<RollMovementDTO>> recordMovement(
            @RequestParam(required = false) UUID rollId,
            @RequestParam(required = false) UUID wastePieceId,
            @RequestParam(required = false) UUID fromAltierID,
            @RequestParam UUID toAltierID,
            @RequestParam String dateSortie,
            @RequestParam(required = false) String dateEntree,
            @RequestParam(required = false) String reason,
            @RequestParam UUID operatorId,
            @RequestParam(required = false) String notes,
            @RequestParam(required = false) UUID transferBonId
    ) {
        log.info("Recording movement for item {} from {} to {}",
                rollId != null ? rollId : wastePieceId, fromAltierID, toAltierID);
        
        try {
            if ((rollId == null && wastePieceId == null) || (rollId != null && wastePieceId != null)) {
                return ResponseEntity.ok(ApiResponse.error("Provide exactly one of rollId or wastePieceId"));
            }

            // Parse ISO 8601 datetime strings (with timezone)
            LocalDateTime sortieDate = parseIsoDateTime(dateSortie);
            LocalDateTime entreeDate = dateEntree != null && !dateEntree.isEmpty() ? parseIsoDateTime(dateEntree) : null;
            
            RollMovementDTO movement = rollMovementService.recordMovement(
                    rollId, wastePieceId, fromAltierID, toAltierID, sortieDate, entreeDate,
                    reason, operatorId, notes, transferBonId
            );
            return ResponseEntity.ok(ApiResponse.success(movement, "Roll movement recorded successfully"));
        } catch (Exception e) {
            log.error("Error recording movement", e);
            return ResponseEntity.ok(ApiResponse.error("Failed to record movement: " + e.getMessage()));
        }
    }

    /**
     * Parse ISO 8601 datetime string (with optional timezone)
     */
    private LocalDateTime parseIsoDateTime(String dateTimeStr) {
        try {
            // Try parsing as Instant first (handles timezone info like 'Z')
            Instant instant = Instant.parse(dateTimeStr);
            return LocalDateTime.ofInstant(instant, ZoneId.systemDefault());
        } catch (Exception e1) {
            try {
                // Fallback to LocalDateTime parsing if no timezone
                return LocalDateTime.parse(dateTimeStr);
            } catch (Exception e2) {
                throw new IllegalArgumentException("Invalid datetime format: " + dateTimeStr, e2);
            }
        }
    }

    /**
     * Get movement history for a roll
     * GET /api/roll-movements/roll/{rollId}/history
     */
    @GetMapping("/roll/{rollId}/history")
        public ResponseEntity<ApiResponse<PagedResponse<RollMovementDTO>>> getRollMovementHistory(
            @PathVariable UUID rollId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
        ) {
        log.info("Fetching movement history for roll: {}", rollId);
        
        try {
            var history = rollMovementService.getRollMovementHistoryPaged(rollId, page, size);
            var paged = PagedResponse.<RollMovementDTO>builder()
                .items(history.getContent())
                .page(history.getNumber())
                .size(history.getSize())
                .totalElements(history.getTotalElements())
                .totalPages(history.getTotalPages())
                .build();
            return ResponseEntity.ok(ApiResponse.success(paged, "Movement history retrieved"));
        } catch (Exception e) {
            log.error("Error fetching movement history", e);
            return ResponseEntity.ok(ApiResponse.error("Failed to fetch movement history: " + e.getMessage()));
        }
    }

    /**
     * Get current location of a roll
     * GET /api/roll-movements/roll/{rollId}/current-location
     */
    @GetMapping("/roll/{rollId}/current-location")
    public ResponseEntity<ApiResponse<RollMovementDTO>> getCurrentLocation(
            @PathVariable UUID rollId
    ) {
        log.info("Fetching current location for roll: {}", rollId);
        
        try {
            RollMovementDTO location = rollMovementService.getCurrentLocation(rollId);
            if (location != null) {
                return ResponseEntity.ok(ApiResponse.success(location, "Current location retrieved"));
            } else {
                return ResponseEntity.ok(ApiResponse.error("No movements found for roll"));
            }
        } catch (Exception e) {
            log.error("Error fetching current location", e);
            return ResponseEntity.ok(ApiResponse.error("Failed to fetch current location: " + e.getMessage()));
        }
    }

    /**
     * Get movement history for a waste piece
     * GET /api/roll-movements/waste-piece/{wastePieceId}/history
     */
    @GetMapping("/waste-piece/{wastePieceId}/history")
    public ResponseEntity<ApiResponse<PagedResponse<RollMovementDTO>>> getWastePieceMovementHistory(
            @PathVariable UUID wastePieceId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        log.info("Fetching movement history for waste piece: {}", wastePieceId);

        try {
            var history = rollMovementService.getWastePieceMovementHistoryPaged(wastePieceId, page, size);
            var paged = PagedResponse.<RollMovementDTO>builder()
                .items(history.getContent())
                .page(history.getNumber())
                .size(history.getSize())
                .totalElements(history.getTotalElements())
                .totalPages(history.getTotalPages())
                .build();
            return ResponseEntity.ok(ApiResponse.success(paged, "Movement history retrieved"));
        } catch (Exception e) {
            log.error("Error fetching movement history", e);
            return ResponseEntity.ok(ApiResponse.error("Failed to fetch movement history: " + e.getMessage()));
        }
    }

    /**
     * Get current location of a waste piece
     * GET /api/roll-movements/waste-piece/{wastePieceId}/current-location
     */
    @GetMapping("/waste-piece/{wastePieceId}/current-location")
    public ResponseEntity<ApiResponse<RollMovementDTO>> getCurrentWastePieceLocation(
            @PathVariable UUID wastePieceId
    ) {
        log.info("Fetching current location for waste piece: {}", wastePieceId);

        try {
            RollMovementDTO location = rollMovementService.getCurrentWastePieceLocation(wastePieceId);
            if (location != null) {
                return ResponseEntity.ok(ApiResponse.success(location, "Current location retrieved"));
            } else {
                return ResponseEntity.ok(ApiResponse.error("No movements found for waste piece"));
            }
        } catch (Exception e) {
            log.error("Error fetching current location", e);
            return ResponseEntity.ok(ApiResponse.error("Failed to fetch current location: " + e.getMessage()));
        }
    }

    /**
     * Get movements to a specific altier
     * GET /api/roll-movements/altier/{altierID}/incoming
     */
    @GetMapping("/altier/{altierID}/incoming")
        public ResponseEntity<ApiResponse<PagedResponse<RollMovementDTO>>> getMovementsToAltier(
            @PathVariable UUID altierID,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
        ) {
        log.info("Fetching incoming movements for altier: {}", altierID);
        
        try {
            var movements = rollMovementService.getMovementsToAltierPaged(altierID, page, size);
            var paged = PagedResponse.<RollMovementDTO>builder()
                .items(movements.getContent())
                .page(movements.getNumber())
                .size(movements.getSize())
                .totalElements(movements.getTotalElements())
                .totalPages(movements.getTotalPages())
                .build();
            return ResponseEntity.ok(ApiResponse.success(paged, "Incoming movements retrieved"));
        } catch (Exception e) {
            log.error("Error fetching incoming movements", e);
            return ResponseEntity.ok(ApiResponse.error("Failed to fetch incoming movements: " + e.getMessage()));
        }
    }

    /**
     * Get movements from a specific altier
     * GET /api/roll-movements/altier/{altierID}/outgoing
     */
    @GetMapping("/altier/{altierID}/outgoing")
        public ResponseEntity<ApiResponse<PagedResponse<RollMovementDTO>>> getMovementsFromAltier(
            @PathVariable UUID altierID,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
        ) {
        log.info("Fetching outgoing movements for altier: {}", altierID);
        
        try {
            var movements = rollMovementService.getMovementsFromAltierPaged(altierID, page, size);
            var paged = PagedResponse.<RollMovementDTO>builder()
                .items(movements.getContent())
                .page(movements.getNumber())
                .size(movements.getSize())
                .totalElements(movements.getTotalElements())
                .totalPages(movements.getTotalPages())
                .build();
            return ResponseEntity.ok(ApiResponse.success(paged, "Outgoing movements retrieved"));
        } catch (Exception e) {
            log.error("Error fetching outgoing movements", e);
            return ResponseEntity.ok(ApiResponse.error("Failed to fetch outgoing movements: " + e.getMessage()));
        }
    }

    /**
     * Get movements recorded by an operator
     * GET /api/roll-movements/operator/{operatorId}
     */
    @GetMapping("/operator/{operatorId}")
        public ResponseEntity<ApiResponse<PagedResponse<RollMovementDTO>>> getOperatorMovements(
            @PathVariable UUID operatorId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
        ) {
        log.info("Fetching movements for operator: {}", operatorId);
        
        try {
            var movements = rollMovementService.getOperatorMovementsPaged(operatorId, page, size);
            var paged = PagedResponse.<RollMovementDTO>builder()
                .items(movements.getContent())
                .page(movements.getNumber())
                .size(movements.getSize())
                .totalElements(movements.getTotalElements())
                .totalPages(movements.getTotalPages())
                .build();
            return ResponseEntity.ok(ApiResponse.success(paged, "Operator movements retrieved"));
        } catch (Exception e) {
            log.error("Error fetching operator movements", e);
            return ResponseEntity.ok(ApiResponse.error("Failed to fetch operator movements: " + e.getMessage()));
        }
    }

    /**
     * Update movement record
     * PUT /api/roll-movements/{movementId}
     */
    @PutMapping("/{movementId}")
    public ResponseEntity<ApiResponse<RollMovementDTO>> updateMovement(
            @PathVariable UUID movementId,
            @RequestBody RollMovementDTO dto
    ) {
        log.info("Updating movement: {}", movementId);
        
        try {
            RollMovementDTO updated = rollMovementService.updateMovement(movementId, dto);
            return ResponseEntity.ok(ApiResponse.success(updated, "Movement updated successfully"));
        } catch (Exception e) {
            log.error("Error updating movement", e);
            return ResponseEntity.ok(ApiResponse.error("Failed to update movement: " + e.getMessage()));
        }
    }

    /**
     * Confirm receipt of a movement (set entry date)
     * POST /api/roll-movements/{movementId}/confirm
     */
    @PostMapping("/{movementId}/confirm")
    public ResponseEntity<ApiResponse<RollMovementDTO>> confirmReceipt(
            @PathVariable UUID movementId,
            @RequestParam String dateEntree
    ) {
        log.info("Confirming receipt for movement: {} with dateEntree: {}", movementId, dateEntree);
        
        try {
            // Parse ISO 8601 datetime string (with optional timezone)
            LocalDateTime entreeDate = parseIsoDateTime(dateEntree);
            
            RollMovementDTO confirmed = rollMovementService.confirmReceipt(movementId, entreeDate);
            return ResponseEntity.ok(ApiResponse.success(confirmed, "Receipt confirmed successfully"));
        } catch (Exception e) {
            log.error("Error confirming receipt", e);
            return ResponseEntity.ok(ApiResponse.error("Failed to confirm receipt: " + e.getMessage()));
        }
    }

    /**
     * Get pending receipts for a specific altier
     * GET /api/roll-movements/altier/{altierID}/pending-receipts
     */
    @GetMapping("/altier/{altierID}/pending-receipts")
        public ResponseEntity<ApiResponse<PagedResponse<RollMovementDTO>>> getPendingReceiptsByAltier(
            @PathVariable UUID altierID,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
        ) {
        log.info("Fetching pending receipts for altier: {}", altierID);
        
        try {
            var movements = rollMovementService.getPendingReceiptsByAltierPaged(altierID, page, size);
            var paged = PagedResponse.<RollMovementDTO>builder()
                .items(movements.getContent())
                .page(movements.getNumber())
                .size(movements.getSize())
                .totalElements(movements.getTotalElements())
                .totalPages(movements.getTotalPages())
                .build();
            return ResponseEntity.ok(ApiResponse.success(paged, "Pending receipts retrieved"));
        } catch (Exception e) {
            log.error("Error fetching pending receipts", e);
            return ResponseEntity.ok(ApiResponse.error("Failed to fetch pending receipts: " + e.getMessage()));
        }
    }

    /**
     * Get all pending receipts (admin only)
     * GET /api/roll-movements/pending-receipts
     */
    @GetMapping("/pending-receipts")
    public ResponseEntity<ApiResponse<PagedResponse<RollMovementDTO>>> getAllPendingReceipts(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        log.info("Fetching all pending receipts");
        
        try {
            var movements = rollMovementService.getAllPendingReceiptsPaged(page, size);
            var paged = PagedResponse.<RollMovementDTO>builder()
                    .items(movements.getContent())
                    .page(movements.getNumber())
                    .size(movements.getSize())
                    .totalElements(movements.getTotalElements())
                    .totalPages(movements.getTotalPages())
                    .build();
            return ResponseEntity.ok(ApiResponse.success(paged, "All pending receipts retrieved"));
        } catch (Exception e) {
            log.error("Error fetching all pending receipts", e);
            return ResponseEntity.ok(ApiResponse.error("Failed to fetch pending receipts: " + e.getMessage()));
        }
    }

    /**
     * Delete movement record
     * DELETE /api/roll-movements/{movementId}
     */
    @DeleteMapping("/{movementId}")
    public ResponseEntity<ApiResponse<Void>> deleteMovement(
            @PathVariable UUID movementId
    ) {
        log.info("Deleting movement: {}", movementId);
        
        try {
            rollMovementService.deleteMovement(movementId);
            return ResponseEntity.ok(ApiResponse.success(null, "Movement deleted successfully"));
        } catch (Exception e) {
            log.error("Error deleting movement", e);
            return ResponseEntity.ok(ApiResponse.error("Failed to delete movement: " + e.getMessage()));
        }
    }
}
