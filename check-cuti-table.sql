-- Check if cuti table exists and view structure
DESCRIBE cuti;

-- Check sample data in cuti table
SELECT COUNT(*) as total_cuti FROM cuti;

-- Check the last 5 cuti records if any
SELECT * FROM cuti ORDER BY created_at DESC LIMIT 5;

-- Check jenis_cuti table
SELECT * FROM jenis_cuti WHERE is_active = 1;
