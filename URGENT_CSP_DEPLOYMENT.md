# 🚨 URGENT: CSP Fix Deployment Instructions

## ❌ Problem Status
Error CSP masih terjadi:
```
"default-src 'self' http: https: data: blob: 'unsafe-inline'"
```

**MISSING**: `'unsafe-eval'` yang diperlukan untuk WebAssembly

## 🎯 IMMEDIATE ACTION REQUIRED

### Method 1: Emergency Auto-Deploy Script (RECOMMENDED)
```bash
# SSH ke server
ssh root@absenkantor.my.id

# Download dan jalankan emergency script
curl -sSL https://raw.githubusercontent.com/MuhammadDarmawanFadilah/absenlampung/main/emergency-csp-deploy.sh | bash
```

### Method 2: Manual Deployment Steps
```bash
# SSH ke server
ssh root@absenkantor.my.id

# Navigate to project
cd /tmp/absenkantor-deploy

# Pull latest changes with CSP fix
git fetch --all
git reset --hard origin/main
git pull origin main

# Go to frontend
cd frontend

# Copy environment
cp .env.prod .env

# Install and build
pnpm install --frozen-lockfile
pnpm run build

# Deploy
cp -r .next public package.json next.config.ts .env /var/www/absenkantor.my.id/
mkdir -p /var/www/absenkantor.my.id/src
cp src/middleware.ts /var/www/absenkantor.my.id/src/

# Restart services
systemctl restart absenkantor-frontend
nginx -t && systemctl reload nginx
```

## 🔍 VERIFICATION COMMANDS

### 1. Check CSP Headers
```bash
curl -I https://absenkantor.my.id | grep -i content-security-policy
```

**Expected Result (HARUS ADA 'unsafe-eval'):**
```
content-security-policy: default-src 'self' 'unsafe-eval' http: https: data: blob: 'unsafe-inline'; script-src 'self' 'unsafe-eval' 'unsafe-inline'...
```

### 2. Check Service Status
```bash
systemctl status absenkantor-frontend
journalctl -u absenkantor-frontend -f --lines=20
```

### 3. Test Endpoints
```bash
# Main site
curl -I https://absenkantor.my.id

# Face recognition
curl -I "https://absenkantor.my.id/admin/master-data/face-recognition/create?pegawaiId=1"

# WASM test
curl -I "https://absenkantor.my.id/test-wasm-csp.html"
```

## 🚨 TROUBLESHOOTING

### If CSP Still Wrong After Deployment:

#### 1. Check Nginx Override
```bash
# Check nginx config for CSP
grep -r "Content-Security-Policy" /etc/nginx/

# If found, comment out nginx CSP and let Next.js handle it
nano /etc/nginx/sites-available/absenkantor.my.id
# Comment out any add_header Content-Security-Policy lines
systemctl reload nginx
```

#### 2. Force Middleware Rebuild
```bash
cd /var/www/absenkantor.my.id
rm -rf .next
cd /tmp/absenkantor-deploy/frontend
pnpm run build
cp -r .next /var/www/absenkantor.my.id/
systemctl restart absenkantor-frontend
```

#### 3. Clear All Caches
```bash
# Server side
systemctl restart absenkantor-frontend
systemctl reload nginx

# Browser side (manual)
- Hard refresh (Ctrl+Shift+R)
- Clear all browser data
- Try incognito mode
```

### If Service Won't Start:
```bash
# Check logs
journalctl -u absenkantor-frontend -f

# Check port
netstat -tlnp | grep 3004

# Kill any existing process
pkill -f "next start"
systemctl restart absenkantor-frontend
```

## ⚡ QUICK STATUS CHECK

Run this one-liner to check everything:
```bash
ssh root@absenkantor.my.id 'echo "=== SERVICE STATUS ==="; systemctl is-active absenkantor-frontend; echo "=== CSP HEADER ==="; curl -s -I https://absenkantor.my.id | grep -i content-security-policy; echo "=== MIDDLEWARE EXISTS ==="; test -f /var/www/absenkantor.my.id/src/middleware.ts && echo "YES" || echo "NO"'
```

## 🎯 SUCCESS INDICATORS

✅ **Service active**: `systemctl is-active absenkantor-frontend` returns `active`  
✅ **CSP contains unsafe-eval**: Headers contain `'unsafe-eval'`  
✅ **No console errors**: Browser console shows no CSP WebAssembly errors  
✅ **MediaPipe loads**: Face recognition page works without errors  

## 📞 NEXT STEPS

1. **Deploy immediately** using Method 1 (emergency script)
2. **Verify CSP headers** contain `'unsafe-eval'`
3. **Clear browser cache** completely
4. **Test face recognition page**
5. **Report results**

---

**🔥 CRITICAL**: CSP fix sudah siap dan teruji. Tinggal deploy ke production untuk menyelesaikan masalah WebAssembly!