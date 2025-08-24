# EMERGENCY CSP FIX DEPLOYMENT

## Issue: Duplicate CSP Headers Causing WebAssembly to Fail

### Problem Identified:
Server mengirim **2 CSP headers** yang berbeda:
1. CSP benar (dengan 'unsafe-eval')  
2. CSP salah (tanpa 'unsafe-eval')

Browser menggunakan intersection → CSP paling restrictive → WebAssembly gagal

### Solution Applied:
**HAPUS CSP dari next.config.ts headers() function**
- Biarkan HANYA middleware.ts yang mengatur CSP
- Eliminasi duplicate headers

### Manual Deployment Required:

```powershell
# 1. Build aplikasi
cd frontend
npm run build

# 2. Upload build ke server
# Gunakan FTP/SFTP atau deploy script manual

# 3. Restart service
# sudo systemctl restart absenkantor-frontend

# 4. Reload nginx  
# sudo nginx -t && sudo systemctl reload nginx
```

### Verification Command:
```powershell
(Invoke-WebRequest -Uri "https://absenkantor.my.id" -Method HEAD).Headers["content-security-policy"]
```

**Expected Result:** Hanya 1 CSP header dengan 'unsafe-eval'

### Next Steps:
1. Manual deployment via server access
2. Verifikasi CSP headers  
3. Test WebAssembly functionality