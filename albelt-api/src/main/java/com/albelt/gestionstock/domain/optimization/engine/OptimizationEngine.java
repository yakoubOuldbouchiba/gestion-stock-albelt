package com.albelt.gestionstock.domain.optimization.engine;

import com.albelt.gestionstock.domain.optimization.data.OptimizationItemSnapshot;
import com.albelt.gestionstock.domain.optimization.data.OptimizationOccupiedRectSnapshot;
import com.albelt.gestionstock.domain.optimization.data.OptimizationSourceSnapshot;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;

@Component
@RequiredArgsConstructor
public class OptimizationEngine {

    public OptimizationResult optimize(OptimizationItemSnapshot item,
                                       List<OptimizationSourceSnapshot> orderedSources,
                                       java.util.Map<UUID, List<OptimizationOccupiedRectSnapshot>> occupiedBySource) {
        List<Piece> remainingPieces = buildPieces(item);
        List<SourcePlan> sourcePlans = new ArrayList<>();
        List<PlacementResult> placements = new ArrayList<>();

        for (OptimizationSourceSnapshot source : orderedSources) {
            if (remainingPieces.isEmpty()) {
                break;
            }

            SourcePlan plan = packSource(source, remainingPieces, occupiedBySource.getOrDefault(source.sourceId(), List.of()));
            if (plan.placements().isEmpty()) {
                continue;
            }

            sourcePlans.add(plan);
            placements.addAll(plan.placements());
            Set<Integer> placedIds = new HashSet<>(plan.placements().stream().map(PlacementResult::pieceIndex).toList());
            remainingPieces.removeIf(piece -> placedIds.contains(piece.index()));
        }

        BigDecimal usedArea = placements.stream()
            .map(PlacementResult::areaM2)
            .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal totalSourceArea = sourcePlans.stream()
            .map(SourcePlan::effectiveAreaM2)
            .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal wasteArea = totalSourceArea.subtract(usedArea).max(BigDecimal.ZERO);
        BigDecimal utilization = totalSourceArea.compareTo(BigDecimal.ZERO) == 0
            ? BigDecimal.ZERO
            : usedArea.divide(totalSourceArea, 4, RoundingMode.HALF_UP).multiply(BigDecimal.valueOf(100));

        return new OptimizationResult(
            item.quantite() != null ? item.quantite() : 0,
            placements.size(),
            sourcePlans,
            placements,
            usedArea,
            wasteArea,
            utilization
        );
    }

    private List<Piece> buildPieces(OptimizationItemSnapshot item) {
        if (item.quantite() == null || item.quantite() <= 0 || item.largeurMm() == null || item.longueurM() == null) {
            return List.of();
        }

        int lengthMm = item.longueurM().multiply(BigDecimal.valueOf(1000))
            .setScale(0, RoundingMode.HALF_UP)
            .intValue();
        BigDecimal areaM2 = toAreaM2(item.largeurMm(), lengthMm);

        List<Piece> pieces = new ArrayList<>();
        for (int i = 0; i < item.quantite(); i++) {
            pieces.add(new Piece(i, item.largeurMm(), lengthMm, item.longueurM(), areaM2));
        }

        pieces.sort(Comparator
            .comparing(Piece::areaM2).reversed()
            .thenComparing(Piece::widthMm).reversed()
            .thenComparing(Piece::lengthMm).reversed());
        return pieces;
    }

    private SourcePlan packSource(OptimizationSourceSnapshot source,
                                  List<Piece> remainingPieces,
                                  List<OptimizationOccupiedRectSnapshot> occupiedRects) {
        List<FreeRect> freeRects = buildFreeRects(source, occupiedRects);
        List<PlacementResult> placements = new ArrayList<>();
        int minPieceArea = remainingPieces.stream()
            .mapToInt(piece -> piece.widthMm() * piece.lengthMm())
            .min()
            .orElse(0);

        for (Piece piece : remainingPieces) {
            PlacementChoice choice = findBestPlacement(piece, freeRects, minPieceArea);
            if (choice == null) {
                continue;
            }

            placements.add(new PlacementResult(
                source,
                piece.index(),
                choice.xMm(),
                choice.yMm(),
                choice.placedWidthMm(),
                choice.placedHeightMm(),
                choice.rotated(),
                piece.widthMm(),
                piece.lengthM(),
                piece.areaM2()
            ));

            FreeRect selected = choice.freeRect();
            freeRects.remove(selected);
            freeRects.addAll(splitRect(selected, choice.placedWidthMm(), choice.placedHeightMm()));
            freeRects = pruneContainedRectangles(freeRects);
            freeRects.sort(Comparator.comparingInt(FreeRect::yMm).thenComparingInt(FreeRect::xMm));
        }

        BigDecimal usedArea = placements.stream()
            .map(PlacementResult::areaM2)
            .reduce(BigDecimal.ZERO, BigDecimal::add);

        return new SourcePlan(source, placements, freeRects, source.effectiveAreaM2(), usedArea);
    }

    private PlacementChoice findBestPlacement(Piece piece, List<FreeRect> freeRects, int minPieceArea) {
        PlacementChoice best = null;
        for (FreeRect rect : freeRects) {
            best = chooseBetter(best, tryPlace(piece, rect, false, minPieceArea));
            best = chooseBetter(best, tryPlace(piece, rect, true, minPieceArea));
        }
        return best;
    }

    private PlacementChoice tryPlace(Piece piece, FreeRect rect, boolean rotated, int minPieceArea) {
        int placedWidth = rotated ? piece.lengthMm() : piece.widthMm();
        int placedHeight = rotated ? piece.widthMm() : piece.lengthMm();
        if (placedWidth > rect.widthMm() || placedHeight > rect.heightMm()) {
            return null;
        }

        int rightWasteArea = Math.max(0, rect.widthMm() - placedWidth) * placedHeight;
        int topWasteArea = rect.widthMm() * Math.max(0, rect.heightMm() - placedHeight);
        int fragmentationPenalty = 0;
        if (rightWasteArea > 0 && rightWasteArea < minPieceArea) {
            fragmentationPenalty += rightWasteArea;
        }
        if (topWasteArea > 0 && topWasteArea < minPieceArea) {
            fragmentationPenalty += topWasteArea;
        }

        return new PlacementChoice(
            rect,
            rect.xMm(),
            rect.yMm(),
            placedWidth,
            placedHeight,
            rotated,
            fragmentationPenalty
        );
    }

    private PlacementChoice chooseBetter(PlacementChoice current, PlacementChoice candidate) {
        if (candidate == null) {
            return current;
        }
        if (current == null) {
            return candidate;
        }

        if (candidate.yMm() != current.yMm()) {
            return candidate.yMm() < current.yMm() ? candidate : current;
        }
        if (candidate.xMm() != current.xMm()) {
            return candidate.xMm() < current.xMm() ? candidate : current;
        }
        if (candidate.fragmentationPenalty() != current.fragmentationPenalty()) {
            return candidate.fragmentationPenalty() < current.fragmentationPenalty() ? candidate : current;
        }

        int candidateGap = Math.abs(candidate.freeRect().widthMm() - candidate.placedWidthMm())
            + Math.abs(candidate.freeRect().heightMm() - candidate.placedHeightMm());
        int currentGap = Math.abs(current.freeRect().widthMm() - current.placedWidthMm())
            + Math.abs(current.freeRect().heightMm() - current.placedHeightMm());
        return candidateGap < currentGap ? candidate : current;
    }

    private List<FreeRect> buildFreeRects(OptimizationSourceSnapshot source,
                                          List<OptimizationOccupiedRectSnapshot> occupiedRects) {
        List<FreeRect> freeRects = new ArrayList<>();
        freeRects.add(new FreeRect(0, 0, source.widthMm(), source.lengthMm()));

        for (OptimizationOccupiedRectSnapshot occupiedRect : occupiedRects) {
            if (occupiedRect.xMm() == null || occupiedRect.yMm() == null
                || occupiedRect.widthMm() == null || occupiedRect.heightMm() == null) {
                continue;
            }
            freeRects = subtractOccupiedRect(
                freeRects,
                new FreeRect(occupiedRect.xMm(), occupiedRect.yMm(), occupiedRect.widthMm(), occupiedRect.heightMm())
            );
            if (freeRects.isEmpty()) {
                break;
            }
        }

        freeRects.sort(Comparator.comparingInt(FreeRect::yMm).thenComparingInt(FreeRect::xMm));
        return freeRects;
    }

    private List<FreeRect> subtractOccupiedRect(List<FreeRect> freeRects, FreeRect occupied) {
        List<FreeRect> result = new ArrayList<>();
        for (FreeRect free : freeRects) {
            if (!overlaps(free, occupied)) {
                result.add(free);
                continue;
            }

            int freeRight = free.xMm() + free.widthMm();
            int freeBottom = free.yMm() + free.heightMm();
            int occupiedRight = occupied.xMm() + occupied.widthMm();
            int occupiedBottom = occupied.yMm() + occupied.heightMm();

            addFreeRect(result, free.xMm(), free.yMm(), occupied.xMm() - free.xMm(), free.heightMm());
            addFreeRect(result, occupiedRight, free.yMm(), freeRight - occupiedRight, free.heightMm());
            addFreeRect(result, free.xMm(), free.yMm(), free.widthMm(), occupied.yMm() - free.yMm());
            addFreeRect(result, free.xMm(), occupiedBottom, free.widthMm(), freeBottom - occupiedBottom);
        }
        return pruneContainedRectangles(result);
    }

    private List<FreeRect> splitRect(FreeRect rect, int placedWidthMm, int placedHeightMm) {
        List<FreeRect> result = new ArrayList<>();
        addFreeRect(result, rect.xMm() + placedWidthMm, rect.yMm(), rect.widthMm() - placedWidthMm, placedHeightMm);
        addFreeRect(result, rect.xMm(), rect.yMm() + placedHeightMm, rect.widthMm(), rect.heightMm() - placedHeightMm);
        return result;
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
            boolean contained = rects.stream()
                .filter(other -> other != candidate)
                .anyMatch(other -> contains(other, candidate));
            if (!contained) {
                pruned.add(candidate);
            }
        }
        return pruned;
    }

    private boolean overlaps(FreeRect first, FreeRect second) {
        return first.xMm() < second.xMm() + second.widthMm()
            && first.xMm() + first.widthMm() > second.xMm()
            && first.yMm() < second.yMm() + second.heightMm()
            && first.yMm() + first.heightMm() > second.yMm();
    }

    private boolean contains(FreeRect outer, FreeRect inner) {
        return inner.xMm() >= outer.xMm()
            && inner.yMm() >= outer.yMm()
            && inner.xMm() + inner.widthMm() <= outer.xMm() + outer.widthMm()
            && inner.yMm() + inner.heightMm() <= outer.yMm() + outer.heightMm();
    }

    private BigDecimal toAreaM2(int widthMm, int lengthMm) {
        return BigDecimal.valueOf(widthMm)
            .multiply(BigDecimal.valueOf(lengthMm))
            .divide(BigDecimal.valueOf(1_000_000), 4, RoundingMode.HALF_UP);
    }

    public record OptimizationResult(
        int totalPieces,
        int placedPieces,
        List<SourcePlan> sourcePlans,
        List<PlacementResult> placements,
        BigDecimal usedAreaM2,
        BigDecimal wasteAreaM2,
        BigDecimal utilizationPct
    ) {
    }

    public record SourcePlan(
        OptimizationSourceSnapshot source,
        List<PlacementResult> placements,
        List<FreeRect> freeRects,
        BigDecimal effectiveAreaM2,
        BigDecimal usedAreaM2
    ) {
    }

    public record PlacementResult(
        OptimizationSourceSnapshot source,
        int pieceIndex,
        int xMm,
        int yMm,
        int widthMm,
        int heightMm,
        boolean rotated,
        int pieceWidthMm,
        BigDecimal pieceLengthM,
        BigDecimal areaM2
    ) {
    }

    public record Piece(
        int index,
        int widthMm,
        int lengthMm,
        BigDecimal lengthM,
        BigDecimal areaM2
    ) {
    }

    public record FreeRect(int xMm, int yMm, int widthMm, int heightMm) {
    }

    public record PlacementChoice(
        FreeRect freeRect,
        int xMm,
        int yMm,
        int placedWidthMm,
        int placedHeightMm,
        boolean rotated,
        int fragmentationPenalty
    ) {
    }
}
