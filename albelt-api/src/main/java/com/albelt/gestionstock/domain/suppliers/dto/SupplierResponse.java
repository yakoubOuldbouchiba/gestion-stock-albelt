package com.albelt.gestionstock.domain.suppliers.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * DTO for returning supplier data in API responses
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SupplierResponse {

    private UUID id;
    private String name;
    private String country;
    private String contactPerson;
    private String email;
    private String phone;
    private Integer leadTimeDays;
    private String notes;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
