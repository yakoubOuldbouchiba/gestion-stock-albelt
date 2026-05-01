package com.albelt.gestionstock.domain.optimization.engine;

import com.albelt.gestionstock.domain.optimization.data.OptimizationItemSnapshot;
import com.albelt.gestionstock.domain.optimization.data.OptimizationOccupiedRectSnapshot;
import com.albelt.gestionstock.domain.optimization.data.OptimizationSourceSnapshot;
import com.albelt.gestionstock.domain.optimization.entity.OptimizationSourceType;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

class OptimizationEngineTest {

    private final OptimizationEngine optimizationEngine = new OptimizationEngine();

    @Test
    void shouldUseWasteBeforeRolls() {
        OptimizationItemSnapshot item = new OptimizationItemSnapshot(
                UUID.randomUUID(),
                UUID.randomUUID(),
                null,
                "PVC",
                1,
                BigDecimal.valueOf(2),
                BigDecimal.ONE,
                1_000,
                1,
                null,
                "REF-1",
                LocalDateTime.now(),
                LocalDateTime.now()
        );

        OptimizationSourceSnapshot waste = new OptimizationSourceSnapshot(
                OptimizationSourceType.WASTE,
                null,
                UUID.randomUUID(),
                1_000,
                BigDecimal.ONE,
                BigDecimal.ONE,
                BigDecimal.ONE,
                1,
                BigDecimal.valueOf(2),
                null,
                "REF-1",
                null,
                LocalDateTime.now()
        );

        OptimizationSourceSnapshot roll = new OptimizationSourceSnapshot(
                OptimizationSourceType.ROLL,
                UUID.randomUUID(),
                null,
                1_000,
                BigDecimal.valueOf(5),
                BigDecimal.valueOf(5),
                BigDecimal.valueOf(5),
                1,
                BigDecimal.valueOf(2),
                null,
                "REF-1",
                LocalDate.now().minusDays(10),
                LocalDateTime.now()
        );

        OptimizationEngine.OptimizationResult result = optimizationEngine.optimize(
                item,
                List.of(waste, roll),
                Map.of()
        );

        assertEquals(1, result.placedPieces());
        assertEquals(1, result.sourcePlans().size());
        assertEquals(OptimizationSourceType.WASTE, result.sourcePlans().get(0).source().sourceType());
    }

    @Test
    void shouldRespectOccupiedRectangles() {
        UUID rollId = UUID.randomUUID();
        OptimizationItemSnapshot item = new OptimizationItemSnapshot(
                UUID.randomUUID(),
                UUID.randomUUID(),
                null,
                "PVC",
                1,
                BigDecimal.valueOf(2),
                BigDecimal.ONE,
                1_000,
                1,
                null,
                "REF-1",
                LocalDateTime.now(),
                LocalDateTime.now()
        );

        OptimizationSourceSnapshot roll = new OptimizationSourceSnapshot(
                OptimizationSourceType.ROLL,
                rollId,
                null,
                2_000,
                BigDecimal.ONE,
                BigDecimal.valueOf(2),
                BigDecimal.valueOf(2),
                1,
                BigDecimal.valueOf(2),
                null,
                "REF-1",
                LocalDate.now().minusDays(5),
                LocalDateTime.now()
        );

        OptimizationOccupiedRectSnapshot occupied = new OptimizationOccupiedRectSnapshot(
                rollId,
                null,
                0,
                0,
                1_000,
                1_000,
                LocalDateTime.now()
        );

        OptimizationEngine.OptimizationResult result = optimizationEngine.optimize(
                item,
                List.of(roll),
                Map.of(rollId, List.of(occupied))
        );

        assertEquals(1, result.placedPieces());
        assertTrue(result.placements().get(0).xMm() >= 1_000);
    }
}
