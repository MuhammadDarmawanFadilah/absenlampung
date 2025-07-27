-- Debug script untuk cuti system - Current Year Issue Check
-- Execute this in MySQL to verify data structure and understand the year filtering issue

USE pemilihan_db2;

-- 1. Check JenisCuti table - verify it doesn't have year column
SELECT 'JenisCuti Table Structure:' as query_type;
DESCRIBE jenis_cuti;

SELECT 'JenisCuti Records:' as query_type;
SELECT * FROM jenis_cuti WHERE is_active = 1 ORDER BY nama_cuti;

-- 2. Check PegawaiCuti table - this has year column
SELECT 'PegawaiCuti Table Structure:' as query_type;
DESCRIBE pegawai_cuti;

SELECT 'PegawaiCuti Records for Current Year (2025):' as query_type;
SELECT 
    pc.id,
    p.nama_lengkap,
    jc.nama_cuti,
    pc.jatah_hari,
    pc.tahun,
    pc.is_active
FROM pegawai_cuti pc
JOIN pegawai p ON pc.pegawai_id = p.id
JOIN jenis_cuti jc ON pc.jenis_cuti_id = jc.id
WHERE pc.tahun = YEAR(NOW()) AND pc.is_active = 1
ORDER BY p.nama_lengkap, jc.nama_cuti;

-- 3. Check if pegawai ID 16 has current year settings
SELECT 'Pegawai ID 16 Current Year Settings:' as query_type;
SELECT 
    pc.id,
    p.nama_lengkap,
    jc.nama_cuti,
    pc.jatah_hari,
    pc.tahun,
    pc.is_active
FROM pegawai_cuti pc
JOIN pegawai p ON pc.pegawai_id = p.id
JOIN jenis_cuti jc ON pc.jenis_cuti_id = jc.id
WHERE pc.pegawai_id = 16 AND pc.tahun = YEAR(NOW()) AND pc.is_active = 1
ORDER BY jc.nama_cuti;

-- 4. Check Cuti table structure and current data
SELECT 'Cuti Table Structure:' as query_type;
DESCRIBE cuti;

SELECT 'Recent Cuti Submissions:' as query_type;
SELECT 
    c.id,
    p.nama_lengkap,
    c.tanggal_cuti,
    jc.nama_cuti,
    c.alasan_cuti,
    c.status_approval,
    c.created_at
FROM cuti c
JOIN pegawai p ON c.pegawai_id = p.id
JOIN jenis_cuti jc ON c.jenis_cuti_id = jc.id
ORDER BY c.created_at DESC
LIMIT 10;

-- 5. Check if there are any cuti submissions for pegawai 16
SELECT 'Cuti History for Pegawai ID 16:' as query_type;
SELECT 
    c.id,
    c.tanggal_cuti,
    jc.nama_cuti,
    c.alasan_cuti,
    c.status_approval,
    c.created_at
FROM cuti c
JOIN jenis_cuti jc ON c.jenis_cuti_id = jc.id
WHERE c.pegawai_id = 16
ORDER BY c.created_at DESC;

-- 6. Analysis: Find jenis cuti that have settings for current year
SELECT 'Available Jenis Cuti for Current Year (Should be displayed in frontend):' as query_type;
SELECT DISTINCT
    jc.id,
    jc.nama_cuti,
    jc.deskripsi,
    jc.is_active,
    COUNT(pc.id) as pegawai_count_with_settings
FROM jenis_cuti jc
INNER JOIN pegawai_cuti pc ON pc.jenis_cuti_id = jc.id
WHERE jc.is_active = 1 
  AND pc.is_active = 1 
  AND pc.tahun = YEAR(NOW())
GROUP BY jc.id, jc.nama_cuti, jc.deskripsi, jc.is_active
ORDER BY jc.nama_cuti;

-- 7. Check specific issue: Does pegawai 16 have ANY year settings?
SELECT 'All Year Settings for Pegawai ID 16:' as query_type;
SELECT 
    pc.id,
    jc.nama_cuti,
    pc.jatah_hari,
    pc.tahun,
    pc.is_active
FROM pegawai_cuti pc
JOIN jenis_cuti jc ON pc.jenis_cuti_id = jc.id
WHERE pc.pegawai_id = 16
ORDER BY pc.tahun DESC, jc.nama_cuti;

-- 8. Check total pegawai count and their current year settings
SELECT 'Summary: Pegawai with Current Year Settings:' as query_type;
SELECT 
    COUNT(DISTINCT pc.pegawai_id) as pegawai_with_current_year_settings,
    COUNT(DISTINCT jc.id) as jenis_cuti_available_current_year,
    YEAR(NOW()) as current_year
FROM pegawai_cuti pc
JOIN jenis_cuti jc ON pc.jenis_cuti_id = jc.id
WHERE pc.tahun = YEAR(NOW()) AND pc.is_active = 1 AND jc.is_active = 1;
