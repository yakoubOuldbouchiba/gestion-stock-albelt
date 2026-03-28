package com.albelt.gestionstock.domain.users.dto;

import com.albelt.gestionstock.domain.altier.dto.AltierDTO;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * DTO for UserAltier - avoids lazy loading issues in JSON serialization
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserAltierDTO {
    private UUID id;
    private UserDTO user;
    private AltierDTO altier;
    private UserDTO assignedBy;
    private LocalDateTime assignedAt;
}
