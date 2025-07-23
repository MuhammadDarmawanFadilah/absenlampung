package com.shadcn.backend.config;

import com.shadcn.backend.model.*;
import com.shadcn.backend.repository.*;
import com.shadcn.backend.entity.WilayahKodepos;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.io.ClassPathResource;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.io.*;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.util.*;

@Component
public class DataSeeder implements CommandLineRunner {
    
    private static final Logger logger = LoggerFactory.getLogger(DataSeeder.class);
    @Autowired
    private UserRepository userRepository;
    @Autowired
    private PaymentRepository paymentRepository;
    @Autowired
    private RoleRepository roleRepository;
    @Autowired
    private PegawaiRepository pegawaiRepository;
    @Autowired
    private JabatanRepository jabatanRepository;
    @Autowired
    private PasswordEncoder passwordEncoder;
    @Autowired
    private AppProperties appProperties;
    @Autowired
    private WilayahKodeposRepository wilayahKodeposRepository;
    
    @Override
    public void run(String... args) throws Exception {
        logger.info("Starting data seeding process...");
        
        if (!appProperties.getSampleData().isEnabled()) {
            logger.info("Sample data seeding is disabled in configuration");
            return;
        }
        
        // Seed roles first
        if (roleRepository.count() == 0) {
            logger.info("No roles found, seeding roles...");
            seedRoles();
        } else {
            logger.info("Roles already exist, skipping role seeding. Count: {}", roleRepository.count());
        }
        
        // Seed jabatan
        if (appProperties.getSampleData().getJabatan().isEnabled()) {
            if (jabatanRepository.count() == 0) {
                logger.info("No jabatan found, seeding jabatan...");
                seedJabatan();
            } else {
                logger.info("Jabatan already exist, skipping jabatan seeding. Count: {}", jabatanRepository.count());
            }
        } else {
            logger.info("Jabatan seeding is disabled in configuration");
        }
        
        // Seed pegawai (including admin users)
        if (pegawaiRepository.count() == 0) {
            logger.info("No pegawai found, seeding pegawai...");
            seedAdminPegawai();
        } else {
            logger.info("Pegawai already exist, skipping pegawai seeding. Count: {}", pegawaiRepository.count());
        }
          if (userRepository.count() == 0) {
            logger.info("No users found, seeding users...");
            seedUsers();
        } else {
            logger.info("Users already exist, skipping user seeding. Count: {}", userRepository.count());
            // Fix existing users that might not have roles
            fixUsersWithoutRoles();
        }
        
        if (paymentRepository.count() == 0) {
            logger.info("No payments found, seeding payments...");
            seedPayments();
        } else {
            logger.info("Payments already exist, skipping payment seeding. Count: {}", paymentRepository.count());
        }
        
        // Seed wilayah kodepos
        long existingKodeposCount = wilayahKodeposRepository.count();
        if (existingKodeposCount == 0) {
            logger.info("No wilayah kodepos found, seeding wilayah kodepos...");
            seedWilayahKodepos();
        } else {
            logger.info("Wilayah kodepos already exist, skipping seeding. Count: {}", existingKodeposCount);
            
            // Verify if we have the expected complete dataset
            if (existingKodeposCount < 83000) {
                logger.warn("Expected around 83,724 postal codes but found only {}. Consider clearing and reseeding.", existingKodeposCount);
            }
        }
        
        logger.info("Data seeding process completed.");
    }
      private void seedUsers() {
        // Create users using default constructor and setters
        User user1 = new User();
        user1.setUsername("john_doe");
        user1.setEmail("john@example.com");
        user1.setFullName("John Doe");
        user1.setPassword("password123");
        user1.setPhoneNumber("+1234567890");
        user1.setAvatarUrl("https://github.com/shadcn.png");
        
        User user2 = new User();
        user2.setUsername("jane_smith");
        user2.setEmail("jane@example.com");
        user2.setFullName("Jane Smith");
        user2.setPassword("password123");
        user2.setPhoneNumber("+1234567891");
        user2.setAvatarUrl("https://github.com/vercel.png");
        
        User user3 = new User();
        user3.setUsername("mike_johnson");
        user3.setEmail("mike@example.com");
        user3.setFullName("Mike Johnson");
        user3.setPassword("password123");
        user3.setPhoneNumber("+1234567892");
        user3.setStatus(User.UserStatus.INACTIVE);
        
        User user4 = new User();
        user4.setUsername("sarah_wilson");
        user4.setEmail("sarah@example.com");
        user4.setFullName("Sarah Wilson");
        user4.setPassword("password123");
        user4.setPhoneNumber("+1234567893");
        user4.setAvatarUrl("https://github.com/github.png");
        
        User user5 = new User();
        user5.setUsername("david_brown");
        user5.setEmail("david@example.com");
        user5.setFullName("David Brown");
        user5.setPassword("password123");
        user5.setPhoneNumber("+1234567894");
          List<User> users = Arrays.asList(user1, user2, user3, user4, user5);
        
        // Set default role and encode passwords for each user
        Role defaultRole = roleRepository.findByRoleName("USER").orElse(null);
        if (defaultRole == null) {
            logger.warn("Default USER role not found, users will be created without roles");
        }
        
        for (User user : users) {
            user.setRole(defaultRole);
            user.setPassword(passwordEncoder.encode(user.getPassword()));
        }
        
        user5.setStatus(User.UserStatus.SUSPENDED);
          userRepository.saveAll(users);
        logger.info("Successfully seeded {} users", users.size());
        
        // Log each user for verification
        for (User user : users) {
            logger.debug("Seeded user: id={}, username={}, email={}", 
                user.getId(), user.getUsername(), user.getEmail());
            }
    }      private void seedRoles() {
        // Create default roles
        Role adminRole = new Role();
        adminRole.setRoleName("ADMIN");
        adminRole.setPermissions(new HashSet<>(Arrays.asList(
            "users.read", "users.write", "users.delete",
            "roles.read", "roles.write", "roles.delete",
            "pegawai.read", "pegawai.write", "pegawai.delete",
            "pemilihan.read", "pemilihan.write", "pemilihan.delete",
            "laporan.read", "laporan.write", "laporan.delete",
            "payments.read", "payments.write", "payments.delete",
            "documents.read", "documents.write", "documents.delete"
        )));
        
        Role userRole = new Role();
        userRole.setRoleName("USER");
        userRole.setPermissions(new HashSet<>(Arrays.asList(
            "pegawai.read",
            "pemilihan.read",
            "laporan.read",
            "documents.read"
        )));
        
        Role moderatorRole = new Role();
        moderatorRole.setRoleName("MODERATOR");
        moderatorRole.setPermissions(new HashSet<>(Arrays.asList(
            "users.read", "users.write",
            "pegawai.read", "pegawai.write",
            "pemilihan.read", "pemilihan.write",
            "laporan.read", "laporan.write",
            "documents.read", "documents.write"
        )));
        
        Role pegawaiRole = new Role();
        pegawaiRole.setRoleName("PEGAWAI");
        pegawaiRole.setPermissions(new HashSet<>(Arrays.asList(
            "pegawai.read",
            "pemilihan.read", "pemilihan.write",
            "laporan.read", "laporan.write",
            "documents.read"
        )));
        
        List<Role> roles = Arrays.asList(adminRole, userRole, moderatorRole, pegawaiRole);
        roleRepository.saveAll(roles);
        logger.info("Successfully seeded {} roles", roles.size());
        
        // Log each role for verification
        for (Role role : roles) {
            logger.debug("Seeded role: id={}, name={}, permissions={}", 
                role.getRoleId(), role.getRoleName(), role.getPermissions());
        }
    }

    private void seedJabatan() {
        logger.info("Starting jabatan seeding...");
        
        List<Jabatan> jabatanList = Arrays.asList(
            // Bawaslu Pusat
            Jabatan.builder().nama("Ketua Bawaslu RI").isActive(true).isActive(true).build(),
            Jabatan.builder().nama("Wakil Ketua Bawaslu RI").isActive(true).isActive(true).build(),
            Jabatan.builder().nama("Anggota Bawaslu RI").isActive(true).isActive(true).build(),
            Jabatan.builder().nama("Sekretaris Jenderal").isActive(true).isActive(true).build(),
            
            // Direktorat-direktorat di Setjen Bawaslu
            Jabatan.builder().nama("Direktur Teknis dan Hukum").isActive(true).isActive(true).build(),
            Jabatan.builder().nama("Direktur Administrasi dan SDM").isActive(true).isActive(true).build(),
            Jabatan.builder().nama("Direktur Sosialisasi dan Partisipasi").isActive(true).isActive(true).build(),
            
            // Subdirektorat-subdirektorat
            Jabatan.builder().nama("Subdirektorat Hukum").isActive(true).isActive(true).build(),
            Jabatan.builder().nama("Subdirektorat Teknis Pemilu").isActive(true).isActive(true).build(),
            Jabatan.builder().nama("Subdirektorat Administrasi").isActive(true).isActive(true).build(),
            Jabatan.builder().nama("Subdirektorat SDM").isActive(true).isActive(true).build(),
            Jabatan.builder().nama("Subdirektorat Sosialisasi").isActive(true).isActive(true).build(),
            Jabatan.builder().nama("Subdirektorat Partisipasi Masyarakat").isActive(true).isActive(true).build(),
            
            // Bawaslu Provinsi
            Jabatan.builder().nama("Ketua Bawaslu Provinsi").isActive(true).build(),
            Jabatan.builder().nama("Anggota Bawaslu Provinsi").isActive(true).build(),
            Jabatan.builder().nama("Sekretaris Bawaslu Provinsi").isActive(true).build(),
            
            // Bawaslu Kabupaten/Kota
            Jabatan.builder().nama("Ketua Bawaslu Kabupaten/Kota").isActive(true).build(),
            Jabatan.builder().nama("Anggota Bawaslu Kabupaten/Kota").isActive(true).build(),
            Jabatan.builder().nama("Sekretaris Bawaslu Kabupaten/Kota").isActive(true).build(),
            
            // Panwaslu
            Jabatan.builder().nama("Ketua Panwaslu Kecamatan").isActive(true).build(),
            Jabatan.builder().nama("Anggota Panwaslu Kecamatan").isActive(true).build(),
            Jabatan.builder().nama("Ketua Panwaslu Kelurahan/Desa").isActive(true).build(),
            Jabatan.builder().nama("Anggota Panwaslu Kelurahan/Desa").isActive(true).build(),
            
            // Pengawas TPS
            Jabatan.builder().nama("Pengawas TPS").isActive(true).build(),
            
            // Staf Fungsional dan Struktural
            Jabatan.builder().nama("Kepala Bagian Umum").isActive(true).build(),
            Jabatan.builder().nama("Kepala Bagian Keuangan").isActive(true).build(),
            Jabatan.builder().nama("Kepala Bagian Program").isActive(true).build(),
            Jabatan.builder().nama("Kepala Bagian Hukum").isActive(true).build(),
            
            // Staf Teknis
            Jabatan.builder().nama("Staf Teknis Pemilu").isActive(true).build(),
            Jabatan.builder().nama("Staf Administrasi").isActive(true).build(),
            Jabatan.builder().nama("Staf Hukum").isActive(true).build(),
            Jabatan.builder().nama("Staf Keuangan").isActive(true).build(),
            Jabatan.builder().nama("Staf Hubungan Masyarakat").isActive(true).build(),
            Jabatan.builder().nama("Staf IT dan Sistem Informasi").isActive(true).build(),
            
            // Koordinator
            Jabatan.builder().nama("Koordinator Lapangan").isActive(true).build(),
            Jabatan.builder().nama("Koordinator Pengawasan").isActive(true).build(),
            Jabatan.builder().nama("Koordinator Sosialisasi").isActive(true).build(),
            
            // Jabatan Tambahan Pemerintahan
            Jabatan.builder().nama("Sekretaris Daerah").isActive(true).build(),
            Jabatan.builder().nama("Kepala Dinas").isActive(true).build(),
            Jabatan.builder().nama("Camat").isActive(true).build(),
            Jabatan.builder().nama("Lurah/Kepala Desa").isActive(true).build(),
            Jabatan.builder().nama("Staf Pemerintah Daerah").isActive(true).build()
        );
        
        jabatanRepository.saveAll(jabatanList);
        logger.info("Successfully seeded {} jabatan", jabatanList.size());
    }

    private void seedAdminPegawai() {
        logger.info("Starting admin pegawai seeding...");
        
        // Create default admin if no roles exist
        Role adminRole = roleRepository.findByRoleName("ADMIN").orElse(null);
        if (adminRole == null) {
            logger.warn("No ADMIN role found, skipping admin pegawai seeding");
            return;
        }
        
        List<Jabatan> jabatanList = jabatanRepository.findAll();
        if (jabatanList.isEmpty()) {
            logger.warn("No jabatan found for pegawai seeding");
            return;
        }
        
        Jabatan defaultJabatan = jabatanList.stream()
            .filter(j -> "Ketua Bawaslu RI".equals(j.getNama()))
            .findFirst()
            .orElse(jabatanList.get(0));
        
        // Create default admin pegawai directly instead of from users
        if (!pegawaiRepository.existsByUsername("admin")) {
            Pegawai adminPegawai = Pegawai.builder()
                .username("admin")
                .password(passwordEncoder.encode("admin123"))
                .namaLengkap("Administrator Sistem")
                .email("muhammad.df@gmail.com")
                .noTelp("085352073620")
                .nip("ADM00000001")
                .role("ADMIN")
                .jabatan(defaultJabatan)
                .isActive(true)
                .isActive(true).build();
            
            pegawaiRepository.save(adminPegawai);
            logger.info("Created default admin pegawai: admin");
        }
        
        // Create additional sample pegawai
        if (!pegawaiRepository.existsByUsername("jane_smith")) {
            Pegawai userPegawai = Pegawai.builder()
                .username("jane_smith")
                .password(passwordEncoder.encode("password123"))
                .namaLengkap("Jane Smith")
                .email("jane@example.com")
                .noTelp("+1234567891")
                .nip("PEG00000002")
                .role("USER")
                .jabatan(jabatanList.stream()
                    .filter(j -> "Staf Teknis Pemilu".equals(j.getNama()))
                    .findFirst()
                    .orElse(defaultJabatan))
                .isActive(true)
                .isActive(true).build();
            
            pegawaiRepository.save(userPegawai);
            logger.info("Created sample user pegawai: jane_smith");
        }
        
        logger.info("Successfully seeded admin pegawai");
    }

    private void seedPayments() {
        logger.info("Starting payment seeding...");
        List<User> users = userRepository.findAll();
        
        if (users.isEmpty()) {
            logger.warn("No users found for payment seeding, skipping...");
            return;
        }
        
        logger.info("Found {} users for payment seeding", users.size());
        
        List<Payment> payments = Arrays.asList(
            new Payment("PAY-12345678", new BigDecimal("299.99"), Payment.PaymentStatus.SUCCESS, Payment.PaymentMethod.CREDIT_CARD, "Subscription Fee", Payment.PaymentCategory.TUITION, users.get(0)),
            new Payment("PAY-87654321", new BigDecimal("149.50"), Payment.PaymentStatus.SUCCESS, Payment.PaymentMethod.PAYPAL, "Product Purchase", Payment.PaymentCategory.BOOKS, users.get(1)),
            new Payment("PAY-11111111", new BigDecimal("499.00"), Payment.PaymentStatus.PENDING, Payment.PaymentMethod.BANK_TRANSFER, "Service Payment", Payment.PaymentCategory.OTHER, users.get(2)),
            new Payment("PAY-22222222", new BigDecimal("79.99"), Payment.PaymentStatus.FAILED, Payment.PaymentMethod.CREDIT_CARD, "Monthly Subscription", Payment.PaymentCategory.ACCOMMODATION, users.get(3)),
            new Payment("PAY-33333333", new BigDecimal("199.99"), Payment.PaymentStatus.SUCCESS, Payment.PaymentMethod.STRIPE, "One-time Purchase", Payment.PaymentCategory.SUPPLIES, users.get(4)),
            new Payment("PAY-44444444", new BigDecimal("89.99"), Payment.PaymentStatus.REFUNDED, Payment.PaymentMethod.DEBIT_CARD, "Refunded Item", Payment.PaymentCategory.BOOKS, users.get(0)),
            new Payment("PAY-55555555", new BigDecimal("359.99"), Payment.PaymentStatus.SUCCESS, Payment.PaymentMethod.CREDIT_CARD, "Premium Package", Payment.PaymentCategory.TUITION, users.get(1)),
            new Payment("PAY-66666666", new BigDecimal("25.00"), Payment.PaymentStatus.CANCELLED, Payment.PaymentMethod.CASH, "Cancelled Order", Payment.PaymentCategory.MEALS, users.get(2))
        );
        
        // Set transaction IDs for some payments
        payments.get(0).setTransactionId("TXN-001234");
        payments.get(1).setTransactionId("TXN-001235");
        payments.get(4).setTransactionId("TXN-001236");
        payments.get(6).setTransactionId("TXN-001237");
        
        paymentRepository.saveAll(payments);
        logger.info("Successfully seeded {} payments", payments.size());
        
        // Log each payment for verification
        for (Payment payment : payments) {
            logger.debug("Seeded payment: id={}, paymentId={}, amount={}, status={}, user={}", 
                payment.getId(), payment.getPaymentId(), payment.getAmount(), 
                payment.getStatus(), payment.getUser() != null ? payment.getUser().getUsername() : "null");
        }
    }
    private void fixUsersWithoutRoles() {
        logger.info("Checking for users without roles...");
        List<User> usersWithoutRoles = userRepository.findAll().stream()
            .filter(user -> user.getRole() == null)
            .toList();
        
        if (!usersWithoutRoles.isEmpty()) {
            logger.info("Found {} users without roles, assigning default USER role", usersWithoutRoles.size());
            Role defaultRole = roleRepository.findByRoleName("USER").orElse(null);
            
            if (defaultRole != null) {
                for (User user : usersWithoutRoles) {
                    user.setRole(defaultRole);
                    // Also encode password if it's not already encoded
                    if (user.getPassword() != null && !user.getPassword().startsWith("$2a$")) {
                        user.setPassword(passwordEncoder.encode(user.getPassword()));
                    }
                }
                userRepository.saveAll(usersWithoutRoles);
                logger.info("Successfully assigned roles to {} users", usersWithoutRoles.size());
            } else {
                logger.error("Default USER role not found! Cannot assign roles to users.");
            }
        } else {
            logger.info("All existing users already have roles assigned");
        }
    }

    private void seedWilayahKodepos() {
        logger.info("Starting complete wilayah kodepos seeding from SQL file...");
        
        // Load complete postal codes from wilayah_kodepos_complete.sql
        try {
            List<WilayahKodepos> kodeposList = loadKodeposFromSqlFile();
            
            if (!kodeposList.isEmpty()) {
                logger.info("Loaded {} postal codes from SQL file", kodeposList.size());
                
                // Remove duplicates by kode (just in case)
                Map<String, WilayahKodepos> uniqueKodepos = new LinkedHashMap<>();
                for (WilayahKodepos kodepos : kodeposList) {
                    if (!uniqueKodepos.containsKey(kodepos.getKode())) {
                        uniqueKodepos.put(kodepos.getKode(), kodepos);
                    }
                }
                
                List<WilayahKodepos> finalList = new ArrayList<>(uniqueKodepos.values());
                logger.info("After deduplication: {} unique postal codes", finalList.size());
                
                if (finalList.size() != kodeposList.size()) {
                    logger.warn("Removed {} duplicate entries", kodeposList.size() - finalList.size());
                }
                
                // Save in batches for better performance
                int batchSize = 1000;
                int totalBatches = (finalList.size() + batchSize - 1) / batchSize;
                
                for (int i = 0; i < finalList.size(); i += batchSize) {
                    int endIndex = Math.min(i + batchSize, finalList.size());
                    List<WilayahKodepos> batch = finalList.subList(i, endIndex);
                    
                    try {
                        wilayahKodeposRepository.saveAll(batch);
                        int currentBatch = (i / batchSize) + 1;
                        logger.info("Saved batch {}/{} - {} entries (Total progress: {}/{})", 
                            currentBatch, totalBatches, batch.size(), endIndex, finalList.size());
                    } catch (Exception e) {
                        logger.error("Error saving batch {}: {}", (i / batchSize) + 1, e.getMessage());
                        // Continue with next batch
                    }
                }
                
                // Final verification
                long finalCount = wilayahKodeposRepository.count();
                logger.info("Successfully completed postal codes seeding. Final count in database: {}", finalCount);
                
                if (finalCount != finalList.size()) {
                    logger.warn("Expected {} entries but database contains {}. Some entries may have failed to save.", 
                        finalList.size(), finalCount);
                }
                
            } else {
                logger.warn("No postal codes loaded from SQL file, using fallback sample data");
                seedFallbackKodepos();
            }
        } catch (Exception e) {
            logger.error("Error loading postal codes from SQL file: {}", e.getMessage(), e);
            logger.info("Using fallback sample data instead");
            seedFallbackKodepos();
        }
    }
    
    private List<WilayahKodepos> loadKodeposFromSqlFile() {
        List<WilayahKodepos> kodeposList = new ArrayList<>();
        
        try {
            // Try to load from classpath first
            ClassPathResource resource = new ClassPathResource("wilayah_kodepos_complete.sql");
            InputStream inputStream;
            
            if (resource.exists()) {
                inputStream = resource.getInputStream();
                logger.info("Loading postal codes from classpath resource");
            } else {
                // Try to load from file system (development environment)
                File sqlFile = new File("wilayah_kodepos_complete.sql");
                if (sqlFile.exists()) {
                    inputStream = new FileInputStream(sqlFile);
                    logger.info("Loading postal codes from file system");
                } else {
                    logger.warn("SQL file not found in classpath or file system");
                    return kodeposList;
                }
            }
            
            try (BufferedReader reader = new BufferedReader(new InputStreamReader(inputStream, StandardCharsets.UTF_8))) {
                String line;
                int lineCount = 0;
                int parsedCount = 0;
                int errorCount = 0;
                
                logger.info("Starting to parse SQL file...");
                
                while ((line = reader.readLine()) != null) {
                    lineCount++;
                    line = line.trim();
                    
                    // Progress logging every 10000 lines
                    if (lineCount % 10000 == 0) {
                        logger.info("Processed {} lines, parsed {} postal codes", lineCount, parsedCount);
                    }
                    
                    // Parse lines like: ('11.01.01.2001', '23773'),
                    if (line.matches("^\\('.*', '.*'\\),$")) {
                        try {
                            // Extract kode and kodepos using regex
                            String pattern = "^\\('([^']+)', '([^']+)'\\),$";
                            if (line.matches(pattern)) {
                                String kode = line.replaceAll(pattern, "$1");
                                String kodepos = line.replaceAll(pattern, "$2");
                                
                                // Validate data
                                if (kode.length() >= 10 && kodepos.length() == 5) {
                                    kodeposList.add(new WilayahKodepos(kode, kodepos));
                                    parsedCount++;
                                } else {
                                    logger.debug("Invalid data format on line {}: kode={}, kodepos={}", lineCount, kode, kodepos);
                                    errorCount++;
                                }
                            }
                        } catch (Exception e) {
                            logger.debug("Error parsing line {}: {} - {}", lineCount, line, e.getMessage());
                            errorCount++;
                        }
                    }
                }
                
                logger.info("Completed parsing SQL file:");
                logger.info("- Total lines processed: {}", lineCount);
                logger.info("- Successfully parsed: {} postal codes", parsedCount);
                logger.info("- Parse errors: {}", errorCount);
                logger.info("- Expected count: ~83,724");
                
                if (parsedCount < 80000) {
                    logger.warn("Parsed count ({}) is significantly lower than expected (~83,724). Check SQL file format.", parsedCount);
                }
            }
            
        } catch (Exception e) {
            logger.error("Error reading SQL file: {}", e.getMessage(), e);
        }
        
        return kodeposList;
    }
    
    private void seedFallbackKodepos() {
        logger.info("Seeding fallback sample postal codes...");
        
        List<WilayahKodepos> fallbackList = Arrays.asList(
            // Sample data for major cities across Indonesia
            new WilayahKodepos("11.01.01.2001", "23773"), // Aceh
            new WilayahKodepos("12.71.01.1001", "20213"), // Medan
            new WilayahKodepos("31.71.01.1001", "10110"), // Jakarta Pusat
            new WilayahKodepos("32.73.01.1001", "40111"), // Bandung
            new WilayahKodepos("33.74.01.1001", "50111"), // Semarang
            new WilayahKodepos("34.71.01.1001", "55111"), // Yogyakarta
            new WilayahKodepos("35.78.01.1001", "60111"), // Surabaya
            new WilayahKodepos("51.71.01.1001", "80111"), // Denpasar
            new WilayahKodepos("73.71.01.1001", "90111"), // Makassar
            new WilayahKodepos("94.71.01.1001", "99111")  // Jayapura
        );
        
        wilayahKodeposRepository.saveAll(fallbackList);
        logger.info("Successfully seeded {} fallback postal codes", fallbackList.size());
    }
}
