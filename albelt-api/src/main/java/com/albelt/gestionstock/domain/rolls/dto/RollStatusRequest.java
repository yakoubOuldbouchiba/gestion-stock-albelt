package com.albelt.gestionstock.domain.rolls.dto;

import com.albelt.gestionstock.shared.enums.RollStatus;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO for updating roll status
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RollStatusRequest {

    @NotNull(message = "Status is required")
    private RollStatus status;
}
