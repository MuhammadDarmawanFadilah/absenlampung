-- Check pegawai dengan ID 16
SELECT 
    id, 
    nama_lengkap, 
    izin_cuti,
    YEAR(CURDATE()) as current_year
FROM pegawai 
WHERE id = 16;

-- Check data cuti untuk pegawai 16 tahun ini
SELECT 
    id,
    pegawai_id,
    tanggal_cuti,
    jenis_cuti_id,
    status_approval,
    created_at
FROM cuti 
WHERE pegawai_id = 16 
AND YEAR(tanggal_cuti) = YEAR(CURDATE())
ORDER BY tanggal_cuti DESC;

-- Check jenis cuti dengan ID 3
SELECT 
    id,
    nama_cuti,
    is_active
FROM jenis_cuti 
WHERE id = 3;
