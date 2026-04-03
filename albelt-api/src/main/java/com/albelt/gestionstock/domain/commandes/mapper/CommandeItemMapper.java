package com.albelt.gestionstock.domain.commandes.mapper;

import com.albelt.gestionstock.domain.commandes.dto.*;
import com.albelt.gestionstock.domain.commandes.entity.*;
import com.albelt.gestionstock.domain.production.entity.ProductionItem;
import com.albelt.gestionstock.domain.production.repository.ProductionItemRepository;
import org.springframework.stereotype.Component;

import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;

/**
 * CommandeItemMapper - Converts between CommandeItem entity and DTOs
 */
@Component
public class CommandeItemMapper {

    private final ProductionItemRepository productionItemRepository;

    public CommandeItemMapper(ProductionItemRepository productionItemRepository) {
        this.productionItemRepository = productionItemRepository;
    }

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
            .reference(request.getReference())
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

        ProductionMatchSummary matchSummary = getProductionMatchSummary(item.getId());

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
            .reference(item.getReference())
            .colorId(item.getColor() != null ? item.getColor().getId() : null)
            .colorName(item.getColor() != null ? item.getColor().getName() : null)
            .colorHexCode(item.getColor() != null ? item.getColor().getHexCode() : null)
                .goodProduction(matchSummary.goodProduction())
                .productionMiss(matchSummary.productionMiss())
                .totalItemsConforme(item.getTotalItemsConforme())
                .totalItemsNonConforme(item.getTotalItemsNonConforme())
                .lineNumber(item.getLineNumber())
                .createdAt(item.getCreatedAt())
                .updatedAt(item.getUpdatedAt())
                .build();
    }

    private ProductionMatchSummary getProductionMatchSummary(java.util.UUID commandeItemId) {
        List<ProductionItem> productionItems = productionItemRepository.findByCommandeItemId(commandeItemId);
        if (productionItems == null || productionItems.isEmpty()) {
            return new ProductionMatchSummary(null, null);
        }

        boolean allGood = true;
        boolean anyBad = false;
        Set<String> misses = new LinkedHashSet<>();

        for (ProductionItem productionItem : productionItems) {
            Boolean good = productionItem.getGoodProduction();
            if (Boolean.FALSE.equals(good)) {
                anyBad = true;
                allGood = false;
            } else if (good == null) {
                allGood = false;
            }

            String miss = productionItem.getProductionMiss();
            if (miss != null && !miss.isBlank()) {
                misses.add(miss.trim());
            }
        }

        Boolean goodProduction = allGood ? Boolean.TRUE : (anyBad ? Boolean.FALSE : null);
        String productionMiss = misses.isEmpty() ? null : String.join("; ", misses);
        return new ProductionMatchSummary(goodProduction, productionMiss);
    }

    private record ProductionMatchSummary(Boolean goodProduction, String productionMiss) {
    }
}
