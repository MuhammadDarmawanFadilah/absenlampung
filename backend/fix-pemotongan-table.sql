-- Drop dan recreate tabel pemotongan
USE pemilihan_db2;

-- Drop tabel pemotongan jika ada
DROP TABLE IF EXISTS pemotongan;

-- Create tabel pemotongan dengan struktur yang benar
CREATE TABLE pemotongan (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    pegawai_id BIGINT NOT NULL,
    bulan_pemotongan INT NOT NULL,
    tahun_pemotongan INT NOT NULL,
    persentase_pemotongan DECIMAL(5,2) NOT NULL,
    alasan_pemotongan VARCHAR(500) NOT NULL,
    nominal_pemotongan DECIMAL(15,2),
    gaji_pokok DECIMAL(15,2),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Foreign key constraint
    FOREIGN KEY (pegawai_id) REFERENCES pegawai(id) ON DELETE CASCADE,
    
    -- Unique constraint untuk mencegah duplikasi pemotongan pada bulan/tahun yang sama untuk pegawai yang sama
    UNIQUE KEY uk_pegawai_bulan_tahun (pegawai_id, bulan_pemotongan, tahun_pemotongan, is_active)
);

-- Create indexes untuk performa
CREATE INDEX idx_pemotongan_pegawai ON pemotongan(pegawai_id);
CREATE INDEX idx_pemotongan_bulan_tahun ON pemotongan(bulan_pemotongan, tahun_pemotongan);
CREATE INDEX idx_pemotongan_created_at ON pemotongan(created_at);

-- Verify table structure
DESC pemotongan;

-- Show table info
SHOW CREATE TABLE pemotongan;
