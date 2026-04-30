package com.albelt.gestionstock.api.controller;

import com.albelt.gestionstock.api.response.ApiResponse;
import com.albelt.gestionstock.api.response.PagedResponse;
import com.albelt.gestionstock.domain.suppliers.dto.SupplierRequest;
import com.albelt.gestionstock.domain.suppliers.dto.SupplierResponse;
import com.albelt.gestionstock.domain.suppliers.mapper.SupplierMapper;
import com.albelt.gestionstock.domain.suppliers.service.SupplierService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

/**
 * REST Controller for Supplier management
 * Base path: /api/suppliers
 */
@RestController
@RequestMapping("/api/suppliers")
@RequiredArgsConstructor
@Slf4j
public class SupplierController {

    private final SupplierService supplierService;
    private final SupplierMapper supplierMapper;

    /**
     * Create a new supplier
     * POST /api/suppliers
     */
    @PostMapping
    public ResponseEntity<ApiResponse<SupplierResponse>> create(@Valid @RequestBody SupplierRequest request) {
        log.info("Creating supplier: {}", request.getName());
        var supplier = supplierService.create(request);
        var response = supplierMapper.toResponse(supplier);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(response, "Supplier created successfully"));
    }

    /**
     * Get all suppliers
     * GET /api/suppliers
     */
    @GetMapping
    public ResponseEntity<ApiResponse<PagedResponse<SupplierResponse>>> getAll(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String country,
            @RequestParam(required = false) String dateFrom,
            @RequestParam(required = false) String dateTo) {
        log.debug("Fetching all suppliers");
        var fromDate = parseDateStart(dateFrom);
        var toDate = parseDateEnd(dateTo);
        var suppliers = supplierService.getAllPaged(search, country, fromDate, toDate, page, size);
        var responses = supplierMapper.toResponseList(suppliers.getContent());
        var paged = PagedResponse.<SupplierResponse>builder()
                .items(responses)
                .page(suppliers.getNumber())
                .size(suppliers.getSize())
                .totalElements(suppliers.getTotalElements())
                .totalPages(suppliers.getTotalPages())
                .build();
        return ResponseEntity.ok(ApiResponse.success(paged, "Suppliers retrieved successfully"));
    }

    /**
     * Get supplier by ID
     * GET /api/suppliers/{id}
     */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<SupplierResponse>> getById(@PathVariable UUID id) {
        log.debug("Fetching supplier: {}", id);
        var supplier = supplierService.getById(id);
        var response = supplierMapper.toResponse(supplier);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    /**
     * Get supplier by name
     * GET /api/suppliers/search/name?name={name}
     */
    @GetMapping("/search/name")
    public ResponseEntity<ApiResponse<SupplierResponse>> getByName(@RequestParam String name) {
        log.debug("Searching supplier by name: {}", name);
        var supplier = supplierService.getByName(name);
        var response = supplierMapper.toResponse(supplier);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    /**
     * Get suppliers by country
     * GET /api/suppliers/search/country?country={country}
     */
    @GetMapping("/search/country")
    public ResponseEntity<ApiResponse<List<SupplierResponse>>> getByCountry(@RequestParam String country) {
        log.debug("Searching suppliers by country: {}", country);
        var suppliers = supplierService.getByCountry(country);
        var responses = supplierMapper.toResponseList(suppliers);
        return ResponseEntity.ok(ApiResponse.success(responses));
    }

    /**
     * Search suppliers by name pattern
     * GET /api/suppliers/search/pattern?pattern={pattern}
     */
    @GetMapping("/search/pattern")
    public ResponseEntity<ApiResponse<List<SupplierResponse>>> searchByName(@RequestParam String pattern) {
        log.debug("Searching suppliers by pattern: {}", pattern);
        var suppliers = supplierService.searchByName(pattern);
        var responses = supplierMapper.toResponseList(suppliers);
        return ResponseEntity.ok(ApiResponse.success(responses));
    }

    /**
     * Update supplier
     * PUT /api/suppliers/{id}
     */
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<SupplierResponse>> update(
            @PathVariable UUID id,
            @Valid @RequestBody SupplierRequest request) {
        log.info("Updating supplier: {}", id);
        var supplier = supplierService.update(id, request);
        var response = supplierMapper.toResponse(supplier);
        return ResponseEntity.ok(ApiResponse.success(response, "Supplier updated successfully"));
    }

    /**
     * Delete supplier
     * DELETE /api/suppliers/{id}
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable UUID id) {
        log.info("Deleting supplier: {}", id);
        supplierService.delete(id);
        return ResponseEntity.ok(ApiResponse.success(null, "Supplier deleted successfully"));
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
