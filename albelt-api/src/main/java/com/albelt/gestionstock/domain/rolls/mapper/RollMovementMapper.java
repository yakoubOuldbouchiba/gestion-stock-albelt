package com.albelt.gestionstock.domain.rolls.mapper;

import com.albelt.gestionstock.domain.rolls.dto.RollMovementDTO;
import com.albelt.gestionstock.domain.rolls.entity.RollMovement;
import com.albelt.gestionstock.domain.altier.mapper.AltierMapper;
import com.albelt.gestionstock.domain.users.mapper.UserMapper;
import org.springframework.stereotype.Component;

/**
 * Mapper for RollMovement entity and DTOs
 */
@Component
public class RollMovementMapper {

    private final AltierMapper altierMapper;
    private final UserMapper userMapper;

    public RollMovementMapper(AltierMapper altierMapper, UserMapper userMapper) {
        this.altierMapper = altierMapper;
        this.userMapper = userMapper;
    }

    public RollMovementDTO toDTO(RollMovement entity) {
        if (entity == null) {
            return null;
        }

        return RollMovementDTO.builder()
                .id(entity.getId())
                .rollId(entity.getRoll() != null ? entity.getRoll().getId() : null)
            .transferBonId(entity.getTransferBon() != null ? entity.getTransferBon().getId() : null)
                .fromAltier(entity.getFromAltier() != null ? altierMapper.toDTO(entity.getFromAltier()) : null)
                .toAltier(entity.getToAltier() != null ? altierMapper.toDTO(entity.getToAltier()) : null)
                .dateSortie(entity.getDateSortie())
                .dateEntree(entity.getDateEntree())
            .statusSortie(entity.getStatusSortie())
            .statusEntree(entity.getStatusEntree())
                .reason(entity.getReason())
                .operator(userMapper.toDTO(entity.getOperator()))
                .notes(entity.getNotes())
                .durationHours(entity.getDurationHours())
                .createdAt(entity.getCreatedAt())
                .updatedAt(entity.getUpdatedAt())
                .build();
    }

    public RollMovement toEntity(RollMovementDTO dto) {
        if (dto == null) {
            return null;
        }

        return RollMovement.builder()
                .id(dto.getId())
                .dateSortie(dto.getDateSortie())
                .dateEntree(dto.getDateEntree())
                .reason(dto.getReason())
                .notes(dto.getNotes())
                .createdAt(dto.getCreatedAt())
                .updatedAt(dto.getUpdatedAt())
                .build();
    }
}
