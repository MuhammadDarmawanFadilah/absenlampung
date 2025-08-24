const https = require('https');
const fs = require('fs');
const path = require('path');

const modelsDir = path.join(__dirname, '../public/models');

// Ensure models directory exists
if (!fs.existsSync(modelsDir)) {
  fs.mkdirSync(modelsDir, { recursive: true });
}

// MediaPipe Face Landmarker model
const mediaPipeModels = [
  {
    name: 'face_landmarker.task',
    url: 'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task'
  }
];

function downloadFile(url, fileName) {
  return new Promise((resolve, reject) => {
    const filePath = path.join(modelsDir, fileName);
    
    // Check if file already exists
    if (fs.existsSync(filePath)) {
      console.log(`Already exists: ${fileName}`);
      resolve();
      return;
    }
    
    const file = fs.createWriteStream(filePath);
    
    console.log(`Downloading: ${fileName}...`);
    https.get(url, (response) => {
      // Check for redirects
      if (response.statusCode === 302 || response.statusCode === 301) {
        https.get(response.headers.location, (redirectResponse) => {
          redirectResponse.pipe(file);
          file.on('finish', () => {
            file.close();
            console.log(`✅ Downloaded: ${fileName} (${Math.round(fs.statSync(filePath).size / 1024)} KB)`);
            resolve();
          });
        }).on('error', reject);
        return;
      }
      
      if (response.statusCode !== 200) {
        reject(new Error(`HTTP ${response.statusCode}: ${response.statusMessage}`));
        return;
      }
      
      response.pipe(file);
      file.on('finish', () => {
        file.close();
        const sizeKB = Math.round(fs.statSync(filePath).size / 1024);
        console.log(`✅ Downloaded: ${fileName} (${sizeKB} KB)`);
        resolve();
      });
    }).on('error', (err) => {
      fs.unlink(filePath, () => {}); // Delete partial file
      reject(err);
    });
  });
}

async function downloadMediaPipeModels() {
  console.log('📦 Downloading MediaPipe models...');
  console.log('📁 Target directory:', modelsDir);
  
  try {
    for (const model of mediaPipeModels) {
      await downloadFile(model.url, model.name);
    }
    console.log('✅ All MediaPipe models downloaded successfully!');
    
    // List all files in models directory
    console.log('\n📋 Models directory contents:');
    const files = fs.readdirSync(modelsDir);
    files.forEach(file => {
      const filePath = path.join(modelsDir, file);
      const stats = fs.statSync(filePath);
      const sizeKB = Math.round(stats.size / 1024);
      console.log(`  - ${file} (${sizeKB} KB)`);
    });
    
  } catch (error) {
    console.error('❌ Error downloading MediaPipe models:', error);
    process.exit(1);
  }
}

downloadMediaPipeModels();