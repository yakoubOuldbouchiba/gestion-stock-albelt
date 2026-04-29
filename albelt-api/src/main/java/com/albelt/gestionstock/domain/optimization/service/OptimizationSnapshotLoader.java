package com.albelt.gestionstock.domain.optimization.service;

import com.albelt.gestionstock.domain.commandes.repository.CommandeItemRepository;
import com.albelt.gestionstock.domain.optimization.data.OptimizationCandidateFilter;
import com.albelt.gestionstock.domain.optimization.data.OptimizationCandidateFingerprint;
import com.albelt.gestionstock.domain.optimization.data.OptimizationItemSnapshot;
import com.albelt.gestionstock.domain.optimization.data.OptimizationOccupiedRectSnapshot;
import com.albelt.gestionstock.domain.optimization.data.OptimizationPlanningContext;
import com.albelt.gestionstock.domain.optimization.data.OptimizationSourceSnapshot;
import com.albelt.gestionstock.domain.optimization.repository.OptimizationPlacementRepository;
import com.albelt.gestionstock.domain.placement.repository.PlacedRectangleRepository;
import com.albelt.gestionstock.domain.rolls.repository.RollRepository;
import com.albelt.gestionstock.domain.waste.repository.WastePieceRepository;
import com.albelt.gestionstock.shared.exceptions.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.Comparator;
import java.util.HexFormat;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class OptimizationSnapshotLoader {

    private static final List<String> ACTIVE_COMMANDE_STATUSES = List.of("PENDING", "ENCOURS");

    private final CommandeItemRepository commandeItemRepository;
    private final RollRepository rollRepository;
    private final WastePieceRepository wastePieceRepository;
    private final PlacedRectangleRepository placedRectangleRepository;
    private final OptimizationPlacementRepository optimizationPlacementRepository;
    private final OptimizationCandidateCacheService candidateCacheService;

    @Transactional(readOnly = true)
    public OptimizationItemSnapshot loadItem(UUID itemId) {
        return commandeItemRepository.findOptimizationSnapshotById(itemId)
            .orElseThrow(() -> new ResourceNotFoundException("Order item not found: " + itemId));
    }

    @Transactional(readOnly = true)
    public List<OptimizationItemSnapshot> loadItemsForCommande(UUID commandeId) {
        return commandeItemRepository.findOptimizationSnapshotsByCommandeId(commandeId);
    }

    @Transactional(readOnly = true)
    public OptimizationPlanningContext loadPlanningContext(OptimizationItemSnapshot itemSnapshot) {
        OptimizationCandidateFilter filter = new OptimizationCandidateFilter(
            itemSnapshot.articleId(),
            itemSnapshot.colorId(),
            itemSnapshot.altierId()
        );

        if (filter.articleId() == null) {
            return new OptimizationPlanningContext(
                itemSnapshot,
                List.of(),
                Collections.emptyMap(),
                digest(java.util.Arrays.asList(
                    safe(itemSnapshot.itemId()),
                    safe(itemSnapshot.commandeId()),
                    safe(itemSnapshot.altierId()),
                    safe(itemSnapshot.articleId()),
                    safe(itemSnapshot.materialType()),
                    safe(itemSnapshot.nbPlis()),
                    safe(itemSnapshot.thicknessMm()),
                    safe(itemSnapshot.longueurM()),
                    safe(itemSnapshot.largeurMm()),
                    safe(itemSnapshot.quantite()),
                    safe(itemSnapshot.colorId()),
                    safe(normalize(itemSnapshot.reference())),
                    safe(itemSnapshot.itemUpdatedAt()),
                    safe(itemSnapshot.commandeUpdatedAt())
                )),
                digest(List.of("ROLLS=0|null|0", "WASTES=0|null|0"))
            );
        }

        OptimizationCandidateFingerprint wasteFingerprint = wastePieceRepository.findOptimizationFingerprint(
            filter.articleId(),
            filter.colorId(),
            filter.altierId()
        );

        OptimizationCandidateFingerprint rollFingerprint = rollRepository.findOptimizationFingerprint(
            filter.articleId(),
            filter.colorId(),
            filter.altierId()
        );

        List<OptimizationSourceSnapshot> sources = new ArrayList<>();
        sources.addAll(candidateCacheService.getWasteCandidates(filter, wasteFingerprint));
        sources.addAll(candidateCacheService.getRollCandidates(filter, rollFingerprint));
        sources.sort(buildSourcePriorityComparator(itemSnapshot));

        List<UUID> rollIds = sources.stream()
            .map(OptimizationSourceSnapshot::rollId)
            .filter(java.util.Objects::nonNull)
            .toList();
        List<UUID> wasteIds = sources.stream()
            .map(OptimizationSourceSnapshot::wastePieceId)
            .filter(java.util.Objects::nonNull)
            .toList();

        List<OptimizationOccupiedRectSnapshot> occupied = new ArrayList<>();
        if (!rollIds.isEmpty() || !wasteIds.isEmpty()) {
            List<UUID> safeRollIds = rollIds.isEmpty() ? List.of(new UUID(0L, 0L)) : rollIds;
            List<UUID> safeWasteIds = wasteIds.isEmpty() ? List.of(new UUID(0L, 0L)) : wasteIds;
            occupied.addAll(placedRectangleRepository.findOccupiedSnapshotsBySourceIds(
                !rollIds.isEmpty(),
                safeRollIds,
                !wasteIds.isEmpty(),
                safeWasteIds
            ));
            occupied.addAll(optimizationPlacementRepository.findActiveOccupiedSnapshotsBySourceIdsExcludingItem(
                !rollIds.isEmpty(),
                safeRollIds,
                !wasteIds.isEmpty(),
                safeWasteIds,
                itemSnapshot.itemId(),
                ACTIVE_COMMANDE_STATUSES
            ));
        }

        Map<UUID, List<OptimizationOccupiedRectSnapshot>> occupiedBySource = occupied.stream()
            .filter(snapshot -> snapshot.sourceId() != null)
            .collect(Collectors.groupingBy(
                OptimizationOccupiedRectSnapshot::sourceId,
                LinkedHashMap::new,
                Collectors.toList()
            ));

        String inputSignature = digest(java.util.Arrays.asList(
            safe(itemSnapshot.itemId()),
            safe(itemSnapshot.commandeId()),
            safe(itemSnapshot.altierId()),
            safe(itemSnapshot.articleId()),
            safe(itemSnapshot.materialType()),
            safe(itemSnapshot.nbPlis()),
            safe(itemSnapshot.thicknessMm()),
            safe(itemSnapshot.longueurM()),
            safe(itemSnapshot.largeurMm()),
            safe(itemSnapshot.quantite()),
            safe(itemSnapshot.colorId()),
            safe(normalize(itemSnapshot.reference())),
            safe(itemSnapshot.itemUpdatedAt()),
            safe(itemSnapshot.commandeUpdatedAt())
        ));

        List<String> stockParts = new ArrayList<>();
        stockParts.add("ROLLS=" + rollFingerprint.cacheToken());
        stockParts.add("WASTES=" + wasteFingerprint.cacheToken());

        sources.stream()
            .sorted(Comparator.comparing(source -> source.sourceId().toString()))
            .forEach(source -> stockParts.add(
                safe(source.sourceType()) + "|"
                    + safe(source.sourceId()) + "|"
                    + safe(source.articleId()) + "|"
                    + safe(source.widthMm()) + "|"
                    + safe(source.lengthM()) + "|"
                    + safe(source.availableAreaM2()) + "|"
                    + safe(source.fullAreaM2()) + "|"
                    + safe(source.sourceStatus()) + "|"
                    + safe(source.updatedAt())
            ));

        occupied.stream()
            .filter(snapshot -> snapshot.sourceId() != null)
            .sorted(Comparator
                .comparing((OptimizationOccupiedRectSnapshot snapshot) -> snapshot.sourceId().toString())
                .thenComparing(snapshot -> snapshot.xMm() != null ? snapshot.xMm() : 0)
                .thenComparing(snapshot -> snapshot.yMm() != null ? snapshot.yMm() : 0))
            .forEach(snapshot -> stockParts.add(
                safe(snapshot.sourceId()) + "|"
                    + safe(snapshot.xMm()) + "|"
                    + safe(snapshot.yMm()) + "|"
                    + safe(snapshot.widthMm()) + "|"
                    + safe(snapshot.heightMm()) + "|"
                    + safe(snapshot.updatedAt())
            ));

        return new OptimizationPlanningContext(
            itemSnapshot,
            sources,
            occupiedBySource,
            inputSignature,
            digest(stockParts)
        );
    }

    private String normalize(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    private String safe(Object value) {
        return value == null ? "null" : value.toString();
    }

    private Comparator<OptimizationSourceSnapshot> buildSourcePriorityComparator(OptimizationItemSnapshot itemSnapshot) {
        return Comparator
            .comparingInt((OptimizationSourceSnapshot source) -> sourcePriority(source, itemSnapshot))
            .thenComparing((OptimizationSourceSnapshot source) -> fittingWasteArea(source, itemSnapshot))
            .thenComparing((OptimizationSourceSnapshot source) -> source.effectiveAreaM2(), Comparator.nullsLast(BigDecimal::compareTo))
            .thenComparing(source -> source.receivedDate(), Comparator.nullsLast(Comparator.naturalOrder()))
            .thenComparing(source -> source.updatedAt(), Comparator.nullsLast(Comparator.naturalOrder()))
            .thenComparing(source -> source.sourceId() != null ? source.sourceId().toString() : "");
    }

    private int sourcePriority(OptimizationSourceSnapshot source, OptimizationItemSnapshot itemSnapshot) {
        boolean fits = canFit(source, itemSnapshot);
        if (source.sourceType() == com.albelt.gestionstock.domain.optimization.entity.OptimizationSourceType.WASTE) {
            if (source.isOpened()) {
                return fits ? 0 : 4;
            }
            return fits ? 1 : 5;
        }
        if (source.isOpened()) {
            return fits ? 2 : 6;
        }
        return fits ? 3 : 7;
    }

    private BigDecimal fittingWasteArea(OptimizationSourceSnapshot source, OptimizationItemSnapshot itemSnapshot) {
        BigDecimal area = source.effectiveAreaM2();
        if (area == null) {
            return BigDecimal.valueOf(Double.MAX_VALUE);
        }

        BigDecimal requiredArea = requiredArea(itemSnapshot);
        if (requiredArea == null) {
            return area;
        }
        return area.subtract(requiredArea).max(BigDecimal.ZERO);
    }

    private BigDecimal requiredArea(OptimizationItemSnapshot itemSnapshot) {
        if (itemSnapshot.largeurMm() == null || itemSnapshot.longueurM() == null) {
            return null;
        }
        return BigDecimal.valueOf(itemSnapshot.largeurMm())
            .multiply(itemSnapshot.longueurM().multiply(BigDecimal.valueOf(1000)))
            .divide(BigDecimal.valueOf(1_000_000), 4, java.math.RoundingMode.HALF_UP);
    }

    private boolean canFit(OptimizationSourceSnapshot source, OptimizationItemSnapshot itemSnapshot) {
        if (source.widthMm() == null || source.lengthM() == null
            || itemSnapshot.largeurMm() == null || itemSnapshot.longueurM() == null) {
            return false;
        }

        int sourceWidth = source.widthMm();
        int sourceLength = source.lengthMm();
        int pieceWidth = itemSnapshot.largeurMm();
        int pieceLength = itemSnapshot.longueurM().multiply(BigDecimal.valueOf(1000))
            .setScale(0, java.math.RoundingMode.HALF_UP)
            .intValue();

        return (pieceWidth <= sourceWidth && pieceLength <= sourceLength)
            || (pieceLength <= sourceWidth && pieceWidth <= sourceLength);
    }

    private String digest(List<String> parts) {
        try {
            MessageDigest messageDigest = MessageDigest.getInstance("SHA-256");
            String joined = String.join("::", parts);
            return HexFormat.of().formatHex(messageDigest.digest(joined.getBytes(StandardCharsets.UTF_8)));
        } catch (NoSuchAlgorithmException ex) {
            throw new IllegalStateException("Unable to compute optimization signature", ex);
        }
    }
}
