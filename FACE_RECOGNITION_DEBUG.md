# Face Recognition System - Technical Documentation

## Masalah yang Ditemukan

### Issue: Orientasi Wajah Tidak Akurat
- **Problem**: User menghadap ke depan tapi sistem mendeteksi "kanan"
- **Root Cause**: Algoritma perhitungan orientasi menggunakan landmark yang salah
- **Screenshot**: User frontal tapi terdeteksi "Orientasi: kanan"

## Solusi yang Diimplementasikan

### 1. Perbaikan Algoritma Face Orientation

#### Sebelum (Salah):
```javascript
// Menggunakan rata-rata semua nose landmarks
const noseCenter = {
  x: (nose[0].x + nose[nose.length-1].x) / 2,
  y: (nose[0].y + nose[nose.length-1].y) / 2
}
```

#### Sesudah (Benar):
```javascript
// Menggunakan nose tip yang spesifik (landmark point 30)
const noseTip = positions[30]           // Nose tip (paling akurat)
const leftEyeOuter = positions[36]      // Left eye outer corner
const rightEyeOuter = positions[45]     // Right eye outer corner
```

### 2. Face Landmarks yang Digunakan

#### 68-Point Face Landmarks (@vladmandic/face-api):
- **Point 30**: Nose tip (ujung hidung) - **KEY POINT**
- **Point 27**: Nose bridge (pangkal hidung)
- **Point 36**: Left eye outer corner - **KEY POINT**
- **Point 45**: Right eye outer corner - **KEY POINT**
- **Point 8**: Bottom of chin
- **Points 36-41**: Left eye (6 points)
- **Points 42-47**: Right eye (6 points)

### 3. Algoritma Orientasi yang Diperbaiki

```javascript
// Calculate face center based on eyes
const eyeCenter = {
  x: (leftEyeOuter.x + rightEyeOuter.x) / 2,
  y: (leftEyeOuter.y + rightEyeOuter.y) / 2
}

// Calculate horizontal deviation of nose tip from face center
const noseHorizontalDiff = noseTip.x - eyeCenter.x

// Improved thresholds based on face proportions
const horizontalThreshold = eyeDistance * 0.12  // 12% of eye distance
const verticalThreshold = faceHeight * 0.08     // 8% of face height

// Handle camera mirroring
if (Math.abs(noseHorizontalDiff) > horizontalThreshold) {
  // Positive diff = face turned to user's left (appears as right in mirror)
  return noseHorizontalDiff > 0 ? 'kiri' : 'kanan'
}
```

### 4. Visual Debug Features

#### Ditambahkan:
- **Red dot**: Nose tip (point 30)
- **Blue dots**: Eye outer corners (points 36, 45)
- **Yellow line**: Connection from eye center to nose tip
- **Yellow dot**: Calculated eye center
- **Debug text**: Real-time calculations (diff, threshold)
- **Real-time feedback**: Orientasi terdeteksi vs yang dibutuhkan

### 5. Camera Mirroring Consideration

#### Problem:
- Kamera depan menghasilkan mirror image
- User putar kepala ke kiri → di kamera terlihat ke kanan
- Sistem harus memahami perspektif user, bukan kamera

#### Solution:
```javascript
// For mirrored camera: positive diff means face is turned to user's left (our right)
return noseHorizontalDiff > 0 ? 'kiri' : 'kanan'
```

## Testing Guidelines

### 1. Test Face Orientation Detection:
1. Buka browser console untuk melihat debug logs
2. Posisikan wajah ke depan → harus detect "depan"
3. Putar kepala ke kiri user → harus detect "kiri"
4. Putar kepala ke kanan user → harus detect "kanan"
5. Angkat dagu → harus detect "atas"
6. Tundukkan kepala → harus detect "bawah"

### 2. Visual Indicators:
- **Green box**: Orientasi sesuai yang diminta
- **Orange box**: Orientasi tidak sesuai
- **Red dot**: Nose tip landmark
- **Blue dots**: Eye corners
- **Yellow line**: Face orientation vector

### 3. Debug Console Output:
```javascript
Face Orientation Debug: {
  noseTip: { x: 320, y: 240 },
  eyeCenter: { x: 318, y: 220 },
  noseHorizontalDiff: 2,           // Small diff = frontal
  horizontalThreshold: 15,         // 12% of eye distance
  orientation: "depan"             // Detected orientation
}
```

## Performance Optimizations

### 1. Detection Frequency:
- Real-time detection: **100ms interval**
- Absensi detection: **500ms interval** (less demanding)

### 2. Threshold Values:
- **Horizontal**: 12% of eye distance (previously 15%)
- **Vertical**: 8% of face height (previously 10%)
- More sensitive and accurate detection

### 3. Error Handling:
- Face not detected → Clear orientation
- Invalid landmarks → Fallback to "unknown"
- Camera errors → Graceful degradation

## Known Issues & Solutions

### Issue 1: Face Too Close/Far
**Problem**: Threshold calculation fails
**Solution**: Added face bounds validation

### Issue 2: Poor Lighting
**Problem**: Landmarks not detected accurately
**Solution**: Added confidence scoring and fallback

### Issue 3: Multiple Faces
**Problem**: Wrong face selected
**Solution**: Use `detectSingleFace()` for best face only

## API Integration

### Face Recognition Endpoint:
```javascript
POST /api/face-recognition
{
  "pegawaiId": 123,
  "faceEncoding": "[array of descriptors]",
  "faceImageBase64": "data:image/jpeg;base64,/9j/4AAQ...",
  "faceConfidence": 0.85,
  "trainingImagesCount": 5,
  "notes": "Multi-angle capture completed"
}
```

### Face Matching Endpoint:
```javascript
GET /api/face-recognition/match?faceDescriptor=[descriptor]
Response: {
  "success": true,
  "data": {
    "pegawai": { "namaLengkap": "John Doe" },
    "confidence": 0.92
  }
}
```

## Future Improvements

1. **3D Face Modeling**: More accurate orientation detection
2. **Anti-Spoofing**: Liveness detection
3. **Multiple Face Support**: Handle group photos
4. **Edge Detection**: Improved landmark accuracy
5. **Machine Learning**: Adaptive threshold based on user behavior

## Troubleshooting

### Orientasi Masih Salah:
1. Pastikan browser console terbuka untuk debug logs
2. Periksa nilai `noseHorizontalDiff` dan `threshold`
3. Pastikan lighting cukup untuk face detection
4. Test dengan multiple users untuk validation

### Performance Issues:
1. Reduce detection frequency (increase interval)
2. Lower video resolution
3. Use `TinyFaceDetectorOptions` instead of full detector

### Face Not Detected:
1. Improve lighting conditions
2. Ensure face is centered in frame
3. Check if Face-API models loaded properly
4. Verify camera permissions granted
