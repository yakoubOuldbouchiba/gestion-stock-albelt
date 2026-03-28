package com.albelt.gestionstock.domain.rolls.mapper;

import com.albelt.gestionstock.domain.altier.mapper.AltierMapper;
import com.albelt.gestionstock.domain.rolls.dto.TransferBonDTO;
import com.albelt.gestionstock.domain.rolls.entity.TransferBon;
import com.albelt.gestionstock.domain.users.mapper.UserMapper;
import org.springframework.stereotype.Component;

import java.util.stream.Collectors;

@Component
public class TransferBonMapper {

    private final AltierMapper altierMapper;
    private final UserMapper userMapper;
    private final RollMovementMapper rollMovementMapper;

    public TransferBonMapper(AltierMapper altierMapper, UserMapper userMapper, RollMovementMapper rollMovementMapper) {
        this.altierMapper = altierMapper;
        this.userMapper = userMapper;
        this.rollMovementMapper = rollMovementMapper;
    }

    /**
     * Summary mapping (no movements list).
     */
    public TransferBonDTO toSummaryDTO(TransferBon entity) {
        if (entity == null) return null;

        Integer movementCount = entity.getMovements() != null ? entity.getMovements().size() : null;

        return TransferBonDTO.builder()
                .id(entity.getId())
                .fromAltier(entity.getFromAltier() != null ? altierMapper.toDTO(entity.getFromAltier()) : null)
                .toAltier(entity.getToAltier() != null ? altierMapper.toDTO(entity.getToAltier()) : null)
                .dateSortie(entity.getDateSortie())
                .dateEntree(entity.getDateEntree())
                .statusSortie(entity.getStatusSortie())
                .statusEntree(entity.getStatusEntree())
                .operator(entity.getOperator() != null ? userMapper.toDTO(entity.getOperator()) : null)
                .notes(entity.getNotes())
                .createdAt(entity.getCreatedAt())
                .updatedAt(entity.getUpdatedAt())
                .movementCount(movementCount)
                .build();
    }

    /**
     * Details mapping including movements.
     */
    public TransferBonDTO toDetailsDTO(TransferBon entity) {
        TransferBonDTO dto = toSummaryDTO(entity);
        if (dto == null) return null;

        if (entity.getMovements() != null) {
            dto.setMovements(entity.getMovements().stream().map(rollMovementMapper::toDTO).collect(Collectors.toList()));
            dto.setMovementCount(entity.getMovements().size());
        }
        return dto;
    }
}
