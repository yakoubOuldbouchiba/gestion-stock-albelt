package com.albelt.gestionstock.domain.commandes.mapper;

import com.albelt.gestionstock.domain.commandes.dto.*;
import com.albelt.gestionstock.domain.commandes.entity.*;
import com.albelt.gestionstock.domain.rolls.entity.Roll;
import org.springframework.stereotype.Component;

/**
 * CommandeItemMapper - Converts between CommandeItem entity and DTOs
 */
@Component
public class CommandeItemMapper {

    /**
     * Convert CommandeItemRequest DTO to CommandeItem entity
     */
    public CommandeItem toEntity(CommandeItemRequest request, Commande commande) {
        if (request == null) {
            return null;
        }

        return CommandeItem.builder()
                .commande(commande)
                .materialType(request.getMaterialType())
                .nbPlis(request.getNbPlis())
                .thicknessMm(request.getThicknessMm())
                .longueurM(request.getLongueurM())
                .longueurToleranceM(request.getLongueurToleranceM())
                .largeurMm(request.getLargeurMm())
                .quantite(request.getQuantite())
                .surfaceConsommeeM2(request.getSurfaceConsommeeM2())
                .typeMouvement(request.getTypeMouvement())
                .observations(request.getObservations())
                .lineNumber(request.getLineNumber())
                .build();
    }

    /**
     * Convert CommandeItem entity to CommandeItemResponse DTO
     */
    public CommandeItemResponse toResponse(CommandeItem item) {
        if (item == null) {
            return null;
        }

        return CommandeItemResponse.builder()
                .id(item.getId())
                .commandeId(item.getCommande().getId())
                .materialType(item.getMaterialType())
                .nbPlis(item.getNbPlis())
                .thicknessMm(item.getThicknessMm())
                .longueurM(item.getLongueurM())
                .longueurToleranceM(item.getLongueurToleranceM())
                .largeurMm(item.getLargeurMm())
                .quantite(item.getQuantite())
                .surfaceConsommeeM2(item.getSurfaceConsommeeM2())
                .typeMouvement(item.getTypeMouvement())
                .status(item.getStatus())
                .observations(item.getObservations())
                .lineNumber(item.getLineNumber())
                .createdAt(item.getCreatedAt())
                .updatedAt(item.getUpdatedAt())
                .build();
    }
}
