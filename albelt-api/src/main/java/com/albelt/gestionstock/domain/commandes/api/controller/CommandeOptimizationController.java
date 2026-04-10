package com.albelt.gestionstock.domain.commandes.api.controller;

import com.albelt.gestionstock.api.response.ApiResponse;
import com.albelt.gestionstock.domain.optimization.dto.OptimizationComparisonResponse;
import com.albelt.gestionstock.domain.optimization.service.OptimizationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/commandes/items")
@RequiredArgsConstructor
@Slf4j
public class CommandeOptimizationController {

    private final OptimizationService optimizationService;

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
}
