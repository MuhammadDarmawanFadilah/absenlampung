package com.shadcn.backend.controller;

import com.shadcn.backend.dto.UserFilterRequest;
import com.shadcn.backend.dto.AuthRequest;
import com.shadcn.backend.dto.AlumniCardResponse;
import com.shadcn.backend.dto.UserSummaryDto;
import com.shadcn.backend.dto.UserRequest;
import com.shadcn.backend.dto.UpdateUserRequest;
import com.shadcn.backend.model.User;

import com.shadcn.backend.service.UserService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@Slf4j
@RestController
@RequestMapping("/api/users")
@CrossOrigin(origins = "${frontend.url}")
@RequiredArgsConstructor
public class UserController {
    
    private final UserService userService;

    @GetMapping
    @PreAuthorize("hasAuthority('pegawai.read')")
    public ResponseEntity<Page<UserSummaryDto>> getAllUsers(
        @RequestParam(defaultValue = "") String search,
        @RequestParam(required = false) Long roleId,
        @RequestParam(defaultValue = "") String status,
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "10") int size,
        @RequestParam(defaultValue = "fullName") String sortBy,
        @RequestParam(defaultValue = "asc") String sortDirection) {
        
        try {
            UserFilterRequest filterRequest = new UserFilterRequest();
            filterRequest.setSearch(search.isEmpty() ? null : search);
            filterRequest.setRoleId(roleId);
            filterRequest.setStatus(status.isEmpty() ? null : status);
            filterRequest.setPage(page);
            filterRequest.setSize(size);
            filterRequest.setSortBy(sortBy);
            filterRequest.setSortDirection(sortDirection);
            
            Page<User> users = userService.getAllUsers(filterRequest);
            Page<UserSummaryDto> userDtos = users.map(UserSummaryDto::new);
            return ResponseEntity.ok(userDtos);
        } catch (Exception e) {
            log.error("Error getting all users", e);
            return ResponseEntity.internalServerError().build();
        }
    }
      
    @GetMapping("/all")
    @PreAuthorize("hasAuthority('pegawai.read')")
    public ResponseEntity<List<UserSummaryDto>> getAllUsersList() {
        try {
            List<User> users = userService.getAllUsers();
            List<UserSummaryDto> userDtos = users.stream()
                .map(UserSummaryDto::new)
                .collect(java.util.stream.Collectors.toList());
            return ResponseEntity.ok(userDtos);
        } catch (Exception e) {
            log.error("Error getting all users list", e);
            return ResponseEntity.internalServerError().build();
        }
    }
      
    

    @GetMapping("/email/{email}")
    @PreAuthorize("hasAuthority('pegawai.read')")
    public ResponseEntity<UserSummaryDto> getUserByEmail(@PathVariable String email) {
        try {
            Optional<User> user = userService.getUserByEmail(email);
            return user.map(u -> ResponseEntity.ok(new UserSummaryDto(u)))
                      .orElse(ResponseEntity.notFound().build());
        } catch (Exception e) {
            log.error("Error getting user by email: " + email, e);
            return ResponseEntity.internalServerError().build();
        }
    }
      
    @GetMapping("/phone/{phoneNumber}")
    @PreAuthorize("hasAuthority('pegawai.read')")
    public ResponseEntity<UserSummaryDto> getUserByPhoneNumber(@PathVariable String phoneNumber) {
        try {
            Optional<User> user = userService.getUserByPhoneNumber(phoneNumber);
            return user.map(u -> ResponseEntity.ok(new UserSummaryDto(u)))                      
                      .orElse(ResponseEntity.notFound().build());
        } catch (Exception e) {
            log.error("Error getting user by phone: " + phoneNumber, e);
            return ResponseEntity.internalServerError().build();
        }
    }
      
    @GetMapping("/status/{status}")
    @PreAuthorize("hasAuthority('pegawai.read')")
    public ResponseEntity<List<UserSummaryDto>> getUsersByStatus(@PathVariable User.UserStatus status) {
        try {
            List<User> users = userService.getUsersByStatus(status);
            List<UserSummaryDto> userDtos = users.stream()
                .map(UserSummaryDto::new)
                .collect(Collectors.toList());
            return ResponseEntity.ok(userDtos);
        } catch (Exception e) {
            log.error("Error getting users by status: " + status, e);
            return ResponseEntity.internalServerError().build();
        }    
    }

    @PostMapping
    @PreAuthorize("hasAuthority('pegawai.create')")
    public ResponseEntity<?> createUser(@Valid @RequestBody UserRequest request) {
        try {
            User user = userService.createUser(request);
            return ResponseEntity.ok(new UserSummaryDto(user));
        } catch (RuntimeException e) {
            log.error("Error creating user: " + e.getMessage(), e);
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (Exception e) {
            log.error("Error creating user", e);
            return ResponseEntity.internalServerError().body("Terjadi kesalahan saat membuat user");
        }
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('pegawai.update')")
    public ResponseEntity<?> updateUser(@PathVariable Long id, @Valid @RequestBody UpdateUserRequest request) {
        try {
            User user = userService.updateUser(id, request);
            return ResponseEntity.ok(new UserSummaryDto(user));
        } catch (RuntimeException e) {
            log.error("Error updating user: " + e.getMessage(), e);
            if (e.getMessage().contains("tidak ditemukan")) {
                return ResponseEntity.notFound().build();
            }
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (Exception e) {
            log.error("Error updating user", e);
            return ResponseEntity.internalServerError().body("Terjadi kesalahan saat mengupdate user");
        }
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('pegawai.delete')")
    public ResponseEntity<?> deleteUser(@PathVariable Long id) {
        try {
            userService.deleteUser(id);
            return ResponseEntity.ok(Map.of("message", "User berhasil dihapus"));
        } catch (RuntimeException e) {
            log.error("Error deleting user: " + e.getMessage(), e);
            if (e.getMessage().contains("tidak ditemukan")) {
                return ResponseEntity.notFound().build();
            }
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (Exception e) {
            log.error("Error deleting user", e);
            return ResponseEntity.internalServerError().body("Terjadi kesalahan saat menghapus user");
        }
    }
    
    @PutMapping("/{id}/toggle-status")
    @PreAuthorize("hasAuthority('pegawai.update')")
    public ResponseEntity<?> toggleUserStatus(@PathVariable Long id) {
        try {
            User user = userService.toggleUserStatus(id);
            return ResponseEntity.ok(user);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("Terjadi kesalahan saat mengubah status user");
        }
    }
    
    @PutMapping("/{id}/old")
    @PreAuthorize("hasAuthority('pegawai.update')")
    public ResponseEntity<?> updateUserOld(@PathVariable Long id, @Valid @RequestBody User userDetails) {
        try {
            User updatedUser = userService.updateUser(id, userDetails);
            return ResponseEntity.ok(updatedUser);
        } catch (RuntimeException e) {
            if (e.getMessage().contains("not found")) {
                return ResponseEntity.notFound().build();
            }
            return ResponseEntity.badRequest().body(e.getMessage());
        }    
    }
    
    @PostMapping("/authenticate")
    public ResponseEntity<?> authenticateUser(@RequestBody AuthRequest authRequest) {
        try {
            boolean isAuthenticated = userService.authenticateUser(authRequest.getUsername(), authRequest.getPassword());
            if (isAuthenticated) {
                Optional<User> userOpt = userService.getUserByUsername(authRequest.getUsername());
                return ResponseEntity.ok(userOpt.get());
            } else {
                return ResponseEntity.badRequest().body("Username atau password salah");
            }
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("Terjadi kesalahan saat login");
        }
    }
    
    @GetMapping("/exists/username/{username}")
    public ResponseEntity<Boolean> checkUsernameExists(@PathVariable String username) {
        try {
            boolean exists = userService.existsByUsername(username);
            return ResponseEntity.ok(exists);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }    

    @GetMapping("/exists/email/{email}")
    public ResponseEntity<Boolean> checkEmailExists(@PathVariable String email) {
        try {
            boolean exists = userService.existsByEmail(email);
            return ResponseEntity.ok(exists);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }
    
    @GetMapping("/exists/phone/{phone}")
    public ResponseEntity<Boolean> checkPhoneExists(@PathVariable String phone) {
        try {
            boolean exists = userService.existsByPhoneNumber(phone);
            return ResponseEntity.ok(exists);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }
    
    @PutMapping("/{id}/reset-password")
    public ResponseEntity<?> resetPassword(@PathVariable Long id, @RequestBody Map<String, String> request) {
        try {
            String currentPassword = request.get("currentPassword");
            String newPassword = request.get("newPassword");
            
            if (currentPassword == null || newPassword == null) {
                return ResponseEntity.badRequest().body("Current password and new password are required");
            }
            
            User updatedUser = userService.resetPassword(id, currentPassword, newPassword);
            return ResponseEntity.ok(Map.of("message", "Password berhasil diubah", "user", updatedUser));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("error", "Terjadi kesalahan saat mengubah password"));
        }    
    }
    
    @PostMapping("/sync-biographies")
    public ResponseEntity<?> syncUserBiographyRelationships() {
        try {
            userService.syncUserBiographyRelationships();
            return ResponseEntity.ok(Map.of("message", "User-biography relationships synchronized successfully"));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("error", "Failed to sync user-biography relationships: " + e.getMessage()));
        }
    }
      
    @GetMapping("/{id}/alumni-card")
    public ResponseEntity<AlumniCardResponse> getUserForAlumniCard(@PathVariable Long id) {
        try {
            Optional<AlumniCardResponse> alumniCard = userService.getUserForAlumniCard(id);
            return alumniCard.map(ResponseEntity::ok)
                           .orElse(ResponseEntity.notFound().build());
        } catch (Exception e) {
            log.error("Error getting user for alumni card: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().build();
        }
    }
}
