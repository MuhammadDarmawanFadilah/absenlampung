-- Check if pemotongan table exists and view its structure
SELECT * FROM information_schema.tables 
WHERE table_schema = 'absenlampung' 
AND table_name = 'pemotongan';

-- If table exists, show its columns
DESC pemotongan;

-- Check some sample data
SELECT COUNT(*) as total_records FROM pemotongan;

-- Check if we have pegawai data
SELECT COUNT(*) as total_pegawai FROM pegawai;

-- Show first few pegawai records to verify data
SELECT id, nama_lengkap, nip, email, gaji_pokok 
FROM pegawai 
WHERE is_active = 1 
LIMIT 10;
