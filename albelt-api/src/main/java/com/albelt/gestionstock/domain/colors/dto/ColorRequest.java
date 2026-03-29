package com.albelt.gestionstock.domain.colors.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.*;

/**
 * DTO for creating/updating colors
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ColorRequest {

    @NotBlank(message = "Color name is required")
    private String name;

    @NotBlank(message = "Hex code is required")
    @Pattern(regexp = "^#[0-9A-Fa-f]{6}$", message = "Hex code must be in #RRGGBB format")
    private String hexCode;

    private Boolean isActive;
}
