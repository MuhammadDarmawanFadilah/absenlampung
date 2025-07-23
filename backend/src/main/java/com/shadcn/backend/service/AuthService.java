package com.shadcn.backend.service;

import com.shadcn.backend.dto.AuthResponse;
import com.shadcn.backend.dto.UserSummaryDto;
import com.shadcn.backend.model.User;
import com.shadcn.backend.model.Pegawai;
import com.shadcn.backend.model.Role;
import com.shadcn.backend.repository.UserRepository;
import com.shadcn.backend.repository.PegawaiRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.Base64;
import java.util.Optional;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuthService {
    
    private final UserRepository userRepository;
    private final PegawaiRepository pegawaiRepository;
    private final PasswordEncoder passwordEncoder;
      public AuthResponse authenticate(String username, String password) {
        log.debug("Attempting authentication for username: {}", username);
        
        // First, try to find user in users table
        Optional<User> userOpt = userRepository.findByUsernameOrEmailWithBiografi(username);
        
        if (userOpt.isPresent()) {
            User user = userOpt.get();
            
            if (!passwordEncoder.matches(password, user.getPassword())) {
                log.warn("Invalid password for user: {}", username);
                throw new RuntimeException("Invalid password");
            }
            
            if (user.getStatus() != User.UserStatus.ACTIVE) {
                log.warn("Inactive user attempted login: {}", username);
                throw new RuntimeException("User account is not active");
            }
            
            // Generate permanent token based on user data
            String token = generatePermanentToken(user);
            
            // Convert User to UserSummaryDto to avoid N+1 queries
            UserSummaryDto userSummary = new UserSummaryDto(user);
            
            log.info("Authentication successful for user: {}", username);
            return new AuthResponse(token, userSummary, Long.MAX_VALUE); // Never expires
        }
        
        // If not found in users table, try pegawai table
        Optional<Pegawai> pegawaiOpt = pegawaiRepository.findByUsername(username);
        
        if (pegawaiOpt.isPresent()) {
            Pegawai pegawai = pegawaiOpt.get();
            
            if (!passwordEncoder.matches(password, pegawai.getPassword())) {
                log.warn("Invalid password for pegawai: {}", username);
                throw new RuntimeException("Invalid password");
            }
            
            if (!pegawai.getIsActive()) {
                log.warn("Inactive pegawai attempted login: {}", username);
                throw new RuntimeException("Pegawai account is not active");
            }
            
            // Generate permanent token based on pegawai data
            String token = generatePermanentTokenForPegawai(pegawai);
            
            // Convert Pegawai to UserSummaryDto for compatibility
            UserSummaryDto userSummary = convertPegawaiToUserSummary(pegawai);
            
            log.info("Authentication successful for pegawai: {}", username);
            return new AuthResponse(token, userSummary, Long.MAX_VALUE); // Never expires
        }
        
        log.warn("User/Pegawai not found: {}", username);
        throw new RuntimeException("User not found");
    }
      /**
     * Extract user ID from permanent token
     */
    public Long getUserIdFromToken(String token) {
        try {
            // Decode the token and extract user ID
            String decoded = new String(Base64.getDecoder().decode(token));
            String[] parts = decoded.split(":");
            if (parts.length >= 2) {
                String userIdStr = parts[0];
                // Check if it's a pegawai token (starts with P)
                if (userIdStr.startsWith("P")) {
                    return Long.parseLong(userIdStr.substring(1));
                } else {
                    return Long.parseLong(userIdStr);
                }
            }
            return null;
        } catch (Exception e) {
            log.debug("Failed to extract user ID from token", e);
            return null;
        }
    }
    
    /**
     * Check if token is for pegawai
     */
    public boolean isPegawaiToken(String token) {
        try {
            String decoded = new String(Base64.getDecoder().decode(token));
            String[] parts = decoded.split(":");
            if (parts.length >= 2) {
                return parts[0].startsWith("P");
            }
            return false;
        } catch (Exception e) {
            return false;
        }
    }
      /**
     * Get user from token - validate against database
     */
    public User getUserFromToken(String token) {
        Long userId = getUserIdFromToken(token);
        if (userId == null) {
            log.debug("Invalid token format");
            return null;
        }
        
        // Check if it's a pegawai token
        if (isPegawaiToken(token)) {
            // Handle pegawai token
            Optional<Pegawai> pegawaiOpt = pegawaiRepository.findById(userId);
            if (pegawaiOpt.isEmpty()) {
                log.debug("Pegawai not found for token: {}", userId);
                return null;
            }
            
            Pegawai pegawai = pegawaiOpt.get();
            
            // Validate token signature
            String expectedToken = generatePermanentTokenForPegawai(pegawai);
            if (!token.equals(expectedToken)) {
                log.debug("Token signature mismatch for pegawai: {}", userId);
                return null;
            }
            
            // Check if pegawai is still active
            if (!pegawai.getIsActive()) {
                log.debug("Pegawai not active: {}", userId);
                return null;
            }
            
            // Convert pegawai to user-like object for compatibility
            return convertPegawaiToUser(pegawai);
        } else {
            // Handle regular user token
            Optional<User> userOpt = userRepository.findByIdWithBiografi(userId);
            if (userOpt.isEmpty()) {
                log.debug("User not found for token: {}", userId);
                return null;
            }
            
            User user = userOpt.get();
            
            // Validate token signature
            String expectedToken = generatePermanentToken(user);
            if (!token.equals(expectedToken)) {
                log.debug("Token signature mismatch for user: {}", userId);
                return null;
            }
            
            // Check if user is still active
            if (user.getStatus() != User.UserStatus.ACTIVE) {
                log.debug("User not active: {}", userId);
                return null;
            }
            
            return user;
        }
    }
      public AuthResponse refreshToken(String oldToken) {
        User user = getUserFromToken(oldToken);
        
        if (user == null) {
            log.warn("Invalid token for refresh");
            throw new RuntimeException("Invalid token");
        }
        
        // Check if this is a pegawai token
        if (isPegawaiToken(oldToken)) {
            // Handle pegawai token refresh
            Optional<Pegawai> pegawaiOpt = pegawaiRepository.findById(user.getId());
            if (pegawaiOpt.isEmpty()) {
                log.warn("Pegawai not found for token refresh");
                throw new RuntimeException("Invalid token");
            }
            
            Pegawai pegawai = pegawaiOpt.get();
            
            // Generate new token (in case pegawai data changed)
            String newToken = generatePermanentTokenForPegawai(pegawai);
            
            // Convert Pegawai to UserSummaryDto
            UserSummaryDto userSummary = convertPegawaiToUserSummary(pegawai);
            
            log.debug("Token refreshed for pegawai: {}", pegawai.getUsername());
            return new AuthResponse(newToken, userSummary, Long.MAX_VALUE);
        } else {
            // Handle regular user token refresh
            Optional<User> userOpt = userRepository.findByIdWithBiografi(user.getId());
            if (userOpt.isEmpty()) {
                log.warn("User not found for token refresh");
                throw new RuntimeException("Invalid token");
            }
            
            User actualUser = userOpt.get();
            
            // Generate new token (in case user data changed)
            String newToken = generatePermanentToken(actualUser);
            
            // Convert User to UserSummaryDto to avoid N+1 queries
            UserSummaryDto userSummary = new UserSummaryDto(actualUser);
            
            log.debug("Token refreshed for user: {}", actualUser.getUsername());
            return new AuthResponse(newToken, userSummary, Long.MAX_VALUE);
        }
    }
    
    public void logout(String token) {
        // For permanent tokens, we don't need to track logout
        // Token validation will always check against database
    }
    
    /**
     * Check if user is admin by user ID
     */
    public boolean isAdmin(Long userId) {
        if (userId == null) {
            return false;
        }
        
        // First check if it's a regular user
        Optional<User> userOpt = userRepository.findByIdWithBiografi(userId);
        if (userOpt.isPresent()) {
            return userOpt.get().isAdmin();
        }
        
        // Then check if it's a pegawai (pegawai are not admin by default)
        Optional<Pegawai> pegawaiOpt = pegawaiRepository.findById(userId);
        if (pegawaiOpt.isPresent()) {
            // Pegawai are not admin by default, but you can modify this logic
            // if you want certain pegawai to have admin privileges
            return false;
        }
        
        return false;
    }
    
    /**
     * Get current pegawai from token if token belongs to pegawai
     */
    public Pegawai getCurrentPegawai(String token) {
        if (token == null || !isPegawaiToken(token)) {
            return null;
        }
        
        Long pegawaiId = getUserIdFromToken(token);
        if (pegawaiId == null) {
            return null;
        }
        
        Optional<Pegawai> pegawaiOpt = pegawaiRepository.findById(pegawaiId);
        if (pegawaiOpt.isEmpty()) {
            return null;
        }
        
        Pegawai pegawai = pegawaiOpt.get();
        
        // Validate token signature
        String expectedToken = generatePermanentTokenForPegawai(pegawai);
        if (!token.equals(expectedToken)) {
            return null;
        }
        
        // Check if pegawai is still active
        if (!pegawai.getIsActive()) {
            return null;
        }
        
        return pegawai;
    }
    
    private String generatePermanentToken(User user) {
        // Generate deterministic permanent token based on user data
        // This ensures same token for same user across server restarts
        String tokenData = user.getId() + ":" + user.getUsername() + ":" + user.getPassword().substring(0, 10);
        return Base64.getEncoder().encodeToString(tokenData.getBytes());
    }
    
    private String generatePermanentTokenForPegawai(Pegawai pegawai) {
        // Generate deterministic permanent token based on pegawai data
        // This ensures same token for same pegawai across server restarts
        String tokenData = "P" + pegawai.getId() + ":" + pegawai.getUsername() + ":" + pegawai.getPassword().substring(0, 10);
        return Base64.getEncoder().encodeToString(tokenData.getBytes());
    }
    
    private UserSummaryDto convertPegawaiToUserSummary(Pegawai pegawai) {
        UserSummaryDto userSummary = new UserSummaryDto();
        userSummary.setId(pegawai.getId());
        userSummary.setUsername(pegawai.getUsername());
        userSummary.setFullName(pegawai.getNamaLengkap());
        userSummary.setEmail(pegawai.getEmail());
        userSummary.setPhoneNumber(pegawai.getNoTelp());
        
        // Convert Pegawai isActive to User status for compatibility
        if (pegawai.getIsActive()) {
            userSummary.setStatus(User.UserStatus.ACTIVE);
        } else {
            userSummary.setStatus(User.UserStatus.INACTIVE);
        }
        
        // Create a role DTO for pegawai
        UserSummaryDto.RoleDto roleDto = new UserSummaryDto.RoleDto();
        roleDto.setRoleId(999L); // Special ID for pegawai role
        roleDto.setRoleName("PEGAWAI");
        roleDto.setDescription("Pegawai Sistem");
        userSummary.setRole(roleDto);
        
        userSummary.setCreatedAt(pegawai.getCreatedAt());
        userSummary.setUpdatedAt(pegawai.getUpdatedAt());
        return userSummary;
    }
    
    private User convertPegawaiToUser(Pegawai pegawai) {
        // Create a temporary User object for compatibility
        User user = new User();
        user.setId(pegawai.getId());
        user.setUsername(pegawai.getUsername());
        user.setFullName(pegawai.getNamaLengkap());
        user.setEmail(pegawai.getEmail());
        user.setPhoneNumber(pegawai.getNoTelp());
        user.setPassword(pegawai.getPassword());
        user.setCreatedAt(pegawai.getCreatedAt());
        user.setUpdatedAt(pegawai.getUpdatedAt());
        
        // Convert status
        if (pegawai.getIsActive()) {
            user.setStatus(User.UserStatus.ACTIVE);
        } else {
            user.setStatus(User.UserStatus.INACTIVE);
        }
        
        // Set role for pegawai - create a dummy role for compatibility
        Role pegawaiRole = new Role();
        pegawaiRole.setRoleId(999L);
        pegawaiRole.setRoleName("PEGAWAI");
        pegawaiRole.setDescription("Pegawai Sistem");
        user.setRole(pegawaiRole);
        
        return user;
    }
}
