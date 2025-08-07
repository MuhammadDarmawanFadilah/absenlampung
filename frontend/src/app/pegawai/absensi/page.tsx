'use client'

import { useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { showErrorToast, showSuccessToast } from "@/components/ui/toast-utils"
import { ThemeToggle } from "@/components/theme-toggle"
import dynamic from 'next/dynamic'
import LocationMapDesktop from '@/components/LocationMapDesktop'
import LocationMapMobile from '@/components/LocationMapMobile'
import { 
  MapPin, 
  Clock, 
  Camera, 
  CheckCircle, 
  User, 
  CalendarClock,
  Navigation,
  MapPinIcon,
  Timer,
  Zap,
  Eye,
  Home,
  Building2,
  Smartphone
} from 'lucide-react'
import { getApiUrl } from "@/lib/config"
import { config } from "@/lib/config"
import { useAuth } from "@/contexts/AuthContext"
import { ApiClient } from "@/lib/api-client"

interface PegawaiUser {
  id: number
  username: string
  email: string
  fullName: string
  namaLengkap: string
  jabatan: string
  photoUrl?: string
  phoneNumber?: string
  status: string
  latitude?: number
  longitude?: number
  alamat?: string
}

interface Shift {
  id: number
  namaShift: string
  jamMasuk: string
  jamKeluar: string
  lockLokasi: string
  isActive: boolean
}

interface TodayAbsensi {
  success: boolean
  date: string
  nextType: 'masuk' | 'pulang'
  defaultShiftId: number | null
  hasMasuk: boolean
  hasPulang: boolean
  isComplete: boolean
  absensi: {
    masuk?: {
      waktu: string
      status: string
      shift: string
      shiftId: number
      latitude: number
      longitude: number
      jarak: number
      photoUrl?: string
      keterangan?: string
    }
    pulang?: {
      waktu: string
      status: string
      shift: string
      shiftId: number
      latitude: number
      longitude: number
      jarak: number
      photoUrl?: string
      keterangan?: string
    }
  }
}

interface Lokasi {
  id: number
  namaLokasi: string
  alamat: string
  latitude: string
  longitude: string
  radius: string
}

interface AbsensiData {
  pegawaiId: number
  type: 'masuk' | 'pulang'
  shiftId: number
  latitude: number
  longitude: number
  photoBase64: string
}

const steps = [
  { id: 1, title: "Pilih Shift", description: "Pilih shift dan jenis absensi" },
  { id: 2, title: "Lokasi & Foto", description: "Lokasi dan foto absensi" },
  { id: 3, title: "Konfirmasi", description: "Review data sebelum submit" }
]

export default function AbsensiPage() {
  const { user, refreshToken } = useAuth()
  const [currentStep, setCurrentStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [shiftList, setShiftList] = useState<Shift[]>([])
  const [selectedShift, setSelectedShift] = useState<Shift | null>(null)
  const [absensiType, setAbsensiType] = useState<'masuk' | 'pulang'>('masuk')
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [distance, setDistance] = useState<number | null>(null)
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null)
  const [pegawaiLokasi, setPegawaiLokasi] = useState<Lokasi | null>(null)
  const [pegawaiData, setPegawaiData] = useState<PegawaiUser | null>(null)
  const [isLocationAllowed, setIsLocationAllowed] = useState(false)
  const [showLocationMap, setShowLocationMap] = useState(false)
  const [distanceToHome, setDistanceToHome] = useState<number | null>(null)
  const [currentTime, setCurrentTime] = useState(new Date())
  const [todayAbsensi, setTodayAbsensi] = useState<TodayAbsensi | null>(null)
  const [loadingTodayAbsensi, setLoadingTodayAbsensi] = useState(true)
  const [showAbsensiDetailModal, setShowAbsensiDetailModal] = useState(false)
  const [showLocationPermissionModal, setShowLocationPermissionModal] = useState(false)
  const [hariLiburInfo, setHariLiburInfo] = useState<{ isHariLibur: boolean; namaLibur?: string; isNasional?: boolean } | null>(null)
  const [isOnApprovedLeave, setIsOnApprovedLeave] = useState<boolean>(false)
  const [loadingLeaveCheck, setLoadingLeaveCheck] = useState(true)
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null)
  const [isRetakingPhoto, setIsRetakingPhoto] = useState(false)

  // Timer untuk update waktu real-time
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    if (user) {
      console.log('User logged in, loading data...', user) // Debug log
      loadShiftData()
      loadPegawaiData()
      loadTodayAbsensi()
      checkHariLibur()
      checkApprovedLeaveToday()
    }
  }, [user])

  useEffect(() => {
    if (currentStep === 2) {
      // Only start camera, don't auto-request location
      startCamera()
    } else {
      stopCamera()
    }
    
    return () => stopCamera()
  }, [currentStep])

  // Additional effect to handle photo retake
  useEffect(() => {
    if (currentStep === 2 && !capturedPhoto && !cameraStream) {
      const timer = setTimeout(() => {
        startCamera()
      }, 300)
      return () => clearTimeout(timer)
    }
  }, [currentStep, capturedPhoto, cameraStream])

  const checkHariLibur = async () => {
    try {
      const today = new Date().toISOString().split('T')[0] // Format: YYYY-MM-DD
      console.log('Checking hari libur for date:', today) // Debug log
      
      const response = await ApiClient.get(`api/hari-libur/check/${today}`)
      
      if (response.ok) {
        const data = await response.json()
        console.log('Hari libur check response:', data) // Debug log
        
        if (data.isHariLibur) {
          // Get holiday details by searching all holidays
          const holidayResponse = await ApiClient.get(`api/hari-libur?page=0&size=200`)
          
          if (holidayResponse.ok) {
            const holidayData = await holidayResponse.json()
            console.log('Holiday detail response:', holidayData) // Debug log
            
            if (holidayData.data && holidayData.data.length > 0) {
              const holiday = holidayData.data.find((h: any) => h.tanggalLibur === today)
              if (holiday) {
                setHariLiburInfo({
                  isHariLibur: true,
                  namaLibur: holiday.namaLibur,
                  isNasional: holiday.isNasional
                })
                console.log('Holiday found:', holiday) // Debug log
              } else {
                setHariLiburInfo({ isHariLibur: true })
                console.log('Holiday confirmed but no details found') // Debug log
              }
            } else {
              setHariLiburInfo({ isHariLibur: true })
              console.log('Holiday confirmed but no data available') // Debug log
            }
          } else {
            setHariLiburInfo({ isHariLibur: true })
            console.log('Holiday confirmed but detail API failed') // Debug log
          }
        } else {
          setHariLiburInfo({ isHariLibur: false })
          console.log('Not a holiday') // Debug log
        }
      }
    } catch (error) {
      console.error('Error checking hari libur:', error)
      setHariLiburInfo({ isHariLibur: false })
    }
  }

  const checkApprovedLeaveToday = async () => {
    if (!user?.id) return
    
    try {
      setLoadingLeaveCheck(true)
      const response = await ApiClient.get(`api/cuti/check-leave-today/${user.id}`)
      
      if (response.ok) {
        const data = await response.json()
        setIsOnApprovedLeave(data.isOnApprovedLeave || false)
      } else {
        setIsOnApprovedLeave(false)
      }
    } catch (error) {
      console.error('Error checking approved leave today:', error)
      setIsOnApprovedLeave(false)
    } finally {
      setLoadingLeaveCheck(false)
    }
  }

  const loadTodayAbsensi = async () => {
    if (!user?.id) return
    
    try {
      setLoadingTodayAbsensi(true)
      const response = await ApiClient.get(`api/absensi/today/${user.id}`)
      
      if (response.ok) {
        const data = await response.json()
        setTodayAbsensi(data)
        
        // Auto-select based on today's absensi status
        if (data.hasMasuk && !data.hasPulang) {
          setAbsensiType('pulang')
          // Find and set the shift used for masuk
          if (data.defaultShiftId && shiftList.length > 0) {
            const shift = shiftList.find(s => s.id === data.defaultShiftId)
            if (shift) {
              setSelectedShift(shift)
            }
          }
        } else if (!data.hasMasuk) {
          setAbsensiType('masuk')
        }
      }
    } catch (error) {
      console.error('Error loading today absensi:', error)
    } finally {
      setLoadingTodayAbsensi(false)
    }
  }

  // Auto-select shift when shift list is loaded and today absensi is available
  useEffect(() => {
    if (todayAbsensi && shiftList.length > 0 && todayAbsensi.defaultShiftId && !selectedShift) {
      const shift = shiftList.find(s => s.id === todayAbsensi.defaultShiftId)
      if (shift) {
        setSelectedShift(shift)
      }
    }
  }, [todayAbsensi, shiftList, selectedShift])

  // Update location info when shift changes
  useEffect(() => {
    if (selectedShift && currentLocation && pegawaiData?.id) {
      updateLocationInfo(pegawaiData.id, selectedShift.id, currentLocation.lat, currentLocation.lng)
    } else if (selectedShift?.lockLokasi !== 'HARUS_DI_KANTOR') {
      // For flexible locations, allow attendance by default
      setIsLocationAllowed(true)
    } else {
      // For office-required shifts without location, disallow
      setIsLocationAllowed(false)
    }
  }, [selectedShift, currentLocation, pegawaiData?.id])

  const loadShiftData = async () => {
    try {
      const response = await ApiClient.get('api/admin/master-data/shift/active')
      
      if (response.ok) {
        const data = await response.json()
        setShiftList(data || [])
      }
    } catch (error) {
      console.error('Error loading shift data:', error)
    }
  }

  const loadPegawaiData = async () => {
    try {
      const token = localStorage.getItem('auth_token')
      if (!token) {
        console.error('No auth token found')
        // Fallback to user data from context
        if (user) {
          setPegawaiData({
            id: user.id || 0,
            username: user.username || '',
            email: user.email || '',
            fullName: user.fullName || '',
            namaLengkap: user.fullName || '',
            jabatan: '',
            photoUrl: undefined,
            phoneNumber: user.phoneNumber,
            status: user.status || 'ACTIVE'
          })
        }
        return
      }

      console.log('Loading pegawai data with token...')
      const response = await fetch(getApiUrl('api/pegawai/current'), {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })
      
      console.log('Pegawai API response status:', response.status)
      
      if (response.ok) {
        const data = await response.json()
        console.log('Pegawai data loaded successfully:', data)
        processPegawaiData(data)
      } else if (response.status === 404) {
        console.warn('Pegawai data not found, using user data as fallback')
        // Fallback to user data
        if (user) {
          setPegawaiData({
            id: user.id || 0,
            username: user.username || '',
            email: user.email || '',
            fullName: user.fullName || '',
            namaLengkap: user.fullName || '',
            jabatan: '',
            photoUrl: undefined,
            phoneNumber: user.phoneNumber,
            status: user.status || 'ACTIVE'
          })
        }
      } else if (response.status === 401) {
        console.warn('Token expired or invalid, trying to refresh...')
        // Try to refresh token
        const refreshSuccess = await refreshToken()
        if (refreshSuccess) {
          // Retry loading pegawai data
          loadPegawaiData()
        } else {
          console.error('Token refresh failed, user needs to login again')
        }
      } else {
        console.error('Failed to load pegawai data:', response.status, response.statusText)
      }
    } catch (error) {
      console.error('Error loading pegawai data:', error)
      // Fallback to user data
      if (user) {
        setPegawaiData({
          id: user.id || 0,
          username: user.username || '',
          email: user.email || '',
          fullName: user.fullName || '',
          namaLengkap: user.fullName || '',
          jabatan: '',
          photoUrl: undefined,
          phoneNumber: user.phoneNumber,
          status: user.status || 'ACTIVE'
        })
      }
    }
  }

  const processPegawaiData = (data: any) => {
    setPegawaiData({
      id: data.id,
      username: data.nip || user?.username || '',
      email: data.email || user?.email || '',
      fullName: data.namaLengkap || user?.fullName || '',
      namaLengkap: data.namaLengkap || user?.fullName || '',
      jabatan: (typeof data.jabatan === 'object' && data.jabatan?.nama) ? data.jabatan.nama : (data.jabatan || ''),
      photoUrl: data.photoUrl,
      phoneNumber: data.nomorTelepon || user?.phoneNumber,
      status: data.isActive ? 'ACTIVE' : 'INACTIVE',
      latitude: data.latitude,
      longitude: data.longitude,
      alamat: data.alamat
    })
    
    // Set pegawai lokasi (kantor) if available
    if (data.lokasi) {
      console.log('Pegawai lokasi (kantor) loaded:', data.lokasi) // Debug log
      setPegawaiLokasi(data.lokasi)
    } else {
      console.log('No lokasi kantor found for pegawai') // Debug log
    }
    
    // Calculate distance to home if pegawai has home coordinates
    if (data.latitude && data.longitude && currentLocation) {
      const distHome = calculateDistance(
        currentLocation.lat,
        currentLocation.lng,
        data.latitude,
        data.longitude
      )
      setDistanceToHome(distHome)
      console.log('Distance to home calculated:', distHome) // Debug log
    }
  }

  const loadPegawaiLokasi = async () => {
    // This function is now integrated into loadPegawaiData
  }

  const handleRequestLocation = () => {
    // If GPS is already active (currentLocation exists), don't show modal
    if (currentLocation) {
      console.log('GPS sudah aktif, tidak perlu tampilkan modal')
      return
    }
    
    // Show GPS modal then request location
    setShowLocationPermissionModal(true)
  }

  const getCurrentLocation = () => {
    // Simple location request without modal
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const location = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          }
          setCurrentLocation(location)
          
          // Get location info from backend if shift is selected
          if (selectedShift && pegawaiData?.id) {
            await updateLocationInfo(pegawaiData.id, selectedShift.id, location.lat, location.lng)
          }
          
          setIsLocationAllowed(true) // Set default to true, will be updated by location info
          
          if (pegawaiLokasi && selectedShift?.lockLokasi === 'HARUS_DI_KANTOR') {
            const dist = calculateDistance(
              location.lat,
              location.lng,
              parseFloat(pegawaiLokasi.latitude),
              parseFloat(pegawaiLokasi.longitude)
            )
            setDistance(dist)
            setIsLocationAllowed(dist <= parseFloat(pegawaiLokasi.radius || '100'))
          }
          
          // Calculate distance to pegawai home if available
          if (pegawaiData?.latitude && pegawaiData?.longitude) {
            const distHome = calculateDistance(
              location.lat,
              location.lng,
              pegawaiData.latitude,
              pegawaiData.longitude
            )
            setDistanceToHome(distHome)
          }

          showSuccessToast('Lokasi berhasil didapatkan!')
        },
        (error) => {
          console.error('Geolocation error:', error)
          let errorMessage = 'Gagal mendapatkan lokasi. '
          
          // Clear current location to prevent unauthorized access
          setCurrentLocation(null)
          
          switch(error.code) {
            case error.PERMISSION_DENIED:
              errorMessage += 'Izin lokasi ditolak. Silakan aktifkan izin lokasi di browser dan refresh halaman.'
              showErrorToast('⚠️ Izin Lokasi Diperlukan: Klik ikon kunci/gembok di address bar browser, pilih "Izinkan" untuk lokasi, lalu refresh halaman.')
              break
            case error.POSITION_UNAVAILABLE:
              errorMessage += 'Informasi lokasi tidak tersedia. Pastikan GPS aktif.'
              showErrorToast(errorMessage)
              break
            case error.TIMEOUT:
              errorMessage += 'Permintaan lokasi timeout. Coba lagi.'
              showErrorToast(errorMessage)
              break
            default:
              errorMessage += 'Pastikan GPS aktif dan izin lokasi diaktifkan.'
              showErrorToast(errorMessage)
              break
          }
          
          // DO NOT set default location - user must provide real GPS location
          // setCurrentLocation({ lat: -7.4491, lng: 109.2388 }) // REMOVED
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000 // 5 minutes
        }
      )
    } else {
      showErrorToast('Geolocation tidak didukung oleh browser ini.')
    }
  }

  const updateLocationInfo = async (pegawaiId: number, shiftId: number, currentLat: number, currentLon: number) => {
    try {
      const response = await fetch(
        getApiUrl(`absensi/location-info?pegawaiId=${pegawaiId}&shiftId=${shiftId}&currentLat=${currentLat}&currentLon=${currentLon}`),
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
          }
        }
      )
      
      if (response.ok) {
        const locationInfo = await response.json()
        
        if (locationInfo.officeRequired) {
          // Update office-based location info
          if (locationInfo.distanceToOffice !== undefined) {
            setDistance(locationInfo.distanceToOffice)
            setIsLocationAllowed(locationInfo.withinOfficeRadius)
          }
          
          if (locationInfo.error) {
            showErrorToast(locationInfo.error)
          }
        } else {
          // Flexible location - always allowed
          setIsLocationAllowed(true)
          if (locationInfo.distanceToHome !== undefined) {
            setDistanceToHome(locationInfo.distanceToHome)
          }
        }
      }
    } catch (error) {
      console.error('Error getting location info:', error)
    }
  }

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371e3 // Earth's radius in meters
    const φ1 = lat1 * Math.PI / 180
    const φ2 = lat2 * Math.PI / 180
    const Δφ = (lat2 - lat1) * Math.PI / 180
    const Δλ = (lon2 - lon1) * Math.PI / 180

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))

    return R * c // Distance in meters
  }

  const startCamera = async () => {
    try {
      // Stop existing stream first
      if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop())
      }
      
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'user',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        } 
      })
      setCameraStream(stream)
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        // Ensure video plays
        await videoRef.current.play()
      }
    } catch (error) {
      console.error('Camera error:', error)
      showErrorToast('Gagal mengakses kamera')
    }
  }

  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop())
      setCameraStream(null)
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
  }

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current
      const canvas = canvasRef.current
      const context = canvas.getContext('2d')
      
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      
      if (context) {
        context.drawImage(video, 0, 0, canvas.width, canvas.height)
        const photoDataUrl = canvas.toDataURL('image/jpeg', 0.8)
        setCapturedPhoto(photoDataUrl)
      }
    }
  }

  const retakePhoto = async () => {
    setIsRetakingPhoto(true)
    setCapturedPhoto(null)
    try {
      // Small delay to ensure UI updates
      await new Promise(resolve => setTimeout(resolve, 100))
      // Restart camera immediately
      await startCamera()
    } catch (error) {
      console.error('Error restarting camera:', error)
      showErrorToast('Gagal memulai ulang kamera')
    } finally {
      setIsRetakingPhoto(false)
    }
  }

  const getTimeDifference = (shiftTime: string) => {
    const now = new Date()
    const [hours, minutes] = shiftTime.split(':').map(Number)
    const shiftDateTime = new Date()
    shiftDateTime.setHours(hours, minutes, 0, 0)
    
    const diffMs = Math.abs(now.getTime() - shiftDateTime.getTime())
    const diffMins = Math.floor(diffMs / (1000 * 60))
    
    if (diffMins < 60) {
      return `${diffMins} menit`
    } else {
      const hours = Math.floor(diffMins / 60)
      const mins = diffMins % 60
      return `${hours} jam ${mins} menit`
    }
  }

  const handleNext = () => {
    if (currentStep === 1) {
      if (!selectedShift) {
        showErrorToast('Pilih shift terlebih dahulu')
        return
      }
      setCurrentStep(2)
    } else if (currentStep === 2) {
      if (!currentLocation) {
        showErrorToast('Lokasi belum terdeteksi')
        return
      }
      if (!capturedPhoto) {
        showErrorToast('Ambil foto terlebih dahulu')
        return
      }
      if (!isLocationAllowed) {
        showErrorToast('Anda berada di luar jangkauan lokasi yang diizinkan')
        return
      }
      setCurrentStep(3)
    }
  }

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleSubmit = async () => {
    if (!selectedShift || !currentLocation || !capturedPhoto || !pegawaiData) {
      showErrorToast('Data tidak lengkap')
      return
    }

    try {
      setLoading(true)
      
      const absensiData = {
        pegawaiId: pegawaiData.id,
        type: absensiType,
        shiftId: selectedShift.id,
        latitude: currentLocation.lat,
        longitude: currentLocation.lng,
        photoBase64: capturedPhoto.split(',')[1] // Remove data:image/jpeg;base64, prefix
      }

      const response = await fetch(getApiUrl('api/absensi'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: JSON.stringify(absensiData)
      })

      if (response.ok) {
        showSuccessToast(`Absensi ${absensiType} berhasil dicatat`)
        
        // Refresh today's absensi data
        await loadTodayAbsensi()
        
        // Reset form
        setCurrentStep(1)
        setSelectedShift(null)
        setCapturedPhoto(null)
        setCurrentLocation(null)
        
        // Auto-update for next absensi type if needed
        setTimeout(() => {
          if (absensiType === 'masuk') {
            // After successful masuk, prepare for pulang
            setAbsensiType('pulang')
          }
        }, 1000)
      } else {
        const errorData = await response.json()
        showErrorToast(errorData.message || 'Gagal melakukan absensi')
      }
    } catch (error) {
      console.error('Error submitting absensi:', error)
      showErrorToast('Gagal melakukan absensi')
    } finally {
      setLoading(false)
    }
  }

  const formatTime = (timeString: string) => {
    return timeString.substring(0, 5) // HH:MM format
  }

  const getCurrentTime = () => {
    return currentTime.toLocaleTimeString('id-ID', { 
      hour: '2-digit', 
      minute: '2-digit',
      second: '2-digit'
    })
  }

  const getCurrentDate = () => {
    return currentTime.toLocaleDateString('id-ID', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-slate-900 p-2 sm:p-4 lg:p-6">
      <div className="max-w-4xl mx-auto space-y-3 sm:space-y-6">
        
        {/* Compact Header with Time & Theme Toggle */}
        <div className="flex justify-between items-center">
          <div className="flex-1">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100 mb-1">
              Absensi Pegawai
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {getCurrentDate()}
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-right">
              <div className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100 font-mono">
                {getCurrentTime()}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                Waktu Real-time
              </div>
            </div>
            <ThemeToggle />
          </div>
        </div>

        {/* Holiday Information Alert */}
        {hariLiburInfo?.isHariLibur && (
          <Alert className="bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800 border-2 shadow-lg">
            <CalendarClock className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
            <AlertDescription className="text-yellow-800 dark:text-yellow-200">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center mb-2">
                    <strong className="text-lg">🎉 Hari Libur: {hariLiburInfo.namaLibur || 'Hari Libur'}</strong>
                    {hariLiburInfo.isNasional && (
                      <Badge variant="secondary" className="ml-3 bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300 font-semibold">
                        🏛️ Nasional
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm font-medium mb-1">
                    ✨ Hari ini adalah hari libur, namun Anda tetap dapat melakukan absensi jika diperlukan.
                  </p>
                  <p className="text-xs text-yellow-700 dark:text-yellow-300">
                    📅 {new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                  </p>
                </div>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Approved Leave Alert */}
        {!loadingLeaveCheck && isOnApprovedLeave && (
          <Alert className="bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
            <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
            <AlertDescription className="text-green-800 dark:text-green-200">
              <div className="flex items-center justify-between">
                <div>
                  <strong>🏖️ Anda Sedang Cuti Hari Ini</strong>
                  <p className="mt-1 text-sm">
                    Anda memiliki cuti yang telah disetujui untuk hari ini. Anda tidak perlu melakukan absensi. 
                    Nikmati waktu cuti Anda! 😊
                  </p>
                </div>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Tampilan Khusus untuk Absensi Lengkap */}
        {todayAbsensi?.isComplete ? (
          <Card className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm border border-gray-200 dark:border-gray-700 shadow-xl">
            <CardContent className="p-8">
              <div className="text-center space-y-6">
                <div className="flex justify-center">
                  <div className="w-24 h-24 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                    <CheckCircle className="w-12 h-12 text-green-600 dark:text-green-400" />
                  </div>
                </div>
                
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                    Absensi Hari Ini Sudah Lengkap! 🎉
                  </h2>
                  <p className="text-gray-600 dark:text-gray-400">
                    Terima kasih, Anda sudah melakukan absen masuk dan pulang untuk hari ini.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto">
                  {/* Absen Masuk Summary */}
                  {todayAbsensi.absensi.masuk && (
                    <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-200 dark:border-green-800">
                      <div className="flex items-center justify-center mb-3">
                        <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mr-3">
                          <Zap className="w-5 h-5 text-green-600 dark:text-green-400" />
                        </div>
                        <h3 className="font-semibold text-green-700 dark:text-green-400">Absen Masuk</h3>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-800 dark:text-green-300 mb-1">
                          {todayAbsensi.absensi.masuk.waktu}
                        </div>
                        <div className="text-sm text-green-600 dark:text-green-400">
                          {todayAbsensi.absensi.masuk.shift}
                        </div>
                        <Badge variant={todayAbsensi.absensi.masuk.status === 'hadir' ? 'default' : 'destructive'} className="mt-2 text-xs">
                          {todayAbsensi.absensi.masuk.status === 'hadir' ? '🟢 Tepat Waktu' : 
                           todayAbsensi.absensi.masuk.status === 'terlambat' ? '🟡 Terlambat' : '🔴 Alpha'}
                        </Badge>
                      </div>
                    </div>
                  )}

                  {/* Absen Pulang Summary */}
                  {todayAbsensi.absensi.pulang && (
                    <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-lg border border-orange-200 dark:border-orange-800">
                      <div className="flex items-center justify-center mb-3">
                        <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center mr-3">
                          <Timer className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                        </div>
                        <h3 className="font-semibold text-orange-700 dark:text-orange-400">Absen Pulang</h3>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-orange-800 dark:text-orange-300 mb-1">
                          {todayAbsensi.absensi.pulang.waktu}
                        </div>
                        <div className="text-sm text-orange-600 dark:text-orange-400">
                          {todayAbsensi.absensi.pulang.shift}
                        </div>
                        <Badge variant={todayAbsensi.absensi.pulang.status === 'hadir' ? 'default' : 'destructive'} className="mt-2 text-xs">
                          {todayAbsensi.absensi.pulang.status === 'hadir' ? '🟢 Tepat Waktu' : 
                           todayAbsensi.absensi.pulang.status === 'pulang_cepat' ? '🟡 Pulang Cepat' : '🔴 Alpha'}
                        </Badge>
                      </div>
                    </div>
                  )}
                </div>

                <div className="pt-4">
                  <Button 
                    onClick={() => setShowAbsensiDetailModal(true)}
                    variant="outline"
                    className="hover:bg-blue-50 dark:hover:bg-blue-900/20"
                  >
                    <CalendarClock className="w-4 h-4 mr-2" />
                    Lihat Detail Lengkap
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : !loadingLeaveCheck && isOnApprovedLeave ? (
          // Special display for approved leave - no absensi form
          <Card className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm border border-gray-200 dark:border-gray-700 shadow-xl">
            <CardContent className="p-8">
              <div className="text-center space-y-6">
                <div className="flex justify-center">
                  <div className="w-24 h-24 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                    <div className="text-4xl">🏖️</div>
                  </div>
                </div>
                
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                    Selamat Menikmati Cuti Anda! 🌴
                  </h2>
                  <p className="text-gray-600 dark:text-gray-400">
                    Anda memiliki cuti yang telah disetujui untuk hari ini. Tidak perlu melakukan absensi.
                  </p>
                </div>

                <div className="bg-green-50 dark:bg-green-900/20 p-6 rounded-lg border border-green-200 dark:border-green-800 max-w-md mx-auto">
                  <div className="flex items-center justify-center mb-4">
                    <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400 mr-3" />
                    <h3 className="text-lg font-semibold text-green-700 dark:text-green-400">Status Cuti Hari Ini</h3>
                  </div>
                  <div className="text-center">
                    <Badge variant="default" className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 text-sm px-3 py-1">
                      ✅ Cuti Disetujui
                    </Badge>
                    <p className="text-sm text-green-600 dark:text-green-400 mt-2">
                      {getCurrentDate()}
                    </p>
                  </div>
                </div>

                <div className="text-sm text-gray-500 dark:text-gray-400">
                  <p>💡 <strong>Tips:</strong> Nikmati waktu istirahat Anda dan kembali bekerja dengan semangat baru!</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Enhanced Progress Steps */}
            <Card className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm border border-gray-200 dark:border-gray-700 shadow-xl">
              <CardContent className="p-6">
                <div className="relative">
                  {/* Progress Bar Background */}
                  <div className="absolute top-5 left-0 right-0 h-0.5 bg-gray-200 dark:bg-gray-600"></div>
                  <div 
                    className={`absolute top-5 left-0 h-0.5 bg-gradient-to-r from-blue-600 to-purple-600 transition-all duration-500 ease-out`}
                    style={{ width: `${((currentStep - 1) / (steps.length - 1)) * 100}%` }}
                  ></div>
                  
                  {/* Steps */}
                  <div className="relative flex justify-between">
                    {steps.map((step, index) => (
                      <div key={step.id} className="flex flex-col items-center">
                        <div className={`
                          flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all duration-300 z-10 relative
                          ${currentStep >= step.id 
                            ? 'bg-gradient-to-r from-blue-600 to-purple-600 border-transparent text-white shadow-lg scale-110' 
                            : currentStep === step.id
                            ? 'bg-white dark:bg-gray-800 border-blue-500 text-blue-600 dark:text-blue-400 shadow-md'
                            : 'bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-400 dark:text-gray-500'
                          }
                        `}>
                          {currentStep > step.id ? (
                            <CheckCircle className="w-5 h-5" />
                          ) : (
                            <span className="text-sm font-bold">{step.id}</span>
                          )}
                        </div>
                        <div className="mt-3 text-center max-w-24">
                          <div className={`text-xs font-medium transition-colors duration-300 ${
                            currentStep >= step.id ? 'text-gray-900 dark:text-gray-100' : 'text-gray-500 dark:text-gray-400'
                          }`}>
                            {step.title}
                          </div>
                          {currentStep === step.id && (
                            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                              {step.description}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

        {/* Step Content */}
        <Card className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm border border-gray-200 dark:border-gray-700 shadow-xl">
          <CardContent className="p-6">
            {/* Step 1: Pilih Shift */}
            {currentStep === 1 && (
              <div className="space-y-6">
                {/* User Profile Section */}
                <div className="text-center">
                  <div className="flex items-center justify-center mb-4">
                    <div className="relative">
                      <Avatar className="w-20 h-20 border-4 border-white dark:border-gray-700 shadow-lg">
                        <AvatarImage 
                          src={pegawaiData?.photoUrl ? 
                            pegawaiData.photoUrl.startsWith('http') 
                              ? pegawaiData.photoUrl 
                              : `${config.backendUrl}/api/upload/photos/${pegawaiData.photoUrl}`
                            : undefined
                          } 
                          alt={pegawaiData?.namaLengkap || 'Profile'}
                        />
                        <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-500 text-white text-xl font-bold">
                          {pegawaiData?.namaLengkap?.split(' ').map((n: string) => n[0]).join('') || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full border-2 border-white dark:border-gray-700 flex items-center justify-center">
                        <Smartphone className="w-3 h-3 text-white" />
                      </div>
                    </div>
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-1">
                      Selamat datang, {pegawaiData?.namaLengkap?.split(' ')[0] || user?.fullName?.split(' ')[0]}
                    </h2>
                    <p className="text-gray-600 dark:text-gray-400">{pegawaiData?.jabatan || 'Pegawai'}</p>
                    {pegawaiData?.alamat && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 flex items-center justify-center">
                        <Home className="w-3 h-3 mr-1" />
                        {pegawaiData.alamat}
                      </p>
                    )}
                  </div>
                </div>

                <Separator className="bg-gradient-to-r from-transparent via-gray-300 dark:via-gray-600 to-transparent" />

                {/* Jenis Absensi */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                    Jenis Absensi
                  </label>
                  
                  {todayAbsensi?.isComplete ? (
                    <Alert className="border-green-200 bg-green-50 dark:bg-green-900/20">
                      <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                      <AlertDescription className="text-green-800 dark:text-green-200">
                        <strong>Absensi hari ini sudah lengkap!</strong><br />
                        Anda sudah melakukan absen masuk dan pulang untuk hari ini.
                      </AlertDescription>
                    </Alert>
                  ) : (
                    <>
                      {todayAbsensi?.hasMasuk && !todayAbsensi?.hasPulang && (
                        <Alert className="border-blue-200 bg-blue-50 dark:bg-blue-900/20 mb-4">
                          <Timer className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                          <AlertDescription className="text-blue-800 dark:text-blue-200">
                            <div className="flex items-center justify-between">
                              <span>
                                <strong>Sudah absen masuk pukul {todayAbsensi.absensi.masuk?.waktu}</strong>
                              </span>
                              <Button 
                                variant="link" 
                                size="sm" 
                                onClick={() => setShowAbsensiDetailModal(true)}
                                className="text-blue-600 dark:text-blue-400 p-0 h-auto underline"
                              >
                                (Lihat Detail)
                              </Button>
                            </div>
                          </AlertDescription>
                        </Alert>
                      )}
                      
                      <div className="grid grid-cols-2 gap-4">
                        <Button
                          variant={absensiType === 'masuk' ? 'default' : 'outline'}
                          onClick={() => setAbsensiType('masuk')}
                          disabled={todayAbsensi?.hasMasuk}
                          className={`h-14 transition-all duration-300 ${
                            todayAbsensi?.hasMasuk 
                              ? 'opacity-50 cursor-not-allowed' 
                              : absensiType === 'masuk' 
                                ? 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 shadow-lg' 
                                : 'hover:bg-green-50 dark:hover:bg-green-900/20 hover:border-green-300 dark:hover:border-green-700'
                          }`}
                        >
                          <Zap className="w-5 h-5 mr-2" />
                          Absen Masuk
                          {todayAbsensi?.hasMasuk && (
                            <CheckCircle className="w-4 h-4 ml-2 text-green-600" />
                          )}
                        </Button>
                        <Button
                          variant={absensiType === 'pulang' ? 'default' : 'outline'}
                          onClick={() => setAbsensiType('pulang')}
                          disabled={!todayAbsensi?.hasMasuk || todayAbsensi?.hasPulang}
                          className={`h-14 transition-all duration-300 ${
                            (!todayAbsensi?.hasMasuk || todayAbsensi?.hasPulang)
                              ? 'opacity-50 cursor-not-allowed' 
                              : absensiType === 'pulang' 
                                ? 'bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 shadow-lg' 
                                : 'hover:bg-orange-50 dark:hover:bg-orange-900/20 hover:border-orange-300 dark:hover:border-orange-700'
                          }`}
                        >
                          <Timer className="w-5 h-5 mr-2" />
                          Absen Pulang
                          {todayAbsensi?.hasPulang && (
                            <CheckCircle className="w-4 h-4 ml-2 text-orange-600" />
                          )}
                        </Button>
                      </div>
                      
                      {!todayAbsensi?.hasMasuk && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 text-center">
                          Mulai dengan absen masuk terlebih dahulu
                        </p>
                      )}
                    </>
                  )}
                </div>

                {/* Pilih Shift - Full Width */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                    Pilih Shift Kerja
                  </label>
                  <div className="space-y-3">
                    {shiftList.map((shift) => (
                      <Card 
                        key={shift.id} 
                        className={`cursor-pointer transition-all duration-300 hover:shadow-md ${
                          selectedShift?.id === shift.id 
                            ? 'ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-600' 
                            : 'hover:border-gray-300 dark:hover:border-gray-600'
                        }`}
                        onClick={() => setSelectedShift(shift)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center space-x-3">
                                <div className={`w-4 h-4 rounded-full border-2 transition-colors ${
                                  selectedShift?.id === shift.id 
                                    ? 'bg-blue-500 border-blue-500' 
                                    : 'border-gray-300 dark:border-gray-600'
                                }`}>
                                  {selectedShift?.id === shift.id && (
                                    <div className="w-full h-full rounded-full bg-white transform scale-50"></div>
                                  )}
                                </div>
                                <div>
                                  <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                                    {shift.namaShift}
                                  </h3>
                                  <p className="text-sm text-gray-600 dark:text-gray-400">
                                    {formatTime(shift.jamMasuk)} - {formatTime(shift.jamKeluar)}
                                  </p>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Badge variant="secondary" className="text-xs">
                                {getTimeDifference(absensiType === 'masuk' ? shift.jamMasuk : shift.jamKeluar)}
                              </Badge>
                              {shift.lockLokasi === 'HARUS_DI_KANTOR' && (
                                <Badge variant="destructive" className="text-xs">
                                  <Building2 className="w-3 h-3 mr-1" />
                                  Lock
                                </Badge>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>

                {selectedShift && (
                  <Alert className="border-l-4 border-l-blue-500 bg-blue-50/80 dark:bg-blue-900/20">
                    <Clock className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    <AlertDescription>
                      <div className="space-y-2 text-sm">
                        <div className="font-semibold text-blue-900 dark:text-blue-100">
                          {selectedShift.namaShift}
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-gray-700 dark:text-gray-300">
                          <div>
                            <strong>Jam Kerja:</strong> {formatTime(selectedShift.jamMasuk)} - {formatTime(selectedShift.jamKeluar)}
                          </div>
                          <div>
                            <strong>Selisih waktu:</strong> {' '}
                            {getTimeDifference(absensiType === 'masuk' ? selectedShift.jamMasuk : selectedShift.jamKeluar)}
                          </div>
                        </div>
                        {selectedShift.lockLokasi === 'HARUS_DI_KANTOR' && (
                          <div className="text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-900/30 p-3 rounded-md">
                            <strong className="flex items-center">
                              <Building2 className="w-4 h-4 mr-2" />
                              Lock Location Aktif
                            </strong>
                            <span className="text-sm">Anda harus berada di area kantor untuk absensi</span>
                          </div>
                        )}
                      </div>
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            )}

            {/* Step 2: Lokasi & Foto */}
            {currentStep === 2 && (
              <div className="space-y-6">
                <div className="text-center">
                  <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                    Lokasi & Foto Absensi
                  </h2>
                </div>

                {/* Location Status - Mobile Optimized */}
                <Card className="border-2 border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600 transition-colors">
                  <CardContent className="p-3 sm:p-4">
                    {/* Mobile: Stack layout, Desktop: Side by side */}
                    <div className="space-y-3 sm:space-y-0 sm:flex sm:items-center sm:justify-between">
                      {/* Profile and Info Section */}
                      <div className="flex items-center space-x-3">
                        {/* Profile Photo */}
                        <div className="relative flex-shrink-0">
                          <Avatar className="w-12 h-12 sm:w-14 sm:h-14 border-2 border-white dark:border-gray-700 shadow-sm">
                            <AvatarImage 
                              src={pegawaiData?.photoUrl ? 
                                pegawaiData.photoUrl.startsWith('http') 
                                  ? pegawaiData.photoUrl 
                                  : `${config.backendUrl}/api/upload/photos/${pegawaiData.photoUrl}`
                                : undefined
                              } 
                              alt={pegawaiData?.namaLengkap || 'Profile'}
                            />
                            <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-500 text-white text-sm font-bold">
                              {pegawaiData?.namaLengkap?.split(' ').map((n: string) => n[0]).join('') || 'U'}
                            </AvatarFallback>
                          </Avatar>
                          <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white dark:border-gray-700 ${isLocationAllowed ? 'bg-green-500' : 'bg-red-500'}`} />
                        </div>
                        
                        {/* Info Section */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2 mb-1">
                            <div className="font-semibold text-gray-900 dark:text-gray-100 text-sm sm:text-base truncate">
                              {pegawaiData?.namaLengkap || user?.fullName}
                            </div>
                            {selectedShift?.lockLokasi === 'HARUS_DI_KANTOR' ? (
                              <div className="text-lg flex-shrink-0" title="Lokasi harus di kantor">🏢</div>
                            ) : (
                              <div className="text-lg flex-shrink-0" title="Lokasi fleksibel - dapat absen dari rumah">🏠</div>
                            )}
                          </div>
                          
                          <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                            {!currentLocation ? (
                              <span className="text-orange-600 dark:text-orange-400 font-medium">
                                GPS belum aktif
                              </span>
                            ) : selectedShift?.lockLokasi === 'HARUS_DI_KANTOR' ? (
                              distance !== null ? (
                                <span>
                                  <span className="font-medium">{Math.round(distance)}m</span> dari kantor
                                  {pegawaiLokasi && (
                                    <span className="text-gray-500 dark:text-gray-400 hidden sm:inline"> (radius: {pegawaiLokasi.radius}m)</span>
                                  )}
                                </span>
                              ) : (
                                'Menghitung jarak...'
                              )
                            ) : (
                              distanceToHome !== null ? (
                                <span>
                                  <span className="font-medium">{Math.round(distanceToHome)}m</span> dari rumah
                                </span>
                              ) : (
                                'Absensi fleksibel'
                              )
                            )}
                          </div>
                        </div>
                      </div>
                      
                      {/* Action Buttons Section - Mobile: Full width, Desktop: Compact */}
                      <div className="flex items-center justify-between sm:justify-end sm:space-x-2">
                        <Badge 
                          variant={isLocationAllowed ? "default" : "destructive"}
                          className="text-xs"
                        >
                          {isLocationAllowed ? '✅ Valid' : '❌ Invalid'}
                        </Badge>
                        
                        <div className="flex items-center space-x-2">
                          {!currentLocation ? (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={getCurrentLocation}
                              className="text-xs bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/20 dark:hover:bg-blue-900/40 border-blue-300 dark:border-blue-700"
                            >
                              <Navigation className="w-3 h-3 mr-1" />
                              <span className="hidden sm:inline">Aktifkan GPS</span>
                              <span className="sm:hidden">GPS</span>
                            </Button>
                          ) : (
                            <Badge variant="default" className="text-xs bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
                              <Navigation className="w-3 h-3 mr-1" />
                              <span className="hidden sm:inline">GPS Aktif</span>
                              <span className="sm:hidden">Aktif</span>
                            </Badge>
                          )}
                          
                          {/* Desktop View */}
                          <div className="hidden md:block">
                            {typeof window !== 'undefined' && window.innerWidth >= 768 && (
                              <LocationMapDesktop
                                showLocationMap={showLocationMap}
                                setShowLocationMap={setShowLocationMap}
                                currentLocation={currentLocation}
                                selectedShift={selectedShift}
                                pegawaiLokasi={pegawaiLokasi}
                                pegawaiData={pegawaiData}
                                distance={distance}
                                distanceToHome={distanceToHome}
                                isLocationAllowed={isLocationAllowed}
                                onRequestLocation={handleRequestLocation}
                              />
                            )}
                          </div>
                          
                          {/* Mobile View */}
                          <div className="md:hidden">
                            {typeof window !== 'undefined' && window.innerWidth < 768 && (
                              <LocationMapMobile
                                showLocationMap={showLocationMap}
                                setShowLocationMap={setShowLocationMap}
                                currentLocation={currentLocation}
                                selectedShift={selectedShift}
                                pegawaiLokasi={pegawaiLokasi}
                                pegawaiData={pegawaiData}
                                distance={distance}
                                distanceToHome={distanceToHome}
                                isLocationAllowed={isLocationAllowed}
                                onRequestLocation={handleRequestLocation}
                              />
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>                {/* Camera Section - Mobile Optimized */}
                <Card className="border-2 border-gray-200 dark:border-gray-700">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base sm:text-lg flex items-center justify-center">
                      <Camera className="w-5 h-5 mr-2 text-blue-600 dark:text-blue-400" />
                      Ambil Foto Selfie
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="px-3 sm:px-6">
                    <div className="space-y-4">
                      {capturedPhoto ? (
                        <div className="flex flex-col items-center">
                          <div className="relative">
                            <img 
                              src={capturedPhoto} 
                              alt="Captured" 
                              className="w-64 h-64 sm:w-72 sm:h-72 md:w-80 md:h-80 lg:w-96 lg:h-96 object-cover rounded-xl border-4 border-white dark:border-gray-700 shadow-lg"
                            />
                            <div className="absolute -top-2 -right-2 w-8 h-8 bg-green-500 rounded-full border-2 border-white dark:border-gray-700 flex items-center justify-center">
                              <CheckCircle className="w-4 h-4 text-white" />
                            </div>
                          </div>
                          <Button 
                            variant="outline" 
                            onClick={retakePhoto}
                            disabled={isRetakingPhoto}
                            className="mt-4 w-full sm:w-auto hover:bg-blue-50 dark:hover:bg-blue-900/20"
                          >
                            {isRetakingPhoto ? (
                              <>
                                <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mr-2" />
                                Memulai Kamera...
                              </>
                            ) : (
                              <>
                                <Camera className="w-4 h-4 mr-2" />
                                Ambil Ulang
                              </>
                            )}
                          </Button>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center">
                          <div className="relative">
                            <video 
                              ref={videoRef}
                              autoPlay
                              playsInline
                              muted
                              className="w-64 h-64 sm:w-72 sm:h-72 md:w-80 md:h-80 lg:w-96 lg:h-96 object-cover rounded-xl border-4 border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800"
                            />
                            {!cameraStream && (
                              <div className="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded-xl">
                                <div className="text-center">
                                  <Camera className="w-12 h-12 mx-auto text-gray-400 dark:text-gray-500 mb-2" />
                                  <p className="text-sm text-gray-500 dark:text-gray-400">Mengakses kamera...</p>
                                </div>
                              </div>
                            )}
                          </div>
                          <Button 
                            onClick={capturePhoto}
                            className="mt-4 w-full sm:w-auto bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                            disabled={!cameraStream}
                          >
                            <Camera className="w-4 h-4 mr-2" />
                            Ambil Foto
                          </Button>
                        </div>
                      )}
                      <canvas ref={canvasRef} className="hidden" />
                      
                      {!isLocationAllowed && (
                        <Alert variant="destructive">
                          <MapPin className="h-4 w-4" />
                          <AlertDescription className="text-sm">
                            Anda berada di luar jangkauan lokasi yang diizinkan. 
                            Silakan pindah ke lokasi yang sesuai untuk melanjutkan absensi.
                          </AlertDescription>
                        </Alert>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Step 3: Preview */}
            {currentStep === 3 && (
              <div className="space-y-6">
                <div className="text-center">
                  <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                    Konfirmasi Data Absensi
                  </h2>
                  <p className="text-gray-600 dark:text-gray-400 text-sm sm:text-base">
                    Periksa kembali data absensi sebelum submit
                  </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card className="border-2 border-gray-200 dark:border-gray-700">
                    <CardHeader>
                      <CardTitle className="text-base sm:text-lg flex items-center">
                        <User className="w-5 h-5 mr-2 text-blue-600 dark:text-blue-400" />
                        Detail Absensi
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-3">
                        <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-700">
                          <span className="text-gray-600 dark:text-gray-400 text-sm">Nama:</span>
                          <span className="font-semibold text-sm sm:text-base text-gray-900 dark:text-gray-100">{pegawaiData?.namaLengkap || user?.fullName}</span>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-700">
                          <span className="text-gray-600 dark:text-gray-400 text-sm">Jenis:</span>
                          <Badge variant={absensiType === 'masuk' ? 'default' : 'secondary'} className="font-medium">
                            {absensiType === 'masuk' ? '🟢 Masuk' : '🔴 Pulang'}
                          </Badge>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-700">
                          <span className="text-gray-600 dark:text-gray-400 text-sm">Shift:</span>
                          <span className="font-semibold text-sm sm:text-base text-gray-900 dark:text-gray-100">{selectedShift?.namaShift}</span>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-700">
                          <span className="text-gray-600 dark:text-gray-400 text-sm">Waktu:</span>
                          <span className="font-semibold text-sm sm:text-base font-mono text-gray-900 dark:text-gray-100">{getCurrentTime()}</span>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-700">
                          <span className="text-gray-600 dark:text-gray-400 text-sm">Lokasi:</span>
                          <span className="font-semibold text-sm sm:text-base text-gray-900 dark:text-gray-100">
                            {selectedShift?.lockLokasi === 'HARUS_DI_KANTOR' ? pegawaiLokasi?.namaLokasi : 'Fleksibel'}
                          </span>
                        </div>
                        {distance !== null && selectedShift?.lockLokasi === 'HARUS_DI_KANTOR' && (
                          <div className="flex justify-between items-center py-2">
                            <span className="text-gray-600 dark:text-gray-400 text-sm">Jarak:</span>
                            <Badge variant="outline" className="font-mono">
                              {Math.round(distance)} meter
                            </Badge>
                          </div>
                        )}
                        {distanceToHome !== null && selectedShift?.lockLokasi !== 'HARUS_DI_KANTOR' && (
                          <div className="flex justify-between items-center py-2">
                            <span className="text-gray-600 dark:text-gray-400 text-sm">Jarak dari rumah:</span>
                            <Badge variant="outline" className="font-mono">
                              {Math.round(distanceToHome)} meter
                            </Badge>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-2 border-gray-200 dark:border-gray-700">
                    <CardHeader>
                      <CardTitle className="text-base sm:text-lg flex items-center">
                        <Camera className="w-5 h-5 mr-2 text-blue-600 dark:text-blue-400" />
                        Foto Absensi
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {capturedPhoto && (
                        <div className="text-center">
                          <img 
                            src={capturedPhoto} 
                            alt="Preview Foto Absensi" 
                            className="w-full h-64 sm:h-80 md:h-96 object-cover rounded-xl border-4 border-white dark:border-gray-700 shadow-lg"
                          />
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-3">
                            Foto akan disimpan sebagai bukti absensi
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}

            {/* Enhanced Navigation Buttons - Mobile Optimized */}
            <div className="mt-6 sm:mt-8 pt-4 sm:pt-6 border-t border-gray-200 dark:border-gray-700">
              <div className="flex justify-between items-center">
                <Button
                  variant="outline"
                  onClick={handlePrevious}
                  disabled={currentStep === 1}
                  className={`min-w-[100px] sm:min-w-[120px] h-10 sm:h-12 text-sm sm:text-base transition-all duration-300 ${
                    currentStep === 1 
                      ? 'opacity-50 cursor-not-allowed' 
                      : 'hover:bg-gray-50 dark:hover:bg-gray-800 hover:border-gray-400 dark:hover:border-gray-500'
                  }`}
                >
                  <Navigation className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2 rotate-180" />
                  <span className="hidden sm:inline">Kembali</span>
                  <span className="sm:hidden">Back</span>
                </Button>

                {/* Progress Indicator */}
                <div className="flex items-center space-x-2">
                  <span className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                    {currentStep} dari {steps.length}
                  </span>
                  <div className="flex space-x-1">
                    {steps.map((step) => (
                      <div
                        key={step.id}
                        className={`w-2 h-2 rounded-full transition-all duration-300 ${
                          currentStep >= step.id
                            ? 'bg-gradient-to-r from-blue-600 to-purple-600'
                            : 'bg-gray-300 dark:bg-gray-600'
                        }`}
                      />
                    ))}
                  </div>
                </div>

                {currentStep < 3 ? (
                  <Button
                    onClick={handleNext}
                    disabled={
                      todayAbsensi?.isComplete ||
                      (currentStep === 1 && !selectedShift) ||
                      (currentStep === 2 && (!currentLocation || !capturedPhoto || !isLocationAllowed))
                    }
                    className={`min-w-[100px] sm:min-w-[120px] h-10 sm:h-12 text-sm sm:text-base transition-all duration-300 ${
                      todayAbsensi?.isComplete ||
                      (currentStep === 1 && !selectedShift) ||
                      (currentStep === 2 && (!currentLocation || !capturedPhoto || !isLocationAllowed))
                        ? 'opacity-50 cursor-not-allowed'
                        : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl'
                    }`}
                  >
                    {todayAbsensi?.isComplete ? (
                      <span className="text-xs">Lengkap</span>
                    ) : (
                      <>
                        <span className="hidden sm:inline">Lanjutkan</span>
                        <span className="sm:hidden">Next</span>
                        {!todayAbsensi?.isComplete && <Navigation className="w-3 h-3 sm:w-4 sm:h-4 ml-1 sm:ml-2" />}
                      </>
                    )}
                  </Button>
                ) : (
                  <Button
                    onClick={handleSubmit}
                    disabled={loading || todayAbsensi?.isComplete}
                    className="min-w-[100px] sm:min-w-[120px] h-10 sm:h-12 text-sm sm:text-base bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 shadow-lg hover:shadow-xl transition-all duration-300"
                  >
                    {loading ? (
                      <>
                        <div className="w-3 h-3 sm:w-4 sm:h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-1 sm:mr-2" />
                        <span className="hidden sm:inline">Menyimpan...</span>
                        <span className="sm:hidden">Wait...</span>
                      </>
                    ) : todayAbsensi?.isComplete ? (
                      <>
                        <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                        <span className="text-xs">Lengkap</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                        Submit
                      </>
                    )}
                  </Button>
                )}
              </div>
              
              {/* Help Text */}
              <div className="mt-3 sm:mt-4 text-center">
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {currentStep === 1 && "Pilih jenis absensi dan shift kerja Anda"}
                  {currentStep === 2 && currentLocation ? "Ambil foto selfie untuk menyelesaikan absensi" : "Nyalakan GPS dan ambil foto selfie"}
                  {currentStep === 3 && "Periksa kembali data sebelum submit"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
          </>
        )}
      </div>

      {/* Modal Panduan GPS Permission */}
      <Dialog open={showLocationPermissionModal} onOpenChange={setShowLocationPermissionModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <Navigation className="w-5 h-5 mr-2 text-blue-600" />
              GPS Diperlukan untuk Melihat Peta
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="text-center">
              <div className="text-6xl mb-3">�️</div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Aktifkan GPS untuk melihat peta lokasi dan melakukan absensi
              </p>
            </div>

            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
              <h4 className="font-semibold text-blue-700 dark:text-blue-400 mb-2">
                � Langkah Aktivasi GPS:
              </h4>
              <ol className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                <li>1. Klik tombol <strong>"Nyalakan GPS"</strong> di bawah</li>
                <li>2. Pilih <strong>"Izinkan"</strong> saat browser meminta akses</li>
                <li>3. Pastikan GPS aktif di perangkat Anda</li>
                <li>4. Tunggu hingga lokasi terdeteksi</li>
              </ol>
            </div>

            <div className="bg-amber-50 dark:bg-amber-900/20 p-4 rounded-lg border border-amber-200 dark:border-amber-800">
              <h4 className="font-semibold text-amber-700 dark:text-amber-400 mb-2">
                ⚠️ Catatan Penting:
              </h4>
              <ul className="text-sm text-amber-800 dark:text-amber-200 space-y-1">
                <li>• GPS diperlukan untuk verifikasi lokasi absensi</li>
                <li>• Peta hanya dapat dibuka setelah GPS aktif</li>
                <li>• Data lokasi tidak disimpan permanen</li>
              </ul>
            </div>

            <div className="flex justify-between items-center pt-2">
              <Button
                variant="outline"
                onClick={() => setShowLocationPermissionModal(false)}
                className="text-sm"
              >
                Batal
              </Button>
              <Button
                onClick={() => {
                  setShowLocationPermissionModal(false)
                  getCurrentLocation()
                }}
                className="text-sm bg-blue-600 hover:bg-blue-700"
              >
                <Navigation className="w-4 h-4 mr-2" />
                Nyalakan GPS
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal Detail Absensi */}
      <Dialog open={showAbsensiDetailModal} onOpenChange={setShowAbsensiDetailModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <CalendarClock className="w-5 h-5 mr-2 text-blue-600" />
              Detail Absensi Hari Ini
            </DialogTitle>
          </DialogHeader>
          
          {todayAbsensi && (
            <div className="space-y-4">
              <div className="text-center">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {todayAbsensi.date}
                </p>
                <Badge variant={todayAbsensi.isComplete ? "default" : "secondary"} className="mt-1">
                  {todayAbsensi.isComplete ? "Absensi Lengkap" : "Belum Lengkap"}
                </Badge>
              </div>

              {/* Absen Masuk Detail */}
              {todayAbsensi.hasMasuk && todayAbsensi.absensi.masuk && (
                <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-200 dark:border-green-800">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold text-green-700 dark:text-green-400 flex items-center">
                      <Zap className="w-4 h-4 mr-2" />
                      Absen Masuk
                    </h4>
                    <Badge variant="default" className="text-xs">✅ Sudah</Badge>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Waktu:</span>
                      <span className="font-mono font-semibold">{todayAbsensi.absensi.masuk.waktu}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Shift:</span>
                      <span className="font-medium">{todayAbsensi.absensi.masuk.shift}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Status:</span>
                      <Badge variant={todayAbsensi.absensi.masuk.status === 'hadir' ? 'default' : 'destructive'} className="text-xs">
                        {todayAbsensi.absensi.masuk.status === 'hadir' ? '🟢 Tepat Waktu' : 
                         todayAbsensi.absensi.masuk.status === 'terlambat' ? '🟡 Terlambat' : '🔴 Alpha'}
                      </Badge>
                    </div>
                    {todayAbsensi.absensi.masuk.jarak && (
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Jarak:</span>
                        <span className="font-mono text-xs">{Math.round(todayAbsensi.absensi.masuk.jarak)}m</span>
                      </div>
                    )}
                    {todayAbsensi.absensi.masuk.keterangan && (
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Keterangan:</span>
                        <span className="text-xs">{todayAbsensi.absensi.masuk.keterangan}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Absen Pulang Detail */}
              {todayAbsensi.hasPulang && todayAbsensi.absensi.pulang && (
                <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-lg border border-orange-200 dark:border-orange-800">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold text-orange-700 dark:text-orange-400 flex items-center">
                      <Timer className="w-4 h-4 mr-2" />
                      Absen Pulang
                    </h4>
                    <Badge variant="default" className="text-xs">✅ Sudah</Badge>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Waktu:</span>
                      <span className="font-mono font-semibold">{todayAbsensi.absensi.pulang.waktu}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Shift:</span>
                      <span className="font-medium">{todayAbsensi.absensi.pulang.shift}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Status:</span>
                      <Badge variant={todayAbsensi.absensi.pulang.status === 'hadir' ? 'default' : 'destructive'} className="text-xs">
                        {todayAbsensi.absensi.pulang.status === 'hadir' ? '🟢 Tepat Waktu' : 
                         todayAbsensi.absensi.pulang.status === 'pulang_cepat' ? '🟡 Pulang Cepat' : '🔴 Alpha'}
                      </Badge>
                    </div>
                    {todayAbsensi.absensi.pulang.jarak && (
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Jarak:</span>
                        <span className="font-mono text-xs">{Math.round(todayAbsensi.absensi.pulang.jarak)}m</span>
                      </div>
                    )}
                    {todayAbsensi.absensi.pulang.keterangan && (
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Keterangan:</span>
                        <span className="text-xs">{todayAbsensi.absensi.pulang.keterangan}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Status belum absen pulang */}
              {todayAbsensi.hasMasuk && !todayAbsensi.hasPulang && (
                <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-lg border border-gray-200 dark:border-gray-700 text-center">
                  <Timer className="w-8 h-8 mx-auto text-gray-400 mb-2" />
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Belum melakukan absen pulang
                  </p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
