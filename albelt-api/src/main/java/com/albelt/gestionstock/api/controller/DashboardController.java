package com.albelt.gestionstock.api.controller;

import com.albelt.gestionstock.api.dto.DashboardStatsResponse;
import com.albelt.gestionstock.api.response.ApiResponse;
import com.albelt.gestionstock.domain.dashboard.service.DashboardService;
import com.albelt.gestionstock.domain.users.service.UserAltierService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

/**
 * Dashboard endpoints.
 * Computes lightweight statistics directly in SQL (aggregations + limits).
 */
@RestController
@RequestMapping("/api/dashboard")
@RequiredArgsConstructor
@Slf4j
public class DashboardController {

    private final DashboardService dashboardService;
    private final UserAltierService userAltierService;

    /**
     * GET /api/dashboard/stats
     */
    @GetMapping("/stats")
    @Transactional(readOnly = true)
    public ResponseEntity<ApiResponse<DashboardStatsResponse>> getStats() {
        UUID currentUser = (UUID) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        var accessibleAltierIds = userAltierService.getAccessibleAltiers(currentUser);

        log.debug("Dashboard stats requested by user={}, altiers={}", currentUser, accessibleAltierIds);

        DashboardStatsResponse stats = dashboardService.getDashboardStats(accessibleAltierIds);
        return ResponseEntity.ok(ApiResponse.success(stats));
    }
}
