package com.albelt.gestionstock.domain.suppliers.service;

import com.albelt.gestionstock.domain.suppliers.dto.SupplierRequest;
import com.albelt.gestionstock.domain.suppliers.entity.Supplier;
import com.albelt.gestionstock.domain.suppliers.mapper.SupplierMapper;
import com.albelt.gestionstock.domain.suppliers.repository.SupplierRepository;
import com.albelt.gestionstock.shared.exceptions.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

/**
 * Service for Supplier management
 * Simple CRUD operations with validation for ERP integration
 */
@Service
@Transactional
@RequiredArgsConstructor
@Slf4j
public class SupplierService {

    private final SupplierRepository supplierRepository;
    private final SupplierMapper supplierMapper;

    /**
     * Create a new supplier
     */
    public Supplier create(SupplierRequest request) {
        log.info("Creating new supplier: {}", request.getName());
        
        // Check if supplier already exists
        if (supplierRepository.findByNameIgnoreCase(request.getName()).isPresent()) {
            throw new IllegalArgumentException("Supplier with name '" + request.getName() + "' already exists");
        }
        
        Supplier supplier = supplierMapper.toEntity(request);
        Supplier saved = supplierRepository.save(supplier);
        
        log.info("Supplier created successfully with ID: {}", saved.getId());
        return saved;
    }

    /**
     * Update an existing supplier
     */
    public Supplier update(UUID id, SupplierRequest request) {
        log.info("Updating supplier: {}", id);
        
        Supplier existing = supplierRepository.findById(id)
                .orElseThrow(() -> ResourceNotFoundException.supplier(id.toString()));
        
        Supplier updated = supplierMapper.updateEntity(existing, request);
        Supplier saved = supplierRepository.save(updated);
        
        log.info("Supplier updated successfully: {}", id);
        return saved;
    }

    /**
     * Get supplier by ID
     */
    @Transactional(readOnly = true)
    public Supplier getById(UUID id) {
        return supplierRepository.findById(id)
                .orElseThrow(() -> ResourceNotFoundException.supplier(id.toString()));
    }

    /**
     * Get supplier by name
     */
    @Transactional(readOnly = true)
    public Supplier getByName(String name) {
        return supplierRepository.findByNameIgnoreCase(name)
                .orElseThrow(() -> ResourceNotFoundException.supplier(name));
    }

    /**
     * Get all suppliers
     */
    @Transactional(readOnly = true)
    public List<Supplier> getAll() {
        return supplierRepository.findAllRecentFirst();
    }

    /**
     * Search suppliers by country
     */
    @Transactional(readOnly = true)
    public List<Supplier> getByCountry(String country) {
        return supplierRepository.findByCountryOrderByNameAsc(country);
    }

    /**
     * Search suppliers by name pattern
     */
    @Transactional(readOnly = true)
    public List<Supplier> searchByName(String namePattern) {
        log.debug("Searching suppliers by pattern: {}", namePattern);
        return supplierRepository.searchByNamePattern(namePattern);
    }

    /**
     * Delete a supplier
     * Note: Database trigger prevents deletion if supplier has active rolls
     */
    public void delete(UUID id) {
        log.info("Deleting supplier: {}", id);
        
        Supplier supplier = getById(id);
        supplierRepository.delete(supplier);
        
        log.info("Supplier deleted successfully: {}", id);
    }

    /**
     * Check if supplier exists
     */
    @Transactional(readOnly = true)
    public boolean exists(UUID id) {
        return supplierRepository.existsById(id);
    }
}
