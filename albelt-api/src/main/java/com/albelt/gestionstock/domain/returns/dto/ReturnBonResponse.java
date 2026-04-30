package com.albelt.gestionstock.domain.returns.dto;

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
public class ReturnBonResponse {

    private UUID id;

    private UUID commandeId;

    private String returnMode;

    private String reason;

    private String reasonDetails;

    private String notes;

    private UserDTO createdBy;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;

    private Integer itemCount;

    private List<ReturnBonItemResponse> items;
}
