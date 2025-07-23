package com.shadcn.backend.controller;

import com.shadcn.backend.dto.DashboardStatsDTO;
import com.shadcn.backend.dto.DashboardOverviewDTO;
import com.shadcn.backend.service.DashboardService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@Slf4j
@RestController
@RequestMapping("/api/dashboard")
@CrossOrigin(origins = "${frontend.url}")
@RequiredArgsConstructor
public class DashboardController {

    private final DashboardService dashboardService;

    @GetMapping("/stats")
    public ResponseEntity<DashboardStatsDTO> getDashboardStats() {
        try {
            log.info("Getting dashboard statistics");
            DashboardStatsDTO stats = dashboardService.getDashboardStats();
            log.info("Successfully retrieved dashboard statistics");
            return ResponseEntity.ok(stats);
        } catch (Exception e) {
            log.error("Error getting dashboard statistics", e);
            return ResponseEntity.internalServerError().build();
        }
    }

    @GetMapping("/overview")
    public ResponseEntity<DashboardOverviewDTO> getDashboardOverview() {
        try {
            log.info("Getting dashboard overview data");
            DashboardOverviewDTO overview = dashboardService.getDashboardOverview();
            log.info("Successfully retrieved dashboard overview");
            return ResponseEntity.ok(overview);
        } catch (Exception e) {
            log.error("Error getting dashboard overview", e);
            return ResponseEntity.internalServerError().build();
        }
    }

    @GetMapping("/health")
    public ResponseEntity<String> healthCheck() {
        log.info("Dashboard health check requested");
        return ResponseEntity.ok("Dashboard API is running");
    }

    @PostMapping("/initialize")
    public ResponseEntity<String> initializeDashboardData() {
        try {
            log.info("Initializing dashboard data");
            dashboardService.initializeDashboardData();
            log.info("Dashboard data initialized successfully");
            return ResponseEntity.ok("Dashboard data initialized successfully");
        } catch (Exception e) {
            log.error("Error initializing dashboard data", e);
            return ResponseEntity.internalServerError().body("Error initializing dashboard data");
        }
    }
}
