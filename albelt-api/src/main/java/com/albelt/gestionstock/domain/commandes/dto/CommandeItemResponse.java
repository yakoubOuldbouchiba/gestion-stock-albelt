package com.albelt.gestionstock.domain.commandes.dto;

import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * CommandeItemResponse DTO - Output for order line item data
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CommandeItemResponse {
    
    private UUID id;
    
    private UUID commandeId;
    
    private String materialType;
    
    private Integer nbPlis;
    
    private BigDecimal thicknessMm;
    
    private BigDecimal longueurM;
    
    private BigDecimal longueurToleranceM;
    
    private Integer largeurMm;
    
    private Integer quantite;
    
    private BigDecimal surfaceConsommeeM2;
    
    private String typeMouvement;
    
    private String status;
    
    private String observations;
    
    private Integer lineNumber;
    
    private LocalDateTime createdAt;
    
    private LocalDateTime updatedAt;
}
