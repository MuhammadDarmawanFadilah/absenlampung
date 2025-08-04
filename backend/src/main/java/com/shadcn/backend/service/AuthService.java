package com.shadcn.backend.service;

import com.shadcn.backend.dto.AuthResponse;
import com.shadcn.backend.dto.UserSummaryDto;
import com.shadcn.backend.model.Pegawai;
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
    
    private final PegawaiRepository pegawaiRepository;
    private final PasswordEncoder passwordEncoder;
      public AuthResponse authenticate(String username, String password) {
        log.debug("Attempting authentication for username: {}", username);
        
        // Try to find pegawai by username
        Optional<Pegawai> pegawaiOpt = pegawaiRepository.findByUsername(username);
        
        // If not found by username, try finding by NIP
        if (!pegawaiOpt.isPresent()) {
            pegawaiOpt = pegawaiRepository.findByNip(username);
        }
        
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
        
        log.warn("Pegawai not found: {}", username);
        throw new RuntimeException("Pegawai not found");
    }
      /**
     * Extract pegawai ID from permanent token
     */
    public Long getUserIdFromToken(String token) {
        try {
            // Decode the token and extract pegawai ID
            String decoded = new String(Base64.getDecoder().decode(token));
            String[] parts = decoded.split(":");
            if (parts.length >= 2) {
                String userIdStr = parts[0];
                // Remove P prefix if exists
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
     * Get pegawai from token - validate against database
     */
    public Pegawai getPegawaiFromToken(String token) {
        Long pegawaiId = getUserIdFromToken(token);
        if (pegawaiId == null) {
            log.debug("Invalid token format");
            return null;
        }
        
        Optional<Pegawai> pegawaiOpt = pegawaiRepository.findById(pegawaiId);
        if (pegawaiOpt.isEmpty()) {
            log.debug("Pegawai not found for token: {}", pegawaiId);
            return null;
        }
        
        Pegawai pegawai = pegawaiOpt.get();
        
        // Validate token signature
        String expectedToken = generatePermanentTokenForPegawai(pegawai);
        if (!token.equals(expectedToken)) {
            log.debug("Token signature mismatch for pegawai: {}", pegawaiId);
            return null;
        }
        
        // Check if pegawai is still active
        if (!pegawai.getIsActive()) {
            log.debug("Pegawai not active: {}", pegawaiId);
            return null;
        }
        
        return pegawai;
    }
      public AuthResponse refreshToken(String oldToken) {
        Pegawai pegawai = getPegawaiFromToken(oldToken);
        
        if (pegawai == null) {
            log.warn("Invalid token for refresh");
            throw new RuntimeException("Invalid token");
        }
        
        // Generate new token (in case pegawai data changed)
        String newToken = generatePermanentTokenForPegawai(pegawai);
        
        // Convert Pegawai to UserSummaryDto
        UserSummaryDto userSummary = convertPegawaiToUserSummary(pegawai);
        
        log.debug("Token refreshed for pegawai: {}", pegawai.getUsername());
        return new AuthResponse(newToken, userSummary, Long.MAX_VALUE);
    }
    
    public void logout(String token) {
        // For permanent tokens, we don't need to track logout
        // Token validation will always check against database
    }
    
    /**
     * Check if pegawai is admin by pegawai ID
     */
    public boolean isAdmin(Long pegawaiId) {
        if (pegawaiId == null) {
            return false;
        }
        
        Optional<Pegawai> pegawaiOpt = pegawaiRepository.findById(pegawaiId);
        if (pegawaiOpt.isPresent()) {
            // Check if pegawai has admin role based on role field or isAdmin field
            Pegawai pegawai = pegawaiOpt.get();
            return pegawai.getIsAdmin() != null && "true".equals(pegawai.getIsAdmin().toLowerCase());
        }
        
        return false;
    }
    
    /**
     * Get current pegawai from token if token belongs to pegawai
     */
    public Pegawai getCurrentPegawai(String token) {
        return getPegawaiFromToken(token);
    }
    
    /**
     * Find pegawai by username - used for cross-table user lookup
     */
    public Pegawai findPegawaiByUsername(String username) {
        Optional<Pegawai> pegawaiOpt = pegawaiRepository.findByUsername(username);
        if (pegawaiOpt.isPresent() && pegawaiOpt.get().getIsActive()) {
            return pegawaiOpt.get();
        }
        return null;
    }
    
    private String generatePermanentTokenForPegawai(Pegawai pegawai) {
        // Generate deterministic permanent token based on pegawai data
        // This ensures same token for same pegawai across server restarts
        String tokenData = "P" + pegawai.getId() + ":" + pegawai.getUsername() + ":" + pegawai.getPassword().substring(0, 10);
        return Base64.getEncoder().encodeToString(tokenData.getBytes());
    }
    
    public UserSummaryDto convertPegawaiToUserSummary(Pegawai pegawai) {
        UserSummaryDto userSummary = new UserSummaryDto();
        userSummary.setId(pegawai.getId());
        userSummary.setUsername(pegawai.getUsername());
        userSummary.setFullName(pegawai.getNamaLengkap());
        userSummary.setEmail(pegawai.getEmail());
        userSummary.setPhoneNumber(pegawai.getNoTelp());
        
        // Convert Pegawai isActive to String status for compatibility
        if (pegawai.getIsActive()) {
            userSummary.setStatus("ACTIVE");
        } else {
            userSummary.setStatus("INACTIVE");
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
}
