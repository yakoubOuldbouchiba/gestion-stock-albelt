package com.albelt.gestionstock.domain.rolls.dto;

import com.albelt.gestionstock.domain.altier.dto.AltierDTO;
import com.albelt.gestionstock.domain.users.dto.UserDTO;
import lombok.*;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * DTO for RollMovement - Response object
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RollMovementDTO {
    private UUID id;
    private UUID rollId;
    private UUID wastePieceId;
    private UUID transferBonId;
    private AltierDTO fromAltier;
    private AltierDTO toAltier;
    private LocalDateTime dateSortie;
    private LocalDateTime dateEntree;
    private Boolean statusSortie;  // true when item exits from_altier
    private Boolean statusEntree;  // true when item enters to_altier
    private String reason;
    private UserDTO operator;
    private String notes;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private long durationHours;
}

/**
 * DTO for RollMovement - Request object
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
class RollMovementRequest {
    private UUID rollId;
    private UUID fromAltierID;
    private UUID toAltierID;
    private LocalDateTime dateSortie;
    private LocalDateTime dateEntree;
    private String reason;
    private String notes;
}
