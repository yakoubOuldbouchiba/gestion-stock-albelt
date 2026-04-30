package com.albelt.gestionstock.domain.commandes.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class OrderSummaryStatsDto {
    private long activeOrders;
    private long waitingItems;
    private long cuttingItems;
    private long completedItems;
}
