# PowerShell Script untuk Check Status CSP Deployment
# Gunakan script ini untuk verify apakah CSP fix sudah ter-deploy

param(
    [string]$Server = "absenkantor.my.id",
    [string]$Action = "check"
)

Write-Host "🔍 Checking CSP Deployment Status" -ForegroundColor Cyan
Write-Host "=================================" -ForegroundColor Cyan

if ($Action -eq "check") {
    Write-Host "`n📡 Testing CSP Headers..." -ForegroundColor Yellow
    
    try {
        # Test main page headers
        $response = Invoke-WebRequest -Uri "https://$Server" -Method HEAD -UseBasicParsing -TimeoutSec 10
        $cspHeader = $response.Headers["Content-Security-Policy"]
        
        Write-Host "🔒 Current CSP Header:" -ForegroundColor Green
        Write-Host $cspHeader -ForegroundColor White
        
        # Check for unsafe-eval
        if ($cspHeader -like "*unsafe-eval*") {
            Write-Host "`n✅ SUCCESS: 'unsafe-eval' found in CSP!" -ForegroundColor Green
            Write-Host "WebAssembly should work now." -ForegroundColor Green
        } else {
            Write-Host "`n❌ PROBLEM: 'unsafe-eval' NOT found in CSP!" -ForegroundColor Red
            Write-Host "WebAssembly will still fail. Deployment needed." -ForegroundColor Red
        }
        
        # Test face recognition page
        Write-Host "`n🧠 Testing Face Recognition Page..." -ForegroundColor Yellow
        try {
            $faceResponse = Invoke-WebRequest -Uri "https://$Server/admin/master-data/face-recognition/create?pegawaiId=1" -Method HEAD -UseBasicParsing -TimeoutSec 10
            Write-Host "✅ Face recognition page accessible (Status: $($faceResponse.StatusCode))" -ForegroundColor Green
        } catch {
            Write-Host "⚠️ Face recognition page not accessible (might need auth)" -ForegroundColor Yellow
        }
        
        # Test WASM test page
        Write-Host "`n🔬 Testing WebAssembly Test Page..." -ForegroundColor Yellow
        try {
            $wasmResponse = Invoke-WebRequest -Uri "https://$Server/test-wasm-csp.html" -Method HEAD -UseBasicParsing -TimeoutSec 10
            Write-Host "✅ WASM test page accessible (Status: $($wasmResponse.StatusCode))" -ForegroundColor Green
        } catch {
            Write-Host "⚠️ WASM test page not accessible" -ForegroundColor Yellow
        }
        
    } catch {
        Write-Host "❌ ERROR: Cannot connect to $Server" -ForegroundColor Red
        Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
        exit 1
    }
    
} elseif ($Action -eq "headers") {
    Write-Host "`n📋 All Response Headers:" -ForegroundColor Yellow
    
    try {
        $response = Invoke-WebRequest -Uri "https://$Server" -Method HEAD -UseBasicParsing
        $response.Headers | Format-Table -AutoSize
    } catch {
        Write-Host "❌ ERROR: Cannot get headers from $Server" -ForegroundColor Red
        Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
    }
    
} elseif ($Action -eq "monitor") {
    Write-Host "`n🔄 Monitoring CSP Status (Press Ctrl+C to stop)..." -ForegroundColor Yellow
    
    while ($true) {
        try {
            $response = Invoke-WebRequest -Uri "https://$Server" -Method HEAD -UseBasicParsing
            $cspHeader = $response.Headers["Content-Security-Policy"]
            $timestamp = Get-Date -Format "HH:mm:ss"
            
            if ($cspHeader -like "*unsafe-eval*") {
                Write-Host "[$timestamp] ✅ CSP OK - unsafe-eval present" -ForegroundColor Green
            } else {
                Write-Host "[$timestamp] ❌ CSP PROBLEM - unsafe-eval missing" -ForegroundColor Red
            }
            
            Start-Sleep -Seconds 5
        } catch {
            $timestamp = Get-Date -Format "HH:mm:ss"
            Write-Host "[$timestamp] ❌ CONNECTION ERROR" -ForegroundColor Red
            Start-Sleep -Seconds 10
        }
    }
}

Write-Host "`n📞 Next Steps:" -ForegroundColor Cyan

if ($cspHeader -like "*unsafe-eval*") {
    Write-Host "1. ✅ CSP is correct - WebAssembly should work" -ForegroundColor Green
    Write-Host "2. 🌐 Clear browser cache completely" -ForegroundColor Yellow
    Write-Host "3. 🔄 Try incognito/private browsing mode" -ForegroundColor Yellow
    Write-Host "4. 🧠 Test face recognition page in browser" -ForegroundColor Yellow
} else {
    Write-Host "1. 🚨 DEPLOY CSP FIX IMMEDIATELY" -ForegroundColor Red
    Write-Host "2. 📡 SSH to server and run emergency deployment" -ForegroundColor Red
    Write-Host "3. ⚡ Use: curl -sSL https://raw.githubusercontent.com/MuhammadDarmawanFadilah/absenlampung/main/emergency-csp-deploy.sh | bash" -ForegroundColor Red
}

Write-Host "`n🔧 Usage:" -ForegroundColor Blue
Write-Host ".\check-csp-status.ps1 -Action check      # Check CSP status" -ForegroundColor White
Write-Host ".\check-csp-status.ps1 -Action headers    # Show all headers" -ForegroundColor White  
Write-Host ".\check-csp-status.ps1 -Action monitor    # Monitor CSP continuously" -ForegroundColor White

Write-Host "`n🏁 CSP Status Check Complete!" -ForegroundColor Cyan