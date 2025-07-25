package com.shadcn.backend.controller;

import com.shadcn.backend.dto.AuthRequest;
import com.shadcn.backend.dto.AuthResponse;
import com.shadcn.backend.dto.PublicRegistrationRequest;
import com.shadcn.backend.model.User;
import com.shadcn.backend.model.Pegawai;
import com.shadcn.backend.service.AuthService;
import com.shadcn.backend.service.UserService;
import com.shadcn.backend.service.WilayahCacheService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "${frontend.url}")
@RequiredArgsConstructor
public class AuthController {
    
    private final AuthService authService;
    private final UserService userService;
    private final WilayahCacheService wilayahCacheService;
      @PostMapping("/login")
    public ResponseEntity<?> login(@Valid @RequestBody AuthRequest authRequest) {
        try {
            log.debug("Login attempt for username: {}", authRequest.getUsername());
            AuthResponse response = authService.authenticate(authRequest.getUsername(), authRequest.getPassword());
            log.info("Successful login for username: {}", authRequest.getUsername());
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            log.warn("Login failed for username: {} - {}", authRequest.getUsername(), e.getMessage());
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(Map.of("error", "Invalid username or password"));
        } catch (Exception e) {
            log.error("Login error for username: {}", authRequest.getUsername(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", "Authentication failed"));
        }
    }
      @PostMapping("/logout")
    public ResponseEntity<?> logout() {
        log.debug("Logout request received");
        return ResponseEntity.ok(Map.of("message", "Logged out successfully"));
    }
      @GetMapping("/me")
    public ResponseEntity<?> getCurrentUser(@RequestHeader(value = "Authorization", required = false) String token) {
        try {
            if (token == null || !token.startsWith("Bearer ")) {
                log.warn("Invalid or missing Authorization header");
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "No valid token provided"));
            }
            
            String actualToken = token.substring(7); // Remove "Bearer " prefix
            User user = authService.getUserFromToken(actualToken);
            
            if (user == null) {
                log.warn("Invalid token provided");
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "Invalid token"));
            }
            
            log.debug("Retrieved current user: {}", user.getUsername());
            return ResponseEntity.ok(user);
        } catch (Exception e) {
            log.error("Error getting current user", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", "Failed to get user info"));
        }
    }
      @PostMapping("/refresh")
    public ResponseEntity<?> refreshToken(@RequestHeader(value = "Authorization", required = false) String token) {
        try {
            if (token == null || !token.startsWith("Bearer ")) {
                log.warn("Invalid or missing Authorization header for token refresh");
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "No valid token provided"));
            }
            
            String actualToken = token.substring(7); // Remove "Bearer " prefix
            AuthResponse response = authService.refreshToken(actualToken);
            
            log.debug("Token refreshed successfully");
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            log.warn("Token refresh failed: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(Map.of("error", "Invalid token"));
        } catch (Exception e) {
            log.error("Error refreshing token", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", "Token refresh failed"));
        }
    }
      /**
     * Register user from public invitation link
     */
    @PostMapping("/register/public")
    public ResponseEntity<?> registerFromPublicLink(@Valid @RequestBody PublicRegistrationRequest request) {
        try {
            log.debug("Public registration attempt for username: {}", request.getUsername());
            User user = userService.registerFromPublicLink(request);
            log.info("Public registration successful for username: {}", request.getUsername());
            return ResponseEntity.status(HttpStatus.CREATED)
                .body(Map.of(
                    "message", "Pendaftaran berhasil! Akun Anda menunggu persetujuan admin sebelum dapat digunakan.",
                    "user", Map.of(
                        "id", user.getId(),
                        "username", user.getUsername(),
                        "fullName", user.getFullName(),
                        "email", user.getEmail(),
                        "status", user.getStatus()
                    )
                ));
        } catch (RuntimeException e) {
            log.warn("Public registration failed for username: {} - {}", request.getUsername(), e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            log.error("Error during public registration for username: {}", request.getUsername(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", "Terjadi kesalahan saat mendaftarkan pengguna"));
        }
    }
      @GetMapping("/me/location")
    public ResponseEntity<?> getCurrentUserLocation(@RequestHeader(value = "Authorization", required = false) String token) {
        try {
            if (token == null || !token.startsWith("Bearer ")) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "No valid token provided"));
            }
            
            String actualToken = token.substring(7);
            
            // Check if token is for pegawai
            if (authService.isPegawaiToken(actualToken)) {
                Pegawai pegawai = authService.getCurrentPegawai(actualToken);
                if (pegawai == null) {
                    return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(Map.of("error", "Invalid token"));
                }
                
                Map<String, Object> locationData = Map.of(
                    "alamat", pegawai.getAlamat() != null ? pegawai.getAlamat() : "",
                    "provinsi", pegawai.getProvinsi() != null ? wilayahCacheService.getNamaByKode(pegawai.getProvinsi()) : "",
                    "kota", pegawai.getKota() != null ? wilayahCacheService.getNamaByKode(pegawai.getKota()) : "",
                    "kecamatan", pegawai.getKecamatan() != null ? wilayahCacheService.getNamaByKode(pegawai.getKecamatan()) : "",
                    "kelurahan", pegawai.getKelurahan() != null ? wilayahCacheService.getNamaByKode(pegawai.getKelurahan()) : ""
                );
                
                return ResponseEntity.ok(locationData);
            } else {
                // Regular user - return biografi location if available
                User user = authService.getUserFromToken(actualToken);
                if (user == null) {
                    return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(Map.of("error", "Invalid token"));
                }
                
                Map<String, Object> locationData = Map.of(
                    "alamat", user.getBiografi() != null && user.getBiografi().getAlamat() != null ? user.getBiografi().getAlamat() : "",
                    "provinsi", user.getBiografi() != null && user.getBiografi().getProvinsi() != null ? wilayahCacheService.getNamaByKode(user.getBiografi().getProvinsi()) : "",
                    "kota", user.getBiografi() != null && user.getBiografi().getKota() != null ? wilayahCacheService.getNamaByKode(user.getBiografi().getKota()) : "",
                    "kecamatan", user.getBiografi() != null && user.getBiografi().getKecamatan() != null ? wilayahCacheService.getNamaByKode(user.getBiografi().getKecamatan()) : "",
                    "kelurahan", user.getBiografi() != null && user.getBiografi().getKelurahan() != null ? wilayahCacheService.getNamaByKode(user.getBiografi().getKelurahan()) : ""
                );
                
                return ResponseEntity.ok(locationData);
            }
        } catch (Exception e) {
            log.error("Error getting current user location", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", "Failed to get location info"));
        }
    }
}
