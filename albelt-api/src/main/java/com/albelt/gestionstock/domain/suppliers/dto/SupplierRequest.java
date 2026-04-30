package com.albelt.gestionstock.domain.suppliers.dto;

import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO for creating/updating suppliers
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SupplierRequest {

    @NotBlank(message = "Supplier name is required")
    @Size(min = 2, max = 200, message = "Supplier name must be 2-200 characters")
    private String name;

    @NotBlank(message = "Country is required")
    @Size(min = 2, max = 100)
    private String country;

    @Size(max = 100)
    private String contactPerson;

    @Email(message = "Email should be valid")
    private String email;

    @Pattern(regexp = "^[+0-9\\-\\s()]*$", message = "Invalid phone format")
    private String phone;

    @Positive(message = "Lead time must be greater than 0")
    private Integer leadTimeDays;

    private String notes;
}
