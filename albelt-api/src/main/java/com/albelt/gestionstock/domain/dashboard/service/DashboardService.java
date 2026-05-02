package com.albelt.gestionstock.domain.dashboard.service;

import com.albelt.gestionstock.api.dto.DashboardStatsResponse;
import com.albelt.gestionstock.domain.rolls.mapper.RollMapper;
import com.albelt.gestionstock.domain.rolls.repository.RollRepository;
import com.albelt.gestionstock.domain.waste.repository.WastePieceRepository;
import com.albelt.gestionstock.shared.enums.MaterialType;
import com.albelt.gestionstock.shared.enums.RollStatus;
import com.albelt.gestionstock.shared.enums.WasteStatus;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class DashboardService {

    private final RollRepository rollRepository;
    private final WastePieceRepository wastePieceRepository;
    private final RollMapper rollMapper;

    @Transactional(readOnly = true)
    public DashboardStatsResponse getDashboardStats(boolean unrestricted, List<UUID> accessibleAltierIds) {
        if (!unrestricted && (accessibleAltierIds == null || accessibleAltierIds.isEmpty())) {
            return emptyResponse();
        }

        // Ensure the IN-list is never empty to avoid invalid SQL when unrestricted=true.
        List<UUID> safeAltierIds = (accessibleAltierIds == null || accessibleAltierIds.isEmpty())
                ? List.of(java.util.UUID.randomUUID())
                : accessibleAltierIds;

        List<RollStatus> activeRollStatuses = Arrays.asList(RollStatus.AVAILABLE, RollStatus.OPENED);

        // 1) Inventory stats: one GROUP BY query
        List<Object[]> materialRows = rollRepository.getStatsByMaterialForAltiers(unrestricted, safeAltierIds, activeRollStatuses);
        DashboardStatsResponse.InventoryMetrics inventoryMetrics = toInventoryMetrics(materialRows);

        // 2) Recent rolls: limited query
        var recent = rollRepository.findRecentByAltierIds(unrestricted, safeAltierIds, PageRequest.of(0, 5));

        // 3) Waste stats: one GROUP BY query
        List<Object[]> wasteRows = wastePieceRepository.getStatsByStatusForAltiers(unrestricted, safeAltierIds);
        DashboardStatsResponse.WasteMetrics wasteMetrics = toWasteMetrics(wasteRows);

        return DashboardStatsResponse.builder()
                .inventoryMetrics(inventoryMetrics)
                .wasteMetrics(wasteMetrics)
                .recentRolls(rollMapper.toResponseList(recent))
                .build();
    }

    private DashboardStatsResponse emptyResponse() {
        return DashboardStatsResponse.builder()
                .inventoryMetrics(DashboardStatsResponse.InventoryMetrics.builder()
                        .totalRolls(0)
                        .totalArea(BigDecimal.ZERO)
                        .byMaterial(defaultMaterialRows())
                        .build())
                .wasteMetrics(DashboardStatsResponse.WasteMetrics.builder()
                        .totalWaste(0)
                        .totalArea(BigDecimal.ZERO)
                        .reuseEfficiency(0)
                        .byStatus(defaultWasteRows())
                        .build())
                .recentRolls(List.of())
                .build();
    }

    private DashboardStatsResponse.InventoryMetrics toInventoryMetrics(List<Object[]> rows) {
        Map<MaterialType, DashboardStatsResponse.InventoryMetrics.ByMaterial> byMaterial = new EnumMap<>(MaterialType.class);
        for (MaterialType mt : MaterialType.values()) {
            byMaterial.put(mt, DashboardStatsResponse.InventoryMetrics.ByMaterial.builder()
                    .material(mt)
                    .count(0)
                    .area(BigDecimal.ZERO)
                    .build());
        }

        long totalCount = 0;
        BigDecimal totalArea = BigDecimal.ZERO;

        if (rows != null) {
            for (Object[] row : rows) {
                if (row == null || row.length < 3 || row[0] == null) continue;
                MaterialType materialType = (MaterialType) row[0];
                long count = row[1] != null ? ((Number) row[1]).longValue() : 0;
                BigDecimal area = row[2] instanceof BigDecimal ? (BigDecimal) row[2] : BigDecimal.ZERO;

                byMaterial.put(materialType, DashboardStatsResponse.InventoryMetrics.ByMaterial.builder()
                        .material(materialType)
                        .count(count)
                        .area(area)
                        .build());

                totalCount += count;
                totalArea = totalArea.add(area != null ? area : BigDecimal.ZERO);
            }
        }

        return DashboardStatsResponse.InventoryMetrics.builder()
                .totalRolls(totalCount)
                .totalArea(totalArea)
                .byMaterial(new ArrayList<>(byMaterial.values()))
                .build();
    }

    private DashboardStatsResponse.WasteMetrics toWasteMetrics(List<Object[]> rows) {
        Map<WasteStatus, DashboardStatsResponse.WasteMetrics.ByStatus> byStatus = new EnumMap<>(WasteStatus.class);
        for (WasteStatus st : WasteStatus.values()) {
            byStatus.put(st, DashboardStatsResponse.WasteMetrics.ByStatus.builder()
                    .status(st)
                    .count(0)
                    .area(BigDecimal.ZERO)
                    .build());
        }

        long totalCount = 0;
        BigDecimal totalArea = BigDecimal.ZERO;
        long reusedCount = 0;
        long consideredCount = 0;

        if (rows != null) {
            for (Object[] row : rows) {
                if (row == null || row.length < 3 || row[0] == null) continue;
                WasteStatus status = (WasteStatus) row[0];
                long count = row[1] != null ? ((Number) row[1]).longValue() : 0;
                BigDecimal area = row[2] instanceof BigDecimal ? (BigDecimal) row[2] : BigDecimal.ZERO;

                byStatus.put(status, DashboardStatsResponse.WasteMetrics.ByStatus.builder()
                        .status(status)
                        .count(count)
                        .area(area)
                        .build());

                totalCount += count;
                totalArea = totalArea.add(area != null ? area : BigDecimal.ZERO);

                if (status == WasteStatus.EXHAUSTED) {
                    reusedCount += count;
                }
                if (status != WasteStatus.ARCHIVED) {
                    consideredCount += count;
                }
            }
        }

        double reuseEfficiency = consideredCount > 0 ? (reusedCount * 100.0) / consideredCount : 0.0;

        return DashboardStatsResponse.WasteMetrics.builder()
                .totalWaste(totalCount)
                .totalArea(totalArea)
                .reuseEfficiency(reuseEfficiency)
                .byStatus(new ArrayList<>(byStatus.values()))
                .build();
    }

    private List<DashboardStatsResponse.InventoryMetrics.ByMaterial> defaultMaterialRows() {
        List<DashboardStatsResponse.InventoryMetrics.ByMaterial> rows = new ArrayList<>();
        for (MaterialType mt : MaterialType.values()) {
            rows.add(DashboardStatsResponse.InventoryMetrics.ByMaterial.builder()
                    .material(mt)
                    .count(0)
                    .area(BigDecimal.ZERO)
                    .build());
        }
        return rows;
    }

    private List<DashboardStatsResponse.WasteMetrics.ByStatus> defaultWasteRows() {
        List<DashboardStatsResponse.WasteMetrics.ByStatus> rows = new ArrayList<>();
        for (WasteStatus st : WasteStatus.values()) {
            rows.add(DashboardStatsResponse.WasteMetrics.ByStatus.builder()
                    .status(st)
                    .count(0)
                    .area(BigDecimal.ZERO)
                    .build());
        }
        return rows;
    }
}
