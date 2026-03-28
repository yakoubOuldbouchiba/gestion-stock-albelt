package com.albelt.gestionstock.api.controller;

import com.albelt.gestionstock.api.response.ApiResponse;
import com.albelt.gestionstock.domain.settings.dto.MaterialChuteThresholdRequest;
import com.albelt.gestionstock.domain.settings.dto.MaterialChuteThresholdResponse;
import com.albelt.gestionstock.domain.settings.mapper.MaterialChuteThresholdMapper;
import com.albelt.gestionstock.domain.settings.service.MaterialChuteThresholdService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * REST Controller for per-material chute threshold configuration
 * Base path: /api/material-chute-thresholds
 */
@RestController
@RequestMapping("/api/material-chute-thresholds")
@RequiredArgsConstructor
@Slf4j
public class MaterialChuteThresholdController {

    private final MaterialChuteThresholdService service;
    private final MaterialChuteThresholdMapper mapper;

    @GetMapping
    public ResponseEntity<ApiResponse<List<MaterialChuteThresholdResponse>>> getAll() {
        var thresholds = service.getAll();
        return ResponseEntity.ok(ApiResponse.success(mapper.toResponseList(thresholds), "Thresholds retrieved"));
    }

    /**
     * Upsert thresholds in bulk (one row per materialType)
     */
    @PutMapping
    public ResponseEntity<ApiResponse<List<MaterialChuteThresholdResponse>>> upsertAll(
            @Valid @RequestBody List<MaterialChuteThresholdRequest> requests
    ) {
        log.info("Updating material chute thresholds: {} rows", requests == null ? 0 : requests.size());
        var updated = service.upsertAll(requests);
        return ResponseEntity.ok(ApiResponse.success(mapper.toResponseList(updated), "Thresholds updated"));
    }
}
