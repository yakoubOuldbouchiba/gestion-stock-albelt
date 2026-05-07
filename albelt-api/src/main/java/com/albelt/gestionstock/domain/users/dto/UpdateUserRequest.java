package com.albelt.gestionstock.domain.users.dto;

import com.albelt.gestionstock.shared.enums.UserRole;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.util.UUID;

@Data
public class UpdateUserRequest {

    @NotBlank(message = "Email is required")
    @Email(message = "Email must be valid")
    private String email;

    @Size(max = 120)
    private String fullName;

    private UserRole role;

    private UUID primaryAltierId;

    private Boolean isActive;
}
