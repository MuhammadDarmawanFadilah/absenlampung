# Test CSP Headers - Local Development
Write-Host "🔍 Testing CSP Headers - Local Development" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan

# Test main page
Write-Host "`n📝 Testing Main Page CSP Headers..." -ForegroundColor Yellow
$response = Invoke-WebRequest -Uri "http://localhost:3000" -Method HEAD -UseBasicParsing
$cspHeader = $response.Headers["Content-Security-Policy"]
$middlewareHeader = $response.Headers["X-CSP-Middleware"]

Write-Host "🔒 CSP Header: $cspHeader" -ForegroundColor Green
Write-Host "🛠️  Middleware Active: $middlewareHeader" -ForegroundColor Green

# Check if unsafe-eval is present
if ($cspHeader -like "*unsafe-eval*") {
    Write-Host "✅ unsafe-eval found in CSP header" -ForegroundColor Green
} else {
    Write-Host "❌ unsafe-eval NOT found in CSP header" -ForegroundColor Red
}

# Test face recognition page
Write-Host "`n🧠 Testing Face Recognition Page CSP Headers..." -ForegroundColor Yellow
try {
    $faceResponse = Invoke-WebRequest -Uri "http://localhost:3000/admin/master-data/face-recognition/create?pegawaiId=1" -Method HEAD -UseBasicParsing
    $faceCspHeader = $faceResponse.Headers["Content-Security-Policy"]
    
    Write-Host "🔒 Face Recognition CSP: $faceCspHeader" -ForegroundColor Green
    
    if ($faceCspHeader -like "*unsafe-eval*") {
        Write-Host "✅ unsafe-eval found in Face Recognition CSP" -ForegroundColor Green
    } else {
        Write-Host "❌ unsafe-eval NOT found in Face Recognition CSP" -ForegroundColor Red
    }
} catch {
    Write-Host "⚠️  Could not test face recognition page (might need auth)" -ForegroundColor Yellow
}

# Test WebAssembly test page
Write-Host "`n🔬 Testing WebAssembly Test Page..." -ForegroundColor Yellow
try {
    $wasmResponse = Invoke-WebRequest -Uri "http://localhost:3000/test-wasm-csp.html" -Method HEAD -UseBasicParsing
    $wasmCspHeader = $wasmResponse.Headers["Content-Security-Policy"]
    
    Write-Host "🔒 WASM Test CSP: $wasmCspHeader" -ForegroundColor Green
    
    if ($wasmCspHeader -like "*unsafe-eval*") {
        Write-Host "✅ unsafe-eval found in WASM Test CSP" -ForegroundColor Green
    } else {
        Write-Host "❌ unsafe-eval NOT found in WASM Test CSP" -ForegroundColor Red
    }
} catch {
    Write-Host "⚠️  WebAssembly test page not accessible" -ForegroundColor Yellow
}

Write-Host "`n🏁 CSP Header Test Complete!" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan

# Show all headers for debugging
Write-Host "`n📋 All Response Headers:" -ForegroundColor Blue
$response.Headers | Format-Table -AutoSize