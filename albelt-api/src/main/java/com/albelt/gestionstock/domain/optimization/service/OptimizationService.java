package com.albelt.gestionstock.domain.optimization.service;

import com.albelt.gestionstock.domain.commandes.entity.CommandeItem;
import com.albelt.gestionstock.domain.commandes.repository.CommandeItemRepository;
import com.albelt.gestionstock.domain.commandes.entity.Commande;
import com.albelt.gestionstock.domain.commandes.repository.CommandeRepository;
import com.albelt.gestionstock.domain.altier.entity.Altier;
import com.albelt.gestionstock.domain.altier.repository.AltierRepository;
import com.albelt.gestionstock.domain.optimization.dto.OptimizationComparisonResponse;
import com.albelt.gestionstock.domain.optimization.dto.OptimizationMetricsResponse;
import com.albelt.gestionstock.domain.optimization.dto.OptimizationPlanResponse;
import com.albelt.gestionstock.domain.optimization.dto.AltierScoreResponse;
import com.albelt.gestionstock.domain.optimization.dto.OptimizationPlacementReportResponse;
import com.albelt.gestionstock.domain.optimization.dto.OptimizationSourceReportResponse;
import com.albelt.gestionstock.domain.optimization.data.OptimizationItemSnapshot;
import com.albelt.gestionstock.domain.optimization.engine.OptimizationEngine;
import com.albelt.gestionstock.domain.optimization.entity.*;
import com.albelt.gestionstock.domain.optimization.repository.OptimizationPlacementRepository;
import com.albelt.gestionstock.domain.optimization.repository.OptimizationPlanRepository;
import com.albelt.gestionstock.domain.placement.entity.PlacedRectangle;
import com.albelt.gestionstock.domain.placement.repository.PlacedRectangleRepository;
import com.albelt.gestionstock.domain.production.repository.ProductionItemRepository;
import com.albelt.gestionstock.domain.rolls.entity.Roll;
import com.albelt.gestionstock.domain.rolls.repository.RollRepository;
import com.albelt.gestionstock.domain.settings.entity.MaterialChuteThreshold;
import com.albelt.gestionstock.domain.settings.repository.MaterialChuteThresholdRepository;
import com.albelt.gestionstock.domain.waste.entity.WastePiece;
import com.albelt.gestionstock.domain.waste.repository.WastePieceRepository;
import com.albelt.gestionstock.shared.enums.MaterialType;
import com.albelt.gestionstock.shared.enums.RollStatus;
import com.albelt.gestionstock.shared.enums.WasteStatus;
import com.albelt.gestionstock.shared.enums.WasteType;
import com.albelt.gestionstock.shared.exceptions.ResourceNotFoundException;
import com.albelt.gestionstock.shared.utils.QrCodeService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class OptimizationService {

    private static final int MAX_WASTE_CANDIDATES = 80;
    private static final int MAX_ROLL_CANDIDATES = 80;
    private static final int SVG_PADDING = 40;
    private static final List<String> ACTIVE_COMMANDE_STATUSES = Arrays.asList("PENDING", "ENCOURS");
    private static final String ALGORITHM_VERSION = "v2-blf";

    private final CommandeItemRepository itemRepository;
    private final CommandeRepository commandeRepository;
    private final AltierRepository altierRepository;
    private final RollRepository rollRepository;
    private final WastePieceRepository wastePieceRepository;
    private final PlacedRectangleRepository placedRectangleRepository;
    private final ProductionItemRepository productionItemRepository;
    private final MaterialChuteThresholdRepository thresholdRepository;
    private final OptimizationPlanRepository planRepository;
    private final OptimizationPlacementRepository placementRepository;
    private final QrCodeService qrCodeService;
    private final OptimizationSnapshotLoader snapshotLoader;
    private final OptimizationEngine optimizationEngine;

    @Transactional
    public OptimizationPlan generateAndSaveSuggestion(CommandeItem item) {
        if (item == null) {
            return null;
        }
        return generateAndSaveSuggestion(item.getId(), true);
    }

    @Transactional
    public OptimizationComparisonResponse getComparison(UUID commandeItemId, boolean forceRegenerate) {
        OptimizationItemSnapshot item = snapshotLoader.loadItem(commandeItemId);
        OptimizationPlan plan = generateAndSaveSuggestion(commandeItemId, forceRegenerate);

        OptimizationMetrics actualMetrics = computeActualMetrics(item);
        OptimizationMetricsResponse actualResponse = toMetricsResponse(actualMetrics);

        List<PlacedRectangle> actualPlacementsRaw = placedRectangleRepository.findByCommandeItemIdWithSources(commandeItemId);
        List<OptimizationSourceReportResponse> actualSources = buildActualSources(actualPlacementsRaw);
        List<OptimizationPlacementReportResponse> actualPlacements = buildActualPlacements(actualPlacementsRaw);

        String actualSvg = buildActualSvgFromPlacements(actualPlacementsRaw);

        OptimizationPlanResponse suggestedResponse = plan != null ? toPlanResponse(plan) : null;

        BigDecimal wasteSaved = BigDecimal.ZERO;
        BigDecimal utilizationGain = BigDecimal.ZERO;
        if (plan != null) {
            wasteSaved = actualMetrics.wasteAreaM2.subtract(plan.getWasteAreaM2());
            utilizationGain = plan.getUtilizationPct().subtract(actualMetrics.utilizationPct);
        }

        return OptimizationComparisonResponse.builder()
            .commandeItemId(commandeItemId)
            .actualMetrics(actualResponse)
            .suggested(suggestedResponse)
            .actualSvg(actualSvg)
            .actualSources(actualSources)
            .actualPlacements(actualPlacements)
            .wasteSavedM2(wasteSaved)
            .utilizationGainPct(utilizationGain)
            .build();
    }

    private OptimizationPlan generateAndSaveSuggestion(UUID commandeItemId, boolean forceRegenerate) {
        OptimizationItemSnapshot item = snapshotLoader.loadItem(commandeItemId);
        var planningContext = snapshotLoader.loadPlanningContext(item);

        if (!forceRegenerate) {
            OptimizationPlan reusable = planRepository
                .findFirstByCommandeItemIdAndStatusAndAlgorithmVersionAndInputSignatureAndStockSignatureOrderByCreatedAtDesc(
                    commandeItemId,
                    OptimizationPlanStatus.ACTIVE,
                    ALGORITHM_VERSION,
                    planningContext.inputSignature(),
                    planningContext.stockSignature()
                )
                .orElse(null);
            if (reusable != null) {
                return reusable;
            }
        }

        supersedeActivePlans(commandeItemId);

        OptimizationEngine.OptimizationResult result = optimizationEngine.optimize(
            item,
            planningContext.sources(),
            planningContext.occupiedBySource()
        );

        if (result.totalPieces() == 0 || planningContext.sources().isEmpty()) {
            return saveEmptyPlan(item, result.totalPieces(), planningContext.inputSignature(), planningContext.stockSignature());
        }

        OptimizationPlan plan = buildPlan(item, result, planningContext.inputSignature(), planningContext.stockSignature());
        OptimizationPlan saved = planRepository.save(plan);
        persistPlacements(saved, result.placements());
        return saved;
    }

    private void supersedeActivePlans(UUID commandeItemId) {
        List<OptimizationPlan> activePlans = planRepository.findByCommandeItemIdAndStatus(
            commandeItemId,
            OptimizationPlanStatus.ACTIVE
        );
        if (activePlans == null || activePlans.isEmpty()) {
            return;
        }

        for (OptimizationPlan plan : activePlans) {
            plan.setStatus(OptimizationPlanStatus.SUPERSEDED);
            planRepository.save(plan);
        }
    }

    private OptimizationPlan saveEmptyPlan(OptimizationItemSnapshot item,
                                           int totalPieces,
                                           String inputSignature,
                                           String stockSignature) {
        OptimizationPlan plan = OptimizationPlan.builder()
            .commandeItemId(item.itemId())
            .algorithmVersion(ALGORITHM_VERSION)
            .inputSignature(inputSignature)
            .stockSignature(stockSignature)
            .totalPieces(totalPieces)
            .placedPieces(0)
            .sourceCount(0)
            .usedAreaM2(BigDecimal.ZERO)
            .wasteAreaM2(BigDecimal.ZERO)
            .utilizationPct(BigDecimal.ZERO)
            .svg(null)
            .build();
        return planRepository.save(plan);
    }

    private List<Piece> buildPieces(CommandeItem item) {
        if (item.getQuantite() == null || item.getQuantite() <= 0) {
            return List.of();
        }

        int widthMm = item.getLargeurMm();
        int lengthMm = toLengthMm(item.getLongueurM());
        BigDecimal areaM2 = toAreaM2(widthMm, lengthMm);

        List<Piece> pieces = new ArrayList<>();
        for (int i = 0; i < item.getQuantite(); i++) {
            pieces.add(new Piece(i, widthMm, lengthMm, item.getLongueurM(), areaM2));
        }

        pieces.sort(Comparator.comparingInt(Piece::maxSide).reversed());
        return pieces;
    }

    private List<SourceCandidate> buildCandidates(CommandeItem item) {
        UUID commandeAltierId = null;
        if (item != null && item.getCommande() != null && item.getCommande().getAltier() != null) {
            commandeAltierId = item.getCommande().getAltier().getId();
        }
        return buildCandidates(item, commandeAltierId);
    }

    private List<SourceCandidate> buildCandidates(CommandeItem item, UUID altierId) {
        MaterialType materialType = parseMaterialType(item.getMaterialType());
        Integer nbPlis = item.getNbPlis();
        BigDecimal thickness = item.getThicknessMm();
        UUID colorId = item.getArticle().getColor()  != null ? item.getArticle().getColor() .getId() : null;
        String reference = normalize(item.getReference());
        UUID articleId = item.getArticle() != null ? item.getArticle().getId() : null;

        List<WasteStatus> wasteStatuses = Arrays.asList(WasteStatus.AVAILABLE, WasteStatus.OPENED);
        List<WastePiece> wastePieces = altierId == null
            ? wastePieceRepository.findAvailableByMaterial(
                materialType,
                wasteStatuses,
                PageRequest.of(0, MAX_WASTE_CANDIDATES)
            )
            : wastePieceRepository.findAvailableByMaterialAndAltier(
                materialType,
                wasteStatuses,
                altierId,
                PageRequest.of(0, MAX_WASTE_CANDIDATES)
            );

        List<SourceCandidate> wasteCandidates = wastePieces.stream()
            .filter(wp -> wp.getWasteType() == WasteType.CHUTE_EXPLOITABLE || wp.getWasteType() == null)
            .filter(wp -> matchesCommonFilters(articleId, materialType, nbPlis, thickness, colorId, reference,
                wp.getArticle() != null ? wp.getArticle().getId() : null,
                wp.getMaterialType(), wp.getNbPlis(), wp.getThicknessMm(),
                wp.getArticle().getColor()  != null ? wp.getArticle().getColor() .getId() : null, wp.getReference()))
            .map(wp -> SourceCandidate.fromWaste(wp))
            .filter(sc -> sc.canFit(item))
            .sorted(Comparator.comparing(SourceCandidate::effectiveAreaM2).reversed())
            .collect(Collectors.toList());

        List<RollStatus> rollStatuses = Arrays.asList(RollStatus.AVAILABLE, RollStatus.OPENED);
        List<Roll> rolls = altierId == null
            ? rollRepository.findFifoQueue(materialType, rollStatuses)
            : rollRepository.findFifoQueueByAltier(materialType, rollStatuses, altierId);

        List<SourceCandidate> rollCandidates = rolls.stream()
            .filter(r -> matchesCommonFilters(articleId, materialType, nbPlis, thickness, colorId, reference,
                r.getArticle() != null ? r.getArticle().getId() : null,
                r.getMaterialType(), r.getNbPlis(), r.getThicknessMm(),
                r.getArticle().getColor()  != null ? r.getArticle().getColor() .getId() : null, r.getReference()))
            .map(SourceCandidate::fromRoll)
            .filter(sc -> sc.canFit(item))
            .sorted(Comparator.comparing(SourceCandidate::fifoScore).reversed())
            .limit(MAX_ROLL_CANDIDATES)
            .collect(Collectors.toList());

        List<SourceCandidate> candidates = new ArrayList<>(wasteCandidates);
        candidates.addAll(rollCandidates);
        return candidates;
    }

    @Transactional(readOnly = true)
    public List<AltierScoreResponse> scoreAltiersForCommande(UUID commandeId) {
        List<OptimizationItemSnapshot> items = snapshotLoader.loadItemsForCommande(commandeId);
        if (items.isEmpty() && !commandeRepository.existsById(commandeId)) {
            throw new ResourceNotFoundException("Order not found: " + commandeId);
        }

        int totalPieces = items.stream()
            .map(OptimizationItemSnapshot::quantite)
            .filter(Objects::nonNull)
            .mapToInt(Integer::intValue)
            .sum();

        List<Altier> altiers = altierRepository.findAll();
        List<AltierScoreResponse> results = new ArrayList<>();

        for (Altier altier : altiers) {
            int placedPieces = 0;

            for (OptimizationItemSnapshot item : items) {
                var planningContext = snapshotLoader.loadPlanningContext(item.withAltierId(altier.getId()));
                OptimizationEngine.OptimizationResult result = optimizationEngine.optimize(
                    item.withAltierId(altier.getId()),
                    planningContext.sources(),
                    planningContext.occupiedBySource()
                );
                placedPieces += result.placedPieces();
            }

            BigDecimal coveragePct = BigDecimal.ZERO;
            if (totalPieces > 0) {
                coveragePct = BigDecimal.valueOf(placedPieces)
                    .divide(BigDecimal.valueOf(totalPieces), 4, RoundingMode.HALF_UP)
                    .multiply(BigDecimal.valueOf(100));
            }

            boolean canFulfill = totalPieces == 0 || placedPieces >= totalPieces;
            double score = (canFulfill ? 1_000_000.0 : 0.0) + coveragePct.doubleValue();

            results.add(AltierScoreResponse.builder()
                .altierId(altier.getId())
                .altierLibelle(altier.getLibelle())
                .score(score)
                .totalPieces(totalPieces)
                .placedPieces(Math.min(placedPieces, totalPieces))
                .coveragePct(coveragePct)
                .canFulfill(canFulfill)
                .build());
        }

        results.sort(
            Comparator.comparingDouble(AltierScoreResponse::getScore).reversed()
                .thenComparing(r -> r.getAltierLibelle() != null ? r.getAltierLibelle() : "")
        );

        return results;
    }

    private OptimizationRun optimizePieces(List<Piece> pieces,
                                           List<SourceCandidate> candidates,
                                           UUID commandeItemId,
                                           UUID commandeId) {
        List<Piece> remaining = new ArrayList<>(pieces);
        List<SourceCandidate> availableSources = new ArrayList<>(candidates);
        List<PlacementRecord> allPlacements = new ArrayList<>();
        List<SourcePlan> selectedPlans = new ArrayList<>();
        Map<String, List<FreeRect>> occupiedCache = new HashMap<>();

        while (!remaining.isEmpty() && !availableSources.isEmpty()) {
            SourcePlan bestPlan = null;

            for (SourceCandidate source : availableSources) {
                SourcePlan plan = packIntoSource(remaining, source, commandeItemId, commandeId, occupiedCache);
                if (plan.placedPieces <= 0) {
                    continue;
                }
                if (bestPlan == null || isBetterPlan(plan, bestPlan)) {
                    bestPlan = plan;
                }
            }

            if (bestPlan == null) {
                break;
            }

            selectedPlans.add(bestPlan);
            allPlacements.addAll(bestPlan.placements);

            SourcePlan committedPlan = bestPlan;
            remaining.removeIf(piece -> committedPlan.placedPieceIds.contains(piece.id));
            availableSources.remove(bestPlan.source);
        }

        return new OptimizationRun(allPlacements, selectedPlans, pieces.size(), pieces.size() - remaining.size());
    }

    private SourcePlan packIntoSource(List<Piece> pieces,
                                      SourceCandidate source,
                                      UUID commandeItemId,
                                      UUID commandeId,
                                      Map<String, List<FreeRect>> occupiedCache) {
        List<FreeRect> freeRects = buildFreeRects(source, commandeItemId, commandeId, occupiedCache);

        List<PlacementRecord> placements = new ArrayList<>();
        Set<Integer> placedPieceIds = new HashSet<>();
        BigDecimal usedArea = BigDecimal.ZERO;

        BigDecimal sourceArea = source.effectiveAreaM2();
        if (sourceArea.compareTo(BigDecimal.ZERO) <= 0) {
            sourceArea = toAreaM2(source.widthMm, source.heightMm);
        }

        for (Piece piece : pieces) {
            PlacementChoice choice = findBestPlacement(piece, freeRects);
            if (choice == null) {
                continue;
            }

            BigDecimal nextArea = usedArea.add(piece.areaM2);
            if (nextArea.compareTo(sourceArea) > 0) {
                continue;
            }

            placements.add(new PlacementRecord(piece, source, choice));
            placedPieceIds.add(piece.id);
            usedArea = nextArea;

            FreeRect selected = choice.rect;
            freeRects.remove(selected);
            freeRects.addAll(splitRect(selected, choice.widthMm, choice.heightMm));
            freeRects.sort(Comparator.comparingInt(FreeRect::area).reversed());
        }

        int placedPieces = placements.size();
        BigDecimal wasteArea = sourceArea.subtract(usedArea).max(BigDecimal.ZERO);
        BigDecimal utilizationPct = sourceArea.compareTo(BigDecimal.ZERO) == 0
            ? BigDecimal.ZERO
            : usedArea.divide(sourceArea, 4, RoundingMode.HALF_UP).multiply(BigDecimal.valueOf(100));

        double score = scorePlan(placedPieces, utilizationPct, wasteArea, source);

        return new SourcePlan(source, placements, freeRects, placedPieceIds, usedArea, wasteArea, utilizationPct, score);
    }

    private PlacementChoice findBestPlacement(Piece piece, List<FreeRect> freeRects) {
        PlacementChoice best = null;
        for (FreeRect rect : freeRects) {
            PlacementChoice normal = tryPlace(piece, rect, false);
            PlacementChoice rotated = tryPlace(piece, rect, true);

            best = selectBetter(best, normal);
            best = selectBetter(best, rotated);
        }
        return best;
    }

    private PlacementChoice tryPlace(Piece piece, FreeRect rect, boolean rotated) {
        int width = rotated ? piece.lengthMm : piece.widthMm;
        int height = rotated ? piece.widthMm : piece.lengthMm;
        if (width <= rect.widthMm && height <= rect.heightMm) {
            int waste = rect.area() - (width * height);
            return new PlacementChoice(rect, width, height, rotated, waste);
        }
        return null;
    }

    private PlacementChoice selectBetter(PlacementChoice current, PlacementChoice candidate) {
        if (candidate == null) {
            return current;
        }
        if (current == null) {
            return candidate;
        }
        return candidate.waste < current.waste ? candidate : current;
    }

    private List<FreeRect> splitRect(FreeRect rect, int placedWidth, int placedHeight) {
        List<FreeRect> result = new ArrayList<>();

        int rightWidth = rect.widthMm - placedWidth;
        if (rightWidth > 0) {
            result.add(new FreeRect(rect.xMm + placedWidth, rect.yMm, rightWidth, placedHeight));
        }

        int topHeight = rect.heightMm - placedHeight;
        if (topHeight > 0) {
            result.add(new FreeRect(rect.xMm, rect.yMm + placedHeight, rect.widthMm, topHeight));
        }

        return result;
    }

    private double scorePlan(int placedPieces, BigDecimal utilizationPct, BigDecimal wasteArea, SourceCandidate source) {
        double wastePenalty = wasteArea.doubleValue() * 1000.0;
        double utilizationScore = utilizationPct.doubleValue() * 100.0;
        double pieceScore = placedPieces * 1000.0;
        double costBonus = source.type == OptimizationSourceType.WASTE ? 5000.0 : 0.0;
        double fifoScore = source.type == OptimizationSourceType.ROLL ? source.fifoScore() * 10.0 : 0.0;

        return pieceScore + utilizationScore + costBonus + fifoScore - wastePenalty;
    }

    private boolean isBetterPlan(SourcePlan candidate, SourcePlan current) {
        double epsilon = 0.0001;
        if (candidate.score > current.score + epsilon) {
            return true;
        }
        if (Math.abs(candidate.score - current.score) <= epsilon) {
            double candidateFifo = candidate.source.fifoScore();
            double currentFifo = current.source.fifoScore();
            return candidateFifo > currentFifo;
        }
        return false;
    }

    private List<FreeRect> buildFreeRects(SourceCandidate source,
                                          UUID commandeItemId,
                                          UUID commandeId,
                                          Map<String, List<FreeRect>> occupiedCache) {
        List<FreeRect> freeRects = new ArrayList<>();
        freeRects.add(new FreeRect(0, 0, source.widthMm, source.heightMm));

        List<FreeRect> occupied = loadOccupiedRects(source, commandeItemId, commandeId, occupiedCache);
        for (FreeRect occupiedRect : occupied) {
            freeRects = subtractOccupiedRect(freeRects, occupiedRect);
            if (freeRects.isEmpty()) {
                break;
            }
        }

        freeRects.sort(Comparator.comparingInt(FreeRect::area).reversed());
        return freeRects;
    }

    private List<FreeRect> loadOccupiedRects(SourceCandidate source,
                                             UUID commandeItemId,
                                             UUID commandeId,
                                             Map<String, List<FreeRect>> occupiedCache) {
        String cacheKey = source.type + ":" + source.sourceId();
        List<FreeRect> cached = occupiedCache.get(cacheKey);
        if (cached != null) {
            return cached;
        }

        List<FreeRect> occupied = new ArrayList<>();
        if (source.roll != null) {
            List<PlacedRectangle> placed = placedRectangleRepository.findByRollIdOrderByCreatedAtAsc(source.roll.getId());
            placed.stream()
                .filter(pr -> commandeItemId == null || !commandeItemId.equals(pr.getCommandeItemId()))
                .forEach(pr -> addOccupiedRect(occupied, pr.getXMm(), pr.getYMm(), pr.getWidthMm(), pr.getHeightMm()));
            if (commandeItemId != null) {
                List<OptimizationPlacement> optimizations = placementRepository
                    .findActivePlacementsExcludingItem(source.roll.getId(), null,
                        OptimizationPlanStatus.ACTIVE, commandeItemId, ACTIVE_COMMANDE_STATUSES);
                optimizations.forEach(op -> addOccupiedRect(occupied, op.getXMm(), op.getYMm(),
                    op.getWidthMm(), op.getHeightMm()));
            }
        } else if (source.wastePiece != null) {
            List<PlacedRectangle> placed = placedRectangleRepository.findByWastePieceIdOrderByCreatedAtAsc(source.wastePiece.getId());
            placed.stream()
                .filter(pr -> commandeItemId == null || !commandeItemId.equals(pr.getCommandeItemId()))
                .forEach(pr -> addOccupiedRect(occupied, pr.getXMm(), pr.getYMm(), pr.getWidthMm(), pr.getHeightMm()));
            if (commandeItemId != null) {
                List<OptimizationPlacement> optimizations = placementRepository
                    .findActivePlacementsExcludingItem(null, source.wastePiece.getId(),
                        OptimizationPlanStatus.ACTIVE, commandeItemId, ACTIVE_COMMANDE_STATUSES);
                optimizations.forEach(op -> addOccupiedRect(occupied, op.getXMm(), op.getYMm(),
                    op.getWidthMm(), op.getHeightMm()));
            }
        }

        occupiedCache.put(cacheKey, occupied);
        return occupied;
    }

    private void addOccupiedRect(List<FreeRect> occupied,
                                 Integer xMm,
                                 Integer yMm,
                                 Integer widthMm,
                                 Integer heightMm) {
        if (xMm == null || yMm == null || widthMm == null || heightMm == null) {
            return;
        }
        if (widthMm <= 0 || heightMm <= 0) {
            return;
        }
        occupied.add(new FreeRect(xMm, yMm, widthMm, heightMm));
    }

    private List<FreeRect> subtractOccupiedRect(List<FreeRect> freeRects, FreeRect occupied) {
        List<FreeRect> result = new ArrayList<>();
        for (FreeRect free : freeRects) {
            if (!overlaps(free, occupied)) {
                result.add(free);
                continue;
            }

            int freeRight = free.xMm + free.widthMm;
            int freeBottom = free.yMm + free.heightMm;
            int occRight = occupied.xMm + occupied.widthMm;
            int occBottom = occupied.yMm + occupied.heightMm;

            int ix1 = Math.max(free.xMm, occupied.xMm);
            int iy1 = Math.max(free.yMm, occupied.yMm);
            int ix2 = Math.min(freeRight, occRight);
            int iy2 = Math.min(freeBottom, occBottom);

            if (ix1 >= ix2 || iy1 >= iy2) {
                result.add(free);
                continue;
            }

            addFreeRect(result, free.xMm, free.yMm, occupied.xMm - free.xMm, free.heightMm);
            addFreeRect(result, occRight, free.yMm, freeRight - occRight, free.heightMm);
            addFreeRect(result, free.xMm, free.yMm, free.widthMm, occupied.yMm - free.yMm);
            addFreeRect(result, free.xMm, occBottom, free.widthMm, freeBottom - occBottom);
        }
        return pruneContainedRectangles(result);
    }

    private void addFreeRect(List<FreeRect> freeRects, int xMm, int yMm, int widthMm, int heightMm) {
        if (widthMm <= 0 || heightMm <= 0) {
            return;
        }
        freeRects.add(new FreeRect(xMm, yMm, widthMm, heightMm));
    }

    private List<FreeRect> pruneContainedRectangles(List<FreeRect> rects) {
        List<FreeRect> pruned = new ArrayList<>();
        for (FreeRect candidate : rects) {
            boolean contained = false;
            for (FreeRect other : rects) {
                if (candidate == other) {
                    continue;
                }
                if (containsRect(other, candidate)) {
                    contained = true;
                    break;
                }
            }
            if (!contained) {
                pruned.add(candidate);
            }
        }
        return pruned;
    }

    private boolean containsRect(FreeRect outer, FreeRect inner) {
        return inner.xMm >= outer.xMm
            && inner.yMm >= outer.yMm
            && inner.xMm + inner.widthMm <= outer.xMm + outer.widthMm
            && inner.yMm + inner.heightMm <= outer.yMm + outer.heightMm;
    }

    private boolean overlaps(FreeRect first, FreeRect second) {
        return first.xMm < second.xMm + second.widthMm
            && first.xMm + first.widthMm > second.xMm
            && first.yMm < second.yMm + second.heightMm
            && first.yMm + first.heightMm > second.yMm;
    }

    private OptimizationPlan buildPlan(OptimizationItemSnapshot item,
                                       OptimizationEngine.OptimizationResult run,
                                       String inputSignature,
                                       String stockSignature) {
        String svg = buildSuggestedSvg(run.sourcePlans(), item);

        return OptimizationPlan.builder()
            .commandeItemId(item.itemId())
            .algorithmVersion(ALGORITHM_VERSION)
            .inputSignature(inputSignature)
            .stockSignature(stockSignature)
            .totalPieces(run.totalPieces())
            .placedPieces(run.placedPieces())
            .sourceCount(run.sourcePlans().size())
            .usedAreaM2(run.usedAreaM2())
            .wasteAreaM2(run.wasteAreaM2())
            .utilizationPct(run.utilizationPct())
            .svg(svg)
            .build();
    }

    private void persistPlacements(OptimizationPlan plan, List<OptimizationEngine.PlacementResult> placements) {
        if (placements == null || placements.isEmpty()) {
            return;
        }

        List<OptimizationPlacement> entities = placements.stream()
            .map(record -> OptimizationPlacement.builder()
                .plan(plan)
                .sourceType(record.source().sourceType())
                .roll(record.source().rollId() != null ? rollRepository.getReferenceById(record.source().rollId()) : null)
                .wastePiece(record.source().wastePieceId() != null ? wastePieceRepository.getReferenceById(record.source().wastePieceId()) : null)
                .xMm(record.xMm())
                .yMm(record.yMm())
                .widthMm(record.widthMm())
                .heightMm(record.heightMm())
                .rotated(record.rotated())
                .pieceWidthMm(record.pieceWidthMm())
                .pieceLengthM(record.pieceLengthM())
                .areaM2(record.areaM2())
                .build())
            .toList();

        placementRepository.saveAll(entities);
    }

    private OptimizationMetrics computeActualMetrics(OptimizationItemSnapshot item) {
        BigDecimal usedArea = productionItemRepository.sumTotalAreaByCommandeItemId(item.itemId());
        if (usedArea == null) {
            usedArea = BigDecimal.ZERO;
        }

        Long producedQty = productionItemRepository.sumQuantityByCommandeItemIdExcludingId(item.itemId(), null);
        int placedPieces = producedQty != null ? producedQty.intValue() : 0;

        List<PlacedRectangle> placements = placedRectangleRepository.findByCommandeItemIdWithSources(item.itemId());
        Map<String, BigDecimal> sourceAreas = new HashMap<>();
        for (PlacedRectangle pr : placements) {
            if (pr.getRoll() != null) {
                sourceAreas.put("ROLL-" + pr.getRoll().getId(), safeArea(pr.getRoll().getAreaM2()));
            } else if (pr.getWastePiece() != null) {
                sourceAreas.put("WASTE-" + pr.getWastePiece().getId(), safeArea(pr.getWastePiece().getAreaM2()));
            }
        }

        BigDecimal totalSourceArea = sourceAreas.values().stream()
            .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal wasteArea = totalSourceArea.subtract(usedArea).max(BigDecimal.ZERO);
        BigDecimal utilization = totalSourceArea.compareTo(BigDecimal.ZERO) == 0
            ? BigDecimal.ZERO
            : usedArea.divide(totalSourceArea, 4, RoundingMode.HALF_UP).multiply(BigDecimal.valueOf(100));

        return new OptimizationMetrics(
            item.quantite() != null ? item.quantite() : 0,
            placedPieces,
            sourceAreas.size(),
            usedArea,
            wasteArea,
            utilization
        );
    }

    private OptimizationMetricsResponse toMetricsResponse(OptimizationMetrics metrics) {
        return OptimizationMetricsResponse.builder()
            .totalPieces(metrics.totalPieces)
            .placedPieces(metrics.placedPieces)
            .sourceCount(metrics.sourceCount)
            .usedAreaM2(metrics.usedAreaM2)
            .wasteAreaM2(metrics.wasteAreaM2)
            .utilizationPct(metrics.utilizationPct)
            .build();
    }

    private OptimizationPlanResponse toPlanResponse(OptimizationPlan plan) {
        OptimizationMetricsResponse metrics = OptimizationMetricsResponse.builder()
            .totalPieces(plan.getTotalPieces())
            .placedPieces(plan.getPlacedPieces())
            .sourceCount(plan.getSourceCount())
            .usedAreaM2(plan.getUsedAreaM2())
            .wasteAreaM2(plan.getWasteAreaM2())
            .utilizationPct(plan.getUtilizationPct())
            .build();

        List<OptimizationPlacement> placementsRaw = placementRepository.findByPlanIdWithSourcesOrderByCreatedAtAsc(plan.getId());
        List<OptimizationSourceReportResponse> sources = buildSuggestedSources(placementsRaw);
        List<OptimizationPlacementReportResponse> placements = buildSuggestedPlacements(placementsRaw);

        return OptimizationPlanResponse.builder()
            .suggestionId(plan.getId())
            .status(plan.getStatus().name())
            .metrics(metrics)
            .svg(plan.getSvg())
            .sources(sources)
            .placements(placements)
            .build();
    }

    private String buildSuggestedSvg(List<OptimizationEngine.SourcePlan> plans, OptimizationItemSnapshot item) {
        if (plans == null || plans.isEmpty()) {
            return null;
        }
        MaterialType materialType = parseMaterialType(item.materialType());
        MaterialChuteThreshold threshold = thresholdRepository.findByMaterialType(materialType).orElse(null);
        ThresholdSpec spec = threshold != null
            ? new ThresholdSpec(threshold.getMinWidthMm(), toLengthMm(threshold.getMinLengthM()))
            : new ThresholdSpec(0, 0);

        List<SvgGroup> groups = new ArrayList<>();
        for (OptimizationEngine.SourcePlan plan : plans) {
            List<SvgRect> placements = plan.placements().stream()
                .map(record -> SvgRect.fromPlacement(record.xMm(), record.yMm(),
                    record.widthMm(), record.heightMm(), "#8fd3ff", "#004d7a",
                    buildPlacementLabel(record.xMm(), record.yMm(),
                        record.widthMm(), record.heightMm())))
                .toList();

            List<SvgRect> wasteRects = plan.freeRects().stream()
                .map(rect -> buildWasteRect(rect.xMm(), rect.yMm(), rect.widthMm(), rect.heightMm(), spec))
                .toList();

            String sourceLabel = plan.source().sourceType() == OptimizationSourceType.WASTE ? "CHUTE" : "ROLL";
            String sourceDetails = buildSourceDetails(
                plan.source().reference(),
                plan.source().nbPlis(),
                plan.source().thicknessMm(),
                plan.source().widthMm(),
                toLengthMm(plan.source().lengthM())
            );
            groups.add(new SvgGroup(sourceLabel, sourceDetails,
                toLengthMm(plan.source().lengthM()), plan.source().widthMm(), placements, wasteRects));
        }

        return renderSvg(groups, false);
    }

    private String buildActualSvgFromPlacements(List<PlacedRectangle> placements) {
        if (placements == null || placements.isEmpty()) {
            return null;
        }

        Map<String, SvgGroupBuilder> builders = new LinkedHashMap<>();
        for (PlacedRectangle pr : placements) {
            if (pr.getRoll() != null) {
                String key = "ROLL-" + pr.getRoll().getId();
                builders.computeIfAbsent(key, k -> SvgGroupBuilder.fromRoll(pr.getRoll()));
                builders.get(key).placements.add(SvgRect.fromPlacement(pr.getXMm(), pr.getYMm(), pr.getWidthMm(), pr.getHeightMm(),
                    "#ffd39c", "#7a4a00", buildPlacementLabel(pr.getXMm(), pr.getYMm(),
                        pr.getWidthMm(), pr.getHeightMm())));
            } else if (pr.getWastePiece() != null) {
                String key = "WASTE-" + pr.getWastePiece().getId();
                builders.computeIfAbsent(key, k -> SvgGroupBuilder.fromWaste(pr.getWastePiece()));
                builders.get(key).placements.add(SvgRect.fromPlacement(pr.getXMm(), pr.getYMm(), pr.getWidthMm(), pr.getHeightMm(),
                    "#ffd39c", "#7a4a00", buildPlacementLabel(pr.getXMm(), pr.getYMm(),
                        pr.getWidthMm(), pr.getHeightMm())));
            }
        }

        List<SvgGroup> groups = builders.values().stream()
            .map(SvgGroupBuilder::build)
            .toList();

        return renderSvg(groups, false);
    }

    private List<OptimizationSourceReportResponse> buildActualSources(List<PlacedRectangle> placements) {
        if (placements == null || placements.isEmpty()) {
            return List.of();
        }
        Map<String, OptimizationSourceReportResponse> sources = new LinkedHashMap<>();
        for (PlacedRectangle pr : placements) {
            if (pr.getRoll() != null) {
                Roll r = pr.getRoll();
                String id = r.getId().toString();
                sources.putIfAbsent("ROLL-" + id, OptimizationSourceReportResponse.builder()
                    .sourceType("ROLL")
                    .sourceId(id)
                    .label("ROLL")
                    .reference(r.getReference())
                    .nbPlis(r.getNbPlis())
                    .thicknessMm(r.getThicknessMm())
                    .widthMm(r.getWidthMm())
                    .lengthM(r.getLengthM())
                    .colorName(r.getArticle().getColor()  != null ? r.getArticle().getColor() .getName() : null)
                    .colorHexCode(r.getArticle().getColor()  != null ? r.getArticle().getColor() .getHexCode() : null)
                    .qrCode(r.getQrCode())
                    .build());
            } else if (pr.getWastePiece() != null) {
                WastePiece w = pr.getWastePiece();
                String id = w.getId().toString();
                sources.putIfAbsent("WASTE-" + id, OptimizationSourceReportResponse.builder()
                    .sourceType("WASTE_PIECE")
                    .sourceId(id)
                    .label("CHUTE")
                    .reference(w.getReference())
                    .nbPlis(w.getNbPlis())
                    .thicknessMm(w.getThicknessMm())
                    .widthMm(w.getWidthMm())
                    .lengthM(w.getLengthM())
                    .colorName(w.getArticle().getColor()  != null ? w.getArticle().getColor() .getName() : null)
                    .colorHexCode(w.getArticle().getColor()  != null ? w.getArticle().getColor() .getHexCode() : null)
                    .qrCode(w.getQrCode())
                    .build());
            }
        }
        return new ArrayList<>(sources.values());
    }

    private List<OptimizationPlacementReportResponse> buildActualPlacements(List<PlacedRectangle> placements) {
        if (placements == null || placements.isEmpty()) {
            return List.of();
        }
        List<OptimizationPlacementReportResponse> results = new ArrayList<>();
        for (PlacedRectangle pr : placements) {
            String sourceType = pr.getRoll() != null ? "ROLL" : "WASTE_PIECE";
            String sourceId = pr.getRoll() != null
                ? pr.getRoll().getId().toString()
                : pr.getWastePiece() != null ? pr.getWastePiece().getId().toString() : null;
            results.add(OptimizationPlacementReportResponse.builder()
                .sourceType(sourceType)
                .sourceId(sourceId)
                .xMm(pr.getXMm())
                .yMm(pr.getYMm())
                .widthMm(pr.getWidthMm())
                .heightMm(pr.getHeightMm())
                .placementColorName(pr.getColor()  != null ? pr.getColor() .getName() : null)
                .placementColorHexCode(pr.getColor()  != null ? pr.getColor() .getHexCode() : null)
                .qrCode(buildPlacementQrCode(
                    sourceType,
                    sourceId,
                    pr.getXMm(),
                    pr.getYMm(),
                    pr.getWidthMm(),
                    pr.getHeightMm(),
                    null,
                    null,
                    null,
                    null,
                    pr.getColor()  != null ? pr.getColor() .getName() : null,
                    pr.getColor()  != null ? pr.getColor() .getHexCode() : null
                ))
                .build());
        }
        return results;
    }

    private List<OptimizationSourceReportResponse> buildSuggestedSources(List<OptimizationPlacement> placements) {
        if (placements == null || placements.isEmpty()) {
            return List.of();
        }
        Map<String, OptimizationSourceReportResponse> sources = new LinkedHashMap<>();
        for (OptimizationPlacement op : placements) {
            if (op.getRoll() != null) {
                Roll r = op.getRoll();
                String id = r.getId().toString();
                sources.putIfAbsent("ROLL-" + id, OptimizationSourceReportResponse.builder()
                    .sourceType("ROLL")
                    .sourceId(id)
                    .label("ROLL")
                    .reference(r.getReference())
                    .nbPlis(r.getNbPlis())
                    .thicknessMm(r.getThicknessMm())
                    .widthMm(r.getWidthMm())
                    .lengthM(r.getLengthM())
                    .colorName(r.getArticle().getColor()  != null ? r.getArticle().getColor() .getName() : null)
                    .colorHexCode(r.getArticle().getColor()  != null ? r.getArticle().getColor() .getHexCode() : null)
                    .qrCode(r.getQrCode())
                    .build());
            } else if (op.getWastePiece() != null) {
                WastePiece w = op.getWastePiece();
                String id = w.getId().toString();
                sources.putIfAbsent("WASTE-" + id, OptimizationSourceReportResponse.builder()
                    .sourceType("WASTE_PIECE")
                    .sourceId(id)
                    .label("CHUTE")
                    .reference(w.getReference())
                    .nbPlis(w.getNbPlis())
                    .thicknessMm(w.getThicknessMm())
                    .widthMm(w.getWidthMm())
                    .lengthM(w.getLengthM())
                    .colorName(w.getArticle().getColor()  != null ? w.getArticle().getColor() .getName() : null)
                    .colorHexCode(w.getArticle().getColor()  != null ? w.getArticle().getColor() .getHexCode() : null)
                    .qrCode(w.getQrCode())
                    .build());
            }
        }
        return new ArrayList<>(sources.values());
    }

    private List<OptimizationPlacementReportResponse> buildSuggestedPlacements(List<OptimizationPlacement> placements) {
        if (placements == null || placements.isEmpty()) {
            return List.of();
        }
        List<OptimizationPlacementReportResponse> results = new ArrayList<>();
        for (OptimizationPlacement op : placements) {
            String sourceType = op.getRoll() != null ? "ROLL" : "WASTE_PIECE";
            String sourceId = op.getRoll() != null
                ? op.getRoll().getId().toString()
                : op.getWastePiece() != null ? op.getWastePiece().getId().toString() : null;
            results.add(OptimizationPlacementReportResponse.builder()
                .sourceType(sourceType)
                .sourceId(sourceId)
                .xMm(op.getXMm())
                .yMm(op.getYMm())
                .widthMm(op.getWidthMm())
                .heightMm(op.getHeightMm())
                .rotated(op.getRotated())
                .pieceWidthMm(op.getPieceWidthMm())
                .pieceLengthM(op.getPieceLengthM())
                .areaM2(op.getAreaM2())
                .qrCode(buildPlacementQrCode(
                    sourceType,
                    sourceId,
                    op.getXMm(),
                    op.getYMm(),
                    op.getWidthMm(),
                    op.getHeightMm(),
                    op.getRotated(),
                    op.getPieceWidthMm(),
                    op.getPieceLengthM(),
                    op.getAreaM2(),
                    null,
                    null
                ))
                .build());
        }
        return results;
    }

    private String buildPlacementQrCode(String sourceType,
                                        String sourceId,
                                        Integer xMm,
                                        Integer yMm,
                                        Integer widthMm,
                                        Integer heightMm,
                                        Boolean rotated,
                                        Integer pieceWidthMm,
                                        BigDecimal pieceLengthM,
                                        BigDecimal areaM2,
                                        String colorName,
                                        String colorHexCode) {
        return qrCodeService.generateForPlacement(
            sourceType,
            sourceId,
            xMm,
            yMm,
            widthMm,
            heightMm,
            rotated,
            pieceWidthMm,
            pieceLengthM,
            areaM2,
            colorName,
            colorHexCode
        );
    }

    private String renderSvg(List<SvgGroup> groups, boolean includeWaste) {

        int totalHeight = groups.stream().mapToInt(g -> g.heightMm).sum();
        int maxWidth = groups.stream().mapToInt(g -> g.widthMm).max().orElse(0);
        int paddedHeight = totalHeight + Math.max(0, groups.size() - 1) * SVG_PADDING;

        StringBuilder svg = new StringBuilder();
        svg.append("<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 ")
            .append(maxWidth).append(" ").append(paddedHeight).append("\">");

        int offsetY = 0;
        int index = 1;
        for (SvgGroup group : groups) {
            int headerHeight = Math.min(group.heightMm, Math.max(120, group.heightMm / 12));
            int titleFont = Math.max(28, headerHeight / 2);
            int detailsFont = Math.max(20, headerHeight / 3);
            int titleY = Math.min(headerHeight - (detailsFont + 10), titleFont + 8);
            int detailsY = Math.min(headerHeight - 8, titleY + detailsFont + 10);

            svg.append("<g transform=\"translate(0,").append(offsetY).append(")\">");
            svg.append("<rect x=\"0\" y=\"0\" width=\"")
                .append(group.widthMm).append("\" height=\"")
                .append(group.heightMm)
                .append("\" fill=\"#f4f4f4\" stroke=\"#333\" stroke-width=\"2\" vector-effect=\"non-scaling-stroke\"/>");
            svg.append("<rect x=\"0\" y=\"0\" width=\"")
                .append(group.widthMm).append("\" height=\"").append(headerHeight)
                .append("\" fill=\"#ffffff\" opacity=\"0.85\"/>");
            svg.append("<text x=\"8\" y=\"").append(titleY)
                .append("\" font-size=\"").append(titleFont)
                .append("\" fill=\"#222\" font-weight=\"700\">")
                .append(escape(group.label)).append(" #").append(index).append("</text>");
            if (group.details != null && !group.details.isBlank()) {
                svg.append("<text x=\"8\" y=\"").append(detailsY)
                    .append("\" font-size=\"").append(detailsFont)
                    .append("\" fill=\"#444\">")
                    .append(escape(group.details)).append("</text>");
            }

            if (includeWaste) {
                for (SvgRect rect : group.wasteRects) {
                    svg.append(rect.toSvg());
                }
            }

            for (SvgRect rect : group.placements) {
                svg.append(rect.toSvg());
            }

            svg.append("</g>");
            offsetY += group.heightMm + SVG_PADDING;
            index++;
        }

        svg.append("</svg>");
        return svg.toString();
    }

    private SvgRect buildWasteRect(int xMm, int yMm, int widthMm, int heightMm, ThresholdSpec spec) {
        boolean reusable = widthMm >= spec.minWidthMm && heightMm >= spec.minLengthMm;
        String fill = reusable ? "#c8f7c5" : "#e0e0e0";
        String stroke = reusable ? "#2f7a2f" : "#9a9a9a";
        return SvgRect.fromPlacement(xMm, yMm, widthMm, heightMm, fill, stroke, 0.3,
            buildPlacementLabel(xMm, yMm, widthMm, heightMm));
    }

    private String buildPlacementLabel(int xMm, int yMm, int widthMm, int heightMm) {
        if (widthMm <= 0 || heightMm <= 0) {
            return null;
        }
        return "x:" + xMm + " y:" + yMm + " " + widthMm + "x" + heightMm + "mm";
    }

    private static String buildSourceDetails(String reference, Integer nbPlis, BigDecimal thicknessMm,
                                             int widthMm, int lengthMm) {
        String refLabel = reference != null && !reference.isBlank() ? reference : "N/A";
        String plisLabel = nbPlis != null ? nbPlis.toString() : "-";
        String thicknessLabel = thicknessMm != null
            ? thicknessMm.stripTrailingZeros().toPlainString()
            : "-";
        BigDecimal lengthM = BigDecimal.valueOf(lengthMm)
            .divide(BigDecimal.valueOf(1000), 3, RoundingMode.HALF_UP)
            .stripTrailingZeros();
        return "Ref: " + refLabel + " | Plis: " + plisLabel + " | Thk: " + thicknessLabel
            + "mm | W: " + widthMm + "mm | L: " + lengthM + "m";
    }

    private MaterialType parseMaterialType(String materialType) {
        if (materialType == null) {
            throw new IllegalArgumentException("Material type is required");
        }
        return MaterialType.valueOf(materialType.trim().toUpperCase(Locale.ROOT));
    }

    private boolean matchesCommonFilters(UUID requiredArticleId,
                                         MaterialType requiredMaterial,
                                         Integer requiredPlis,
                                         BigDecimal requiredThickness,
                                         UUID requiredColorId,
                                         String requiredReference,
                                         UUID articleId,
                                         MaterialType material,
                                         Integer nbPlis,
                                         BigDecimal thickness,
                                         UUID colorId,
                                         String reference) {
        if (requiredArticleId != null) {
            return requiredArticleId.equals(articleId)
                && (requiredColorId == null || requiredColorId.equals(colorId));
        }
        if (material != requiredMaterial) {
            return false;
        }
        if (requiredPlis != null && !requiredPlis.equals(nbPlis)) {
            return false;
        }
        if (requiredThickness != null) {
            if (thickness == null || requiredThickness.compareTo(thickness) != 0) {
                return false;
            }
        }
        if (requiredColorId != null && !requiredColorId.equals(colorId)) {
            return false;
        }
        if (requiredReference != null) {
            String normalizedRef = normalize(reference);
            if (normalizedRef == null || !requiredReference.equalsIgnoreCase(normalizedRef)) {
                return false;
            }
        }
        return true;
    }

    private String normalize(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    private int toLengthMm(BigDecimal lengthM) {
        if (lengthM == null) {
            return 0;
        }
        return lengthM.multiply(BigDecimal.valueOf(1000))
            .setScale(0, RoundingMode.HALF_UP)
            .intValue();
    }

    private BigDecimal toAreaM2(int widthMm, int lengthMm) {
        return BigDecimal.valueOf(widthMm)
            .multiply(BigDecimal.valueOf(lengthMm))
            .divide(BigDecimal.valueOf(1_000_000), 4, RoundingMode.HALF_UP);
    }

    private BigDecimal safeArea(BigDecimal value) {
        return value != null ? value : BigDecimal.ZERO;
    }

    private static String escape(String value) {
        if (value == null) {
            return "";
        }
        return value.replace("&", "&amp;")
            .replace("<", "&lt;")
            .replace(">", "&gt;")
            .replace("\"", "&quot;")
            .replace("'", "&apos;");
    }

    private static class Piece {
        private final int id;
        private final int widthMm;
        private final int lengthMm;
        private final BigDecimal lengthM;
        private final BigDecimal areaM2;

        private Piece(int id, int widthMm, int lengthMm, BigDecimal lengthM, BigDecimal areaM2) {
            this.id = id;
            this.widthMm = widthMm;
            this.lengthMm = lengthMm;
            this.lengthM = lengthM;
            this.areaM2 = areaM2;
        }

        private int maxSide() {
            return Math.max(widthMm, lengthMm);
        }
    }

    private static class SourceCandidate {
        private final OptimizationSourceType type;
        private final Roll roll;
        private final WastePiece wastePiece;
        private final int widthMm;
        private final int heightMm;
        private final BigDecimal availableAreaM2;
        private final BigDecimal fullAreaM2;
        private final String label;
        private final String reference;
        private final Integer nbPlis;
        private final BigDecimal thicknessMm;
        private final Long ageDays;

        private SourceCandidate(OptimizationSourceType type,
                                Roll roll,
                                WastePiece wastePiece,
                                int widthMm,
                                int heightMm,
                                BigDecimal availableAreaM2,
                                BigDecimal fullAreaM2,
                                String label,
                                String reference,
                                Integer nbPlis,
                                BigDecimal thicknessMm,
                                Long ageDays) {
            this.type = type;
            this.roll = roll;
            this.wastePiece = wastePiece;
            this.widthMm = widthMm;
            this.heightMm = heightMm;
            this.availableAreaM2 = availableAreaM2;
            this.fullAreaM2 = fullAreaM2;
            this.label = label;
            this.reference = reference;
            this.nbPlis = nbPlis;
            this.thicknessMm = thicknessMm;
            this.ageDays = ageDays;
        }

        static SourceCandidate fromRoll(Roll roll) {
            int width = roll.getWidthRemainingMm() != null ? roll.getWidthRemainingMm() : roll.getWidthMm();
            int height = toLengthMmStatic(roll.getLengthRemainingM() != null ? roll.getLengthRemainingM() : roll.getLengthM());
            BigDecimal available = roll.getAvailableAreaM2() != null ? roll.getAvailableAreaM2() : roll.getAreaM2();
            BigDecimal full = roll.getAreaM2() != null ? roll.getAreaM2() : BigDecimal.ZERO;
            Long age = roll.getReceivedDate() != null
                ? ChronoUnit.DAYS.between(roll.getReceivedDate(), LocalDate.now())
                : 0L;
            String reference = roll.getReference() != null ? roll.getReference() : roll.getId().toString();
            return new SourceCandidate(OptimizationSourceType.ROLL, roll, null, width, height, available, full,
                "ROLL", reference, roll.getNbPlis(), roll.getThicknessMm(), age);
        }

        static SourceCandidate fromWaste(WastePiece wastePiece) {
            int width = wastePiece.getWidthRemainingMm() != null ? wastePiece.getWidthRemainingMm() : wastePiece.getWidthMm();
            int height = toLengthMmStatic(wastePiece.getLengthRemainingM() != null ? wastePiece.getLengthRemainingM() : wastePiece.getLengthM());
            BigDecimal available = wastePiece.getAvailableAreaM2() != null ? wastePiece.getAvailableAreaM2() : wastePiece.getAreaM2();
            BigDecimal full = wastePiece.getAreaM2() != null ? wastePiece.getAreaM2() : BigDecimal.ZERO;
            String reference = wastePiece.getReference() != null ? wastePiece.getReference() : wastePiece.getId().toString();
            return new SourceCandidate(OptimizationSourceType.WASTE, null, wastePiece, width, height, available, full,
                "CHUTE", reference, wastePiece.getNbPlis(), wastePiece.getThicknessMm(), 0L);
        }

        boolean canFit(CommandeItem item) {
            int pieceWidth = item.getLargeurMm();
            int pieceLength = toLengthMmStatic(item.getLongueurM());
            return (pieceWidth <= widthMm && pieceLength <= heightMm)
                || (pieceLength <= widthMm && pieceWidth <= heightMm);
        }

        BigDecimal effectiveAreaM2() {
            if (availableAreaM2 != null && availableAreaM2.compareTo(BigDecimal.ZERO) > 0) {
                return availableAreaM2;
            }
            return fullAreaM2 != null ? fullAreaM2 : BigDecimal.ZERO;
        }

        double priorityScore() {
            double score = type == OptimizationSourceType.WASTE ? 2000.0 : 0.0;
            if (type == OptimizationSourceType.ROLL && ageDays != null) {
                score += ageDays * 0.5;
            }
            return score;
        }

        double fifoScore() {
            return ageDays != null ? ageDays : 0.0;
        }

        String label() {
            return label;
        }

        String details() {
            return buildSourceDetails(reference, nbPlis, thicknessMm, widthMm, heightMm);
        }

        String sourceId() {
            if (roll != null) {
                return roll.getId().toString();
            }
            if (wastePiece != null) {
                return wastePiece.getId().toString();
            }
            return "unknown";
        }

        static int toLengthMmStatic(BigDecimal lengthM) {
            if (lengthM == null) {
                return 0;
            }
            return lengthM.multiply(BigDecimal.valueOf(1000))
                .setScale(0, RoundingMode.HALF_UP)
                .intValue();
        }
    }

    private static class FreeRect {
        private final int xMm;
        private final int yMm;
        private final int widthMm;
        private final int heightMm;

        private FreeRect(int xMm, int yMm, int widthMm, int heightMm) {
            this.xMm = xMm;
            this.yMm = yMm;
            this.widthMm = widthMm;
            this.heightMm = heightMm;
        }

        private int area() {
            return widthMm * heightMm;
        }
    }

    private static class PlacementChoice {
        private final FreeRect rect;
        private final int widthMm;
        private final int heightMm;
        private final boolean rotated;
        private final int waste;

        private PlacementChoice(FreeRect rect, int widthMm, int heightMm, boolean rotated, int waste) {
            this.rect = rect;
            this.widthMm = widthMm;
            this.heightMm = heightMm;
            this.rotated = rotated;
            this.waste = waste;
        }
    }

    private static class PlacementRecord {
        private final Piece piece;
        private final SourceCandidate source;
        private final PlacementChoice choice;

        private PlacementRecord(Piece piece, SourceCandidate source, PlacementChoice choice) {
            this.piece = piece;
            this.source = source;
            this.choice = choice;
        }
    }

    private static class SourcePlan {
        private final SourceCandidate source;
        private final List<PlacementRecord> placements;
        private final List<FreeRect> freeRects;
        private final Set<Integer> placedPieceIds;
        private final BigDecimal usedAreaM2;
        private final BigDecimal wasteAreaM2;
        private final BigDecimal utilizationPct;
        private final double score;
        private final int placedPieces;

        private SourcePlan(SourceCandidate source,
                           List<PlacementRecord> placements,
                           List<FreeRect> freeRects,
                           Set<Integer> placedPieceIds,
                           BigDecimal usedAreaM2,
                           BigDecimal wasteAreaM2,
                           BigDecimal utilizationPct,
                           double score) {
            this.source = source;
            this.placements = placements;
            this.freeRects = freeRects;
            this.placedPieceIds = placedPieceIds;
            this.usedAreaM2 = usedAreaM2;
            this.wasteAreaM2 = wasteAreaM2;
            this.utilizationPct = utilizationPct;
            this.score = score;
            this.placedPieces = placements != null ? placements.size() : 0;
        }
    }

    private static class OptimizationRun {
        private final List<PlacementRecord> placements;
        private final List<SourcePlan> selectedPlans;
        private final int totalPieces;
        private final int placedPieces;

        private OptimizationRun(List<PlacementRecord> placements,
                                List<SourcePlan> selectedPlans,
                                int totalPieces,
                                int placedPieces) {
            this.placements = placements;
            this.selectedPlans = selectedPlans;
            this.totalPieces = totalPieces;
            this.placedPieces = placedPieces;
        }

        private BigDecimal usedAreaM2() {
            return placements.stream()
                .map(record -> record.piece.areaM2)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        }

        private BigDecimal totalSourceAreaM2() {
            return selectedPlans.stream()
                .map(plan -> plan.source.effectiveAreaM2())
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        }
    }

    private static class OptimizationMetrics {
        private final int totalPieces;
        private final int placedPieces;
        private final int sourceCount;
        private final BigDecimal usedAreaM2;
        private final BigDecimal wasteAreaM2;
        private final BigDecimal utilizationPct;

        private OptimizationMetrics(int totalPieces,
                                    int placedPieces,
                                    int sourceCount,
                                    BigDecimal usedAreaM2,
                                    BigDecimal wasteAreaM2,
                                    BigDecimal utilizationPct) {
            this.totalPieces = totalPieces;
            this.placedPieces = placedPieces;
            this.sourceCount = sourceCount;
            this.usedAreaM2 = usedAreaM2;
            this.wasteAreaM2 = wasteAreaM2;
            this.utilizationPct = utilizationPct;
        }
    }

    private static class SvgRect {
        private final int x;
        private final int y;
        private final int width;
        private final int height;
        private final String fill;
        private final String stroke;
        private final double opacity;
        private final String label;

        private SvgRect(int x, int y, int width, int height, String fill, String stroke) {
            this(x, y, width, height, fill, stroke, 0.9, null);
        }

        private SvgRect(int x, int y, int width, int height, String fill, String stroke, double opacity) {
            this(x, y, width, height, fill, stroke, opacity, null);
        }

        private SvgRect(int x, int y, int width, int height, String fill, String stroke, String label) {
            this(x, y, width, height, fill, stroke, 0.9, label);
        }

        private SvgRect(int x, int y, int width, int height, String fill, String stroke, double opacity, String label) {
            this.x = x;
            this.y = y;
            this.width = width;
            this.height = height;
            this.fill = fill;
            this.stroke = stroke;
            this.opacity = opacity;
            this.label = label;
        }

        /**
         * Placement coordinates are stored as (x along source width, y along source length).
         * For visualization we render length on X axis and width on Y axis, so we swap axes.
         */
        private static SvgRect fromPlacement(int xMm, int yMm, int widthMm, int heightMm, String fill, String stroke, String label) {
            return new SvgRect(yMm, xMm, heightMm, widthMm, fill, stroke, label);
        }

        private static SvgRect fromPlacement(int xMm, int yMm, int widthMm, int heightMm, String fill, String stroke, double opacity, String label) {
            return new SvgRect(yMm, xMm, heightMm, widthMm, fill, stroke, opacity, label);
        }

        private String toSvg() {
            StringBuilder output = new StringBuilder();
            output.append("<g>");
            if (label != null && !label.isBlank()) {
                output.append("<title>").append(escape(label)).append("</title>");
            }
            output.append("<rect x=\"").append(x).append("\" y=\"").append(y)
                .append("\" width=\"").append(width).append("\" height=\"").append(height)
                .append("\" fill=\"").append(fill).append("\" stroke=\"").append(stroke)
                .append("\" stroke-width=\"1\" vector-effect=\"non-scaling-stroke\" opacity=\"").append(opacity).append("\"/>");

            if (label != null && !label.isBlank()) {
                // Only draw inline text when the rectangle is big enough; tooltip is always present.
                int fontSize = Math.max(14, Math.min(60, Math.min(width, height) / 6));
                int minTextWidth = Math.min(520, Math.max(140, (int) Math.ceil(label.length() * (fontSize * 0.55))));
                if (width < minTextWidth || height < (fontSize + 10)) {
                    output.append("</g>");
                    return output.toString();
                }
                int textX = x + Math.max(4, fontSize / 4);
                int textY = y + fontSize + Math.max(4, fontSize / 4);
                int bgX = textX - Math.max(2, fontSize / 6);
                int bgY = textY - (fontSize + Math.max(4, fontSize / 5));
                int bgWidth = minTextWidth;
                int bgHeight = fontSize + Math.max(6, fontSize / 3);
                output.append("<rect x=\"").append(bgX).append("\" y=\"").append(bgY)
                    .append("\" width=\"").append(bgWidth).append("\" height=\"").append(bgHeight)
                    .append("\" fill=\"#ffffff\" opacity=\"0.8\"/>" );
                output.append("<text x=\"").append(textX).append("\" y=\"").append(textY)
                    .append("\" font-size=\"").append(fontSize).append("\" fill=\"#111\" opacity=\"0.95\" font-weight=\"700\">")
                    .append(escape(label))
                    .append("</text>");
            }

            output.append("</g>");
            return output.toString();
        }
    }

    private static class SvgGroup {
        private final String label;
        private final String details;
        private final int widthMm;
        private final int heightMm;
        private final List<SvgRect> placements;
        private final List<SvgRect> wasteRects;

        private SvgGroup(String label, String details, int widthMm, int heightMm,
                         List<SvgRect> placements, List<SvgRect> wasteRects) {
            this.label = label;
            this.details = details;
            this.widthMm = widthMm;
            this.heightMm = heightMm;
            this.placements = placements != null ? placements : List.of();
            this.wasteRects = wasteRects != null ? wasteRects : List.of();
        }
    }

    private static class SvgGroupBuilder {
        private final String label;
        private final String details;
        private final int widthMm;
        private final int heightMm;
        private final List<SvgRect> placements = new ArrayList<>();

        private SvgGroupBuilder(String label, String details, int widthMm, int heightMm) {
            this.label = label;
            this.details = details;
            this.widthMm = widthMm;
            this.heightMm = heightMm;
        }

        static SvgGroupBuilder fromRoll(Roll roll) {
            int width = roll.getWidthRemainingMm() != null ? roll.getWidthRemainingMm() : roll.getWidthMm();
            int length = SourceCandidate.toLengthMmStatic(roll.getLengthRemainingM() != null ? roll.getLengthRemainingM() : roll.getLengthM());
            String reference = roll.getReference() != null ? roll.getReference() : roll.getId().toString();
            String details = buildSourceDetails(reference, roll.getNbPlis(), roll.getThicknessMm(), width, length);
            // Render length on X axis and width on Y axis.
            return new SvgGroupBuilder("ROLL", details, length, width);
        }

        static SvgGroupBuilder fromWaste(WastePiece wastePiece) {
            int width = wastePiece.getWidthRemainingMm() != null ? wastePiece.getWidthRemainingMm() : wastePiece.getWidthMm();
            int length = SourceCandidate.toLengthMmStatic(wastePiece.getLengthRemainingM() != null ? wastePiece.getLengthRemainingM() : wastePiece.getLengthM());
            String reference = wastePiece.getReference() != null ? wastePiece.getReference() : wastePiece.getId().toString();
            String details = buildSourceDetails(reference, wastePiece.getNbPlis(), wastePiece.getThicknessMm(), width, length);
            // Render length on X axis and width on Y axis.
            return new SvgGroupBuilder("CHUTE", details, length, width);
        }

        SvgGroup build() {
            return new SvgGroup(label, details, widthMm, heightMm, placements, List.of());
        }
    }

    private static class ThresholdSpec {
        private final int minWidthMm;
        private final int minLengthMm;

        private ThresholdSpec(int minWidthMm, int minLengthMm) {
            this.minWidthMm = minWidthMm;
            this.minLengthMm = minLengthMm;
        }
    }
}
