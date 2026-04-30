package com.albelt.gestionstock.domain.altier.mapper;

import com.albelt.gestionstock.domain.altier.dto.AltierDTO;
import com.albelt.gestionstock.domain.altier.dto.AltierRequest;
import com.albelt.gestionstock.domain.altier.dto.AltierResponse;
import com.albelt.gestionstock.domain.altier.entity.Altier;
import org.springframework.stereotype.Component;

import java.util.List;

/**
 * Mapper for Altier entity <-> DTO conversions
 */
@Component
public class AltierMapper {

    public Altier toEntity(AltierRequest request) {
        if (request == null) {
            return null;
        }

        return Altier.builder()
                .libelle(request.getLibelle())
                .adresse(request.getAdresse())
                .build();
    }

    public AltierResponse toResponse(Altier altier) {
        if (altier == null) {
            return null;
        }

        return AltierResponse.builder()
                .id(altier.getId())
                .libelle(altier.getLibelle())
                .adresse(altier.getAdresse())
                .createdAt(altier.getCreatedAt())
                .updatedAt(altier.getUpdatedAt())
                .build();
    }

    public List<AltierResponse> toResponseList(List<Altier> altiers) {
        if (altiers == null) {
            return null;
        }
        return altiers.stream()
                .map(this::toResponse)
                .toList();
    }

    public AltierDTO toDTO(Altier altier) {
        if (altier == null) {
            return null;
        }

        return AltierDTO.builder()
                .id(altier.getId())
                .libelle(altier.getLibelle())
                .adresse(altier.getAdresse())
                .createdAt(altier.getCreatedAt())
                .updatedAt(altier.getUpdatedAt())
                .build();
    }

    public List<AltierDTO> toDTOList(List<Altier> altiers) {
        if (altiers == null) {
            return null;
        }
        return altiers.stream()
                .map(this::toDTO)
                .toList();
    }

    public void updateEntityFromRequest(AltierRequest request, Altier altier) {
        if (request != null) {
            altier.setLibelle(request.getLibelle());
            altier.setAdresse(request.getAdresse());
        }
    }
}
