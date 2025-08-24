# PowerShell Deployment Script untuk CSP Fix
# Alternative untuk bash script jika bash tidak tersedia

param(
    [string]$Action = "deploy"
)

Write-Host "🚀 Starting CSP Fix Deployment for WebAssembly Support" -ForegroundColor Cyan
Write-Host "=====================================================" -ForegroundColor Cyan

# Validate environment
Write-Host "`n📋 Checking Prerequisites..." -ForegroundColor Yellow

# Check if .env.prod exists
if (-not (Test-Path "frontend\.env.prod")) {
    Write-Host "❌ .env.prod file not found in frontend directory!" -ForegroundColor Red
    exit 1
}

# Check if middleware.ts has the fix
$middlewareContent = Get-Content "frontend\src\middleware.ts" -Raw
if ($middlewareContent -notlike "*default-src 'self' 'unsafe-eval'*") {
    Write-Host "❌ Middleware CSP fix not found!" -ForegroundColor Red
    exit 1
}

# Check if next.config.ts has the fix  
$nextConfigContent = Get-Content "frontend\next.config.ts" -Raw
if ($nextConfigContent -notlike "*default-src 'self' 'unsafe-eval'*") {
    Write-Host "❌ Next.js config CSP fix not found!" -ForegroundColor Red
    exit 1
}

Write-Host "✅ All prerequisites passed!" -ForegroundColor Green

if ($Action -eq "build-test") {
    Write-Host "`n🔨 Building for Test..." -ForegroundColor Yellow
    Set-Location "frontend"
    
    # Copy environment
    Copy-Item ".env.prod" ".env" -Force
    Write-Host "✅ Environment copied (.env.prod → .env)" -ForegroundColor Green
    
    # Install dependencies
    Write-Host "📦 Installing dependencies..." -ForegroundColor Yellow
    npm install
    
    # Build
    Write-Host "🔨 Building application..." -ForegroundColor Yellow
    npm run build
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Build successful!" -ForegroundColor Green
        Write-Host "📝 Next steps: Deploy to production using deployment script" -ForegroundColor Cyan
    } else {
        Write-Host "❌ Build failed!" -ForegroundColor Red
        exit 1
    }
    
    Set-Location ".."
    
} elseif ($Action -eq "deploy") {
    Write-Host "`n🌐 Preparing Production Deployment Instructions..." -ForegroundColor Yellow
    
    Write-Host "`n📋 Manual Deployment Steps:" -ForegroundColor Cyan
    Write-Host "1. SSH to server: ssh root@absenkantor.my.id" -ForegroundColor White
    Write-Host "2. Navigate: cd /tmp/absenkantor-deploy" -ForegroundColor White
    Write-Host "3. Pull changes: git pull origin main" -ForegroundColor White
    Write-Host "4. Go to frontend: cd frontend" -ForegroundColor White
    Write-Host "5. Copy env: cp .env.prod .env" -ForegroundColor White
    Write-Host "6. Install: pnpm install" -ForegroundColor White
    Write-Host "7. Build: pnpm run build" -ForegroundColor White
    Write-Host "8. Deploy: cp -r .next public package.json next.config.ts .env /var/www/absenkantor.my.id/" -ForegroundColor White
    Write-Host "9. Restart: systemctl restart absenkantor-frontend" -ForegroundColor White
    Write-Host "10. Reload nginx: nginx -t && systemctl reload nginx" -ForegroundColor White
    
    Write-Host "`n🔍 Verification Commands:" -ForegroundColor Cyan
    Write-Host "curl -I https://absenkantor.my.id | grep -i content-security-policy" -ForegroundColor White
    Write-Host "curl -I https://absenkantor.my.id/test-wasm-csp.html" -ForegroundColor White
    
    Write-Host "`n🎯 Test URLs after deployment:" -ForegroundColor Cyan
    Write-Host "- Main site: https://absenkantor.my.id" -ForegroundColor White
    Write-Host "- Face Recognition: https://absenkantor.my.id/admin/master-data/face-recognition/create?pegawaiId=1" -ForegroundColor White
    Write-Host "- WASM Test: https://absenkantor.my.id/test-wasm-csp.html" -ForegroundColor White
    
} elseif ($Action -eq "verify-csp") {
    Write-Host "`n🔍 Verifying Current CSP Configuration..." -ForegroundColor Yellow
    
    # Check middleware
    Write-Host "`n📝 Middleware CSP:" -ForegroundColor Cyan
    $middlewareLines = Get-Content "frontend\src\middleware.ts" | Where-Object { $_ -like "*default-src*" }
    foreach ($line in $middlewareLines) {
        if ($line -like "*unsafe-eval*") {
            Write-Host "✅ $($line.Trim())" -ForegroundColor Green
        } else {
            Write-Host "❌ $($line.Trim())" -ForegroundColor Red
        }
    }
    
    # Check next.config.ts
    Write-Host "`n🔧 Next.js Config CSP:" -ForegroundColor Cyan
    $nextConfigLines = Get-Content "frontend\next.config.ts" | Where-Object { $_ -like "*default-src*" }
    foreach ($line in $nextConfigLines) {
        if ($line -like "*unsafe-eval*") {
            Write-Host "✅ $($line.Trim())" -ForegroundColor Green
        } else {
            Write-Host "❌ $($line.Trim())" -ForegroundColor Red
        }
    }
    
    # Check environment
    Write-Host "`n🌍 Environment Configuration:" -ForegroundColor Cyan
    if (Test-Path "frontend\.env.prod") {
        $envContent = Get-Content "frontend\.env.prod"
        $wasmEnabled = $envContent | Where-Object { $_ -like "*NEXT_PUBLIC_ENABLE_WASM*" }
        if ($wasmEnabled) {
            Write-Host "✅ $wasmEnabled" -ForegroundColor Green
        } else {
            Write-Host "⚠️  NEXT_PUBLIC_ENABLE_WASM not found" -ForegroundColor Yellow
        }
    }
    
} else {
    Write-Host "`n❓ Usage:" -ForegroundColor Yellow
    Write-Host ".\deploy-csp-fix.ps1 -Action build-test    # Test build locally" -ForegroundColor White
    Write-Host ".\deploy-csp-fix.ps1 -Action deploy        # Show deployment instructions" -ForegroundColor White
    Write-Host ".\deploy-csp-fix.ps1 -Action verify-csp    # Verify CSP configuration" -ForegroundColor White
}

Write-Host "`n🏁 CSP Fix Deployment Script Complete!" -ForegroundColor Cyan