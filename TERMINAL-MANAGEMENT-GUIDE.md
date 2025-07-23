# Terminal Management Guide

## Overview
Panduan untuk mengelola multiple terminals saat development dengan backend dan frontend yang berjalan bersamaan.

## 1. Mengapa Perlu Terminal Terpisah?

### Masalah Umum:
- Backend dan frontend adalah proses long-running
- Tidak bisa menjalankan command lain di terminal yang sama saat aplikasi running
- Sulit untuk monitoring logs dari kedua aplikasi
- Restart salah satu tidak mempengaruhi yang lain

### Solusi:
Gunakan terminal terpisah untuk setiap proses dan additional terminal untuk commands.

## 2. Setup Terminal untuk Development

### Terminal 1: Backend Server
```powershell
# Terminal khusus untuk backend
cd "C:\PROJEK\kiro\pemilihan\backend"

# Start backend (akan block terminal ini)
mvn spring-boot:run "-Dspring-boot.run.profiles=local"

# Output yang diharapkan:
# Started ShadcnBackendApplication in X seconds (process running for Y)
# Tomcat started on port 8080 (http) with context path ''
```

### Terminal 2: Frontend Server  
```powershell
# Terminal khusus untuk frontend
cd "C:\PROJEK\kiro\pemilihan\frontend"

# Start frontend (akan block terminal ini)
pnpm run dev

# Output yang diharapkan:
# ▲ Next.js 15.3.0 (Turbopack)
# - Local:        http://localhost:3000
# - Ready in Xms
```

### Terminal 3: Development Commands
```powershell
# Terminal untuk commands lain seperti:
# - Git operations
# - File operations  
# - Database queries
# - Testing API endpoints
# - Debugging commands

# Contoh penggunaan:
cd "C:\PROJEK\kiro\pemilihan"

# Test API
Invoke-WebRequest -Uri "http://localhost:8080/api/admin/master-data/jabatan" -Method GET

# Git operations
git status
git add .
git commit -m "Fix database schema"

# Database operations
mysql -u root -p
```

## 3. Terminal Management Commands

### Check Running Processes
```powershell
# Check Java processes (Backend)
Get-Process -Name "*java*" -ErrorAction SilentlyContinue

# Check Node processes (Frontend)  
Get-Process -Name "*node*" -ErrorAction SilentlyContinue

# Check ports
netstat -an | findstr ":8080"  # Backend
netstat -an | findstr ":3000"  # Frontend
```

### Stop Processes
```powershell
# Stop backend
Get-Process -Name "*java*" | Stop-Process -Force

# Stop frontend
Get-Process -Name "*node*" | Stop-Process -Force

# Stop specific process by PID
Stop-Process -Id 12345 -Force
```

### Restart Services
```powershell
# Restart Backend (Terminal 1)
# 1. Ctrl+C to stop current process
# 2. Run: mvn spring-boot:run "-Dspring-boot.run.profiles=local"

# Restart Frontend (Terminal 2)  
# 1. Ctrl+C to stop current process
# 2. Run: pnpm run dev

# Quick restart backend with clean compile
cd "C:\PROJEK\kiro\pemilihan\backend"
mvn clean compile
mvn spring-boot:run "-Dspring-boot.run.profiles=local"
```

## 4. VS Code Terminal Management

### Membuat Terminal Baru di VS Code:
1. **Ctrl + Shift + `** : Buka terminal panel
2. **Ctrl + Shift + 5** : Split terminal
3. **Ctrl + `** : Toggle terminal panel
4. **Klik + icon** : Tambah terminal baru

### Rename Terminal:
1. Right-click pada tab terminal
2. Pilih "Rename"
3. Beri nama: "Backend", "Frontend", "Commands"

### Terminal Shortcuts:
- **Ctrl + PageUp/PageDown** : Switch between terminals
- **Ctrl + Shift + C** : Copy
- **Ctrl + Shift + V** : Paste
- **Ctrl + C** : Stop running process

## 5. Development Workflow

### Startup Sequence:
1. **Terminal 1 (Backend)**:
   ```powershell
   cd "C:\PROJEK\kiro\pemilihan\backend"
   mvn spring-boot:run "-Dspring-boot.run.profiles=local"
   # Wait for: "Started ShadcnBackendApplication"
   ```

2. **Terminal 2 (Frontend)**:
   ```powershell
   cd "C:\PROJEK\kiro\pemilihan\frontend"  
   pnpm run dev
   # Wait for: "Ready in Xms"
   ```

3. **Terminal 3 (Commands)**:
   ```powershell
   # Test if both are running
   Invoke-WebRequest -Uri "http://localhost:8080/api/admin/master-data/jabatan" -Method GET
   Start-Process "http://localhost:3000"
   ```

### Normal Development:
- **Backend Terminal**: Monitor backend logs dan errors
- **Frontend Terminal**: Monitor frontend builds dan hot reload
- **Commands Terminal**: Git, API testing, database queries

### Shutdown Sequence:
1. Frontend: Ctrl+C di Terminal 2
2. Backend: Ctrl+C di Terminal 1  
3. Verify: Check processes stopped

## 6. Troubleshooting Terminal Issues

### Port Already in Use:
```powershell
# Find process using port
netstat -ano | findstr ":8080"
netstat -ano | findstr ":3000"

# Kill process by PID
taskkill /PID <PID> /F
```

### Terminal Hangs:
```powershell
# If terminal becomes unresponsive
# 1. Try Ctrl+C first
# 2. If not working, close terminal tab
# 3. Force kill processes:
Get-Process -Name "*java*" | Stop-Process -Force
Get-Process -Name "*node*" | Stop-Process -Force
```

### Permission Issues:
```powershell
# Run PowerShell as Administrator if needed
# Right-click PowerShell -> "Run as Administrator"
```

## 7. Monitoring Tools

### Real-time Monitoring:
```powershell
# Watch Java processes
while ($true) { Get-Process -Name "*java*" -ErrorAction SilentlyContinue | Select-Object Id, ProcessName, CPU; Start-Sleep 2; Clear-Host }

# Watch ports
while ($true) { netstat -an | findstr ":8080\|:3000"; Start-Sleep 2; Clear-Host }
```

### Log Monitoring:
- Backend logs: Monitor Terminal 1 untuk database connections, API calls
- Frontend logs: Monitor Terminal 2 untuk build errors, hot reload status

## 8. Best Practices

### DO:
- ✅ Gunakan 3 terminal terpisah minimal
- ✅ Beri nama yang jelas pada setiap terminal
- ✅ Monitor logs di terminal yang sesuai
- ✅ Stop services dengan Ctrl+C sebelum close terminal

### DON'T:
- ❌ Menjalankan backend dan frontend di terminal yang sama
- ❌ Close terminal tanpa stop processes terlebih dahulu
- ❌ Menjalankan command lain di terminal yang sedang running server
- ❌ Ignore error messages di terminal logs

### Tips:
- Simpan command yang sering digunakan dalam notepad
- Gunakan history (↑ arrow key) untuk repeat commands
- Monitor CPU usage jika aplikasi lambat
- Restart berkala untuk prevent memory leaks
