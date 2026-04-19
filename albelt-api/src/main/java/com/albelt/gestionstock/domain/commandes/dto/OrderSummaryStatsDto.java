package com.albelt.gestionstock.domain.commandes.dto;

import lombok.*;

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
