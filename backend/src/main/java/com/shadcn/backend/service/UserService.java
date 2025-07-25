package com.shadcn.backend.service;

import com.shadcn.backend.dto.UpdateUserRequest;
import com.shadcn.backend.dto.UserFilterRequest;
import com.shadcn.backend.dto.UserRequest;
import com.shadcn.backend.dto.PublicRegistrationRequest;
import com.shadcn.backend.dto.AlumniCardResponse;
import com.shadcn.backend.model.User;
import com.shadcn.backend.model.Role;
import com.shadcn.backend.model.Biografi;
import com.shadcn.backend.repository.UserRepository;
import com.shadcn.backend.repository.RoleRepository;
import com.shadcn.backend.repository.BiografiRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Slf4j
@Service
@Transactional
@RequiredArgsConstructor
public class UserService {
    
    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final BiografiRepository biografiRepository;
    private final BiografiService biografiService;
    private final PasswordEncoder passwordEncoder;
    private final PublicInvitationLinkService publicInvitationLinkService;
    private final WhatsAppService whatsAppService;
    
    public Page<User> getAllUsers(UserFilterRequest filterRequest) {
        Sort sort = Sort.by(
            filterRequest.getSortDirection().equalsIgnoreCase("desc") ? 
            Sort.Direction.DESC : Sort.Direction.ASC, 
            filterRequest.getSortBy()
        );
        
        Pageable pageable = PageRequest.of(filterRequest.getPage(), filterRequest.getSize(), sort);
        
        User.UserStatus status = null;
        if (filterRequest.getStatus() != null && !filterRequest.getStatus().isEmpty()) {
            try {
                status = User.UserStatus.valueOf(filterRequest.getStatus().toUpperCase());
            } catch (IllegalArgumentException e) {
                // Invalid status, ignore
            }
        }
        
        return userRepository.findUsersWithFilters(
            filterRequest.getSearch(),
            filterRequest.getRoleId(),
            status,
            pageable
        );
    }
    
    public List<User> getAllUsers() {
        return userRepository.findAll();
    }

      public Optional<User> getUserByUsername(String username) {
        return userRepository.findByUsernameOrEmailWithBiografi(username);
    }
      public Optional<User> getUserByEmail(String email) {
        return userRepository.findByEmail(email);
    }
    
    public Optional<User> getUserByPhoneNumber(String phoneNumber) {
        return userRepository.findByPhoneNumber(phoneNumber);
    }
      public List<User> getUsersByStatus(User.UserStatus status) {
        return userRepository.findByStatus(status);
    }
    
    /**
     * Create a new user
     */
    public User createUser(com.shadcn.backend.dto.UserRequest request) {
        // Check if username, email, or phone already exists
        if (userRepository.existsByUsername(request.getUsername())) {
            throw new RuntimeException("Username '" + request.getUsername() + "' sudah digunakan");
        }
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("Email '" + request.getEmail() + "' sudah digunakan");
        }
        
        // Normalize phone number for consistent checking
        String normalizedPhone = whatsAppService.formatPhoneNumber(request.getPhoneNumber());
        String phoneInPlusFormat = whatsAppService.formatPhoneNumberForWhatsApp(request.getPhoneNumber());
        if (userRepository.existsByPhoneNumber(normalizedPhone) || 
            userRepository.existsByPhoneNumber(phoneInPlusFormat)) {
            throw new RuntimeException("Nomor handphone '" + request.getPhoneNumber() + "' sudah digunakan");
        }
        
        // Get role
        Role role = roleRepository.findById(request.getRoleId())
            .orElseThrow(() -> new RuntimeException("Role tidak ditemukan"));
        
        // Create new user
        User user = new User();
        user.setUsername(request.getUsername());
        user.setEmail(request.getEmail());
        user.setFullName(request.getFullName());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setPhoneNumber(normalizedPhone);
        user.setRole(role);
        user.setStatus(User.UserStatus.ACTIVE);
        
        // Check if there's a biografi with the same phone number
        Optional<Biografi> biografiOpt = biografiRepository.findByNomorTelepon(normalizedPhone);
        if (biografiOpt.isEmpty()) {
            biografiOpt = biografiRepository.findByNomorTelepon(phoneInPlusFormat);
        }
        user.setBiografi(biografiOpt.orElse(null));
        
        return userRepository.save(user);
    }
    
    /**
     * Delete a user
     */
    public void deleteUser(Long id) {
        User user = userRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("User tidak ditemukan"));
        
        // Check if user can be deleted (business logic)
        // For example, don't delete if user has important relationships
        // This is just basic implementation
        
        userRepository.delete(user);
    }
    
    public User updateUser(Long id, UpdateUserRequest request) {
        User user = userRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("User tidak ditemukan"));
        
        // Validate unique constraints (excluding current user)
        if (!user.getUsername().equals(request.getUsername()) && 
            userRepository.existsByUsername(request.getUsername())) {
            throw new RuntimeException("Username '" + request.getUsername() + "' sudah digunakan");
        }
        
        if (!user.getEmail().equals(request.getEmail()) && 
            userRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("Email '" + request.getEmail() + "' sudah digunakan");
        }
        
        if (!user.getPhoneNumber().equals(request.getPhoneNumber()) && 
            userRepository.existsByPhoneNumberAndIdNot(request.getPhoneNumber(), id)) {
            throw new RuntimeException("Nomor handphone '" + request.getPhoneNumber() + "' sudah digunakan");
        }
        
        // Get role
        Role role = roleRepository.findById(request.getRoleId())
            .orElseThrow(() -> new RuntimeException("Role tidak ditemukan"));
        
        // Update user
        user.setUsername(request.getUsername());
        user.setEmail(request.getEmail());
        user.setFullName(request.getFullName());
        // Only update password if provided and not empty
        if (request.getPassword() != null && !request.getPassword().trim().isEmpty()) {
            // Validate password length if provided
            if (request.getPassword().trim().length() < 6) {
                throw new RuntimeException("Data tidak valid: Password minimal 6 karakter");
            }
            user.setPassword(passwordEncoder.encode(request.getPassword()));
        }
        user.setPhoneNumber(request.getPhoneNumber());
        user.setRole(role);
        
        // Check if there's a biografi with the same phone number
        Optional<Biografi> biografiOpt = biografiRepository.findByNomorTelepon(request.getPhoneNumber());
        user.setBiografi(biografiOpt.orElse(null));
          return userRepository.save(user);
    }
    
    public User updateUser(Long id, User user) {
        if (!userRepository.existsById(id)) {
            throw new RuntimeException("User not found");
        }
        user.setId(id);        return userRepository.save(user);
    }
    
    public User toggleUserStatus(Long id) {
        User user = userRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("User tidak ditemukan"));
        
        user.setStatus(user.getStatus() == User.UserStatus.ACTIVE ? 
                      User.UserStatus.INACTIVE : User.UserStatus.ACTIVE);
        
        return userRepository.save(user);
    }
    
    public List<User> searchUsers(String search) {
        if (search == null || search.trim().isEmpty()) {
            return userRepository.findAll();
        }
        return userRepository.findByNameContaining(search.trim());
    }
      public boolean authenticateUser(String username, String password) {
        Optional<User> userOpt = userRepository.findByUsername(username);
        if (userOpt.isPresent()) {
            User user = userOpt.get();
            // Only allow login for ACTIVE users, not WAITING_APPROVAL
            return passwordEncoder.matches(password, user.getPassword()) && 
                   user.getStatus() == User.UserStatus.ACTIVE;
        }
        return false;
    }
    
    public boolean existsByUsername(String username) {
        return userRepository.existsByUsername(username);
    }
      public boolean existsByEmail(String email) {
        return userRepository.existsByEmail(email);
    }
    
    public boolean existsByPhoneNumber(String phoneNumber) {
        // Normalize phone number and check both formats
        String normalizedPhone = whatsAppService.formatPhoneNumber(phoneNumber);
        String phoneInPlusFormat = whatsAppService.formatPhoneNumberForWhatsApp(phoneNumber);
        
        return userRepository.existsByPhoneNumber(normalizedPhone) || 
               userRepository.existsByPhoneNumber(phoneInPlusFormat);
    }
    
    /**
     * Register user from public invitation link
     */    public User registerFromPublicLink(PublicRegistrationRequest request) {
        // Validate public invitation link
        if (!publicInvitationLinkService.isLinkValid(request.getPublicInvitationToken())) {
            throw new RuntimeException("Link undangan tidak valid atau sudah expired");
        }
        
        // Normalize phone number for consistent checking
        String normalizedPhone = whatsAppService.formatPhoneNumber(request.getPhoneNumber());
        
        // Check if username, email, or phone already exists
        if (userRepository.existsByUsername(request.getUsername())) {
            throw new RuntimeException("Username sudah digunakan");
        }
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("Email sudah digunakan");
        }
        
        // Check for phone number in both formats (08xxx and +62)
        String phoneInPlusFormat = whatsAppService.formatPhoneNumberForWhatsApp(request.getPhoneNumber());
        if (userRepository.existsByPhoneNumber(normalizedPhone) || 
            userRepository.existsByPhoneNumber(phoneInPlusFormat)) {
            throw new RuntimeException("Nomor HP sudah digunakan");
        }
        
        // Get alumni role
        Role alumniRole = roleRepository.findByRoleName("ALUMNI")
            .orElseThrow(() -> new RuntimeException("Alumni role not found"));        // Create biografi first if provided
        Biografi biografi = null;
        if (request.getBiografiData() != null) {
            log.info("Creating biografi for public registration. AlumniTahun: {}, Jurusan: {}, TempatLahir: {}, TanggalLahir: {}", 
                request.getBiografiData().getAlumniTahun(),
                request.getBiografiData().getJurusan(),
                request.getBiografiData().getTempatLahir(),
                request.getBiografiData().getTanggalLahir());
            
            // Populate biografi with user data
            request.getBiografiData().setNamaLengkap(request.getFullName());
            request.getBiografiData().setEmail(request.getEmail());
            request.getBiografiData().setNomorTelepon(normalizedPhone);
            
            // Create biografi using the service (with proper validation)
            biografi = biografiService.createBiografi(request.getBiografiData());
            log.info("Biografi created successfully with ID: {}", biografi.getBiografiId());
        } else {
            log.warn("No biografi data provided in public registration request");
        }        // Create user with WAITING_APPROVAL status
        User user = new User();
        user.setUsername(request.getUsername());
        user.setEmail(request.getEmail());
        user.setFullName(request.getFullName());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setPhoneNumber(normalizedPhone);  // Use normalized phone number
        user.setRole(alumniRole);
        user.setStatus(User.UserStatus.WAITING_APPROVAL);
        
        // Set biografi if it was created
        if (biografi != null) {
            user.setBiografi(biografi);
        }
        
        User savedUser = userRepository.save(user);
        
        // Use the public invitation link
        publicInvitationLinkService.usePublicLink(request.getPublicInvitationToken(), savedUser);
        
        return savedUser;
    }

    public User resetPassword(Long userId, String currentPassword, String newPassword) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new RuntimeException("User tidak ditemukan"));
        
        // Verify current password
        if (!passwordEncoder.matches(currentPassword, user.getPassword())) {
            throw new RuntimeException("Password lama tidak benar");
        }
        
        // Validate new password
        if (newPassword == null || newPassword.length() < 6) {
            throw new RuntimeException("Password baru minimal 6 karakter");
        }
        
        // Encode and set new password
        user.setPassword(passwordEncoder.encode(newPassword));
        
        return userRepository.save(user);
    }

    /**
     * Synchronize user-biography relationships for users who don't have their biography linked
     * This method helps fix data inconsistencies where users exist but their biography reference is null
     */
    @Transactional
    public void syncUserBiographyRelationships() {
        List<User> usersWithoutBiography = userRepository.findAll().stream()
            .filter(user -> user.getBiografi() == null)
            .collect(Collectors.toList());
        
        int linkedCount = 0;
        for (User user : usersWithoutBiography) {
            // Try to find biography by full name first
            Optional<Biografi> biografiOpt = biografiRepository.findByNamaLengkap(user.getFullName());
            
            // If not found by name, try by email
            if (biografiOpt.isEmpty()) {
                biografiOpt = biografiRepository.findByEmail(user.getEmail());
            }
            
            // If not found by email, try by phone number
            if (biografiOpt.isEmpty()) {
                biografiOpt = biografiRepository.findByNomorTelepon(user.getPhoneNumber());
            }
            
            if (biografiOpt.isPresent()) {
                user.setBiografi(biografiOpt.get());
                userRepository.save(user);
                linkedCount++;
                System.out.println("Linked biography for user: " + user.getFullName() + " (ID: " + user.getId() + ")");
            }
        }
        
        System.out.println("Synchronization complete. Linked " + linkedCount + " users with their biographies.");
    }    @Transactional(readOnly = true)
    public Optional<AlumniCardResponse> getUserForAlumniCard(Long id) {
        Optional<User> userOpt = userRepository.findByIdWithBiografi(id);
        if (userOpt.isPresent()) {
            User user = userOpt.get();
            return Optional.of(convertToAlumniCardResponse(user));
        }
        return Optional.empty();
    }
    
    private AlumniCardResponse convertToAlumniCardResponse(User user) {
        AlumniCardResponse.AlumniCardResponseBuilder builder = AlumniCardResponse.builder()
            .id(user.getId())
            .username(user.getUsername())
            .email(user.getEmail())
            .fullName(user.getFullName())
            .phoneNumber(user.getPhoneNumber())
            .avatarUrl(user.getAvatarUrl())
            .status(user.getStatus() != null ? user.getStatus().toString() : null)
            .createdAt(user.getCreatedAt())
            .updatedAt(user.getUpdatedAt());
        
        if (user.getBiografi() != null) {
            Biografi biografi = user.getBiografi();
            builder
                .biografiId(biografi.getBiografiId())
                .namaLengkap(biografi.getNamaLengkap())
                .nim(biografi.getNim())
                .alumniTahun(biografi.getAlumniTahun())
                .nomorTelepon(biografi.getNomorTelepon())
                .fotoProfil(biografi.getFotoProfil())
                .jurusan(biografi.getJurusan())
                .tanggalLulus(biografi.getTanggalLulus())
                .ipk(biografi.getIpk())
                .tanggalLahir(biografi.getTanggalLahir())
                .tempatLahir(biografi.getTempatLahir())
                .jenisKelamin(biografi.getJenisKelamin())
                .agama(biografi.getAgama())
                .foto(biografi.getFoto())
                .programStudi(biografi.getProgramStudi())
                .pendidikanLanjutan(biografi.getPendidikanLanjutan())
                .alamat(biografi.getAlamat())
                .kota(biografi.getKota())
                .provinsi(biografi.getProvinsi())
                .kecamatan(biografi.getKecamatan())
                .kelurahan(biografi.getKelurahan())
                .kodePos(biografi.getKodePos())
                .prestasi(biografi.getPrestasi())
                .hobi(biografi.getHobi())
                .instagram(biografi.getInstagram())
                .youtube(biografi.getYoutube())
                .linkedin(biografi.getLinkedin())
                .facebook(biografi.getFacebook())
                .tiktok(biografi.getTiktok())
                .telegram(biografi.getTelegram())
                .tanggalMasukKerja(biografi.getTanggalMasukKerja())
                .tanggalKeluarKerja(biografi.getTanggalKeluarKerja())
                .biografiStatus(biografi.getStatus() != null ? biografi.getStatus().toString() : null);
            
            // Get current job safely without triggering lazy loading
            try {
                String pekerjaanSaatIni = biografi.getPekerjaanSaatIni();
                builder.pekerjaanSaatIni(pekerjaanSaatIni);
            } catch (Exception e) {
                log.debug("Could not get current job: {}", e.getMessage());
                builder.pekerjaanSaatIni(null);
            }
        }
        
        return builder.build();
    }
}
