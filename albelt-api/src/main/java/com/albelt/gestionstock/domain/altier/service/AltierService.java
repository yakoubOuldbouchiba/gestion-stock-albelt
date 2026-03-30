package com.albelt.gestionstock.domain.altier.service;

import com.albelt.gestionstock.domain.altier.dto.AltierRequest;
import com.albelt.gestionstock.domain.altier.entity.Altier;
import com.albelt.gestionstock.domain.altier.repository.AltierRepository;
import com.albelt.gestionstock.shared.exceptions.BusinessException;
import com.albelt.gestionstock.shared.exceptions.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

/**
 * Service for Altier business logic
 */
@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class AltierService {

    private final AltierRepository altierRepository;

    /**
     * Create a new altier
     */
    public Altier create(AltierRequest request) {
        log.info("Creating altier: {}", request.getLibelle());
        
        if (altierRepository.existsByLibelle(request.getLibelle())) {
            throw new BusinessException("Altier with libelle '" + request.getLibelle() + "' already exists");
        }

        var altier = Altier.builder()
                .libelle(request.getLibelle())
                .adresse(request.getAdresse())
                .build();

        return altierRepository.save(altier);
    }

    /**
     * Get all altiers
     */
    @Transactional(readOnly = true)
    public List<Altier> getAll() {
        log.debug("Fetching all altiers");
        return altierRepository.findAll();
    }

    /**
     * Get altiers with pagination and optional filters
     */
    @Transactional(readOnly = true)
    public Page<Altier> getAllPaged(String search, java.time.LocalDateTime fromDate,
                                    java.time.LocalDateTime toDate, int page, int size) {
        String normalizedSearch = normalize(search);
        if (normalizedSearch == null) {
            normalizedSearch = "";
        } else {
            normalizedSearch = normalizedSearch.toLowerCase(java.util.Locale.ROOT);
        }
        java.time.LocalDateTime effectiveFromDate = fromDate != null ? fromDate : java.time.LocalDateTime.of(1970, 1, 1, 0, 0);
        java.time.LocalDateTime effectiveToDate = toDate != null ? toDate : java.time.LocalDateTime.of(2100, 1, 1, 0, 0);
        var pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        return altierRepository.findFiltered(normalizedSearch, effectiveFromDate, effectiveToDate, pageable);
    }

    /**
     * Get altier by ID
     */
    @Transactional(readOnly = true)
    public Altier getById(UUID id) {
        log.debug("Fetching altier: {}", id);
        return altierRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Altier not found with id: " + id));
    }

    /**
     * Get altier by libelle
     */
    @Transactional(readOnly = true)
    public Altier getByLibelle(String libelle) {
        log.debug("Searching altier by libelle: {}", libelle);
        return altierRepository.findByLibelle(libelle)
                .orElseThrow(() -> new ResourceNotFoundException("Altier not found with libelle: " + libelle));
    }

    /**
     * Update an altier
     */
    public Altier update(UUID id, AltierRequest request) {
        log.info("Updating altier: {}", id);
        
        var altier = getById(id);

        // Check if new libelle is unique (if it's being changed)
        if (!altier.getLibelle().equals(request.getLibelle()) && 
            altierRepository.existsByLibelle(request.getLibelle())) {
            throw new BusinessException("Altier with libelle '" + request.getLibelle() + "' already exists");
        }

        altier.setLibelle(request.getLibelle());
        altier.setAdresse(request.getAdresse());

        return altierRepository.save(altier);
    }

    /**
     * Delete an altier
     */
    public void delete(UUID id) {
        log.info("Deleting altier: {}", id);
        var altier = getById(id);
        altierRepository.delete(altier);
    }

    private String normalize(String value) {
        if (value == null) return null;
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }
}
