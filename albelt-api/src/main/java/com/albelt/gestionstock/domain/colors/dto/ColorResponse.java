package com.albelt.gestionstock.domain.colors.dto;

import lombok.*;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * DTO for returning color data
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ColorResponse {

    private UUID id;
    private String name;
    private String hexCode;
    private Boolean isActive;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
