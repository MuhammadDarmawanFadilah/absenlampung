# FRONTEND REDEPLOY GUIDE
## Quick Frontend Redeployment for Production

### 🚀 ONE-COMMAND FRONTEND REDEPLOY

#### **Method 1: Quick Redeploy (Recommended)**
```bash
echo "🔄 Starting Frontend Redeploy..." && \
sudo systemctl stop trensilapor-frontend && \
cd /tmp && \
sudo rm -rf /tmp/pemilihan && \
sudo git clone https://github.com/MuhammadDarmawanFadilah/pemilihan.git /tmp/pemilihan && \
cd /tmp/pemilihan/frontend && \
sudo cp .env.prod .env.local && \
sudo pnpm install --frozen-lockfile && \
sudo pnpm run build && \
sudo rm -rf /var/www/trensilapor.my.id/.next && \
sudo cp -r .next /var/www/trensilapor.my.id/ && \
sudo cp -r public/* /var/www/trensilapor.my.id/public/ 2>/dev/null || true && \
sudo chown -R root:root /var/www/trensilapor.my.id && \
sudo systemctl start trensilapor-frontend && \
echo "✅ Frontend redeployed successfully!" && \
echo "📋 Checking service status..." && \
sudo systemctl status trensilapor-frontend --no-pager
```

#### **Method 2: Full Clean Redeploy**
```bash
echo "🔄 Starting Full Clean Frontend Redeploy..." && \
sudo systemctl stop trensilapor-frontend && \
sudo rm -rf /var/www/trensilapor.my.id && \
sudo mkdir -p /var/www/trensilapor.my.id && \
cd /tmp && \
sudo rm -rf /tmp/pemilihan && \
sudo git clone https://github.com/MuhammadDarmawanFadilah/pemilihan.git /tmp/pemilihan && \
cd /tmp/pemilihan/frontend && \
sudo cp .env.prod .env.local && \
sudo pnpm install --frozen-lockfile && \
sudo pnpm run build && \
sudo cp -r .next public package.json next.config.ts .env.local node_modules /var/www/trensilapor.my.id/ && \
sudo chown -R root:root /var/www/trensilapor.my.id && \
sudo systemctl start trensilapor-frontend && \
echo "✅ Frontend fully redeployed successfully!" && \
echo "📋 Checking service status..." && \
sudo systemctl status trensilapor-frontend --no-pager
```

#### **Method 3: Build Only Update (Fastest)**
```bash
echo "🔄 Starting Build-Only Frontend Update..." && \
sudo systemctl stop trensilapor-frontend && \
cd /var/www/trensilapor.my.id && \
sudo git pull origin main && \
sudo pnpm run build && \
sudo chown -R root:root /var/www/trensilapor.my.id && \
sudo systemctl start trensilapor-frontend && \
echo "✅ Frontend build updated successfully!" && \
echo "📋 Checking service status..." && \
sudo systemctl status trensilapor-frontend --no-pager
```

### 🔧 FRONTEND TROUBLESHOOTING COMMANDS

#### **Check Frontend Logs:**
```bash
sudo journalctl -u trensilapor-frontend -f
```

#### **Check Service Status:**
```bash
sudo systemctl status trensilapor-frontend --no-pager
```

#### **Manual Frontend Restart:**
```bash
sudo systemctl stop trensilapor-frontend && sleep 3 && sudo systemctl start trensilapor-frontend
```

#### **Check Port 3000:**
```bash
netstat -tlnp | grep :3000
```

#### **Test Frontend Locally:**
```bash
curl -s http://localhost:3000 | head -10
```

#### **Check Build Directory:**
```bash
ls -la /var/www/trensilapor.my.id/.next/
```

#### **Check Dependencies:**
```bash
cd /var/www/trensilapor.my.id && sudo pnpm list --depth=0
```

### 📋 FRONTEND VERIFICATION STEPS

#### **Step 1: Service Check**
```bash
sudo systemctl is-active trensilapor-frontend
```

#### **Step 2: Port Check**
```bash
curl -s http://localhost:3000 > /dev/null && echo "Frontend OK" || echo "Frontend Down"
```

#### **Step 3: Nginx Proxy Check**
```bash
curl -s https://trensilapor.my.id > /dev/null && echo "Public Access OK" || echo "Public Access Failed"
```

#### **Step 4: Build Files Check**
```bash
sudo find /var/www/trensilapor.my.id/.next -name "*.js" | wc -l
```

### 🚨 EMERGENCY FRONTEND RECOVERY

#### **If Frontend Won't Start:**
```bash
sudo systemctl stop trensilapor-frontend && \
cd /var/www/trensilapor.my.id && \
sudo rm -rf .next node_modules && \
sudo pnpm install --frozen-lockfile && \
sudo pnpm run build && \
sudo chown -R root:root /var/www/trensilapor.my.id && \
sudo systemctl start trensilapor-frontend
```

#### **If Build Fails:**
```bash
cd /tmp/pemilihan/frontend && \
sudo rm -rf node_modules .next && \
sudo pnpm install --frozen-lockfile && \
sudo pnpm run build --verbose
```

#### **If Port 3000 is Busy:**
```bash
sudo lsof -ti:3000 | sudo xargs kill -9 2>/dev/null || true && \
sudo systemctl restart trensilapor-frontend
```

### 🔄 FRONTEND DEPLOYMENT VARIATIONS

#### **Quick CSS/Static Updates:**
```bash
cd /tmp/pemilihan/frontend && \
sudo pnpm run build && \
sudo cp -r .next/static/* /var/www/trensilapor.my.id/.next/static/ && \
sudo systemctl restart trensilapor-frontend
```

#### **Environment Variables Update:**
```bash
sudo systemctl stop trensilapor-frontend && \
cd /tmp/pemilihan/frontend && \
sudo cp .env.prod /var/www/trensilapor.my.id/.env.local && \
sudo systemctl start trensilapor-frontend
```

#### **Package Dependencies Update:**
```bash
cd /var/www/trensilapor.my.id && \
sudo pnpm install --frozen-lockfile && \
sudo pnpm run build && \
sudo systemctl restart trensilapor-frontend
```

### ⚡ RAPID FRONTEND DEPLOYMENT ALIASES

Add these to your `~/.bashrc` for quick access:

```bash
# Quick Frontend Redeploy
alias redeploy-frontend='sudo systemctl stop trensilapor-frontend && cd /tmp && sudo rm -rf /tmp/pemilihan && sudo git clone https://github.com/MuhammadDarmawanFadilah/pemilihan.git /tmp/pemilihan && cd /tmp/pemilihan/frontend && sudo cp .env.prod .env.local && sudo pnpm install --frozen-lockfile && sudo pnpm run build && sudo rm -rf /var/www/trensilapor.my.id/.next && sudo cp -r .next /var/www/trensilapor.my.id/ && sudo chown -R root:root /var/www/trensilapor.my.id && sudo systemctl start trensilapor-frontend'

# Frontend Status Check
alias frontend-status='sudo systemctl status trensilapor-frontend --no-pager && netstat -tlnp | grep :3000'

# Frontend Logs
alias frontend-logs='sudo journalctl -u trensilapor-frontend -f'

# Quick Frontend Restart
alias frontend-restart='sudo systemctl restart trensilapor-frontend'
```

### 🎯 NGINX CACHE CLEARING

#### **Clear Nginx Cache (if needed):**
```bash
sudo nginx -s reload && \
curl -X PURGE https://trensilapor.my.id/ || true
```

#### **Force Browser Cache Clear:**
```bash
echo "Clear browser cache manually or use Ctrl+F5"
```

### 📊 FRONTEND DEPLOYMENT SPECS
- **Build Time**: ~3-5 minutes
- **Deploy Time**: ~10 seconds
- **Total Time**: ~4-6 minutes
- **Memory Usage**: 4GB RAM
- **Port**: 3000
- **Build Size**: ~200-500MB

### 🌐 FRONTEND ACCESS POINTS
- **Local**: http://localhost:3000
- **Public**: https://trensilapor.my.id
- **Health Check**: https://trensilapor.my.id/_next/static

### 🔍 FRONTEND DEBUG COMMANDS

#### **Check Environment Variables:**
```bash
cd /var/www/trensilapor.my.id && sudo cat .env.local
```

#### **Check Next.js Build Info:**
```bash
cd /var/www/trensilapor.my.id && sudo cat .next/BUILD_ID
```

#### **Check Static Files:**
```bash
sudo ls -la /var/www/trensilapor.my.id/.next/static/
```

---
**Quick Deploy**: 4-6 minutes  
**Build Only**: 3-5 minutes  
**Zero Downtime**: Use Method 1  
**Emergency Recovery**: Method 2
