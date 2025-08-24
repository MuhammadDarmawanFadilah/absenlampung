# WebAssembly CSP Deployment Guide

## Problem Solved
- **Error**: `WebAssembly.instantiateStreaming(): Refused to compile or instantiate WebAssembly module because 'unsafe-eval' is not an allowed source of script`
- **Location**: https://absenkantor.my.id/admin/master-data/face-recognition/create?pegawaiId=1
- **Cause**: Content Security Policy blocking WebAssembly execution for MediaPipe face recognition

## Solution Implementation

### 1. Next.js Configuration (`next.config.ts`)
```typescript
// Added CSP headers to allow WebAssembly execution
const nextConfig = {
  headers: async () => [
    {
      source: '/(.*)',
      headers: [
        {
          key: 'Content-Security-Policy',
          value: "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' https:; font-src 'self' data:; object-src 'none'; base-uri 'self'; frame-ancestors 'none';"
        }
      ]
    },
    {
      source: '/models/:path*.wasm',
      headers: [
        { key: 'Content-Type', value: 'application/wasm' },
        { key: 'Cross-Origin-Embedder-Policy', value: 'require-corp' },
        { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' }
      ]
    }
  ]
}
```

### 2. MediaPipe Models Setup
- **Downloaded**: `face_landmarker.task` (3.6MB)
- **Location**: `public/models/face_landmarker.task`
- **Download Script**: `scripts/download-mediapipe-models.js`

### 3. Production Environment (`.env.production`)
```bash
NEXT_PUBLIC_BACKEND_URL=https://absenkantor.my.id
NEXT_PUBLIC_FRONTEND_URL=https://absenkantor.my.id
NEXT_PUBLIC_ENABLE_PWA=true
NEXT_PUBLIC_ENABLE_WASM=true
```

### 4. Build Fixes
- Fixed `flushSync` import from `react-dom`
- Corrected `AdminPageHeader` props and `secondaryActions`
- Fixed window property TypeScript casting

### 5. Deployment Automation (`redeploy-frontend-absenkantor.sh`)

#### Environment File Handling
```bash
# Check for production environment file
if [ -f ".env.production" ]; then
    echo "✅ Using .env.production for production deployment"
    cp .env.production .env
elif [ -f ".env.prod" ]; then
    echo "✅ Using .env.prod for production deployment"
    cp .env.prod .env
else
    echo "⚠️  No production environment file found"
fi
```

#### MediaPipe Model Download
```bash
# Download MediaPipe models if needed
echo "🧠 Ensuring MediaPipe models are available..."
if [ -f "scripts/download-mediapipe-models.js" ]; then
    echo "📥 Downloading MediaPipe models..."
    node scripts/download-mediapipe-models.js
    echo "✅ MediaPipe models download completed"
else
    echo "⚠️  MediaPipe download script not found"
fi
```

#### Nginx MIME Types
```bash
# Add WebAssembly MIME types
sudo sed -i '/types {/a\    application/wasm                                wasm;' "$MIME_TYPES_FILE"
sudo sed -i '/types {/a\    application/octet-stream                        task;' "$MIME_TYPES_FILE"
```

#### Nginx CSP Headers
```bash
# Add CSP headers for WebAssembly
add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' https:; font-src 'self' data:; object-src 'none'; base-uri 'self'; frame-ancestors 'none';" always;
```

### 6. Testing Tools

#### WebAssembly CSP Test (`public/test-wasm-csp.html`)
```html
<!-- Tests WebAssembly instantiation and CSP configuration -->
<script>
async function testWebAssembly() {
    try {
        const wasmModule = new WebAssembly.Module(new Uint8Array([
            0x00, 0x61, 0x73, 0x6d, 0x01, 0x00, 0x00, 0x00
        ]));
        console.log('✅ WebAssembly compilation successful');
        return true;
    } catch (error) {
        console.error('❌ WebAssembly compilation failed:', error);
        return false;
    }
}
</script>
```

## Verification Steps

### 1. Local Testing
```bash
npm run build
npm start
# Test at http://localhost:3000/test-wasm-csp.html
```

### 2. Production Deployment
```bash
./redeploy-frontend-absenkantor.sh
```

### 3. Production Verification
- Visit: https://absenkantor.my.id/test-wasm-csp.html
- Check: https://absenkantor.my.id/admin/master-data/face-recognition/create?pegawaiId=1
- Verify MediaPipe model: https://absenkantor.my.id/models/face_landmarker.task

### 4. Browser Console Checks
```javascript
// Should not show CSP errors
// Should show successful WebAssembly compilation
// MediaPipe should load without errors
```

## Files Modified

### Configuration Files
- `next.config.ts` - CSP headers and WebAssembly support
- `.env.production` - Production environment variables
- `redeploy-frontend-absenkantor.sh` - Deployment automation

### Component Fixes
- `src/app/admin/master-data/pegawai/components/ExportReportModal.tsx`
- `src/app/admin/master-data/pegawai/components/PegawaiTable.tsx`
- `src/components/ui/AdminPageHeader.tsx`

### New Files
- `public/test-wasm-csp.html` - WebAssembly CSP testing
- `public/models/face_landmarker.task` - MediaPipe face recognition model
- `scripts/download-mediapipe-models.js` - Model download automation

## Production Checklist

- ✅ CSP headers allow `'unsafe-eval'` for WebAssembly
- ✅ MediaPipe models downloaded and accessible
- ✅ Nginx MIME types configured for `.wasm` and `.task` files
- ✅ Build errors resolved (flushSync, AdminPageHeader, window casting)
- ✅ Environment variables set for production
- ✅ Deployment script automated for WebAssembly support
- ✅ Testing tools available for verification

## Troubleshooting

### If WebAssembly Still Fails
1. Check browser console for CSP errors
2. Verify CSP headers in Network tab
3. Test with `test-wasm-csp.html`
4. Ensure MediaPipe models are accessible
5. Check Nginx error logs

### Common Issues
- **Cache**: Clear browser cache after deployment
- **Models**: Ensure MediaPipe models downloaded correctly
- **CSP**: Verify both Next.js and Nginx CSP headers
- **MIME**: Check `.wasm` files served with correct Content-Type

## Success Criteria
- Face recognition page loads without CSP errors
- MediaPipe WebAssembly modules instantiate successfully
- Face landmarker model loads and functions correctly
- No console errors related to WebAssembly or CSP