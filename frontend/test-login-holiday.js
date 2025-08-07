// Test login dan akses halaman absensi untuk verifikasi notifikasi hari libur
const baseUrl = 'http://localhost:8080/api';
const frontendUrl = 'http://localhost:3001';

async function testLoginAndHolidayNotification() {
  try {
    console.log('1. Testing login...');
    
    // Test login dengan credentials yang valid
    const loginResponse = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        username: 'admin', // Ganti dengan username yang valid
        password: 'admin123' // Ganti dengan password yang valid
      })
    });
    
    if (!loginResponse.ok) {
      throw new Error(`Login failed: ${loginResponse.status}`);
    }
    
    const loginData = await loginResponse.json();
    console.log('Login successful');
    
    const token = loginData.token;
    
    // Test akses API current user
    console.log('2. Testing current user API...');
    const userResponse = await fetch(`${baseUrl}/pegawai/current`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json'
      }
    });
    
    if (userResponse.ok) {
      const userData = await userResponse.json();
      console.log('Current user:', userData.namaLengkap || userData.username);
    }
    
    // Test API hari libur dengan token
    console.log('3. Testing holiday API with authentication...');
    const today = '2025-08-07';
    
    const holidayCheckResponse = await fetch(`${baseUrl}/hari-libur/check/${today}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json'
      }
    });
    
    if (holidayCheckResponse.ok) {
      const holidayCheckData = await holidayCheckResponse.json();
      console.log('Holiday check with auth:', holidayCheckData);
      
      if (holidayCheckData.isHariLibur) {
        console.log('✅ Holiday API working with authentication');
        
        // Get holiday details
        const holidayDetailResponse = await fetch(`${baseUrl}/hari-libur?page=0&size=200`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json'
          }
        });
        
        if (holidayDetailResponse.ok) {
          const holidayDetailData = await holidayDetailResponse.json();
          const holiday = holidayDetailData.data.find(h => h.tanggalLibur === today);
          
          if (holiday) {
            console.log('✅ Holiday details found:', holiday.namaLibur);
            console.log('\n🎉 All APIs are working correctly!');
            console.log('🔍 Next step: Test frontend at', `${frontendUrl}/pegawai/absensi`);
            console.log('💡 Login with the same credentials and check if notification appears');
          }
        }
      }
    }
    
  } catch (error) {
    console.error('Error during test:', error);
  }
}

// Run the test
testLoginAndHolidayNotification();
