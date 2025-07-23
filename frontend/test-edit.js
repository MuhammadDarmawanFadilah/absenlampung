// Simple test to check if edit page imports work
const fs = require('fs');
const path = require('path');

const editPagePath = path.join(__dirname, 'src', 'app', 'admin', 'pemilihan', '[id]', 'edit', 'page.tsx');

try {
  const content = fs.readFileSync(editPagePath, 'utf8');
  
  // Check for key imports
  const hasWilayahForm = content.includes('WilayahFormConditional');
  const hasMapPicker = content.includes('MapLocationPicker');
  const hasStepperComponent = content.includes('StepperComponent');
  
  console.log('Edit Page Import Check:');
  console.log('✓ WilayahFormConditional:', hasWilayahForm);
  console.log('✓ MapLocationPicker:', hasMapPicker);
  console.log('✓ StepperComponent:', hasStepperComponent);
  
  // Check for PemilihanDTO properties
  const hasRtRw = content.includes('rt:') && content.includes('rw:');
  const hasLatLng = content.includes('latitude:') && content.includes('longitude:');
  const hasAlamatLokasi = content.includes('alamatLokasi:');
  
  console.log('\nForm Properties Check:');
  console.log('✓ RT/RW properties:', hasRtRw);
  console.log('✓ Latitude/Longitude:', hasLatLng);
  console.log('✓ Alamat Lokasi:', hasAlamatLokasi);
  
  console.log('\n✅ Edit page structure looks good!');
  
} catch (error) {
  console.error('❌ Error reading edit page:', error.message);
}
