package com.albelt.gestionstock.domain.rolls.service;

import com.albelt.gestionstock.domain.rolls.dto.RollRequest;
import com.albelt.gestionstock.domain.rolls.entity.Roll;
import com.albelt.gestionstock.domain.rolls.mapper.RollMapper;
import com.albelt.gestionstock.domain.rolls.repository.RollRepository;
import com.albelt.gestionstock.domain.colors.entity.Color;
import com.albelt.gestionstock.domain.colors.service.ColorService;
import com.albelt.gestionstock.domain.suppliers.entity.Supplier;
import com.albelt.gestionstock.domain.suppliers.service.SupplierService;
import com.albelt.gestionstock.domain.altier.entity.Altier;
import com.albelt.gestionstock.domain.altier.service.AltierService;
import com.albelt.gestionstock.shared.enums.MaterialType;
import com.albelt.gestionstock.shared.enums.RollStatus;
import com.albelt.gestionstock.shared.exceptions.BusinessException;
import com.albelt.gestionstock.shared.exceptions.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.*;

/**
 * Service for Roll management
 * FIFO-based inventory selection and tracking
 * Clean schema implementation: no initial/remaining duplication
 * 
 * Key responsibilities:
 * - Receive rolls into inventory (supplier delivery)
 * - FIFO-based roll selection for cutting operations
 * - Inventory tracking and consumption recording
 * - Roll status management (AVAILABLE → OPENED → EXHAUSTED → ARCHIVED)
 * - Waste tracking via totalWasteAreaM2 and totalCuts
 */
@Service
@Transactional
@RequiredArgsConstructor
@Slf4j
public class RollService {
    /**
     * Get grouped roll statistics by color, nbPlis, thicknessMm, materialType, altierId, status
     */
    @Transactional(readOnly = true)
    public List<Object[]> getGroupedByAllFields() {
        return rollRepository.groupByAllFields();
    }

    private final RollRepository rollRepository;
    private final RollMapper rollMapper;
    private final SupplierService supplierService;
    private final AltierService altierService;
    private final ColorService colorService;

    /**
     * Create a new roll from supplier delivery
     * Initializes roll with AVAILABLE status and zero waste tracking
     * 
     * @param request RollRequest containing material specs, dimensions, etc.
     * @param createdBy UUID of user receiving the roll
     * @return Saved Roll entity with generated ID
     * @throws ResourceNotFoundException if supplier not found
     */
    public Roll receive(RollRequest request, UUID createdBy) {
        log.info("Receiving roll: material={}, supplier_id={}, dimensions={}x{}x{}mm, area_m2={}", 
                 request.getMaterialType(), request.getSupplierId(),
                 request.getWidthMm(), request.getNbPlis(), request.getThicknessMm(),
                 request.getAreaM2());
        
        Supplier supplier = supplierService.getById(request.getSupplierId());
        
        // Resolve altier if provided (optional field)
        Altier altier = null;
        if (request.getAltierId() != null) {
            altier = altierService.getById(request.getAltierId());
        }

        Color color = null;
        if (request.getColorId() != null) {
            color = colorService.getById(request.getColorId());
        }
        
        Roll roll = rollMapper.toEntity(request, supplier, altier, color, createdBy);
        Roll saved = rollRepository.save(roll);
        
        log.info("Roll received successfully: id={}, material={}, area_m2={}, status=AVAILABLE, totalCuts=0, totalWaste=0m²", 
                 saved.getId(), saved.getMaterialType(), saved.getAreaM2());
        return saved;
    }

    /**
     * FIFO Selection: Get oldest available roll for a material
     * Core FIFO inventory selection logic - selects by received_date ASC
     * 
     * @param materialType The material to search for
     * @return Optional containing oldest available roll, or empty if none available
     */
    @Transactional(readOnly = true)
    public Optional<Roll> selectByFifo(MaterialType materialType) {
        log.debug("FIFO Selection: Looking for oldest available roll with material={}", materialType);
        
        Optional<Roll> roll = rollRepository.findOldestAvailableByMaterial(materialType, RollStatus.AVAILABLE);
        
        if (roll.isPresent()) {
            Roll selected = roll.get();
            log.info("FIFO Selected: roll_id={}, received_date={}, area_m2={}", 
                     selected.getId(), selected.getReceivedDate(), selected.getAreaM2());
        } else {
            log.warn("No available rolls found for material: {}", materialType);
        }
        
        return roll;
    }

    /**
     * Get FIFO queue for a material (all available rolls in order)
     */
    @Transactional(readOnly = true)
    public List<Roll> getFifoQueue(MaterialType materialType) {
        List<RollStatus> availableStatuses = Arrays.asList(RollStatus.AVAILABLE, RollStatus.OPENED);
        return rollRepository.findFifoQueue(materialType, availableStatuses);
    }

    /**
     * Find rolls with sufficient area for cutting request
     */
    @Transactional(readOnly = true)
    public List<Roll> findRollsBySize(MaterialType materialType, BigDecimal requiredArea) {
        log.debug("Finding rolls: material={}, required_area={}", materialType, requiredArea);
        
        List<RollStatus> availableStatuses = Arrays.asList(RollStatus.AVAILABLE, RollStatus.OPENED);
        return rollRepository.findRollsBySizeAndMaterial(materialType, requiredArea, availableStatuses);
    }

    /**
     * Get all rolls
     */
    @Transactional(readOnly = true)
    public List<Roll> getAll() {
        log.debug("Fetching all rolls");
        return rollRepository.findAll();
    }

    /**
     * Get all rolls in user's assigned altiers
     * Non-admin users only see their altier's rolls
     */
    @Transactional(readOnly = true)
    public List<Roll> getByUserAltiers(List<UUID> userAltierIds) {
        if (userAltierIds == null || userAltierIds.isEmpty()) {
            log.warn("User has no assigned altiers");
            return List.of();
        }
        log.debug("Fetching rolls for user altiers: {}", userAltierIds);
        return rollRepository.findByAltierIds(userAltierIds);
    }

    /**
     * Get paged rolls for user's altiers with optional filters
     */
    @Transactional(readOnly = true)
    public Page<Roll> getByUserAltiersPaged(List<UUID> userAltierIds,
                                            RollStatus status,
                                            MaterialType materialType,
                                            UUID supplierId,
                                            UUID altierId,
                                            java.time.LocalDate fromDate,
                                            java.time.LocalDate toDate,
                                            String search,
                                            int page,
                                            int size) {
        if (userAltierIds == null || userAltierIds.isEmpty()) {
            return Page.empty();
        }

        String normalizedSearch = normalize(search);
        if (normalizedSearch == null) {
            normalizedSearch = "";
        } else {
            normalizedSearch = normalizedSearch.toLowerCase(Locale.ROOT);
        }
        java.time.LocalDate effectiveFromDate = fromDate != null ? fromDate : java.time.LocalDate.of(1970, 1, 1);
        java.time.LocalDate effectiveToDate = toDate != null ? toDate : java.time.LocalDate.of(2100, 1, 1);
        var pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "receivedDate"));
        return rollRepository.findFiltered(userAltierIds, status, materialType, supplierId, altierId,
            effectiveFromDate, effectiveToDate, normalizedSearch, pageable);
    }

    /**
     * Get available rolls in user's assigned altiers
     */
    @Transactional(readOnly = true)
    public List<Roll> getAvailableByUserAltiers(List<UUID> userAltierIds) {
        if (userAltierIds == null || userAltierIds.isEmpty()) {
            return List.of();
        }
        List<RollStatus> availableStatuses = Arrays.asList(RollStatus.AVAILABLE, RollStatus.OPENED);
        return rollRepository.findAvailableByAltierIds(userAltierIds, availableStatuses);
    }

    /**
     * Get roll by ID
     */
    @Transactional(readOnly = true)
    public Roll getById(UUID id) {
        return rollRepository.findById(id)
                .orElseThrow(() -> ResourceNotFoundException.roll(id.toString()));
    }

    /**
     * Update roll status (e.g., AVAILABLE -> OPENED -> EXHAUSTED)
     */
    public Roll updateStatus(UUID id, RollStatus newStatus) {
        log.info("Updating roll status: id={}, new_status={}", id, newStatus);
        
        Roll roll = getById(id);
        RollStatus oldStatus = roll.getStatus();
        
        // Validate status transitions
        if (!isValidStatusTransition(oldStatus, newStatus)) {
            throw new BusinessException("Invalid status transition from " + oldStatus + " to " + newStatus);
        }
        
        roll.setStatus(newStatus);
        Roll updated = rollRepository.save(roll);
        
        log.info("Roll status updated: id={}, old_status={}, new_status={}", id, oldStatus, newStatus);
        return updated;
    }

    /**
     * Get all rolls by supplier
     */
    @Transactional(readOnly = true)
    public List<Roll> getBySupplier(UUID supplierId) {
        return rollRepository.findBySupplierIdOrderByReceivedDateDesc(supplierId);
    }

    /**
     * Get all rolls by altier (workshop)
     */
    @Transactional(readOnly = true)
    public List<Roll> getByAltier(UUID altierId) {
        return rollRepository.findByAltierIdOrderByReceivedDateDesc(altierId);
    }

    /**
     * Get inventory statistics by material
     */
    @Transactional(readOnly = true)
    public long getCountByMaterial(MaterialType materialType) {
        List<RollStatus> availableStatuses = Arrays.asList(RollStatus.AVAILABLE, RollStatus.OPENED);
        return rollRepository.countByMaterialAndStatus(materialType, availableStatuses);
    }

    /**
     * Get total available area by material type
     */
    @Transactional(readOnly = true)
    public BigDecimal getTotalAreaByMaterial(MaterialType materialType) {
        List<RollStatus> availableStatuses = Arrays.asList(RollStatus.AVAILABLE, RollStatus.OPENED);
        List<Object[]> results = rollRepository.getTotalAreaByMaterial(availableStatuses);
        
        for (Object[] row : results) {
            if (row[0].equals(materialType)) {
                return (BigDecimal) row[1];
            }
        }
        return BigDecimal.ZERO;
    }

    /**
     * Validate status transitions
     */
    private boolean isValidStatusTransition(RollStatus from, RollStatus to) {
        // AVAILABLE -> OPENED, EXHAUSTED, ARCHIVED
        // OPENED -> EXHAUSTED, ARCHIVED
        // EXHAUSTED -> ARCHIVED (immutable once exhausted)
        // ARCHIVED -> nowhere (end state)
        
        if (from.equals(to)) return false; // No self-transitions
        
        switch (from) {
            case AVAILABLE:
                return to.equals(RollStatus.OPENED) || to.equals(RollStatus.EXHAUSTED) || to.equals(RollStatus.ARCHIVED);
            case OPENED:
                return to.equals(RollStatus.EXHAUSTED) || to.equals(RollStatus.ARCHIVED);
            case EXHAUSTED:
                return to.equals(RollStatus.ARCHIVED);
            case ARCHIVED:
                return false; // No transitions from archived
            default:
                return false;
        }
    }

    private String normalize(String value) {
        if (value == null) return null;
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    /**
     * Record consumption/waste on a roll after cutting operation
     * Updates total waste area, cut count, last processing date, and status
     * 
     * Status transitions:
     * - AVAILABLE → OPENED (on first cut)
     * - OPENED → EXHAUSTED (when waste ≥ 90% of area)
     * - EXHAUSTED → ARCHIVED (manual transition)
     * 
     * @param rollId UUID of the roll being processed
     * @param wasteAreaM2 Area consumed/wasted in this operation (m²)
     * @return Updated Roll with new waste tracking
     * @throws ResourceNotFoundException if roll not found
     * @throws BusinessException if parameters invalid
     */
    public Roll recordConsumption(UUID rollId, BigDecimal wasteAreaM2) {
        if (wasteAreaM2 == null || wasteAreaM2.compareTo(BigDecimal.ZERO) < 0) {
            throw new BusinessException("Waste area must be a non-negative value");
        }
        
        log.info("Recording waste consumption: roll_id={}, waste_area_m2={}", rollId, wasteAreaM2);
        
        Roll roll = getById(rollId);
        RollStatus oldStatus = roll.getStatus();
        
        // Update total waste tracking
        BigDecimal newTotalWaste = roll.getTotalWasteAreaM2().add(wasteAreaM2);
        if (newTotalWaste.compareTo(roll.getAreaM2()) > 0) {
            log.warn("Warning: total waste {} exceeds roll area {}", newTotalWaste, roll.getAreaM2());
        }
        roll.setTotalWasteAreaM2(newTotalWaste);
        
        // Increment cut count
        roll.setTotalCuts(roll.getTotalCuts() + 1);
        
        // Update last processing date
        roll.setLastProcessingDate(LocalDateTime.now());
        
        // Update status based on waste percentage
        BigDecimal wastePercentage = newTotalWaste.divide(roll.getAreaM2(), 4, java.math.RoundingMode.HALF_UP)
                                                   .multiply(BigDecimal.valueOf(100));
        
        if (RollStatus.AVAILABLE.equals(roll.getStatus())) {
            roll.setStatus(RollStatus.OPENED);
            log.debug("Roll status transitioned: AVAILABLE → OPENED");
        }
        
        if (wastePercentage.compareTo(BigDecimal.valueOf(90)) >= 0) {
            roll.setStatus(RollStatus.EXHAUSTED);
            log.info("Roll marked EXHAUSTED: waste percentage={}%", wastePercentage.setScale(2, java.math.RoundingMode.HALF_UP));
        }
        
        Roll updated = rollRepository.save(roll);
        
        log.info("Consumption recorded: roll_id={}, total_waste={}m², waste_pct={}%, cuts={}, status_transition={}→{}", 
                 rollId, newTotalWaste, wastePercentage.setScale(2, java.math.RoundingMode.HALF_UP), 
                 updated.getTotalCuts(), oldStatus, updated.getStatus());
        return updated;
    }

    /**
     * Save a roll (for updates)
     */
    public Roll save(Roll roll) {
        return rollRepository.save(roll);
    }

    /**
     * Get available rolls by supplier and material type
     * Used for chute form dropdown when filtering rolls by supplier and material
     */
    @Transactional(readOnly = true)
    public List<Roll> getRollsBySupplierAndMaterial(UUID supplierId, MaterialType materialType) {
        log.debug("Getting rolls: supplier={}, material={}", supplierId, materialType);

        List<RollStatus> availableStatuses = Arrays.asList(RollStatus.AVAILABLE, RollStatus.OPENED);
        return rollRepository.findBySupplierAndMaterial(supplierId, materialType, availableStatuses);
    }

    /**
     * Get inventory statistics grouped by material type only
     * Aggregates across all waste types
     */
    @Transactional(readOnly = true)
    public List<Map<String, Object>> getStatsByMaterial() {
        log.debug("Fetching stats grouped by material type");
        
        List<RollStatus> activeStatuses = Arrays.asList(RollStatus.AVAILABLE, RollStatus.OPENED);
        List<Object[]> results = rollRepository.getStatsByMaterial(activeStatuses);
        
        return results.stream()
            .map(row -> {
                Map<String, Object> stat = new java.util.HashMap<>();
                stat.put("material", row[0]);
                stat.put("count", ((Number) row[1]).longValue());
                stat.put("totalArea", row[2] != null ? row[2] : BigDecimal.ZERO);
                return stat;
            })
            .toList();
    }
}
