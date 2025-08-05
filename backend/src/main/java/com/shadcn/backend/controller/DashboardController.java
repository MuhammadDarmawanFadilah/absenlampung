package com.shadcn.backend.controller;

import com.shadcn.backend.model.LoginAudit;
import com.shadcn.backend.model.Pegawai;
import com.shadcn.backend.repository.LoginAuditRepository;
import com.shadcn.backend.repository.PegawaiRepository;
import com.shadcn.backend.service.LoginAuditService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@RestController
@RequestMapping("/api/dashboard")
@RequiredArgsConstructor
@CrossOrigin(origins = "${frontend.url}")
public class DashboardController {

    private final PegawaiRepository pegawaiRepository;
    private final LoginAuditRepository loginAuditRepository;
    private final LoginAuditService loginAuditService;

    @GetMapping("/health")
    public ResponseEntity<Map<String, Object>> getHealthStatus() {
        try {
            Map<String, Object> health = new HashMap<>();
            health.put("status", "UP");
            health.put("timestamp", LocalDateTime.now().toString());
            health.put("service", "Sistem Absensi Lampung");
            health.put("version", "1.0.0");
            return ResponseEntity.ok(health);
        } catch (Exception e) {
            log.error("Health check failed", e);
            Map<String, Object> health = new HashMap<>();
            health.put("status", "DOWN");
            health.put("timestamp", LocalDateTime.now().toString());
            health.put("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).body(health);
        }
    }

    @GetMapping("/overview")
    public ResponseEntity<Map<String, Object>> getDashboardOverview() {
        try {
            log.info("Getting dashboard overview data");
            
            Map<String, Object> response = new HashMap<>();
            
            // User Info - Based on Pegawai data
            Map<String, Object> userInfo = new HashMap<>();
            long totalPegawai = pegawaiRepository.count();
            long activePegawai = pegawaiRepository.countByIsActive(true);
            userInfo.put("totalUsers", totalPegawai);
            userInfo.put("activeUsers", activePegawai);
            userInfo.put("newUsersToday", 0L); // Can be implemented later
            userInfo.put("onlineUsers", 0L); // Can be implemented later
            response.put("userInfo", userInfo);
            
            // Organization Info
            Map<String, Object> organizationInfo = new HashMap<>();
            organizationInfo.put("name", "Sistem Absensi Lampung");
            organizationInfo.put("description", "Sistem informasi untuk mengelola absensi dan data pegawai");
            organizationInfo.put("establishedYear", "2024");
            organizationInfo.put("totalEmployees", totalPegawai);
            organizationInfo.put("totalDepartments", 5L);
            organizationInfo.put("logoUrl", "/logo.svg");
            response.put("organizationInfo", organizationInfo);
            
            // Quick Stats - Frontend compatible structure
            Map<String, Object> quickStats = new HashMap<>();
            quickStats.put("totalMembers", totalPegawai);
            quickStats.put("activeMembers", activePegawai); 
            quickStats.put("totalNews", 0L); // Placeholder for news data
            quickStats.put("totalProposals", 0L); // Placeholder for proposals data
            quickStats.put("totalDocuments", 0L); // Placeholder for documents data
            quickStats.put("monthlyLogins", 0L); // TODO: implement login statistics
            quickStats.put("memberGrowthRate", 0.0); // Placeholder for growth rate
            quickStats.put("newsGrowthRate", 0.0); // Placeholder for news growth rate
            response.put("quickStats", quickStats);
            
            // Monthly Data (sample data for charts)
            List<Map<String, Object>> monthlyData = createMonthlyData();
            response.put("monthlyData", monthlyData);
            
            // Activity Feed - Recent logins and absensi
            List<Map<String, Object>> activityFeed = createActivityFeed();
            response.put("activityFeed", activityFeed);
            
            // Recent Comments (sample data)
            List<Map<String, Object>> recentComments = createRecentComments();
            response.put("recentComments", recentComments);
            
            log.info("Dashboard overview data retrieved successfully");
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            log.error("Error getting dashboard overview", e);
            return ResponseEntity.internalServerError().build();
        }
    }

    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> getDashboardStats() {
        try {
            log.info("Getting dashboard stats data");
            
            Map<String, Object> response = new HashMap<>();
            
            // Login statistics
            long monthlyLoginCount = loginAuditRepository.countByStatusAndCreatedAtAfter(
                LoginAudit.LoginStatus.SUCCESS, 
                LocalDateTime.now().minusMonths(1)
            );
            response.put("monthlyLoginCount", monthlyLoginCount);
            
            // Recent logins
            List<LoginAudit> recentLogins = loginAuditService.getRecentLogins();
            List<Map<String, Object>> recentLoginData = recentLogins.stream()
                .limit(10)
                .map(this::convertLoginToUserInfo)
                .collect(Collectors.toList());
            response.put("recentLogins", recentLoginData);
            
            // Basic stats
            response.put("totalBiographies", pegawaiRepository.count());
            response.put("monthlyNewsCount", 0L);
            response.put("monthlyDocumentCount", 0L);
            
            // Empty arrays for now
            response.put("recentBiographies", new ArrayList<>());
            response.put("popularNews", new ArrayList<>());
            response.put("popularProposals", new ArrayList<>());
            response.put("recentComments", new ArrayList<>());
            response.put("popularDocuments", new ArrayList<>());
            
            log.info("Dashboard stats data retrieved successfully");
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            log.error("Error getting dashboard stats", e);
            return ResponseEntity.internalServerError().build();
        }
    }

    private List<Map<String, Object>> createMonthlyData() {
        List<Map<String, Object>> monthlyData = new ArrayList<>();
        String[] months = {"Jan", "Feb", "Mar", "Apr", "May", "Jun"};
        int[] logins = {50, 60, 70, 80, 90, 100};
        int[] newMembers = {5, 6, 7, 8, 9, 10};
        int[] newsPublished = {3, 4, 5, 3, 4, 5};
        int[] proposalsSubmitted = {2, 3, 2, 3, 2, 3};
        int[] documentsUploaded = {10, 12, 14, 16, 18, 20};
        
        for (int i = 0; i < months.length; i++) {
            Map<String, Object> monthData = new HashMap<>();
            monthData.put("month", months[i]);
            monthData.put("logins", logins[i]);
            monthData.put("newMembers", newMembers[i]);
            monthData.put("newsPublished", newsPublished[i]);
            monthData.put("proposalsSubmitted", proposalsSubmitted[i]);
            monthData.put("documentsUploaded", documentsUploaded[i]);
            monthlyData.add(monthData);
        }
        
        return monthlyData;
    }

    private List<Map<String, Object>> createActivityFeed() {
        List<Map<String, Object>> activities = new ArrayList<>();
        
        try {
            List<LoginAudit> recentLogins = loginAuditService.getRecentLogins();
            
            for (LoginAudit login : recentLogins) {
                Map<String, Object> activity = new HashMap<>();
                activity.put("type", "login");
                activity.put("title", "Login Berhasil");
                activity.put("description", login.getFullName() + " berhasil masuk ke sistem");
                activity.put("userName", login.getUsername());
                activity.put("userAvatar", "");
                activity.put("timestamp", login.getLoginTimestamp().toString());
                activity.put("itemUrl", "/dashboard");
                activity.put("icon", "user-check");
                activity.put("color", "green");
                activities.add(activity);
            }
            
            // Add placeholder for absensi activities
            if (activities.size() < 5) {
                Map<String, Object> activity = new HashMap<>();
                activity.put("type", "absensi");
                activity.put("title", "Absensi Masuk");
                activity.put("description", "Sistem menunggu integrasi dengan data absensi");
                activity.put("userName", "System");
                activity.put("userAvatar", "");
                activity.put("timestamp", LocalDateTime.now().toString());
                activity.put("itemUrl", "/absensi");
                activity.put("icon", "clock");
                activity.put("color", "blue");
                activities.add(activity);
            }
            
        } catch (Exception e) {
            log.error("Error creating activity feed", e);
        }
        
        return activities.stream().limit(10).collect(Collectors.toList());
    }

    private List<Map<String, Object>> createRecentComments() {
        List<Map<String, Object>> comments = new ArrayList<>();
        Map<String, Object> comment = new HashMap<>();
        comment.put("id", 1);
        comment.put("content", "Sistem berjalan dengan baik");
        comment.put("author", "Admin");
        comment.put("authorAvatar", "");
        comment.put("createdAt", LocalDateTime.now().toString());
        comment.put("itemType", "system");
        comment.put("itemTitle", "System Status");
        comment.put("itemUrl", "/dashboard");
        comments.add(comment);
        return comments;
    }

    private Map<String, Object> convertLoginToUserInfo(LoginAudit login) {
        Map<String, Object> userInfo = new HashMap<>();
        userInfo.put("fullName", login.getFullName());
        userInfo.put("email", ""); // Email not stored in LoginAudit
        userInfo.put("lastLoginDate", login.getLoginTimestamp().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME));
        userInfo.put("profileImageUrl", "");
        return userInfo;
    }
}
