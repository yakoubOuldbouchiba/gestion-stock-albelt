package com.albelt.gestionstock.domain.optimization.data;

import java.util.List;
import java.util.Map;
import java.util.UUID;

public record OptimizationPlanningContext(
    OptimizationItemSnapshot item,
    List<OptimizationSourceSnapshot> sources,
    Map<UUID, List<OptimizationOccupiedRectSnapshot>> occupiedBySource,
    String inputSignature,
    String stockSignature
) {
}
