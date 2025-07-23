# Quick Database Fix Script
# Untuk mengatasi masalah column mapping pada table jabatan

# Jalankan MySQL queries berikut jika ada error:

```sql
-- Akses MySQL
mysql -u root -p

-- Pilih database
USE pemilihan_db2;

-- Cek struktur table jabatan
DESCRIBE jabatan;

-- Option 1: Drop dan recreate table (Recommended untuk development)
DROP TABLE IF EXISTS jabatan;

-- Option 2: Rename column jika ingin preserve data
-- ALTER TABLE jabatan CHANGE COLUMN nama_jabatan nama VARCHAR(100) NOT NULL;

-- Restart aplikasi setelah menjalankan salah satu option di atas
```

# PowerShell commands untuk restart:
```powershell
# Stop processes
Get-Process -Name "*java*" | Stop-Process -Force

# Restart backend
cd "C:\PROJEK\kiro\pemilihan\backend"
mvn spring-boot:run "-Dspring-boot.run.profiles=local"
```
