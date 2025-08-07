// Test script untuk memverifikasi notifikasi hari libur
async function testHolidayNotification() {
  const baseUrl = 'http://localhost:8080/api';
  
  try {
    console.log('1. Testing holiday check API...');
    const today = '2025-08-07';
    
    // Test check API
    const checkResponse = await fetch(`${baseUrl}/hari-libur/check/${today}`, {
      headers: { 'Accept': 'application/json' }
    });
    
    if (!checkResponse.ok) {
      throw new Error(`Holiday check API failed: ${checkResponse.status}`);
    }
    
    const checkData = await checkResponse.json();
    console.log('Holiday check result:', checkData);
    
    if (!checkData.isHariLibur) {
      console.log('❌ No holiday found for today');
      return;
    }
    
    console.log('2. Getting holiday details from full list...');
    // Test detail API with large page size to get all data
    const detailResponse = await fetch(`${baseUrl}/hari-libur?page=0&size=200`, {
      headers: { 'Accept': 'application/json' }
    });
    
    if (!detailResponse.ok) {
      throw new Error(`Holiday detail API failed: ${detailResponse.status}`);
    }
    
    const detailData = await detailResponse.json();
    console.log(`Total holidays in database: ${detailData.totalItems}`);
    
    // Find holiday for today
    const holiday = detailData.data.find(h => h.tanggalLibur === today);
    
    if (holiday) {
      console.log('✅ Holiday notification should show:');
      console.log(`   ID: ${holiday.id}`);
      console.log(`   Name: ${holiday.namaLibur}`);
      console.log(`   Date: ${holiday.tanggalLibur}`);
      console.log(`   National: ${holiday.isNasional ? 'Yes' : 'No'}`);
      console.log(`   Description: ${holiday.keterangan}`);
      
      // Expected notification content
      console.log('\n📢 Expected notification in frontend:');
      console.log(`"Hari Libur: ${holiday.namaLibur}"`);
      if (holiday.isNasional) {
        console.log('Badge: "Nasional"');
      }
      console.log('Message: "Hari ini adalah hari libur, namun Anda tetap dapat melakukan absensi jika diperlukan."');
      
      console.log('\n✅ API integration is working correctly!');
      console.log('The frontend checkHariLibur() function should now display the notification.');
    } else {
      console.log('❌ Holiday found in check API but no details available in list');
      console.log('This might be a data inconsistency issue.');
    }
    
  } catch (error) {
    console.error('Error testing holiday notification:', error);
  }
}

// Run the test
testHolidayNotification();
