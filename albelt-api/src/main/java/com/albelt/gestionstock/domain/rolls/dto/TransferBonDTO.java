package com.albelt.gestionstock.domain.rolls.dto;

import com.albelt.gestionstock.domain.altier.dto.AltierDTO;
import com.albelt.gestionstock.domain.users.dto.UserDTO;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TransferBonDTO {
    private UUID id;
    private AltierDTO fromAltier;
    private AltierDTO toAltier;
    private LocalDateTime dateSortie;
    private LocalDateTime dateEntree;
    private Boolean statusSortie;
    private Boolean statusEntree;
    private UserDTO operator;
    private String notes;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    // Optional details
    private Integer movementCount;
    private List<RollMovementDTO> movements;
}
