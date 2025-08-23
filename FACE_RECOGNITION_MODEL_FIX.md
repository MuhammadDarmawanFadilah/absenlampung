# Face Recognition Model Loading Fix

## Issue
The face-api.js models were trying to load from local `/models` directory which didn't exist, causing 404 errors:
- `http://localhost:3000/models/tiny_face_detector_model.bin`
- `http://localhost:3000/models/face_landmark_68_model.bin` 
- `http://localhost:3000/models/face_recognition_model.bin`
- `http://localhost:3000/models/face_expression_model-weights_manifest.json`

## Solution
Changed all model loading from local `/models` path to CDN:

**Before:**
```javascript
window.faceapi.nets.tinyFaceDetector.loadFromUri('/models')
```

**After:**
```javascript
window.faceapi.nets.tinyFaceDetector.loadFromUri('https://cdn.jsdelivr.net/npm/@vladmandic/face-api@latest/model')
```

## Files Updated
1. `frontend/src/app/admin/master-data/face-recognition/create/page.tsx`
2. `frontend/src/app/admin/master-data/face-recognition/[id]/edit/page.tsx`
3. `frontend/src/app/pegawai/absensi/page.tsx`

## Benefits
- ✅ No need to download and host model files locally
- ✅ Always uses latest model versions from CDN
- ✅ Faster deployment (no large model files to transfer)
- ✅ Reliable access to models without 404 errors

## Models Loaded
- **TinyFaceDetector**: Fast face detection
- **FaceLandmark68Net**: 68-point facial landmarks
- **FaceRecognitionNet**: Face encoding for recognition
- **FaceExpressionNet**: Emotion detection (bonus feature)

The face recognition system should now work without any model loading errors.