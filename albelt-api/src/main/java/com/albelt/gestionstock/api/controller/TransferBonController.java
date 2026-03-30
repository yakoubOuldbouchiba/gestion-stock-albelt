package com.albelt.gestionstock.api.controller;

import com.albelt.gestionstock.api.response.ApiResponse;
import com.albelt.gestionstock.api.response.PagedResponse;
import com.albelt.gestionstock.domain.rolls.dto.TransferBonDTO;
import com.albelt.gestionstock.domain.rolls.service.TransferBonService;
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
 * REST Controller for Transfer Bons (Bon de Transfert)
 * Base path: /api/transfer-bons
 */
@RestController
@RequestMapping("/api/transfer-bons")
@RequiredArgsConstructor
@Slf4j
public class TransferBonController {

    private final TransferBonService transferBonService;

    @PostMapping
    public ResponseEntity<ApiResponse<TransferBonDTO>> createBon(
            @RequestParam UUID fromAltierID,
            @RequestParam UUID toAltierID,
            @RequestParam String dateSortie,
            @RequestParam(required = false) String dateEntree,
            @RequestParam UUID operatorId,
            @RequestParam(required = false) String notes
    ) {
        try {
            LocalDateTime sortieDate = parseIsoDateTime(dateSortie);
            LocalDateTime entreeDate = (dateEntree != null && !dateEntree.isEmpty()) ? parseIsoDateTime(dateEntree) : null;

            TransferBonDTO bon = transferBonService.createBon(fromAltierID, toAltierID, sortieDate, entreeDate, operatorId, notes);
            return ResponseEntity.ok(ApiResponse.success(bon, "Transfer bon created successfully"));
        } catch (Exception e) {
            log.error("Error creating transfer bon", e);
            return ResponseEntity.ok(ApiResponse.error("Failed to create transfer bon: " + e.getMessage()));
        }
    }

    @GetMapping
    public ResponseEntity<ApiResponse<PagedResponse<TransferBonDTO>>> listBons(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) UUID fromAltierId,
            @RequestParam(required = false) UUID toAltierId,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String dateFrom,
            @RequestParam(required = false) String dateTo) {
        try {
            Boolean statusEntree = parseStatusEntree(status);
            LocalDateTime fromDate = parseDateTimeStart(dateFrom);
            LocalDateTime toDate = parseDateTimeEnd(dateTo);
            var pageResult = transferBonService.listBonsPaged(fromAltierId, toAltierId, statusEntree, fromDate, toDate, search, page, size);
            var paged = PagedResponse.<TransferBonDTO>builder()
                    .items(pageResult.getContent())
                    .page(pageResult.getNumber())
                    .size(pageResult.getSize())
                    .totalElements(pageResult.getTotalElements())
                    .totalPages(pageResult.getTotalPages())
                    .build();
            return ResponseEntity.ok(ApiResponse.success(paged, "Transfer bons retrieved"));
        } catch (Exception e) {
            log.error("Error listing transfer bons", e);
            return ResponseEntity.ok(ApiResponse.error("Failed to list transfer bons: " + e.getMessage()));
        }
    }

    @GetMapping("/{bonId}")
    public ResponseEntity<ApiResponse<TransferBonDTO>> getBonDetails(@PathVariable UUID bonId) {
        try {
            return ResponseEntity.ok(ApiResponse.success(transferBonService.getBonDetails(bonId), "Transfer bon details retrieved"));
        } catch (Exception e) {
            log.error("Error getting transfer bon details", e);
            return ResponseEntity.ok(ApiResponse.error("Failed to get transfer bon: " + e.getMessage()));
        }
    }

    @PutMapping("/{bonId}")
    public ResponseEntity<ApiResponse<TransferBonDTO>> updateBon(
            @PathVariable UUID bonId,
            @RequestBody TransferBonDTO dto
    ) {
        try {
            return ResponseEntity.ok(ApiResponse.success(transferBonService.updateBon(bonId, dto), "Transfer bon updated"));
        } catch (Exception e) {
            log.error("Error updating transfer bon", e);
            return ResponseEntity.ok(ApiResponse.error("Failed to update transfer bon: " + e.getMessage()));
        }
    }

    @PostMapping("/{bonId}/confirm")
    public ResponseEntity<ApiResponse<TransferBonDTO>> confirmReceipt(
            @PathVariable UUID bonId,
            @RequestParam String dateEntree
    ) {
        try {
            LocalDateTime entreeDate = parseIsoDateTime(dateEntree);
            TransferBonDTO confirmed = transferBonService.confirmReceipt(bonId, entreeDate);
            return ResponseEntity.ok(ApiResponse.success(confirmed, "Transfer bon receipt confirmed"));
        } catch (Exception e) {
            log.error("Error confirming transfer bon receipt", e);
            return ResponseEntity.ok(ApiResponse.error("Failed to confirm transfer bon: " + e.getMessage()));
        }
    }

    @DeleteMapping("/{bonId}")
    public ResponseEntity<ApiResponse<Void>> deleteBon(@PathVariable UUID bonId) {
        try {
            transferBonService.deletePendingBon(bonId);
            return ResponseEntity.ok(ApiResponse.success(null, "Transfer bon deleted"));
        } catch (Exception e) {
            log.error("Error deleting transfer bon", e);
            return ResponseEntity.ok(ApiResponse.error("Failed to delete transfer bon: " + e.getMessage()));
        }
    }

    @DeleteMapping("/{bonId}/movements/{movementId}")
    public ResponseEntity<ApiResponse<Void>> removeMovement(
            @PathVariable UUID bonId,
            @PathVariable UUID movementId
    ) {
        try {
            transferBonService.removePendingMovement(bonId, movementId);
            return ResponseEntity.ok(ApiResponse.success(null, "Movement removed from transfer bon"));
        } catch (Exception e) {
            log.error("Error removing movement from transfer bon", e);
            return ResponseEntity.ok(ApiResponse.error("Failed to remove movement: " + e.getMessage()));
        }
    }

    private LocalDateTime parseIsoDateTime(String dateTimeStr) {
        try {
            Instant instant = Instant.parse(dateTimeStr);
            return LocalDateTime.ofInstant(instant, ZoneId.systemDefault());
        } catch (Exception e1) {
            try {
                return LocalDateTime.parse(dateTimeStr);
            } catch (Exception e2) {
                throw new IllegalArgumentException("Invalid datetime format: " + dateTimeStr, e2);
            }
        }
    }

    private Boolean parseStatusEntree(String status) {
        if (status == null || status.trim().isEmpty()) return null;
        String normalized = status.trim().toUpperCase();
        if ("RECEIVED".equals(normalized)) return true;
        if ("PENDING".equals(normalized)) return false;
        return null;
    }

    private LocalDateTime parseDateTimeStart(String value) {
        if (value == null || value.trim().isEmpty()) return null;
        return java.time.LocalDate.parse(value.trim()).atStartOfDay();
    }

    private LocalDateTime parseDateTimeEnd(String value) {
        if (value == null || value.trim().isEmpty()) return null;
        return java.time.LocalDate.parse(value.trim()).atTime(23, 59, 59);
    }
}
