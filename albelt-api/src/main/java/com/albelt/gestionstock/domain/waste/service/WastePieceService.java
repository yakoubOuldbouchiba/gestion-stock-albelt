package com.albelt.gestionstock.domain.waste.service;

import com.albelt.gestionstock.domain.waste.dto.WastePieceRequest;
import com.albelt.gestionstock.domain.waste.entity.WastePiece;
import com.albelt.gestionstock.domain.waste.mapper.WastePieceMapper;
import com.albelt.gestionstock.domain.waste.repository.WastePieceRepository;
import com.albelt.gestionstock.domain.colors.entity.Color;
import com.albelt.gestionstock.domain.colors.service.ColorService;
import com.albelt.gestionstock.domain.rolls.entity.Roll;
import com.albelt.gestionstock.domain.rolls.repository.RollRepository;
import com.albelt.gestionstock.shared.enums.MaterialType;
import com.albelt.gestionstock.shared.enums.WasteStatus;
import com.albelt.gestionstock.shared.enums.WasteType;
import com.albelt.gestionstock.shared.exceptions.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Service for Waste Piece management
 * Simplified for direct roll → waste → commande workflow
 * Tracks waste created during roll processing per commande item
 */
@Service
@Transactional
@RequiredArgsConstructor
@Slf4j
public class WastePieceService {

    private final WastePieceRepository wastePieceRepository;
    private final RollRepository rollRepository;
    private final WastePieceMapper wastePieceMapper;
    private final ColorService colorService;

    /**
     * Record a waste piece from a commande item processing
     * @param request WastePieceRequest containing waste piece details
     * @param createdBy UUID of user creating the waste piece
     * @return Saved WastePiece entity
     */
    public WastePiece recordWaste(WastePieceRequest request, UUID createdBy) {
        log.info("Recording waste piece: material={}, area_m2={}", 
                 request.getMaterialType(), request.getLengthM());

        WastePiece parentWastePiece = null;
        Roll roll = null;

        if (request.getParentWastePieceId() != null) {
            parentWastePiece = wastePieceRepository.findById(request.getParentWastePieceId())
                    .orElseThrow(() -> ResourceNotFoundException.supplier(request.getParentWastePieceId().toString()));
            roll = parentWastePiece.getRoll();
        }

        if (request.getRollId() != null) {
            Roll requestedRoll = rollRepository.findById(request.getRollId())
                    .orElseThrow(() -> ResourceNotFoundException.supplier(request.getRollId().toString()));
            if (roll != null && !requestedRoll.getId().equals(roll.getId())) {
                throw new IllegalArgumentException("Roll ID must match parent waste piece roll");
            }
            roll = requestedRoll;
        }

        if (roll == null) {
            throw new IllegalArgumentException("Roll ID or parent waste piece ID is required");
        }

        Color color = null;
        if (request.getColorId() != null) {
            color = colorService.getById(request.getColorId());
        } else if (roll.getColor() != null) {
            color = roll.getColor();
        } else if (parentWastePiece != null && parentWastePiece.getColor() != null) {
            color = parentWastePiece.getColor();
        }
        
        // Create WastePiece with Roll reference
        WastePiece wastePiece = wastePieceMapper.toEntity(request, roll, color);

        if (parentWastePiece != null) {
            wastePiece.setParentWastePiece(parentWastePiece);
        }
        
        // Set the creator
        wastePiece.setCreatedBy(createdBy);
        
        // Auto-categorize based on waste type
        if (WasteType.CHUTE_EXPLOITABLE.name().equalsIgnoreCase(wastePiece.getWasteType())) {
            wastePiece.setStatus(WasteStatus.AVAILABLE);
            log.debug("Reusable waste piece marked as AVAILABLE: {}", wastePiece.getId());
        } else {
            wastePiece.setStatus(WasteStatus.SCRAP);
            log.debug("Scrap waste piece marked as SCRAP: {}", wastePiece.getId());
        }
        
        wastePiece.setClassificationDate(java.time.LocalDateTime.now());
        WastePiece saved = wastePieceRepository.save(wastePiece);
        return saved;
    }

    /**
     * Get all waste pieces (paginated)
     */
    @Transactional(readOnly = true)
    public List<WastePiece> getAll(int page, int size) {
        log.debug("Fetching all waste pieces: page={}, size={}", page, size);
        return wastePieceRepository.findAll(PageRequest.of(page, size)).getContent();
    }

    /**
     * Get waste pieces with pagination and optional filters
     */
    @Transactional(readOnly = true)
    public Page<WastePiece> getAllPaged(MaterialType materialType, WasteStatus status, UUID altierId,
                                        java.time.LocalDateTime fromDate, java.time.LocalDateTime toDate,
                                        String search, int page, int size) {
        String normalizedSearch = normalize(search);
        if (normalizedSearch == null) {
            normalizedSearch = "";
        } else {
            normalizedSearch = normalizedSearch.toLowerCase(java.util.Locale.ROOT);
        }
        java.time.LocalDateTime effectiveFromDate = fromDate != null ? fromDate : java.time.LocalDateTime.of(1970, 1, 1, 0, 0);
        java.time.LocalDateTime effectiveToDate = toDate != null ? toDate : java.time.LocalDateTime.of(2100, 1, 1, 0, 0);
        var pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        return wastePieceRepository.findFiltered(materialType, status, altierId, effectiveFromDate, effectiveToDate, normalizedSearch, pageable);
    }

    /**
     * Get waste pieces by roll ID
     */
    @Transactional(readOnly = true)
    public List<WastePiece> getByRollId(UUID rollId) {
        log.debug("Fetching waste pieces for roll: {}", rollId);
        return wastePieceRepository.findByRollId(rollId);
    }

    /**
     * Find reuse candidate waste pieces
     * Looks for large waste pieces suitable for current cutting request
     */
    @Transactional(readOnly = true)
    public Optional<WastePiece> findReuseCandidate(MaterialType materialType, BigDecimal requiredArea) {
        log.debug("Finding reuse candidate: material={}, required_area={}", materialType, requiredArea);
        
        List<WasteStatus> reuseableStatuses = Arrays.asList(WasteStatus.AVAILABLE, WasteStatus.RESERVED);
        List<WastePiece> candidates = wastePieceRepository.findReuseCandidate(
                materialType, 
                requiredArea, 
                reuseableStatuses
        );
        
        if (!candidates.isEmpty()) {
            WastePiece candidate = candidates.get(0);
            log.info("Reuse candidate found: id={}, area_m2={}", candidate.getId(), candidate.getAreaM2());
            return Optional.of(candidate);
        }
        
        log.debug("No reuse candidates found for material: {}", materialType);
        return Optional.empty();
    }

    /**
     * Find all large waste pieces for potential reuse
     */
    @Transactional(readOnly = true)
    public List<WastePiece> findLargeAvailablePieces(int page, int size) {
        return wastePieceRepository.findLargeAvailablePieces(
                WasteStatus.AVAILABLE,
                PageRequest.of(page, size)
        );
    }

    /**
     * Mark waste piece as scrap
     */
    public WastePiece markAsScrap(UUID wastePieceId) {
        log.info("Marking waste piece as scrap: {}", wastePieceId);
        
        WastePiece wastePiece = getById(wastePieceId);
        wastePiece.markAsScrap(LocalDate.now());
        WastePiece updated = wastePieceRepository.save(wastePiece);
        
        log.info("Waste piece marked as SCRAP: {}", wastePieceId);
        return updated;
    }

    /**
     * Get waste piece by ID
     */
    @Transactional(readOnly = true)
    public WastePiece getById(UUID id) {
        return wastePieceRepository.findById(id)
                .orElseThrow(() -> ResourceNotFoundException.supplier(id.toString()));
    }

    /**
     * Get available waste pieces by material
     */
    @Transactional(readOnly = true)
    public List<WastePiece> getAvailableByMaterial(MaterialType materialType, int page, int size) {
        return wastePieceRepository.findAvailableByMaterial(
                materialType,
                WasteStatus.AVAILABLE,
                PageRequest.of(page, size)
        );
    }

    /**
     * Get waste statistics
     */
    @Transactional(readOnly = true)
    public long countByStatus(WasteStatus status) {
        return wastePieceRepository.countByStatus(status);
    }

    /**
     * Get reuse efficiency (reused vs total waste)
     */
    @Transactional(readOnly = true)
    public double getWasteReuseEfficiency(MaterialType materialType) {
        Object[] stats = wastePieceRepository.getWasteReuseStats(materialType);
        if (stats == null || stats.length < 2) {
            return 0.0;
        }
        
        long reused = ((Number) stats[0]).longValue();
        long total = ((Number) stats[1]).longValue();
        
        return total > 0 ? (double) reused / total * 100 : 0.0;
    }

    /**
     * Get total waste area by material
     */
    @Transactional(readOnly = true)
    public List<Object[]> getTotalWasteAreaByMaterial() {
        return wastePieceRepository.getTotalWasteAreaByMaterial(WasteStatus.AVAILABLE);
    }

    private String normalize(String value) {
        if (value == null) return null;
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }
}
