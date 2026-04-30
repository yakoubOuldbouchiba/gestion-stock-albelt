package com.albelt.gestionstock.domain.optimization.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.UUID;

/**
 * Altier score for fulfilling an entire commande.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AltierScoreResponse {

    private UUID altierId;
    private String altierLibelle;

    /**
     * Higher is better. Primarily based on whether the altier can fulfill the full order.
     */
    private double score;

    private int totalPieces;
    private int placedPieces;

    /**
     * Coverage percentage for the whole commande (0..100).
     */
    private BigDecimal coveragePct;

    private boolean canFulfill;
}
