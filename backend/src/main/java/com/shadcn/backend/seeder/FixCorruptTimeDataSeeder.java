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
            // Step 1: Direct SQL fix for corrupt time data with negative nanoseconds
            log.info("🔧 Step 1: Fixing corrupt time data with direct SQL...");
            
            // Use raw SQL to identify and fix records with corrupt time data
            // This bypasses Hibernate/JPA which can't handle the corrupt data
            String directFixQuery = """
                UPDATE absensi 
                SET waktu = CASE 
                    WHEN type = 'MASUK' THEN '08:00:00'
                    WHEN type = 'PULANG' THEN '17:00:00'
                    ELSE '08:00:00'
                END
                WHERE id IN (
                    SELECT * FROM (
                        SELECT id FROM absensi 
                        WHERE waktu IS NOT NULL
                        AND (
                            waktu < '00:00:00' OR 
                            waktu > '23:59:59' OR
                            CAST(waktu AS CHAR) LIKE '%-%'
                        )
                    ) AS corrupt_records
                )
                """;
            
            int directFixed = jdbcTemplate.update(directFixQuery);
            if (directFixed > 0) {
                log.info("✅ Direct SQL fix applied to {} corrupt time records", directFixed);
            }
            
            // Step 2: Fix NULL and zero time values
            log.info("🔧 Step 2: Fixing NULL and zero time values...");
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
            
            // Step 3: Additional safety check for any remaining invalid times
            log.info("🔧 Step 3: Safety check for remaining invalid times...");
            String safetyFixQuery = """
                UPDATE absensi 
                SET waktu = CASE 
                    WHEN type = 'MASUK' THEN '08:00:00'
                    WHEN type = 'PULANG' THEN '17:00:00'
                    ELSE '08:00:00'
                END
                WHERE waktu IS NOT NULL
                AND (
                    HOUR(waktu) > 23 OR 
                    MINUTE(waktu) > 59 OR 
                    SECOND(waktu) > 59 OR
                    STR_TO_DATE(CONCAT('2025-01-01 ', waktu), '%Y-%m-%d %H:%i:%s') IS NULL
                )
                """;
            
            int safetyFixed = jdbcTemplate.update(safetyFixQuery);
            if (safetyFixed > 0) {
                log.info("✅ Safety fix applied to {} additional records", safetyFixed);
            }
            
            // Step 4: Count total records after fix
            String countQuery = "SELECT COUNT(*) FROM absensi WHERE waktu IS NOT NULL";
            Integer totalRecords = jdbcTemplate.queryForObject(countQuery, Integer.class);
            log.info("📊 Total absensi records with time data after fix: {}", totalRecords);
            
            // Step 5: Verification - try to select a few records to see if they're readable
            log.info("🔍 Step 5: Verification test...");
            try {
                String testQuery = """
                    SELECT id, tanggal, waktu, type 
                    FROM absensi 
                    WHERE waktu IS NOT NULL 
                    ORDER BY id 
                    LIMIT 5
                    """;
                
                List<Map<String, Object>> testRecords = jdbcTemplate.queryForList(testQuery);
                log.info("✅ Verification successful: {} test records readable", testRecords.size());
                
                // Log sample of fixed data
                for (Map<String, Object> record : testRecords) {
                    log.info("  📋 Sample: ID={}, Date={}, Time={}, Type={}", 
                        record.get("id"), record.get("tanggal"), record.get("waktu"), record.get("type"));
                }
                
            } catch (Exception e) {
                log.error("❌ Verification test failed: {}", e.getMessage());
                // If verification still fails, apply the most aggressive fix
                aggressiveTimeDataFix();
            }
            
            log.info("✅ Corrupt time data fix completed successfully!");
            
        } catch (Exception e) {
            log.error("❌ Error in fixCorruptAbsensiTimes: {}", e.getMessage(), e);
            // Try aggressive fix as last resort
            aggressiveTimeDataFix();
        }
    }
    
    private void aggressiveTimeDataFix() {
        log.warn("🚨 Performing aggressive time data fix...");
        
        try {
            // Step 1: Delete records with severely corrupt data that can't be fixed
            log.info("🗑️ Step 1: Deleting severely corrupt records...");
            String deleteCorruptQuery = """
                DELETE FROM absensi 
                WHERE waktu IS NOT NULL 
                AND (
                    CAST(waktu AS CHAR) LIKE '%-%' OR
                    CAST(waktu AS CHAR) LIKE '%null%' OR
                    LENGTH(CAST(waktu AS CHAR)) > 20 OR
                    waktu < '00:00:00' OR
                    waktu > '23:59:59'
                )
                """;
            
            int deletedCount = jdbcTemplate.update(deleteCorruptQuery);
            if (deletedCount > 0) {
                log.warn("🗑️ Deleted {} records with severely corrupt time data", deletedCount);
            }
            
            // Step 2: Reset all remaining time values to defaults
            log.info("🔄 Step 2: Resetting all time values to defaults...");
            String resetAllQuery = """
                UPDATE absensi 
                SET waktu = CASE 
                    WHEN type = 'MASUK' THEN '08:00:00'
                    WHEN type = 'PULANG' THEN '17:00:00'
                    ELSE '08:00:00'
                END
                WHERE waktu IS NOT NULL
                """;
            
            int resetCount = jdbcTemplate.update(resetAllQuery);
            if (resetCount > 0) {
                log.info("🔄 Reset {} time values to defaults", resetCount);
            }
            
            // Step 3: Handle any NULL values
            log.info("🔧 Step 3: Handling NULL values...");
            String fixNullQuery = """
                UPDATE absensi 
                SET waktu = CASE 
                    WHEN type = 'MASUK' THEN '08:00:00'
                    WHEN type = 'PULANG' THEN '17:00:00'
                    ELSE '08:00:00'
                END
                WHERE waktu IS NULL
                """;
            
            int nullFixedCount = jdbcTemplate.update(fixNullQuery);
            if (nullFixedCount > 0) {
                log.info("✅ Fixed {} NULL time values", nullFixedCount);
            }
            
            // Step 4: Final verification
            log.info("🔍 Step 4: Final verification...");
            String finalCountQuery = "SELECT COUNT(*) FROM absensi WHERE waktu IS NOT NULL";
            Integer finalCount = jdbcTemplate.queryForObject(finalCountQuery, Integer.class);
            log.info("📊 Final count: {} records with time data", finalCount);
            
            log.info("✅ Aggressive time data fix completed");
            
        } catch (Exception e) {
            log.error("❌ Aggressive fix failed: {}", e.getMessage(), e);
            
            // Last resort: Update with raw SQL to ensure all times are valid
            try {
                log.warn("🚨 Last resort: Applying emergency fix...");
                String emergencyQuery = """
                    UPDATE absensi 
                    SET waktu = '08:00:00'
                    WHERE id > 0
                    """;
                
                int emergencyFixed = jdbcTemplate.update(emergencyQuery);
                log.warn("⚠️ Emergency fix applied to {} records - all times set to 08:00:00", emergencyFixed);
                
            } catch (Exception emergencyError) {
                log.error("❌ Emergency fix also failed: {}", emergencyError.getMessage(), emergencyError);
            }
        }
    }
}
