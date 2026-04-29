package com.albelt.gestionstock.api.controller;

import com.albelt.gestionstock.api.response.ApiResponse;
import com.albelt.gestionstock.domain.returns.dto.ReturnBonRequest;
import com.albelt.gestionstock.domain.returns.dto.ReturnBonResponse;
import com.albelt.gestionstock.domain.returns.service.ReturnBonService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/return-bons")
@RequiredArgsConstructor
@Slf4j
public class ReturnBonController {

    private final ReturnBonService returnBonService;

    @PostMapping
    public ResponseEntity<ApiResponse<ReturnBonResponse>> create(@Valid @RequestBody ReturnBonRequest request) {
        log.info("POST /api/return-bons - Create return bon for commande {}", request.getCommandeId());

        UUID userId = getCurrentUserId();
        ReturnBonResponse response = returnBonService.create(request, userId);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(response, "Return bon created successfully"));
    }

    @GetMapping("/by-commande/{commandeId}")
    public ResponseEntity<ApiResponse<List<ReturnBonResponse>>> getByCommande(@PathVariable UUID commandeId) {
        log.info("GET /api/return-bons/by-commande/{} - Fetch return bons", commandeId);

        List<ReturnBonResponse> items = returnBonService.getByCommandeId(commandeId);
        return ResponseEntity.ok(ApiResponse.success(items));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<ReturnBonResponse>> getById(@PathVariable UUID id) {
        log.info("GET /api/return-bons/{} - Fetch return bon", id);

        ReturnBonResponse response = returnBonService.getById(id);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    private UUID getCurrentUserId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !(authentication.getPrincipal() instanceof UUID userId)) {
            throw new RuntimeException("User not authenticated");
        }
        return userId;
    }
}
