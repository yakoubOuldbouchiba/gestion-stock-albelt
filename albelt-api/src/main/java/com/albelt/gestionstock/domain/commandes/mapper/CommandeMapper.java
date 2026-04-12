package com.albelt.gestionstock.domain.commandes.mapper;

import com.albelt.gestionstock.domain.commandes.dto.*;
import com.albelt.gestionstock.domain.commandes.entity.*;
import com.albelt.gestionstock.domain.clients.entity.Client;
import com.albelt.gestionstock.domain.altier.entity.Altier;
import com.albelt.gestionstock.domain.users.entity.User;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.stream.Collectors;

/**
 * CommandeMapper - Converts between Commande entity and DTOs
 */
@Component
public class CommandeMapper {

    private final CommandeItemMapper itemMapper;

    public CommandeMapper(CommandeItemMapper itemMapper) {
        this.itemMapper = itemMapper;
    }

    /**
     * Convert CommandeRequest DTO to Commande entity
     */
    public Commande toEntity(CommandeRequest request, Client client, Altier altier, User createdBy) {
        if (request == null) {
            return null;
        }

        String status = request.getStatus();
        if (status == null || status.isBlank()) {
            status = "PENDING";
        }

        return Commande.builder()
            .numeroCommande(request.getNumeroCommande())
            .client(client)
            .altier(altier)
            .status(status)
            .description(request.getDescription())
            .notes(request.getNotes())
            .createdBy(createdBy)
            .build();
    }

    /**
     * Convert Commande entity to CommandeResponse DTO
     */
    public CommandeResponse toResponse(Commande commande) {
        if (commande == null) {
            return null;
        }

        List<CommandeItemResponse> itemResponses = commande.getItems() != null
                ? commande.getItems().stream()
                .map(itemMapper::toResponse)
                .collect(Collectors.toList())
                : null;

        return CommandeResponse.builder()
                .id(commande.getId())
                .numeroCommande(commande.getNumeroCommande())
                .clientId(commande.getClient().getId())
                .clientName(commande.getClient().getName())
            .altierId(commande.getAltier() != null ? commande.getAltier().getId() : null)
            .altierLibelle(commande.getAltier() != null ? commande.getAltier().getLibelle() : null)
                .status(commande.getStatus())
                .description(commande.getDescription())
                .notes(commande.getNotes())
                .createdBy(commande.getCreatedBy().getId())
                .createdByName(commande.getCreatedBy().getFullName())
                .updatedBy(commande.getUpdatedBy() != null ? commande.getUpdatedBy().getId() : null)
                .updatedByName(commande.getUpdatedBy() != null ? commande.getUpdatedBy().getFullName() : null)
                .items(itemResponses)
                .createdAt(commande.getCreatedAt())
                .updatedAt(commande.getUpdatedAt())
                .build();
    }

    /**
     * Convert list of Commande entities to list of responses
     */
    public List<CommandeResponse> toResponseList(List<Commande> commandes) {
        if (commandes == null) {
            return null;
        }
        return commandes.stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }
}
