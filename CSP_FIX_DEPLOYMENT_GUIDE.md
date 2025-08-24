# WebAssembly CSP Fix - Summary & Deployment Instructions

## ✅ Perubahan Yang Sudah Dilakukan

### 1. **Middleware CSP Fix** (`src/middleware.ts`)
```typescript
// SEBELUM (ERROR):
"default-src 'self' http: https: data: blob: 'unsafe-inline'"

// SESUDAH (FIXED):
"default-src 'self' 'unsafe-eval' http: https: data: blob: 'unsafe-inline'"
```

### 2. **Next.js Config CSP Fix** (`next.config.ts`)
```typescript
// CSP header sudah diperbaiki untuk mengizinkan WebAssembly:
"default-src 'self' 'unsafe-eval' http: https: data: blob: 'unsafe-inline'"
```

### 3. **Environment Configuration**
- ❌ **Dihapus**: `.env.production` 
- ✅ **Digunakan**: `.env.prod` saja
- ✅ **Ditambahkan**: `NEXT_PUBLIC_ENABLE_WASM=true`

### 4. **Deployment Script Update** (`redeploy-frontend-absenkantor.sh`)
```bash
# Sekarang hanya menggunakan .env.prod:
if [ -f ".env.prod" ]; then
    sudo cp .env.prod .env.local
    sudo cp .env.prod .env
    echo "✅ Production environment configuration applied (.env.prod)"
else
    echo "❌ .env.prod file not found!"
    exit 1
fi
```

## 🚀 Cara Deploy ke Production

### Method 1: Menggunakan WSL/Git Bash
```bash
cd /path/to/absenlampung
bash redeploy-frontend-absenkantor.sh
```

### Method 2: Manual Steps (jika bash tidak tersedia)
```bash
# 1. Login ke server
ssh root@absenkantor.my.id

# 2. Navigate to project
cd /tmp/absenkantor-deploy

# 3. Pull latest changes  
git pull origin main

# 4. Go to frontend
cd frontend

# 5. Copy environment
cp .env.prod .env

# 6. Install & build
pnpm install
pnpm run build

# 7. Deploy to production
cp -r .next public package.json next.config.ts .env /var/www/absenkantor.my.id/

# 8. Restart service
systemctl restart absenkantor-frontend

# 9. Reload nginx
nginx -t && systemctl reload nginx
```

## 🔍 Verification Steps

### 1. Check CSP Headers in Production
```bash
curl -I https://absenkantor.my.id | grep -i content-security-policy
```

**Expected Result:**
```
content-security-policy: default-src 'self' 'unsafe-eval' http: https: data: blob: 'unsafe-inline'; script-src 'self' 'unsafe-eval' 'unsafe-inline' https: data: blob:; ...
```

### 2. Test WebAssembly Page
- Visit: https://absenkantor.my.id/admin/master-data/face-recognition/create?pegawaiId=1
- Open Browser DevTools → Console
- Should **NOT** see CSP errors
- Should see successful MediaPipe initialization

### 3. Test WASM Test Page
- Visit: https://absenkantor.my.id/test-wasm-csp.html
- Should show "✅ WebAssembly compilation successful"

## 🎯 Key Points

1. **Root Cause**: CSP di middleware tidak mengizinkan `'unsafe-eval'` di `default-src`
2. **Solution**: Menambahkan `'unsafe-eval'` ke `default-src` di middleware dan next.config.ts
3. **Environment**: Menggunakan `.env.prod` saja untuk konsistensi
4. **Deployment**: Script sudah diupdate untuk menggunakan `.env.prod`

## 🚨 Troubleshooting

### Jika Masih Error CSP:
1. **Clear browser cache** - CSP headers bisa ter-cache
2. **Check middleware aktif**: Cari header `X-CSP-Middleware: active` di response
3. **Verify environment**: Pastikan `.env.prod` ter-copy dengan benar
4. **Check Nginx**: Pastikan tidak ada CSP override di Nginx config

### Jika WebAssembly Tidak Load:
1. **Check model files**: Pastikan `public/models/face_landmarker.task` tersedia
2. **Check MIME types**: Pastikan `.wasm` dan `.task` files serve dengan MIME type yang benar
3. **Check CORS**: Pastikan tidak ada CORS blocking

## ✅ Success Indicators

- ✅ No CSP errors in browser console
- ✅ MediaPipe initializes successfully  
- ✅ Face recognition page loads without errors
- ✅ `test-wasm-csp.html` shows success message
- ✅ Headers contain `'unsafe-eval'` in CSP

## 📞 Next Steps

1. **Deploy** menggunakan salah satu method di atas
2. **Test** di production menggunakan verification steps
3. **Monitor** browser console untuk error WebAssembly
4. **Validate** face recognition functionality bekerja

---

**Status**: Ready for Production Deployment ✅