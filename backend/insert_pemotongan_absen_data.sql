-- Insert data pemotongan absen
INSERT INTO pemotongan_absen (kode, nama, deskripsi, persentase, is_active, created_at, updated_at) VALUES
('TL0', 'Terlambat Masuk 0', 'Terlambat Masuk 1 - 30 menit', 0.00, true, NOW(), NOW()),
('TL1', 'Terlambat Masuk 1', 'Terlambat Masuk 31 - 60 menit', 0.50, true, NOW(), NOW()),
('TL2', 'Terlambat Masuk 2', 'Terlambat Masuk 61 - 90 menit', 1.25, true, NOW(), NOW()),
('TL3', 'Terlambat Masuk 3', 'Terlambat Masuk lebih dari 90 menit', 2.50, true, NOW(), NOW()),
('PSW1', 'Pulang Cepat 1', 'Pulang Cepat 1 - 30 menit', 0.50, true, NOW(), NOW()),
('PSW2', 'Pulang Cepat 2', 'Pulang Cepat 31 - 60 menit', 1.25, true, NOW(), NOW()),
('PSW3', 'Pulang Cepat 3', 'Pulang Cepat lebih dari 61 menit', 2.50, true, NOW(), NOW()),
('LAM', 'Lupa Absen Masuk', 'Lupa Absen Masuk', 2.50, true, NOW(), NOW()),
('LAP', 'Lupa Absen Pulang', 'Lupa Absen Pulang', 2.50, true, NOW(), NOW()),
('TA', 'Tidak Absen', 'Tidak Absen', 5.00, true, NOW(), NOW());
