package com.albelt.gestionstock.domain.commandes.api.controller;

import com.albelt.gestionstock.api.response.ApiResponse;
import com.albelt.gestionstock.domain.optimization.dto.OptimizationComparisonResponse;
import com.albelt.gestionstock.domain.optimization.service.OptimizationPrintService;
import com.albelt.gestionstock.domain.optimization.service.OptimizationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Locale;
import java.util.UUID;

@RestController
@RequestMapping("/api/commandes/items")
@RequiredArgsConstructor
@Slf4j
public class CommandeOptimizationController {

    private final OptimizationService optimizationService;
    private final OptimizationPrintService optimizationPrintService;

    @GetMapping("/{itemId}/optimization")
    public ResponseEntity<ApiResponse<OptimizationComparisonResponse>> getOptimizationComparison(
            @PathVariable UUID itemId) {
        log.info("GET /api/commandes/items/{}/optimization - Compare actual vs suggested", itemId);
        var comparison = optimizationService.getComparison(itemId, false);
        return ResponseEntity.ok(ApiResponse.success(comparison, "Optimization comparison retrieved"));
    }

    @PostMapping("/{itemId}/optimization/regenerate")
    public ResponseEntity<ApiResponse<OptimizationComparisonResponse>> regenerateOptimization(
            @PathVariable UUID itemId) {
        log.info("POST /api/commandes/items/{}/optimization/regenerate - Regenerate suggestion", itemId);
        var comparison = optimizationService.getComparison(itemId, true);
        return ResponseEntity.ok(ApiResponse.success(comparison, "Optimization suggestion regenerated"));
    }

    @GetMapping(value = "/{itemId}/optimization/print", produces = MediaType.TEXT_HTML_VALUE)
    public ResponseEntity<String> printOptimization(
            @PathVariable UUID itemId,
            @RequestParam(defaultValue = "actual") String variant,
            @RequestParam(defaultValue = "fr") String lang,
            @RequestParam(defaultValue = "false") boolean forceRegenerate) {
        log.info("GET /api/commandes/items/{}/optimization/print - Server-generated print for {}", itemId, variant);
        Locale locale = Locale.forLanguageTag(lang);
        String html = optimizationPrintService.generatePrintHtml(itemId, variant, locale, forceRegenerate);
        return ResponseEntity.ok()
            .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"optimization-" + variant + ".html\"")
            .contentType(MediaType.parseMediaType("text/html;charset=UTF-8"))
            .body(html);
    }

    /**
     * Clean, SVG-focused print with minimal whitespace
     */
    @GetMapping(value = "/{itemId}/optimization/print-simple", produces = MediaType.TEXT_HTML_VALUE)
    public ResponseEntity<String> printOptimizationSimple(
            @PathVariable UUID itemId,
            @RequestParam(defaultValue = "actual") String variant,
            @RequestParam(defaultValue = "fr") String lang,
            @RequestParam(defaultValue = "false") boolean forceRegenerate) {
        log.info("GET /api/commandes/items/{}/optimization/print-simple - Clean SVG print for {}", itemId, variant);
        Locale locale = Locale.forLanguageTag(lang);
        String html = optimizationPrintService.generateSimplePrintHtml(itemId, variant, locale, forceRegenerate);
        return ResponseEntity.ok()
            .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"optimization-" + variant + ".html\"")
            .contentType(MediaType.parseMediaType("text/html;charset=UTF-8"))
            .body(html);
    }

    @PostMapping("/{itemId}/optimization/adopt")
    public ResponseEntity<ApiResponse<Void>> adoptOptimization(
            @PathVariable UUID itemId,
            @RequestParam UUID suggestionId) {
        log.info("POST /api/commandes/items/{}/optimization/adopt?suggestionId={} - Adopting plan", itemId, suggestionId);
        optimizationService.adoptPlan(itemId, suggestionId);
        return ResponseEntity.ok(ApiResponse.success(null, "Optimization plan adopted successfully"));
    }
}
