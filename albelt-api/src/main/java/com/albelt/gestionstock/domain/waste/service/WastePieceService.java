package com.albelt.gestionstock.domain.waste.service;

import com.albelt.gestionstock.domain.altier.entity.Altier;
import com.albelt.gestionstock.domain.altier.repository.AltierRepository;
import com.albelt.gestionstock.domain.altier.service.AltierService;
import com.albelt.gestionstock.domain.articles.service.ArticleService;
import com.albelt.gestionstock.domain.waste.dto.WastePieceGroupedStatsResponse;
import com.albelt.gestionstock.domain.commandes.entity.Commande;
import com.albelt.gestionstock.domain.commandes.entity.CommandeItem;
import com.albelt.gestionstock.domain.commandes.repository.CommandeItemRepository;
import com.albelt.gestionstock.domain.waste.dto.WastePieceRequest;
import com.albelt.gestionstock.domain.waste.entity.WastePiece;
import com.albelt.gestionstock.domain.waste.mapper.WastePieceMapper;
import com.albelt.gestionstock.domain.waste.repository.WastePieceRepository;
import com.albelt.gestionstock.domain.colors.entity.Color;
import com.albelt.gestionstock.domain.colors.service.ColorService;
import com.albelt.gestionstock.domain.rolls.entity.Roll;
import com.albelt.gestionstock.domain.rolls.repository.RollRepository;
import com.albelt.gestionstock.shared.enums.*;
import com.albelt.gestionstock.shared.enums.WasteType;
import com.albelt.gestionstock.shared.exceptions.BusinessException;
import com.albelt.gestionstock.shared.exceptions.ResourceNotFoundException;
import com.albelt.gestionstock.shared.persistence.LotIdAllocator;
import com.albelt.gestionstock.shared.utils.QrCodeService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.*;

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
    /**
     * Get grouped waste piece statistics by color, nbPlis, thicknessMm, materialType, altierId, status
     */
    @Transactional(readOnly = true)
    public List<WastePieceGroupedStatsResponse> getGroupedByAllFields(WasteType type) {
        List<Object[]> rows = wastePieceRepository.groupByAllFields(type);
        return wastePieceMapper.toGroupedStatsResponseList(rows);
    }

    private final WastePieceRepository wastePieceRepository;
    private final RollRepository rollRepository;
    private final WastePieceMapper wastePieceMapper;
    private final ColorService colorService;
    private final AltierService altierService;
    private final ArticleService articleService;
    private final CommandeItemRepository commandeItemRepository;
    private final LotIdAllocator lotIdAllocator;
    private final QrCodeService qrCodeService;

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
        Altier altier = altierService.getById(request.getAltierId());

        if (request.getCommandeItemId() != null) {
            CommandeItem item = commandeItemRepository.findById(request.getCommandeItemId())
                    .orElseThrow(() -> new ResourceNotFoundException("Order item not found: " + request.getCommandeItemId()));
            assertCommandeNotLocked(item.getCommande());
        }

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

        UUID colorIdToUse = request.getColorId();
        if (colorIdToUse == null) {
             if (roll != null && roll.getArticle() != null && roll.getArticle().getColor() != null) {
                 colorIdToUse = roll.getArticle().getColor().getId();
             } else if (parentWastePiece != null && parentWastePiece.getArticle() != null && parentWastePiece.getArticle().getColor() != null) {
                 colorIdToUse = parentWastePiece.getArticle().getColor().getId();
             }
        }


        // Create WastePiece with Roll reference
        WastePiece wastePiece = wastePieceMapper.toEntity(request, roll, altier);

        // Inherit article from parent source to ensure consistency in color/reference
        if (roll != null && roll.getArticle() != null) {
            wastePiece.setArticle(roll.getArticle());
        } else if (parentWastePiece != null && parentWastePiece.getArticle() != null) {
            wastePiece.setArticle(parentWastePiece.getArticle());
        } else {
            wastePiece.setArticle(articleService.resolve(
                request.getMaterialType(),
                request.getThicknessMm(),
                request.getNbPlis(),
                request.getReference(),
                colorIdToUse
            ));
        }

        if (parentWastePiece != null) {
            wastePiece.setParentWastePiece(parentWastePiece);
        }
        wastePiece.setLotId(lotIdAllocator.nextLotId());
        
        // Set the creator
        wastePiece.setCreatedBy(createdBy);
        
        if (request.getAltierId() != null) {
            wastePiece.setAltier(altierService.getById(request.getAltierId()));
        }
        
        // Default status starts as AVAILABLE; placement triggers manage OPENED/EXHAUSTED
        wastePiece.setStatus(WasteStatus.AVAILABLE);
        
        wastePiece.setClassificationDate(java.time.LocalDateTime.now());
        WastePiece saved = wastePieceRepository.save(wastePiece);
        saved.setQrCode(qrCodeService.generateForWastePiece(saved));
        saved = wastePieceRepository.save(saved);
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
    public Page<WastePiece> getAllPaged(UUID articleId, MaterialType materialType, WasteStatus status, UUID altierId,
                                        UUID colorId, Integer nbPlis, BigDecimal thicknessMm,
                                        WasteType wasteType,
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
        return wastePieceRepository.findFiltered(articleId, materialType, status, wasteType, altierId, colorId, nbPlis,
            thicknessMm, effectiveFromDate, effectiveToDate, normalizedSearch, pageable);
    }

    /**
     * Transfer sources: reusable waste pieces (CHUTE_EXPLOITABLE) that are AVAILABLE/OPENED in the from-altier
     * and not already reserved by a pending transfer bon movement.
     */
    @Transactional(readOnly = true)
    public Page<WastePiece> getTransferSourcesPaged(
            List<UUID> accessibleAltierIds,
            UUID fromAltierId,
            int page,
            int size) {
        if (accessibleAltierIds == null || accessibleAltierIds.isEmpty() || fromAltierId == null) {
            return Page.empty();
        }

        List<WasteStatus> statuses = Arrays.asList(WasteStatus.AVAILABLE, WasteStatus.OPENED);
        var pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        return wastePieceRepository.findTransferSources(
                accessibleAltierIds,
                fromAltierId,
                WasteType.CHUTE_EXPLOITABLE,
                statuses,
                pageable);
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
     * Get waste pieces for a specific commande item.
     */
    @Transactional(readOnly = true)
    public List<WastePiece> getByCommandeItem(UUID commandeItemId) {
        log.debug("Fetching waste pieces for commande item: {}", commandeItemId);
        return wastePieceRepository.findByCommandeItem(commandeItemId);
    }

    /**
     * Find reuse candidate waste pieces
     * Looks for large waste pieces suitable for current cutting request
     */
    @Transactional(readOnly = true)
    public Optional<WastePiece> findReuseCandidate(MaterialType materialType, BigDecimal requiredArea) {
        log.debug("Finding reuse candidate: material={}, required_area={}", materialType, requiredArea);
        
        List<WasteStatus> reuseableStatuses = Arrays.asList(WasteStatus.AVAILABLE, WasteStatus.OPENED);
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
        List<WasteStatus> availableStatuses = Arrays.asList(WasteStatus.AVAILABLE, WasteStatus.OPENED);
        return wastePieceRepository.findLargeAvailablePieces(availableStatuses, PageRequest.of(page, size));
    }

    /**
      * Archive waste piece
     */
    public WastePiece markAsScrap(UUID wastePieceId) {
          log.info("Archiving waste piece: {}", wastePieceId);
        
        WastePiece wastePiece = getById(wastePieceId);
        wastePiece.markAsArchived(LocalDate.now());
        WastePiece updated = wastePieceRepository.save(wastePiece);

        log.info("Waste piece archived: {}", wastePieceId);
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

    public WastePiece regenerateQrCode(UUID id) {
        WastePiece wastePiece = getById(id);
        wastePiece.setQrCode(qrCodeService.generateForWastePiece(wastePiece));
        return wastePieceRepository.save(wastePiece);
    }

    /**
     * Get available waste pieces by material
     */
    @Transactional(readOnly = true)
    public List<WastePiece> getAvailableByMaterial(MaterialType materialType, int page, int size) {
        List<WasteStatus> availableStatuses = Arrays.asList(WasteStatus.AVAILABLE, WasteStatus.OPENED);
        return wastePieceRepository.findAvailableByMaterial(
            materialType,
            availableStatuses,
            PageRequest.of(page, size)
        );
    }

    @Transactional(readOnly = true)
    public List<WastePiece> getAvailableByArticle(UUID articleId, int page, int size) {
        if (articleId == null) {
            return List.of();
        }
        List<WasteStatus> availableStatuses = Arrays.asList(WasteStatus.AVAILABLE, WasteStatus.OPENED);
        return wastePieceRepository.findAvailableByArticle(
            articleId,
            availableStatuses,
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
        List<WasteStatus> availableStatuses = Arrays.asList(WasteStatus.AVAILABLE, WasteStatus.OPENED);
        return wastePieceRepository.getTotalWasteAreaByMaterial(availableStatuses);
    }

    public WastePiece save(WastePiece wastePiece) {
        if (wastePiece != null && wastePiece.getArticle() == null) {
            if (wastePiece.getRoll() != null && wastePiece.getRoll().getArticle() != null) {
                wastePiece.setArticle(wastePiece.getRoll().getArticle());
            } else {
                wastePiece.setArticle(articleService.resolve(
                    wastePiece.getMaterialType(),
                    wastePiece.getThicknessMm(),
                    wastePiece.getNbPlis(),
                    wastePiece.getReference(),
                    null
                ));
            }
        }
        return wastePieceRepository.save(wastePiece);
    }

    private void assertCommandeNotLocked(Commande commande) {
        String normalizedStatus = Optional.ofNullable(commande)
                .map(Commande::getStatus)
                .map(String::trim)
                .map(String::toUpperCase)
                .orElse("");
        if ("COMPLETED".equals(normalizedStatus) || "CANCELLED".equals(normalizedStatus)) {
            throw new BusinessException("Commande is locked (COMPLETED/CANCELLED) and cannot be modified");
        }
    }

    private String normalize(String value) {
        if (value == null) return null;
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    public List<Map<String, Object>> getStatsByMaterial(WasteType type) {
        log.debug("Fetching stats grouped by material type");

        List<WasteStatus> activeStatuses = Arrays.asList(WasteStatus.AVAILABLE, WasteStatus.OPENED);
        List<Object[]> results = wastePieceRepository.getStatsByMaterial(type,activeStatuses);

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
