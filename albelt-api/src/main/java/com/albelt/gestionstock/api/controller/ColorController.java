package com.albelt.gestionstock.api.controller;

import com.albelt.gestionstock.api.response.ApiResponse;
import com.albelt.gestionstock.domain.colors.dto.ColorRequest;
import com.albelt.gestionstock.domain.colors.dto.ColorResponse;
import com.albelt.gestionstock.domain.colors.mapper.ColorMapper;
import com.albelt.gestionstock.domain.colors.service.ColorService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

/**
 * REST Controller for color configuration
 * Base path: /api/colors
 */
@RestController
@RequestMapping("/api/colors")
@RequiredArgsConstructor
@Slf4j
public class ColorController {

    private final ColorService colorService;
    private final ColorMapper colorMapper;

    /**
     * Create a new color
     * POST /api/colors
     */
    @PostMapping
    public ResponseEntity<ApiResponse<ColorResponse>> create(@Valid @RequestBody ColorRequest request) {
        log.info("Creating color: {}", request.getName());
        var color = colorService.create(request);
        var response = colorMapper.toResponse(color);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(response, "Color created successfully"));
    }

    /**
     * Get all colors
     * GET /api/colors
     */
    @GetMapping
    public ResponseEntity<ApiResponse<List<ColorResponse>>> getAll() {
        var colors = colorService.getAll();
        var responses = colorMapper.toResponseList(colors);
        return ResponseEntity.ok(ApiResponse.success(responses, "Colors retrieved"));
    }

    /**
     * Get color by ID
     * GET /api/colors/{id}
     */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<ColorResponse>> getById(@PathVariable UUID id) {
        var color = colorService.getById(id);
        var response = colorMapper.toResponse(color);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    /**
     * Get color by name
     * GET /api/colors/search/name?name={name}
     */
    @GetMapping("/search/name")
    public ResponseEntity<ApiResponse<ColorResponse>> getByName(@RequestParam String name) {
        var color = colorService.getByName(name);
        var response = colorMapper.toResponse(color);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    /**
     * Update color
     * PUT /api/colors/{id}
     */
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<ColorResponse>> update(
            @PathVariable UUID id,
            @Valid @RequestBody ColorRequest request) {
        var color = colorService.update(id, request);
        var response = colorMapper.toResponse(color);
        return ResponseEntity.ok(ApiResponse.success(response, "Color updated successfully"));
    }

    /**
     * Delete color
     * DELETE /api/colors/{id}
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable UUID id) {
        colorService.delete(id);
        return ResponseEntity.ok(ApiResponse.success(null, "Color deleted successfully"));
    }
}
