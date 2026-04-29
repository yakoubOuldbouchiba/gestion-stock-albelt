package com.albelt.gestionstock.domain.optimization.service;

import com.albelt.gestionstock.domain.altier.repository.AltierRepository;
import com.albelt.gestionstock.domain.commandes.repository.CommandeItemRepository;
import com.albelt.gestionstock.domain.commandes.repository.CommandeRepository;
import com.albelt.gestionstock.domain.optimization.data.OptimizationItemSnapshot;
import com.albelt.gestionstock.domain.optimization.dto.OptimizationComparisonResponse;
import com.albelt.gestionstock.domain.optimization.entity.OptimizationPlan;
import com.albelt.gestionstock.domain.optimization.entity.OptimizationPlanStatus;
import com.albelt.gestionstock.domain.optimization.repository.OptimizationPlacementRepository;
import com.albelt.gestionstock.domain.optimization.repository.OptimizationPlanRepository;
import com.albelt.gestionstock.domain.placement.repository.PlacedRectangleRepository;
import com.albelt.gestionstock.domain.production.repository.ProductionItemRepository;
import com.albelt.gestionstock.domain.rolls.repository.RollRepository;
import com.albelt.gestionstock.domain.settings.repository.MaterialChuteThresholdRepository;
import com.albelt.gestionstock.domain.waste.repository.WastePieceRepository;
import com.albelt.gestionstock.shared.utils.QrCodeService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class OptimizationServiceTest {

    @Mock
    private CommandeItemRepository itemRepository;
    @Mock
    private CommandeRepository commandeRepository;
    @Mock
    private AltierRepository altierRepository;
    @Mock
    private RollRepository rollRepository;
    @Mock
    private WastePieceRepository wastePieceRepository;
    @Mock
    private PlacedRectangleRepository placedRectangleRepository;
    @Mock
    private ProductionItemRepository productionItemRepository;
    @Mock
    private MaterialChuteThresholdRepository thresholdRepository;
    @Mock
    private OptimizationPlanRepository planRepository;
    @Mock
    private OptimizationPlacementRepository placementRepository;
    @Mock
    private QrCodeService qrCodeService;
    @Mock
    private OptimizationSnapshotLoader snapshotLoader;
    @Mock
    private com.albelt.gestionstock.domain.optimization.engine.OptimizationEngine optimizationEngine;

    private OptimizationService service;

    @BeforeEach
    void setUp() {
        service = new OptimizationService(
            itemRepository,
            commandeRepository,
            altierRepository,
            rollRepository,
            wastePieceRepository,
            placedRectangleRepository,
            productionItemRepository,
            thresholdRepository,
            planRepository,
            placementRepository,
            qrCodeService,
            snapshotLoader,
            optimizationEngine
        );
    }

    @Test
    void getComparisonReturnsExistingActivePlanWhenCommandeStatusIsClosed() {
        UUID itemId = UUID.randomUUID();
        UUID planId = UUID.randomUUID();
        OptimizationItemSnapshot item = new OptimizationItemSnapshot(
            itemId,
            UUID.randomUUID(),
            "TERMINE",
            null,
            null,
            "PVC",
            1,
            BigDecimal.ONE,
            BigDecimal.ONE,
            1000,
            2,
            null,
            "REF-1",
            LocalDateTime.now(),
            LocalDateTime.now()
        );
        OptimizationPlan plan = OptimizationPlan.builder()
            .id(planId)
            .commandeItemId(itemId)
            .status(OptimizationPlanStatus.ACTIVE)
            .totalPieces(2)
            .placedPieces(2)
            .sourceCount(1)
            .usedAreaM2(new BigDecimal("2.0000"))
            .wasteAreaM2(new BigDecimal("0.1000"))
            .utilizationPct(new BigDecimal("95.00"))
            .svg("<svg/>")
            .build();

        when(snapshotLoader.loadItem(itemId)).thenReturn(item);
        when(planRepository.findFirstByCommandeItemIdAndStatusOrderByCreatedAtDesc(itemId, OptimizationPlanStatus.ACTIVE))
            .thenReturn(Optional.of(plan));
        when(productionItemRepository.sumTotalAreaByCommandeItemId(itemId)).thenReturn(BigDecimal.ZERO);
        when(productionItemRepository.sumQuantityByCommandeItemIdExcludingId(itemId, null)).thenReturn(0L);
        when(placedRectangleRepository.findByCommandeItemIdWithSources(itemId)).thenReturn(List.of());
        when(placementRepository.findByPlanIdWithSourcesOrderByCreatedAtAsc(planId)).thenReturn(List.of());

        OptimizationComparisonResponse response = service.getComparison(itemId, false);

        assertNotNull(response);
        assertNotNull(response.getSuggested());
        assertEquals(planId, response.getSuggested().getSuggestionId());
        assertEquals("ACTIVE", response.getSuggested().getStatus());
        verify(planRepository, never())
            .findFirstByCommandeItemIdAndStatusAndAlgorithmVersionAndInputSignatureAndStockSignatureOrderByCreatedAtDesc(
                any(), any(), any(), any(), any()
            );
        verify(snapshotLoader, never()).loadPlanningContext(any());
    }
}
