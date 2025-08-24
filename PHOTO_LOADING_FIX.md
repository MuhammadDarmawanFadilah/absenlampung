# PHOTO LOADING FIX - Production Deployment Guide

## Problem Identified
- Photos appearing empty on production edit page (https://absenkantor.my.id/admin/master-data/pegawai/4/edit)
- Model Pegawai has TWO photo fields: `fotoKaryawan` and `photoUrl`
- Inconsistent data between the two fields causing frontend to display empty photos

## Root Cause Analysis
1. **Database Schema Issue**: Model has both `foto_karyawan` and `photo_url` columns
2. **Data Inconsistency**: Some records have data in one field but not the other
3. **Frontend Logic**: Frontend checks both fields but may get empty values
4. **Backend Mapping**: Different services update different fields inconsistently

## Fixed Files

### Backend Changes:
1. **PegawaiService.java**:
   - `updatePegawai()`: Now syncs both `photoUrl` and `fotoKaryawan` fields
   - `selfUpdatePegawai()`: Now syncs both photo fields  
   - `createPegawai()`: Now syncs both photo fields

2. **PegawaiResponse.java**:
   - Constructor now prioritizes `photoUrl` over `fotoKaryawan`
   - Added debug logging for pegawai ID 4
   - Ensures consistent photo field in API response

3. **WebConfig.java** (Previous fix):
   - Fixed static resource handler for production absolute paths
   - Proper mapping for `/opt/absenkantor/uploads/photos/`

4. **DebugController.java** (New):
   - Added `/api/debug/pegawai/{id}/photo` endpoint for debugging
   - Added `/api/debug/pegawai/{id}/sync-photo` endpoint for manual sync

### Frontend Changes:
1. **edit/page.tsx**:
   - Added debug logging to see photo data received from API
   - Shows both `fotoKaryawan` and `photoUrl` values in console

### Database Verification:
1. **check_photo_data.sql**:
   - Query to identify photo field inconsistencies
   - Script to sync photo fields if needed

### Debugging Tools:
1. **debug-photo-production.html**:
   - Web-based tool to test photo loading in production
   - Tests API connectivity, photo URLs, frontend logic

## Deployment Steps

### Option 1: Deploy via existing script (if SSH accessible)
```bash
# Upload and run deploy script
scp redeploy-backend-absenkantor.sh root@server:/tmp/
ssh root@server "chmod +x /tmp/redeploy-backend-absenkantor.sh && /tmp/redeploy-backend-absenkantor.sh"
```

### Option 2: Manual deployment
1. **Push changes to GitHub**:
   ```bash
   git add .
   git commit -m "Fix photo loading - sync fotoKaryawan and photoUrl fields"
   git push origin main
   ```

2. **Deploy on server**:
   ```bash
   # SSH to server and run deploy script
   ssh root@server
   cd /tmp
   wget https://raw.githubusercontent.com/MuhammadDarmawanFadilah/absenlampung/main/redeploy-backend-absenkantor.sh
   chmod +x redeploy-backend-absenkantor.sh
   ./redeploy-backend-absenkantor.sh
   ```

### Option 3: Test first with debug tools
1. **Access debug page**: https://absenkantor.my.id/debug-photo-production.html
2. **Run debug API**: https://absenkantor.my.id/api/debug/pegawai/4/photo
3. **Sync fields if needed**: POST to https://absenkantor.my.id/api/debug/pegawai/4/sync-photo

## Verification Steps
1. **Check debug endpoint**: `https://absenkantor.my.id/api/debug/pegawai/4/photo`
2. **Test photo URL**: `https://absenkantor.my.id/api/upload/photos/{filename}`
3. **Test edit page**: `https://absenkantor.my.id/admin/master-data/pegawai/4/edit`
4. **Check browser console** for debug logs showing photo data

## Database Query for Manual Fix (if needed)
```sql
-- Check inconsistencies
SELECT id, username, foto_karyawan, photo_url 
FROM pegawai 
WHERE (foto_karyawan IS NULL AND photo_url IS NOT NULL) 
   OR (foto_karyawan IS NOT NULL AND photo_url IS NULL)
   OR (foto_karyawan != photo_url AND foto_karyawan IS NOT NULL AND photo_url IS NOT NULL);

-- Sync fields (run after backup)
UPDATE pegawai 
SET foto_karyawan = photo_url 
WHERE photo_url IS NOT NULL 
  AND (foto_karyawan IS NULL OR foto_karyawan != photo_url);

UPDATE pegawai 
SET photo_url = foto_karyawan 
WHERE foto_karyawan IS NOT NULL 
  AND photo_url IS NULL;
```

## Expected Results
- Photos should display correctly in edit pages
- Both photo fields synchronized in database
- Consistent photo URLs across all API responses
- Debug endpoints available for troubleshooting

## Rollback Plan
If issues occur:
1. **Revert backend**: Deploy previous WAR file
2. **Database**: Restore from backup if needed
3. **Files**: No file system changes made, only code logic

## Next Steps
1. Deploy and test with debug tools
2. Verify photo loading on problematic edit page
3. Remove debug controller and logging after confirmation
4. Consider consolidating to single photo field in future refactoring