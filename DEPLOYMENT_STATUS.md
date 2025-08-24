# MANUAL DEPLOYMENT REQUIRED

## Problem: Duplicate CSP Headers Fixed in Code
✅ Code fixed: Removed duplicate CSP from next.config.ts  
❌ Server still needs deployment of the fix

## Server Access Required:
```bash
# SSH ke server
ssh user@smarthr.my.id

# Pull latest code  
cd /tmp/absenkantor-deploy
git pull origin main

# Copy ke frontend directory
cd frontend  
npm run build
sudo cp -r .next public package.json next.config.ts .env.local /var/www/absenkantor.my.id/

# Restart service
sudo systemctl restart absenkantor-frontend
sudo nginx -t && sudo systemctl reload nginx
```

## Verification After Deployment:
```powershell
# Test CSP headers
(Invoke-WebRequest -Uri "https://absenkantor.my.id" -Method HEAD).Headers["content-security-policy"]

# Should return ONLY:
# "default-src 'self' 'unsafe-eval' http: https: data: blob: 'unsafe-inline'; ..."
```

## Expected Result:
- ✅ Single CSP header (no duplicates)
- ✅ CSP contains 'unsafe-eval' 
- ✅ WebAssembly works correctly
- ✅ MediaPipe face recognition functions

**STATUS: WAITING FOR SERVER ACCESS TO DEPLOY THE FIX**