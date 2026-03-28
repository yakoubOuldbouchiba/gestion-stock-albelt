package com.albelt.gestionstock.api.dto;

import com.albelt.gestionstock.domain.users.entity.User;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.UUID;

/**
 * DTO for login response
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LoginResponse {
    private String token;
    private User user;
    private List<UUID> altierIds;  // List of altiers user has access to
}
