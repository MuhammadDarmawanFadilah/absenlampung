# Database Error Troubleshooting Guide

## Overview
Panduan ini membantu mengatasi error database yang umum terjadi pada aplikasi Spring Boot dengan MySQL.

## 1. Error Table Column Mismatch

### Gejala
```
Field 'nama_jabatan' doesn't have a default value
Could not resolve attribute 'namaJabatan' of 'com.shadcn.backend.model.Jabatan'
```

### Solusi
1. **Cek Application Properties**
   ```properties
   # File: src/main/resources/application-local.properties
   spring.datasource.url=jdbc:mysql://localhost:3306/pemilihan_db2?useSSL=false&serverTimezone=UTC&allowPublicKeyRetrieval=true&createDatabaseIfNotExist=true
   spring.datasource.username=root
   spring.datasource.password=root
   spring.jpa.hibernate.ddl-auto=update
   ```

2. **Drop dan Recreate Table yang Bermasalah**
   ```sql
   -- Akses MySQL
   mysql -u root -p
   
   -- Pilih database
   USE pemilihan_db2;
   
   -- Cek struktur table yang bermasalah
   DESCRIBE jabatan;
   
   -- Drop table yang bermasalah
   DROP TABLE IF EXISTS jabatan;
   
   -- Restart aplikasi untuk auto-create table baru
   ```

3. **Alternative: Update Column Name**
   ```sql
   -- Jika tidak ingin drop table
   ALTER TABLE jabatan CHANGE COLUMN nama_jabatan nama VARCHAR(100) NOT NULL;
   ```

## 2. Error Foreign Key Constraints

### Gejala
```
Cannot add or update a child row: a foreign key constraint fails
```

### Solusi
```sql
-- Disable foreign key checks temporarily
SET FOREIGN_KEY_CHECKS = 0;

-- Drop tables in correct order
DROP TABLE IF EXISTS pegawai;
DROP TABLE IF EXISTS jabatan;
DROP TABLE IF EXISTS lokasi_kantor;

-- Re-enable foreign key checks
SET FOREIGN_KEY_CHECKS = 1;

-- Restart aplikasi
```

## 3. Complete Database Reset

### Jika semua cara di atas gagal:
```sql
-- Backup important data first (optional)
CREATE DATABASE pemilihan_db2_backup AS SELECT * FROM pemilihan_db2;

-- Drop entire database
DROP DATABASE IF EXISTS pemilihan_db2;

-- Create new database
CREATE DATABASE pemilihan_db2;

-- Restart aplikasi (akan auto-create semua tables)
```

## 4. Common MySQL Commands

### Check Database Structure
```sql
-- Show all databases
SHOW DATABASES;

-- Use database
USE pemilihan_db2;

-- Show all tables
SHOW TABLES;

-- Describe table structure
DESCRIBE table_name;

-- Show table creation SQL
SHOW CREATE TABLE table_name;
```

### Fix Common Column Issues
```sql
-- Add missing column
ALTER TABLE jabatan ADD COLUMN nama VARCHAR(100) NOT NULL DEFAULT '';

-- Rename column
ALTER TABLE jabatan CHANGE COLUMN old_name new_name VARCHAR(100) NOT NULL;

-- Drop column
ALTER TABLE jabatan DROP COLUMN column_name;

-- Modify column
ALTER TABLE jabatan MODIFY COLUMN nama VARCHAR(100) NOT NULL;
```

## 5. Application Properties Debugging

### Enable SQL Logging
```properties
# Add to application-local.properties
spring.jpa.show-sql=true
spring.jpa.properties.hibernate.format_sql=true
logging.level.org.hibernate.SQL=DEBUG
logging.level.org.hibernate.type.descriptor.sql.BasicBinder=TRACE
```

### Change DDL Strategy
```properties
# For development - recreate tables
spring.jpa.hibernate.ddl-auto=create-drop

# For production - only validate
spring.jpa.hibernate.ddl-auto=validate

# For updates - modify existing
spring.jpa.hibernate.ddl-auto=update
```

## 6. Quick Fix Commands

### PowerShell Commands
```powershell
# Stop all Java processes
Get-Process -Name "*java*" | Stop-Process -Force

# Check if port is in use
netstat -an | findstr ":8080"

# Test database connection
mysql -u root -p -e "SELECT 1"
```

### Backend Restart
```powershell
cd "C:\PROJEK\kiro\pemilihan\backend"
mvn clean compile
mvn spring-boot:run "-Dspring-boot.run.profiles=local"
```

## 7. Prevention Tips

1. **Always backup database before major changes**
2. **Use consistent column naming conventions**
3. **Test with `spring.jpa.hibernate.ddl-auto=validate` before production**
4. **Keep model annotations consistent with database schema**
5. **Use database migrations (Liquibase/Flyway) for production**

## 8. Error Log Analysis

### Look for these patterns in logs:
- `SqlExceptionHelper`: SQL errors
- `UnknownPathException`: Entity attribute not found
- `ConstraintViolationException`: Database constraint errors
- `DataIntegrityViolationException`: Foreign key violations

### Common Solutions:
1. Check entity `@Column` annotations
2. Verify foreign key relationships
3. Ensure database schema matches entity definitions
4. Check data types compatibility
