package com.shadcn.backend.service;

import com.shadcn.backend.dto.ProvinsiResponseDTO;
import com.shadcn.backend.model.Role;
import com.shadcn.backend.model.User;
import com.shadcn.backend.repository.RoleRepository;
import com.shadcn.backend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.Set;
import java.util.HashSet;

/**
 * Service untuk membuat data default saat aplikasi pertama kali dijalankan
 * Akan membuat role Admin dan user admin default jika belum ada
 */
@Component
public class DefaultDataService implements CommandLineRunner {
    
    @Autowired
    private UserRepository userRepository;
    
    @Autowired
    private RoleRepository roleRepository;
      @Autowired
    private PasswordEncoder passwordEncoder;
      @Autowired
    private LocationService locationService;
    
    @Autowired
    private MasterDataInitializer masterDataInitializer;@Value("${location.data.force-reinsert:false}")
    private boolean forceReinsertLocationData;
    
    @Value("${app.admin.username:admin}")
    private String defaultAdminUsername;
    
    @Value("${app.admin.password:admin123}")
    private String defaultAdminPassword;
    
    @Value("${app.admin.email:admin@alumni.com}")
    private String defaultAdminEmail;
    
    @Value("${app.admin.fullname:Administrator Sistem}")
    private String defaultAdminFullName;
    
    @Value("${app.admin.phone:+6281234567890}")
    private String defaultAdminPhone;    @Override
    @Transactional
    public void run(String... args) throws Exception {
        createDefaultAdminRole();
        createDefaultModeratorRole();
        createDefaultAdminUser();
        initializeLocationData();
        initializeMasterData();
    }
    
    /**
     * Membuat role Admin default dengan semua permissions
     */
    private void createDefaultAdminRole() {        // Cek apakah role Admin sudah ada
        if (roleRepository.findByRoleName("ADMIN").isPresent()) {
            System.out.println("✅ Role ADMIN sudah ada");
            return;
        }
        
        System.out.println("📝 Membuat role ADMIN default...");
        
        // Buat role Admin
        Role adminRole = new Role();
        adminRole.setRoleName("ADMIN");
        adminRole.setDescription("Administrator dengan akses penuh ke semua fitur sistem");
        
        // Tambahkan semua permissions
        Set<String> permissions = new HashSet<>();
        permissions.add("READ_USERS");
        permissions.add("WRITE_USERS");
        permissions.add("DELETE_USERS");
        permissions.add("MANAGE_USERS");
        permissions.add("READ_BIOGRAFI");
        permissions.add("WRITE_BIOGRAFI");
        permissions.add("DELETE_BIOGRAFI");
        permissions.add("MANAGE_BIOGRAFI");
        permissions.add("READ_DOCUMENTS");
        permissions.add("WRITE_DOCUMENTS");
        permissions.add("DELETE_DOCUMENTS");
        permissions.add("MANAGE_DOCUMENTS");
        permissions.add("READ_BERITA");
        permissions.add("WRITE_BERITA");
        permissions.add("DELETE_BERITA");
        permissions.add("MANAGE_BERITA");
        permissions.add("READ_USULAN");
        permissions.add("WRITE_USULAN");
        permissions.add("DELETE_USULAN");
        permissions.add("MANAGE_USULAN");
        permissions.add("READ_PELAKSANAAN");
        permissions.add("WRITE_PELAKSANAAN");
        permissions.add("DELETE_PELAKSANAAN");
        permissions.add("MANAGE_PELAKSANAAN");
        permissions.add("READ_ROLES");
        permissions.add("WRITE_ROLES");
        permissions.add("DELETE_ROLES");
        permissions.add("MANAGE_ROLES");
        permissions.add("SEND_NOTIFICATIONS");
        permissions.add("MANAGE_NOTIFICATIONS");
        permissions.add("SEND_INVITATIONS");
        permissions.add("MANAGE_INVITATIONS");
        permissions.add("VIEW_ANALYTICS");
        permissions.add("MANAGE_SYSTEM");
        permissions.add("SUPER_ADMIN");
        
        adminRole.setPermissions(permissions);
        
        roleRepository.save(adminRole);
        System.out.println("✅ Role ADMIN berhasil dibuat dengan " + permissions.size() + " permissions");
    }
    
    /**
     * Membuat role MODERATOR default dengan permissions terbatas
     */
    private void createDefaultModeratorRole() {
        // Cek apakah role MODERATOR sudah ada
        if (roleRepository.findByRoleName("MODERATOR").isPresent()) {
            System.out.println("✅ Role MODERATOR sudah ada");
            return;
        }
        
        System.out.println("📝 Membuat role MODERATOR default...");
        
        // Buat role MODERATOR
        Role moderatorRole = new Role();
        moderatorRole.setRoleName("MODERATOR");
        moderatorRole.setDescription("Moderator dengan akses terbatas ke fitur sistem");
        
        // Tambahkan permissions terbatas untuk moderator
        Set<String> permissions = new HashSet<>();
        permissions.add("READ_USERS");
        permissions.add("READ_BIOGRAFI");
        permissions.add("WRITE_BIOGRAFI");
        permissions.add("READ_DOCUMENTS");
        permissions.add("WRITE_DOCUMENTS");
        permissions.add("READ_BERITA");
        permissions.add("WRITE_BERITA");
        permissions.add("READ_USULAN");
        permissions.add("WRITE_USULAN");
        permissions.add("READ_PELAKSANAAN");
        permissions.add("WRITE_PELAKSANAAN");
        permissions.add("SEND_NOTIFICATIONS");
        
        moderatorRole.setPermissions(permissions);
        
        roleRepository.save(moderatorRole);
        System.out.println("✅ Role MODERATOR berhasil dibuat dengan " + permissions.size() + " permissions");
    }

    /**
     * Membuat user admin default
     */    private void createDefaultAdminUser() {
        // Cek apakah user admin sudah ada
        if (userRepository.findByUsername(defaultAdminUsername).isPresent()) {
            System.out.println("✅ User admin sudah ada");
            return;
        }
        
        System.out.println("📝 Membuat user admin default...");
          // Ambil role Admin
        Role adminRole = roleRepository.findByRoleName("ADMIN")
            .orElseThrow(() -> new RuntimeException("Role ADMIN tidak ditemukan"));
        
        // Buat user admin
        User adminUser = new User();
        adminUser.setUsername(defaultAdminUsername);
        adminUser.setEmail(defaultAdminEmail);
        adminUser.setFullName(defaultAdminFullName);
        adminUser.setPassword(passwordEncoder.encode(defaultAdminPassword));
        adminUser.setPhoneNumber(defaultAdminPhone);
        adminUser.setRole(adminRole);
        adminUser.setStatus(User.UserStatus.ACTIVE);
        
        userRepository.save(adminUser);
          System.out.println("✅ User admin berhasil dibuat!");
        System.out.println("📋 Informasi Login:");
        System.out.println("   Username: " + defaultAdminUsername);
        System.out.println("   Password: " + defaultAdminPassword);
        System.out.println("   Email: " + defaultAdminEmail);
        System.out.println("   Role: ADMIN (akses penuh ke semua menu)");
        System.out.println("💡 Silakan ganti password default setelah login pertama");
    }/**
     * Inisialisasi data provinsi dan kota Indonesia
     */
    private void initializeLocationData() {
        try {
            System.out.println("📍 Mengecek data provinsi dan kota...");
            System.out.println("🔧 Konfigurasi Force Reinsert: " + forceReinsertLocationData);
            
            // Cek apakah data provinsi sudah ada
            int existingProvinsiCount = locationService.getAllProvinsi().size();
            
            if (existingProvinsiCount > 0 && !forceReinsertLocationData) {
                System.out.println("✅ Data provinsi dan kota sudah ada (" + existingProvinsiCount + " provinsi)");
                System.out.println("💡 Untuk force reinsert, set location.data.force-reinsert=true");
                return;
            }
            
            if (forceReinsertLocationData && existingProvinsiCount > 0) {
                System.out.println("🔄 Force reinsert: Menghapus data lama dan insert ulang...");
                // Call reset method yang akan hapus semua data lama
                locationService.resetAndInitializeData();
            } else if (existingProvinsiCount == 0) {
                System.out.println("📝 Menginisialisasi data provinsi dan kota Indonesia...");
                // Call initialization saja untuk first time
                locationService.initializeLocationData();
            }
            
            int provinsiCount = locationService.getAllProvinsi().size();
            // Hitung total kota dari semua provinsi
            long kotaCount = 0;
            for (ProvinsiResponseDTO provinsi : locationService.getAllProvinsi()) {
                kotaCount += locationService.getKotaByProvinsiId(provinsi.getId()).size();
            }
                
            System.out.println("✅ Data lokasi berhasil diinisialisasi!");
            System.out.println("📊 Summary:");
            System.out.println("   • Provinsi: " + provinsiCount + " provinsi");
            System.out.println("   • Kota/Kabupaten: " + kotaCount + " kota");
            System.out.println("💡 Data location siap untuk digunakan di dropdown frontend");
            
        } catch (Exception e) {            System.err.println("❌ Error saat inisialisasi data location: " + e.getMessage());
            e.printStackTrace();
        }
    }
    
    /**
     * Inisialisasi master data (agama, dll)
     */
    private void initializeMasterData() {
        try {
            System.out.println("📚 Mengecek master data...");
            
            // Initialize agama data
            masterDataInitializer.initializeAgamaData();
            
            System.out.println("✅ Master data berhasil diinisialisasi!");
            System.out.println("💡 Data master siap untuk digunakan di sistem");
            
        } catch (Exception e) {
            System.err.println("❌ Error saat inisialisasi master data: " + e.getMessage());
            e.printStackTrace();
        }
    }
}
