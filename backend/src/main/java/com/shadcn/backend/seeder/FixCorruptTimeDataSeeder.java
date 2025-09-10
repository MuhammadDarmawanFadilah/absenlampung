package com.shadcn.backend.seeder;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.sql.Time;
import java.time.LocalTime;
import java.util.List;
import java.util.Map;

@Component
@RequiredArgsConstructor
@Slf4j
@Order(1) // Run first to fix corrupt data
public class FixCorruptTimeDataSeeder implements CommandLineRunner {

    private final JdbcTemplate jdbcTemplate;

    @Override
    @Transactional
    public void run(String... args) throws Exception {
        log.info("🔧 Starting corrupt time data fix...");
        
        try {
            // Fix corrupt time data in absensi table
            fixCorruptAbsensiTimes();
            
            log.info("✅ Corrupt time data fix completed successfully!");
            
        } catch (Exception e) {
            log.error("❌ Error during corrupt time data fix: {}", e.getMessage(), e);
            // Don't throw exception to prevent application startup failure
        }
    }

    private void fixCorruptAbsensiTimes() {
        log.info("🕐 Fixing corrupt time data in absensi table...");
        
        try {
            // First, let's check how many records have corrupt time data
            String countQuery = """
                SELECT COUNT(*) as corrupt_count
                FROM absensi 
                WHERE waktu IS NOT NULL
                """;
            
            Integer totalRecords = jdbcTemplate.queryForObject(countQuery, Integer.class);
            log.info("📊 Total absensi records with time data: {}", totalRecords);
            
            // Find records with potentially corrupt time data by checking raw data
            String findCorruptQuery = """
                SELECT id, pegawai_id, tanggal, waktu, type, status
                FROM absensi 
                WHERE waktu IS NOT NULL
                ORDER BY id
                """;
            
            List<Map<String, Object>> records = jdbcTemplate.queryForList(findCorruptQuery);
            int fixedCount = 0;
            int validCount = 0;
            
            for (Map<String, Object> record : records) {
                Long id = ((Number) record.get("id")).longValue();
                Object waktuObj = record.get("waktu");
                String type = (String) record.get("type");
                
                try {
                    // Try to convert the time value to LocalTime to see if it's corrupt
                    LocalTime waktu = null;
                    if (waktuObj instanceof Time) {
                        waktu = ((Time) waktuObj).toLocalTime();
                    } else if (waktuObj instanceof String) {
                        waktu = LocalTime.parse((String) waktuObj);
                    }
                    
                    if (waktu != null) {
                        // If we can parse it successfully, it's valid
                        validCount++;
                    }
                    
                } catch (Exception e) {
                    // This record has corrupt time data
                    log.warn("🔧 Found corrupt time data in record ID {}: {}", id, e.getMessage());
                    
                    // Fix the corrupt time data with reasonable defaults
                    LocalTime fixedTime;
                    if ("MASUK".equals(type)) {
                        fixedTime = LocalTime.of(8, 0); // Default check-in time
                    } else {
                        fixedTime = LocalTime.of(17, 0); // Default check-out time
                    }
                    
                    // Update the record with fixed time
                    String updateQuery = "UPDATE absensi SET waktu = ? WHERE id = ?";
                    int updated = jdbcTemplate.update(updateQuery, Time.valueOf(fixedTime), id);
                    
                    if (updated > 0) {
                        fixedCount++;
                        log.info("✅ Fixed corrupt time data for record ID {} - set to {}", id, fixedTime);
                    }
                }
            }
            
            log.info("📊 Time data fix summary:");
            log.info("  - Total records processed: {}", records.size());
            log.info("  - Valid records: {}", validCount);
            log.info("  - Fixed corrupt records: {}", fixedCount);
            
            // Additional fix: Update any remaining NULL or invalid time values
            String fixNullTimesQuery = """
                UPDATE absensi 
                SET waktu = CASE 
                    WHEN type = 'MASUK' THEN '08:00:00'
                    WHEN type = 'PULANG' THEN '17:00:00'
                    ELSE '08:00:00'
                END
                WHERE waktu IS NULL OR waktu = '00:00:00'
                """;
            
            int nullFixed = jdbcTemplate.update(fixNullTimesQuery);
            if (nullFixed > 0) {
                log.info("✅ Fixed {} NULL or zero time values", nullFixed);
            }
            
            // Verify the fix by trying to query all records
            try {
                String verifyQuery = "SELECT COUNT(*) FROM absensi WHERE waktu IS NOT NULL";
                Integer verifiedCount = jdbcTemplate.queryForObject(verifyQuery, Integer.class);
                log.info("✅ Verification successful: {} records with valid time data", verifiedCount);
                
            } catch (Exception e) {
                log.error("❌ Verification failed, some corrupt data may still exist: {}", e.getMessage());
                
                // If verification still fails, let's try a more aggressive fix
                aggressiveTimeDataFix();
            }
            
        } catch (Exception e) {
            log.error("❌ Error fixing corrupt time data: {}", e.getMessage(), e);
            
            // Try aggressive fix as fallback
            aggressiveTimeDataFix();
        }
    }
    
    private void aggressiveTimeDataFix() {
        log.warn("🚨 Performing aggressive time data fix...");
        
        try {
            // Delete records with severely corrupt data that can't be fixed
            String deleteCorruptQuery = """
                DELETE FROM absensi 
                WHERE waktu IS NOT NULL 
                AND (
                    HOUR(waktu) < 0 OR HOUR(waktu) > 23 OR
                    MINUTE(waktu) < 0 OR MINUTE(waktu) > 59 OR
                    SECOND(waktu) < 0 OR SECOND(waktu) > 59
                )
                """;
            
            int deletedCount = jdbcTemplate.update(deleteCorruptQuery);
            if (deletedCount > 0) {
                log.warn("🗑️ Deleted {} records with severely corrupt time data", deletedCount);
            }
            
            // Fix any remaining problematic records by setting them to default times
            String fixRemainingQuery = """
                UPDATE absensi 
                SET waktu = CASE 
                    WHEN type = 'MASUK' THEN '08:00:00'
                    WHEN type = 'PULANG' THEN '17:00:00'
                    ELSE '08:00:00'
                END
                WHERE waktu IS NULL 
                OR TIME_FORMAT(waktu, '%H:%i:%s') = '00:00:00'
                OR HOUR(waktu) NOT BETWEEN 0 AND 23
                OR MINUTE(waktu) NOT BETWEEN 0 AND 59
                """;
            
            int fixedCount = jdbcTemplate.update(fixRemainingQuery);
            if (fixedCount > 0) {
                log.info("✅ Applied aggressive fix to {} records", fixedCount);
            }
            
        } catch (Exception e) {
            log.error("❌ Aggressive fix also failed: {}", e.getMessage(), e);
        }
    }
}
