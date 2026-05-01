package com.albelt.gestionstock.api.dto;

import com.albelt.gestionstock.domain.rolls.dto.RollResponse;
import com.albelt.gestionstock.shared.enums.MaterialType;
import com.albelt.gestionstock.shared.enums.WasteStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

/**
 * Lightweight dashboard stats payload.
 * Designed to avoid fetching full roll/waste lists on the client.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DashboardStatsResponse {

    private InventoryMetrics inventoryMetrics;
    private WasteMetrics wasteMetrics;
    private List<RollResponse> recentRolls;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class InventoryMetrics {
        private long totalRolls;
        private BigDecimal totalArea;
        private List<ByMaterial> byMaterial;

        @Data
        @NoArgsConstructor
        @AllArgsConstructor
        @Builder
        public static class ByMaterial {
            private MaterialType material;
            private long count;
            private BigDecimal area;
        }
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class WasteMetrics {
        private long totalWaste;
        private BigDecimal totalArea;
        /**
         * Percent, 0-100
         */
        private double reuseEfficiency;
        private List<ByStatus> byStatus;

        @Data
        @NoArgsConstructor
        @AllArgsConstructor
        @Builder
        public static class ByStatus {
            private WasteStatus status;
            private long count;
            private BigDecimal area;
        }
    }
}
