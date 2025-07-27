-- Insert Jenis Cuti Data
INSERT INTO jenis_cuti (nama_cuti, deskripsi, is_active, created_at, updated_at) VALUES
('Cuti Tahunan', 'Cuti tahunan sesuai undang-undang', true, NOW(), NOW()),
('Cuti Sakit', 'Cuti karena sakit dengan surat dokter', true, NOW(), NOW()),
('Cuti Melahirkan', 'Cuti melahirkan untuk karyawan wanita', true, NOW(), NOW()),
('Cuti Menikah', 'Cuti untuk keperluan pernikahan', true, NOW(), NOW()),
('Cuti Kematian Keluarga', 'Cuti karena kematian anggota keluarga', true, NOW(), NOW()),
('Cuti Ibadah Haji', 'Cuti untuk menunaikan ibadah haji', true, NOW(), NOW()),
('Cuti Besar', 'Cuti besar setelah 6 tahun bekerja', true, NOW(), NOW()),
('Cuti Tidak Berbayar', 'Cuti tanpa gaji untuk keperluan pribadi', true, NOW(), NOW());
