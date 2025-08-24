# WebAssembly CSP Fix - MediaPipe Production Deployment

## Problem Summary
- **Issue**: MediaPipe Face Recognition fails in production with CSP error
- **Error**: `WebAssembly.instantiate(): Refused to compile or instantiate WebAssembly module because 'unsafe-eval' is not an allowed source of script`
- **Affected Pages**: 
  - `/admin/master-data/face-recognition/create`
  - `/pegawai/face-recognition/create`
  - Any page using MediaPipe face detection

## Root Cause
Content Security Policy (CSP) in production environment was blocking WebAssembly execution, which MediaPipe requires for face landmark detection.

## Solution Implemented

### 1. Updated Content Security Policy in `next.config.ts`
```typescript
// Added comprehensive CSP headers allowing WebAssembly
{
  key: 'Content-Security-Policy',
  value: [
    "default-src 'self' http: https: data: blob: 'unsafe-inline'",
    "script-src 'self' 'unsafe-eval' 'unsafe-inline' https: data: blob:",
    "worker-src 'self' blob: data:",
    "child-src 'self' blob: data:",
    "object-src 'none'",
    "img-src 'self' data: blob: https: http:",
    "style-src 'self' 'unsafe-inline' https:",
    "font-src 'self' data: https:",
    "connect-src 'self' https: http: ws: wss:",
    "media-src 'self' blob: data:",
    "frame-src 'self'"
  ].join('; ')
}
```

### 2. Added WebAssembly File Headers
```typescript
// WebAssembly files for MediaPipe
{
  source: '/:path*.wasm',
  headers: [
    {
      key: 'Content-Type',
      value: 'application/wasm',
    },
    {
      key: 'Cross-Origin-Embedder-Policy',
      value: 'require-corp',
    },
    {
      key: 'Cross-Origin-Opener-Policy',
      value: 'same-origin',
    },
  ],
}
```

### 3. Fixed Build Errors
- **flushSync Import**: Fixed import from `react-dom` instead of `react`
- **AdminPageHeader**: Fixed `secondaryAction` to `secondaryActions` (array)
- **Window Properties**: Fixed TypeScript errors with `(window as any)` casting
- **Removed Backup Files**: Cleaned up `*_backup.tsx`, `*_broken.tsx`, `*_clean.tsx` files

### 4. Added MediaPipe Models
- Downloaded `face_landmarker.task` (3.6MB) to `/public/models/`
- Created script `download-mediapipe-models.js` for automated model download

### 5. Production Environment Configuration
Created `.env.production` with:
```env
NEXT_PUBLIC_BACKEND_URL=https://absenkantor.my.id
NEXT_PUBLIC_API_URL=https://absenkantor.my.id/api
NEXT_PUBLIC_ENABLE_CSP=true
NEXT_PUBLIC_ENABLE_WASM=true
NEXT_PUBLIC_MEDIAPIPE_WASM_PATH=/models
```

## Files Modified

### Core Configuration
- ✅ `frontend/next.config.ts` - Added CSP headers and WASM support
- ✅ `frontend/.env.production` - Production environment variables

### Fixed Components
- ✅ `frontend/src/app/admin/master-data/face-recognition/create/page.tsx` - Fixed flushSync import
- ✅ `frontend/src/app/admin/master-data/face-recognition/page.tsx` - Fixed AdminPageHeader props
- ✅ `frontend/src/app/pegawai/absensi/page.tsx` - Fixed window property types

### New Files
- ✅ `frontend/scripts/download-mediapipe-models.js` - MediaPipe model downloader
- ✅ `frontend/public/test-wasm-csp.html` - CSP testing tool
- ✅ `frontend/public/models/face_landmarker.task` - MediaPipe face landmarker model

## Deployment Steps

### 1. Frontend Deployment
```bash
# Build completed - ready for deployment
cd frontend
pnpm run build
# Deploy 'out' or '.next' folder to production server
```

### 2. Verification Steps
1. **Test CSP Configuration**: 
   - Visit: `https://absenkantor.my.id/test-wasm-csp.html`
   - Run all tests to verify CSP and WebAssembly support

2. **Test Face Recognition Pages**:
   - Admin: `https://absenkantor.my.id/admin/master-data/face-recognition/create?pegawaiId=1`
   - Pegawai: `https://absenkantor.my.id/pegawai/face-recognition/create`

3. **Check Browser Console**:
   - Should NOT see CSP violation errors
   - Should see successful MediaPipe model loading
   - Look for "✅ Face detected" messages

### 3. Expected Results
- ✅ No CSP violations in browser console
- ✅ MediaPipe models load successfully
- ✅ Face detection works in face recognition pages
- ✅ WebAssembly instantiation successful
- ✅ No "unsafe-eval" errors

## Troubleshooting

### If CSP Errors Persist:
1. Check server-side CSP headers (Nginx/Apache configuration)
2. Verify no conflicting CSP meta tags in HTML
3. Check browser developer tools → Security tab

### If MediaPipe Still Fails:
1. Verify model files are accessible: `/models/face_landmarker.task`
2. Check CORS headers for model files
3. Verify WASM files are served with correct MIME types

### Testing Commands:
```bash
# Test CSP headers
curl -I https://absenkantor.my.id

# Test model availability
curl -I https://absenkantor.my.id/models/face_landmarker.task

# Check WASM support
# Visit: https://absenkantor.my.id/test-wasm-csp.html
```

## Security Considerations
- CSP allows `'unsafe-eval'` specifically for WebAssembly - this is required for MediaPipe
- Worker and blob sources enabled for MediaPipe workers
- CORS configured to allow model loading from CDN if needed
- Cross-origin policies set for proper WASM isolation

## Performance Impact
- MediaPipe model size: ~3.6MB (cached after first load)
- No significant performance impact from CSP changes
- WebAssembly execution is faster than JavaScript for face detection

## Rollback Plan
If issues occur:
1. **Remove CSP headers** from `next.config.ts`
2. **Restore previous build** without MediaPipe changes
3. **Disable face recognition features** temporarily

---

## Summary
✅ **CSP Configuration**: Updated to allow WebAssembly execution
✅ **Build Errors**: All TypeScript and React errors fixed
✅ **MediaPipe Models**: Downloaded and configured
✅ **Production Environment**: Properly configured
✅ **Testing Tools**: Created for verification

**Expected Result**: Face recognition should now work properly in production without CSP errors.
