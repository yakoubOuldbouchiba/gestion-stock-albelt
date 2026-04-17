package com.albelt.gestionstock.api.controller;

import com.albelt.gestionstock.api.response.ApiResponse;
import com.albelt.gestionstock.api.response.PagedResponse;
import com.albelt.gestionstock.domain.purchasebons.dto.PurchaseBonRequest;
import com.albelt.gestionstock.domain.purchasebons.dto.PurchaseBonResponse;
import com.albelt.gestionstock.domain.purchasebons.service.PurchaseBonService;
import com.albelt.gestionstock.shared.pdf.PdfExportService;
import com.albelt.gestionstock.shared.enums.PurchaseBonStatus;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.nio.charset.StandardCharsets;
import java.util.Locale;
import java.util.List;
import java.util.UUID;

/**
 * REST Controller for Purchase Bons (Bon d'achat)
 * Base path: /api/purchase-bons
 */
@RestController
@RequestMapping("/api/purchase-bons")
@RequiredArgsConstructor
@Slf4j
public class PurchaseBonController {

    private final PurchaseBonService purchaseBonService;
    private final PdfExportService pdfExportService;

    @PostMapping
    public ResponseEntity<ApiResponse<PurchaseBonResponse>> create(@Valid @RequestBody PurchaseBonRequest request) {
        try {
            UUID currentUser = (UUID) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
            PurchaseBonResponse created = purchaseBonService.create(request, currentUser);
            return ResponseEntity.status(HttpStatus.CREATED)
                    .body(ApiResponse.success(created, "Purchase bon created successfully"));
        } catch (Exception e) {
            log.error("Error creating purchase bon", e);
            return ResponseEntity.ok(ApiResponse.error("Failed to create purchase bon: " + e.getMessage()));
        }
    }

    @GetMapping
    public ResponseEntity<ApiResponse<PagedResponse<PurchaseBonResponse>>> list(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) PurchaseBonStatus status,
            @RequestParam(required = false) UUID supplierId,
            @RequestParam(required = false) String dateFrom,
            @RequestParam(required = false) String dateTo) {
        try {
            var fromDate = parseDate(dateFrom);
            var toDate = parseDate(dateTo);
            var result = purchaseBonService.listPaged(status, supplierId, fromDate, toDate, search, page, size);
            var paged = PagedResponse.<PurchaseBonResponse>builder()
                    .items(result.getContent())
                    .page(result.getNumber())
                    .size(result.getSize())
                    .totalElements(result.getTotalElements())
                    .totalPages(result.getTotalPages())
                    .build();
            return ResponseEntity.ok(ApiResponse.success(paged, "Purchase bons retrieved"));
        } catch (Exception e) {
            log.error("Error listing purchase bons", e);
            return ResponseEntity.ok(ApiResponse.error("Failed to list purchase bons: " + e.getMessage()));
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<PurchaseBonResponse>> getDetails(@PathVariable UUID id) {
        try {
            return ResponseEntity.ok(ApiResponse.success(purchaseBonService.getDetails(id), "Purchase bon details retrieved"));
        } catch (Exception e) {
            log.error("Error getting purchase bon details", e);
            return ResponseEntity.ok(ApiResponse.error("Failed to get purchase bon: " + e.getMessage()));
        }
    }

    @GetMapping("/{id}/pdf")
    public ResponseEntity<byte[]> downloadPdf(
            @PathVariable UUID id,
            @RequestParam(defaultValue = "fr") String lang) {
        PurchaseBonResponse bon = purchaseBonService.getDetails(id);
        Locale locale = Locale.forLanguageTag(lang);
        byte[] pdf = pdfExportService.generatePurchaseBonPdf(bon, locale);
        String filename = "purchase-bon-" + safeFileName(bon.getReference() != null ? bon.getReference() : id.toString()) + ".pdf";

        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_PDF)
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        "attachment; filename*=UTF-8''" + java.net.URLEncoder.encode(filename, StandardCharsets.UTF_8))
                .body(pdf);
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<PurchaseBonResponse>> update(
            @PathVariable UUID id,
            @Valid @RequestBody PurchaseBonRequest request
    ) {
        try {
            return ResponseEntity.ok(ApiResponse.success(purchaseBonService.update(id, request), "Purchase bon updated"));
        } catch (Exception e) {
            log.error("Error updating purchase bon", e);
            return ResponseEntity.ok(ApiResponse.error("Failed to update purchase bon: " + e.getMessage()));
        }
    }

    @PostMapping("/{id}/validate")
    public ResponseEntity<ApiResponse<PurchaseBonResponse>> validate(@PathVariable UUID id) {
        try {
            UUID currentUser = (UUID) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
            PurchaseBonResponse validated = purchaseBonService.validate(id, currentUser);
            return ResponseEntity.ok(ApiResponse.success(validated, "Purchase bon validated"));
        } catch (Exception e) {
            log.error("Error validating purchase bon", e);
            return ResponseEntity.ok(ApiResponse.error("Failed to validate purchase bon: " + e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable UUID id) {
        try {
            purchaseBonService.delete(id);
            return ResponseEntity.ok(ApiResponse.success(null, "Purchase bon deleted"));
        } catch (Exception e) {
            log.error("Error deleting purchase bon", e);
            return ResponseEntity.ok(ApiResponse.error("Failed to delete purchase bon: " + e.getMessage()));
        }
    }

    private java.time.LocalDate parseDate(String value) {
        if (value == null || value.trim().isEmpty()) return null;
        return java.time.LocalDate.parse(value.trim());
    }

    private String safeFileName(String raw) {
        return raw.replaceAll("[^a-zA-Z0-9._-]", "_");
    }
}
