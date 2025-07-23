'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useParams } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { showErrorToast, showSuccessToast } from "@/components/ui/toast-utils"
import { ArrowLeft, Save, Camera, X, ChevronRight, ChevronLeft, User, MapPin, Calculator, Eye, Check, ChevronsUpDown, Search } from 'lucide-react'
import { AdminPageHeader } from "@/components/AdminPageHeader"
import { useToast } from "@/hooks/use-toast"
import { getApiUrl } from "@/lib/config"
import { cn } from "@/lib/utils"
import { Stepper } from "@/components/ui/stepper"
import { MapSelector } from "@/components/MapSelector"

interface JabatanResponse {
  id: number
  nama: string
}

interface LokasiResponse {
  id: number
  namaLokasi: string
}

interface ProvinsiResponse {
  kode: string
  nama: string
}

interface KotaResponse {
  kode: string
  nama: string
}

interface KecamatanResponse {
  kode: string
  nama: string
}

interface KelurahanResponse {
  kode: string
  nama: string
  kodePos: string
}

const steps = [
  {
    id: 1,
    title: "Personal & Akun",
    description: "Informasi personal dan jabatan"
  },
  {
    id: 2,
    title: "Alamat Detail",
    description: "Informasi lokasi lengkap"
  },
  {
    id: 3,
    title: "Tunjangan Kerja",
    description: "Komponen gaji & tunjangan"
  },
  {
    id: 4,
    title: "Preview",
    description: "Review data sebelum simpan"
  }
]

export default function EditPegawaiPage() {
  const router = useRouter()
  const params = useParams()
  const [loading, setLoading] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)
  const [jabatanList, setJabatanList] = useState<JabatanResponse[]>([])
  const [lokasiList, setLokasiList] = useState<LokasiResponse[]>([])
  const [roleList, setRoleList] = useState<any[]>([])
  const [previewImage, setPreviewImage] = useState<string | null>(null)

  // Wilayah data
  const [provinsiList, setProvinsiList] = useState<ProvinsiResponse[]>([])
  const [kotaList, setKotaList] = useState<KotaResponse[]>([])
  const [kecamatanList, setKecamatanList] = useState<KecamatanResponse[]>([])
  const [kelurahanList, setKelurahanList] = useState<KelurahanResponse[]>([])
  
  // Search dropdown states
  const [provinsiOpen, setProvinsiOpen] = useState(false)
  const [kotaOpen, setKotaOpen] = useState(false)
  const [kecamatanOpen, setKecamatanOpen] = useState(false)
  const [kelurahanOpen, setKelurahanOpen] = useState(false)
  
  // Loading states
  const [loadingProvinsi, setLoadingProvinsi] = useState(true)
  const [loadingKota, setLoadingKota] = useState(false)
  
  // Map selector state
  const [showMapSelector, setShowMapSelector] = useState(false)
  
  // Map states
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<any>(null)
  const markerRef = useRef<any>(null)
  const [mapLoaded, setMapLoaded] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedAddress, setSelectedAddress] = useState('')
  
  // Form state matching backend Pegawai entity
  const [formData, setFormData] = useState({
    // Step 1: Personal & Account Info
    name: '',
    nip: '',
    email: '',
    telepon: '',
    gender: '',
    tgl_lahir: '',
    status_nikah: '',
    tgl_join: '',
    rekening: '',
    username: '',
    password: '',
    lokasi_id: '',
    jabatan_id: '',
    is_admin: '',
    foto_karyawan: null as File | null,

    // Step 2: Address Details
    alamat: '',
    provinsi: '',
    kota: '',
    kecamatan: '',
    kelurahan: '',
    kodePos: '',
    latitude: '',
    longitude: '',
    
    // Step 3: Salary & Benefits (sesuai backend)
    gaji_pokok: '',
    makan_transport: '',
    lembur: '',
    kehadiran: '',
    thr: '',
    bonus: '',

    // Pengurangan
    izin: '',
    terlambat: '',
    mangkir: '',
    saldo_kasbon: '',

    // Izin data
    izin_cuti: 0,
    izin_lainnya: 0,
    izin_telat: 0,
    izin_pulang_cepat: 0,
    id: ''
  })
  
  const { toast } = useToast()

  useEffect(() => {
    setMounted(true)
  }, [])
  
  useEffect(() => {
    if (mounted) {
      // Load data in specific order to ensure dependencies are loaded first
      const loadAllData = async () => {
        // Load static data first (roles, jabatan, lokasi)
        await Promise.all([
          loadJabatanData(),
          loadLokasiData(),
          loadRoleData(),
          loadProvinsiData()
        ])
        
        // Then load pegawai data after static data is loaded
        await loadPegawaiData()
      }
      
      loadAllData()
    }
  }, [mounted])

  // Debug useEffect untuk roleList
  useEffect(() => {
    if (roleList.length > 0 && formData.is_admin && formData.id) {
      const matchingRole = roleList.find(role => role.roleName === formData.is_admin)
      if (matchingRole) {
        setFormData(prevData => ({
          ...prevData,
          is_admin: matchingRole.roleName
        }))
      }
    }
  }, [roleList, formData.is_admin, formData.id])

  const loadPegawaiData = async () => {
    if (!params.id) {
      showErrorToast('ID Pegawai tidak valid')
      return
    }
    
    try {
      console.log('Loading pegawai data for ID:', params.id)
      const response = await fetch(getApiUrl(`api/pegawai/${params.id}`), {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('auth_token')}` }
      })
      if (response.ok) {
        const data = await response.json()
        
        const newFormData = {
          name: data.namaLengkap || '',
          nip: data.nip || '',
          email: data.email || '',
          telepon: data.noTelp || '',
          gender: data.jenisKelamin === 'L' ? 'Laki-Laki' : 'Perempuan',
          tgl_lahir: data.tanggalLahir || '',
          status_nikah: data.statusNikah || '',
          tgl_join: data.tanggalMasuk || '',
          rekening: data.rekening || '',
          username: data.username || '',
          password: '',
          lokasi_id: data.lokasi?.id?.toString() || '',
          jabatan_id: data.jabatan?.id?.toString() || '',
          is_admin: data.role || '',
          foto_karyawan: null,
          alamat: data.alamat || '',
          provinsi: data.provinsi || '',
          kota: data.kota || '',
          kecamatan: data.kecamatan || '',
          kelurahan: data.kelurahan || '',
          kodePos: data.kodePos || '',
          latitude: data.latitude?.toString() || '',
          longitude: data.longitude?.toString() || '',
          gaji_pokok: data.gajiPokok?.toString() || '',
          makan_transport: data.makanTransport?.toString() || '',
          lembur: data.lembur?.toString() || '',
          kehadiran: data.kehadiran?.toString() || '',
          thr: data.thr?.toString() || '',
          bonus: data.bonus?.toString() || '',
          izin: data.izin?.toString() || '',
          terlambat: data.terlambat?.toString() || '',
          mangkir: data.mangkir?.toString() || '',
          saldo_kasbon: data.saldoKasbon?.toString() || '',
          izin_cuti: data.izinCuti || 0,
          izin_lainnya: data.izinLainnya || 0,
          izin_telat: data.izinTelat || 0,
          izin_pulang_cepat: data.izinPulangCepat || 0,
          id: data.id?.toString() || ''
        }
        
        setFormData(newFormData)
        if (data.fotoKaryawan) {
          setPreviewImage(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/upload/photos/${data.fotoKaryawan}` as string)
        }
        // Load wilayah data berdasarkan data pegawai
        if (data.provinsi) {
          await loadKotaData(data.provinsi)
        }
        if (data.kota) {
          await loadKecamatanData(data.kota)
        }
        if (data.kecamatan) {
          await loadKelurahanData(data.kecamatan)
        }
      } else {
        console.error('Failed to load pegawai data:', response.status)
        showErrorToast('Gagal memuat data pegawai')
      }
    } catch (error) {
      console.error('Error loading pegawai data:', error)
      showErrorToast('Gagal memuat data pegawai')
    }
  }

  const loadJabatanData = async () => {
    try {
      console.log('Loading jabatan data...')
      const response = await fetch(
        getApiUrl('api/admin/master-data/jabatan?page=0&size=100'),
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
          }
        }
      )
      
      if (response.ok) {
        const data = await response.json()
        console.log('Jabatan data loaded:', data)
        setJabatanList(data.content || [])
      } else {
        console.error('Failed to load jabatan data:', response.status)
      }
    } catch (error) {
      console.error('Error loading jabatan data:', error)
    }
  }

  const loadLokasiData = async () => {
    try {
      const response = await fetch(
        getApiUrl('api/admin/master-data/lokasi?page=0&size=100'),
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
          }
        }
      )
      
      if (response.ok) {
        const data = await response.json()
        setLokasiList(data.content || [])
      }
    } catch (error) {
      console.error('Error loading lokasi data:', error)
    }
  }

  const loadRoleData = async () => {
    try {
      console.log('Loading role data...')
      const response = await fetch(getApiUrl('api/roles/all'), {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        console.log('Role data loaded:', data)
        setRoleList(data || [])
      } else {
        console.error('Failed to load role data:', response.status)
      }
    } catch (error) {
      console.error('Error loading role data:', error)
    }
  }

  // Wilayah API functions
  const loadProvinsiData = async () => {
    try {
      setLoadingProvinsi(true)
      const response = await fetch(getApiUrl('api/wilayah/provinsi'))
      if (response.ok) {
        const data = await response.json()
        console.log('Provinsi data loaded:', data?.length, 'items')
        setProvinsiList(data || [])
      } else {
        console.error('Failed to load provinsi data:', response.status)
      }
    } catch (error) {
      console.error('Error loading provinsi data:', error)
    } finally {
      setLoadingProvinsi(false)
    }
  }

  const loadKotaData = async (provinsiKode: string) => {
    try {
      setLoadingKota(true)
      console.log('Loading kota for provinsi:', provinsiKode)
      const response = await fetch(
        getApiUrl(`api/wilayah/kota?provinsiKode=${provinsiKode}`)
      )
      if (response.ok) {
        const data = await response.json()
        console.log('Kota data loaded:', data?.length, 'items')
        setKotaList(data || [])
        setKecamatanList([])
        setKelurahanList([])
      } else {
        console.error('Failed to load kota data:', response.status)
      }
    } catch (error) {
      console.error('Error loading kota data:', error)
    } finally {
      setLoadingKota(false)
    }
  }

  const loadKecamatanData = async (kotaKode: string) => {
    try {
      const response = await fetch(
        getApiUrl(`api/wilayah/kecamatan?kotaKode=${kotaKode}`)
      )
      if (response.ok) {
        const data = await response.json()
        setKecamatanList(data || [])
        setKelurahanList([])
      }
    } catch (error) {
      console.error('Error loading kecamatan data:', error)
    }
  }

  const loadKelurahanData = async (kecamatanKode: string) => {
    try {
      const response = await fetch(
        getApiUrl(`api/wilayah/kelurahan?kecamatanKode=${kecamatanKode}`)
      )
      if (response.ok) {
        const data = await response.json()
        setKelurahanList(data || [])
      }
    } catch (error) {
      console.error('Error loading kelurahan data:', error)
    }
  }

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))

    // Auto-fill username from NIP
    if (field === 'nip' && value) {
      setFormData(prev => ({
        ...prev,
        nip: value,
        username: value // Auto-fill username with NIP value
      }))
    }

    // Handle wilayah dependencies
    if (field === 'provinsi' && value) {
      setFormData(prev => ({
        ...prev,
        kota: '',
        kecamatan: '',
        kelurahan: '',
        kodePos: ''
      }))
      loadKotaData(value)
    } else if (field === 'kota' && value) {
      setFormData(prev => ({
        ...prev,
        kecamatan: '',
        kelurahan: '',
        kodePos: ''
      }))
      loadKecamatanData(value)
    } else if (field === 'kecamatan' && value) {
      setFormData(prev => ({
        ...prev,
        kelurahan: '',
        kodePos: ''
      }))
      loadKelurahanData(value)
    } else if (field === 'kelurahan' && value) {
      // Auto-populate postal code from selected kelurahan
      const selectedKelurahan = kelurahanList.find(k => k.kode === value)
      if (selectedKelurahan && selectedKelurahan.kodePos) {
        setFormData(prev => ({
          ...prev,
          kodePos: selectedKelurahan.kodePos || ''
        }))
      }
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif']
      if (!allowedTypes.includes(file.type)) {
        showErrorToast('Format file tidak didukung. Silakan pilih file JPG, PNG, atau GIF.')
        e.target.value = ''
        return
      }
      
      // Validate file size (2MB)
      const maxSize = 2 * 1024 * 1024
      if (file.size > maxSize) {
        showErrorToast('Ukuran file terlalu besar. Maksimal 2MB.')
        e.target.value = ''
        return
      }

      setFormData(prev => ({ ...prev, foto_karyawan: file }))
      
      // Create preview
      const reader = new FileReader()
      reader.onload = (e) => {
        setPreviewImage(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const removePreview = () => {
    setFormData(prev => ({ ...prev, foto_karyawan: null }))
    setPreviewImage(null)
    const fileInput = document.getElementById('foto_karyawan') as HTMLInputElement
    if (fileInput) {
      fileInput.value = ''
    }
  }

  const handleLocationSelect = (lat: number, lng: number) => {
    setFormData(prev => ({
      ...prev,
      latitude: lat.toString(),
      longitude: lng.toString()
    }))
  }

  // Initialize map on component mount
  useEffect(() => {
    if (currentStep === 1 && mapRef.current && !mapInstanceRef.current) {
      loadLeafletAndInitMap()
    }
    // Cleanup map when leaving step 1
    return () => {
      if (currentStep !== 1 && mapInstanceRef.current) {
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
        markerRef.current = null
        setMapLoaded(false)
      }
    }
  }, [currentStep])

  // Cleanup on component unmount
  useEffect(() => {
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
        markerRef.current = null
      }
    }
  }, [])

  // Re-initialize map when returning to step 1
  useEffect(() => {
    if (currentStep === 1 && mapRef.current && !mapInstanceRef.current) {
      // Small delay to ensure DOM is ready
      const timer = setTimeout(() => {
        loadLeafletAndInitMap()
      }, 100)
      
      return () => clearTimeout(timer)
    }
  }, [currentStep])

  const loadLeafletAndInitMap = async () => {
    try {
      // Dynamically import Leaflet
      const L = (await import('leaflet')).default
      
      // Load Leaflet CSS
      if (!document.querySelector('link[href*="leaflet"]')) {
        const link = document.createElement('link')
        link.rel = 'stylesheet'
        link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
        document.head.appendChild(link)
      }

      // Indonesia center coordinates
      const indonesiaLat = -2.5
      const indonesiaLng = 118.0

      // Initialize map centered on Indonesia
      const map = L.map(mapRef.current!).setView([indonesiaLat, indonesiaLng], 5)
      
      // Add tile layer
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: ''
      }).addTo(map)

      // Custom marker icon
      const customIcon = L.divIcon({
        html: `<div style="background: #ef4444; width: 24px; height: 24px; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.2); display: flex; align-items: center; justify-content: center;">
                 <svg width="12" height="12" viewBox="0 0 24 24" fill="white" stroke="white" stroke-width="2">
                   <circle cx="12" cy="12" r="3"/>
                 </svg>
               </div>`,
        className: 'custom-marker',
        iconSize: [24, 24],
        iconAnchor: [12, 12]
      })

      // Add initial marker if coordinates exist
      if (formData.latitude && formData.longitude) {
        const lat = parseFloat(formData.latitude)
        const lng = parseFloat(formData.longitude)
        markerRef.current = L.marker([lat, lng], { icon: customIcon }).addTo(map)
        map.setView([lat, lng], 13)
      }

      // Handle map clicks
      map.on('click', (e: any) => {
        const { lat, lng } = e.latlng
        
        // Remove existing marker
        if (markerRef.current) {
          map.removeLayer(markerRef.current)
        }
        
        // Add new marker
        markerRef.current = L.marker([lat, lng], { icon: customIcon }).addTo(map)
        
        // Update form data
        setFormData(prev => ({
          ...prev,
          latitude: lat.toFixed(6),
          longitude: lng.toFixed(6)
        }))

        // Reverse geocoding
        reverseGeocode(lat, lng)
      })

      mapInstanceRef.current = map
      setMapLoaded(true)

    } catch (error) {
      console.error('Error loading map:', error)
      setMapLoaded(true) // Still set to true to show fallback
    }
  }

  const reverseGeocode = async (lat: number, lng: number) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1&countrycodes=id`
      )
      
      if (response.ok) {
        const data = await response.json()
        const address = data.display_name || `${lat.toFixed(6)}, ${lng.toFixed(6)}`
        setSelectedAddress(address)
      }
    } catch (error) {
      console.error('Reverse geocoding failed:', error)
      setSelectedAddress(`${lat.toFixed(6)}, ${lng.toFixed(6)}`)
    }
  }

  const searchLocation = async () => {
    if (!searchQuery.trim()) return
    
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=1&countrycodes=id`
      )
      
      if (response.ok) {
        const data = await response.json()
        if (data.length > 0) {
          const lat = parseFloat(data[0].lat)
          const lng = parseFloat(data[0].lon)
          
          setFormData(prev => ({
            ...prev,
            latitude: lat.toFixed(6),
            longitude: lng.toFixed(6)
          }))
          
          setSelectedAddress(data[0].display_name)
          
          // Update map view and marker if map is loaded
          if (mapInstanceRef.current) {
            mapInstanceRef.current.setView([lat, lng], 15)
            
            // Remove existing marker
            if (markerRef.current) {
              mapInstanceRef.current.removeLayer(markerRef.current)
            }
            
            // Add new marker
            const L = await import('leaflet')
            const customIcon = L.default.divIcon({
              html: `<div style="background: #ef4444; width: 24px; height: 24px; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.2); display: flex; align-items: center; justify-content: center;">
                       <svg width="12" height="12" viewBox="0 0 24 24" fill="white" stroke="white" stroke-width="2">
                         <circle cx="12" cy="12" r="3"/>
                       </svg>
                     </div>`,
              className: 'custom-marker',
              iconSize: [24, 24],
              iconAnchor: [12, 12]
            })
            
            markerRef.current = L.default.marker([lat, lng], { icon: customIcon }).addTo(mapInstanceRef.current)
          }
        }
      }
    } catch (error) {
      console.error('Search failed:', error)
    }
  }

  const getCurrentLocation = () => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude
          const lng = position.coords.longitude
          
          setFormData(prev => ({
            ...prev,
            latitude: lat.toFixed(6),
            longitude: lng.toFixed(6)
          }))
          
          setSelectedAddress('Lokasi saat ini')
          
          // Update map if available
          if (mapInstanceRef.current) {
            mapInstanceRef.current.setView([lat, lng], 15)
            
            // Remove existing marker
            if (markerRef.current) {
              mapInstanceRef.current.removeLayer(markerRef.current)
            }
            
            // Add new marker
            import('leaflet').then((L) => {
              const customIcon = L.default.divIcon({
                html: `<div style="background: #ef4444; width: 24px; height: 24px; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.2); display: flex; align-items: center; justify-content: center;">
                         <svg width="12" height="12" viewBox="0 0 24 24" fill="white" stroke="white" stroke-width="2">
                           <circle cx="12" cy="12" r="3"/>
                         </svg>
                       </div>`,
                className: 'custom-marker',
                iconSize: [24, 24],
                iconAnchor: [12, 12]
              })
              
              markerRef.current = L.default.marker([lat, lng], { icon: customIcon }).addTo(mapInstanceRef.current)
            })
          }
        },
        (error) => {
          console.error('Geolocation error:', error)
        }
      )
    }
  }

  const validateStep = async (step: number): Promise<boolean> => {
    
    switch (step) {
      case 0: // Personal & Account Info
        
        if (!formData.name?.trim()) {
          showErrorToast('Nama lengkap harus diisi')
          return false
        }
        if (!formData.nip?.trim()) {
          showErrorToast('NIP harus diisi')
          return false
        }
        if (!formData.email?.trim()) {
          showErrorToast('Email harus diisi')
          return false
        }
        if (!formData.telepon?.trim()) {
          showErrorToast('Nomor telepon harus diisi')
          return false
        }
        if (!formData.username?.trim()) {
          showErrorToast('Username harus diisi')
          return false
        }
        // Password tidak wajib untuk edit
        if (!formData.gender) {
          showErrorToast('Jenis kelamin harus dipilih')
          return false
        }
        if (!formData.jabatan_id) {
          showErrorToast('Jabatan harus dipilih')
          return false
        }
        if (!formData.lokasi_id) {
          showErrorToast('Lokasi kantor harus dipilih')
          return false
        }
        if (!formData.is_admin) {
          showErrorToast('Level user harus dipilih')
          return false
        }
        
        // Check for duplicates (excluding current user) only if fields are changed
        try {
          // Get original data to compare
          const originalDataResponse = await fetch(getApiUrl(`api/pegawai/${formData.id}`), {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('auth_token')}` }
          })
          
          if (originalDataResponse.ok) {
            const originalData = await originalDataResponse.json()
            
            // Only check fields that have actually changed
            const duplicateCheckData: any = {}
            let hasChanges = false
            
            if (formData.username !== originalData.username) {
              duplicateCheckData.username = formData.username
              hasChanges = true
            }
            if (formData.email !== originalData.email) {
              duplicateCheckData.email = formData.email
              hasChanges = true
            }
            if (formData.telepon !== originalData.noTelp) {
              duplicateCheckData.phoneNumber = formData.telepon
              hasChanges = true
            }
            if (formData.nip !== originalData.nip) {
              duplicateCheckData.nip = formData.nip
              hasChanges = true
            }
            
            // Only perform duplicate check if there are actual changes
            if (hasChanges) {
              duplicateCheckData.excludeId = parseInt(formData.id)
              
              const duplicateResponse = await fetch(getApiUrl('api/pegawai/check-duplicate'), {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
                },
                body: JSON.stringify(duplicateCheckData)
              })
              
              if (duplicateResponse.ok) {
                const duplicateData = await duplicateResponse.json()
                console.log('Duplicate check result:', duplicateData)
                
                if (duplicateData.usernameExists) {
                  showErrorToast('Username sudah digunakan oleh pegawai lain')
                  return false
                }
                if (duplicateData.emailExists) {
                  showErrorToast('Email sudah digunakan oleh pegawai lain')
                  return false
                }
                if (duplicateData.phoneExists) {
                  showErrorToast('Nomor telepon sudah digunakan oleh pegawai lain')
                  return false
                }
                if (duplicateData.nipExists) {
                  showErrorToast('NIP sudah digunakan oleh pegawai lain')
                  return false
                }
              }
            }
          }
        } catch (error) {
          console.error('Error checking duplicates:', error)
          showErrorToast('Gagal memvalidasi data. Silakan coba lagi.')
          return false
        }
        
        return true
      
      case 1: // Address Details
        if (!formData.alamat.trim()) {
          showErrorToast('Alamat lengkap harus diisi')
          return false
        }
        if (!formData.provinsi) {
          showErrorToast('Provinsi harus dipilih')
          return false
        }
        if (!formData.kota) {
          showErrorToast('Kota/Kabupaten harus dipilih')
          return false
        }
        return true
      
      case 2: // Salary & Benefits
        // Optional validation for salary components
        return true
      
      default:
        return true
    }
  }

  const handlePrevious = () => {
    // Clean up map if moving away from step 1
    if (currentStep === 1 && mapInstanceRef.current) {
      mapInstanceRef.current.remove()
      mapInstanceRef.current = null
      markerRef.current = null
      setMapLoaded(false)
    }
    setCurrentStep(prev => Math.max(prev - 1, 0))
  }

  const handleNext = async () => {
    console.log('handleNext called, current step:', currentStep)
    console.log('formData values:', {
      name: formData.name,
      nip: formData.nip,
      email: formData.email,
      telepon: formData.telepon,
      username: formData.username,
      gender: formData.gender,
      jabatan_id: formData.jabatan_id,
      lokasi_id: formData.lokasi_id,
      is_admin: formData.is_admin
    })
    
    const isValid = await validateStep(currentStep)
    console.log('validation result:', isValid)
    
    if (isValid) {
      console.log('moving to next step')
      // Clean up map if moving away from step 1
      if (currentStep === 1 && mapInstanceRef.current) {
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
        markerRef.current = null
        setMapLoaded(false)
      }
      setCurrentStep(prev => Math.min(prev + 1, steps.length - 1))
    } else {
      console.log('validation failed, staying on current step')
    }
  }

  const handleSubmit = async () => {
    // Only allow submit on final step (step 3 - Preview)
    if (currentStep !== 3) {
      showErrorToast('Silakan selesaikan semua langkah terlebih dahulu')
      return
    }
    
    // Validate all steps
    for (let i = 0; i < steps.length - 1; i++) {
      const isValid = await validateStep(i)
      if (!isValid) {
        setCurrentStep(i)
        return
      }
    }

    try {
      setLoading(true)
      
      // Map frontend field names to backend field names (UpdatePegawaiRequest)
      const selectedJabatan = jabatanList.find(j => j.id.toString() === formData.jabatan_id)
      if (!selectedJabatan) {
        showErrorToast('Jabatan tidak valid')
        return
      }
      
      const mappedData = {
        username: formData.username,
        password: formData.password || undefined, // Optional untuk edit
        namaLengkap: formData.name,
        email: formData.email,
        noTelp: formData.telepon,
        nip: formData.nip,
        role: formData.is_admin,
        jabatan: selectedJabatan.nama, // Send jabatan name, not ID
        isActive: true,
        alamat: formData.alamat,
        provinsi: formData.provinsi,
        kota: formData.kota,
        kecamatan: formData.kecamatan,
        kelurahan: formData.kelurahan,
        kodePos: formData.kodePos,
        latitude: formData.latitude ? parseFloat(formData.latitude) : null,
        longitude: formData.longitude ? parseFloat(formData.longitude) : null,
        photoUrl: formData.foto_karyawan ? undefined : undefined // Will be handled separately if file is provided
      }
      
      // Check if we have file upload or not
      const hasFile = formData.foto_karyawan !== null
      
      let requestBody: any
      let headers: any = {
        'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
      }
      
      if (hasFile) {
        // Use FormData with multipart/form-data for file upload
        const submitData = new FormData()
        
        submitData.append('data', JSON.stringify(mappedData))
        submitData.append('foto_karyawan', formData.foto_karyawan as File)
        
        requestBody = submitData
        // Don't set Content-Type for FormData, let browser set it
      } else {
        // Use JSON if no file
        requestBody = JSON.stringify(mappedData)
        headers['Content-Type'] = 'application/json'
      }

      console.log('Sending update request:', hasFile ? 'with file' : 'JSON only', mappedData)

      const response = await fetch(getApiUrl(`api/pegawai/${formData.id}`), {
        method: 'PUT',
        headers: headers,
        body: requestBody
      })
      
      if (response.ok) {
        showSuccessToast('Pegawai berhasil diperbarui')
        router.push('/admin/master-data/pegawai')
      } else {
        const errorData = await response.json()
        showErrorToast(errorData.message || 'Gagal memperbarui pegawai')
      }
    } catch (error) {
      console.error('Error updating pegawai:', error)
      showErrorToast('Gagal memperbarui pegawai')
    } finally {
      setLoading(false)
    }
  }

  const handleBack = () => {
    router.push('/admin/master-data/pegawai')
  }

  // Early return if no ID
  if (!params.id) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="text-red-500 text-xl mb-2">❌</div>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">ID Pegawai Tidak Valid</h2>
            <p className="text-gray-600 mb-4">ID pegawai tidak ditemukan dalam URL</p>
            <Button onClick={handleBack}>Kembali ke Daftar Pegawai</Button>
          </div>
        </div>
      </div>
    )
  }

  const formatCurrency = (value: string) => {
    const num = parseInt(value.replace(/\D/g, ''))
    return isNaN(num) ? '' : num.toLocaleString('id-ID')
  }

  const getStepIcon = (step: number) => {
    switch (step) {
      case 0: return User
      case 1: return MapPin
      case 2: return Calculator
      case 3: return Eye
      default: return User
    }
  }

  if (!mounted) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="flex flex-col items-center gap-2">
            <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" />
            <span className="text-muted-foreground">Memuat halaman...</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <AdminPageHeader
        title="Edit Pegawai"
        description="Edit data pegawai dengan langkah-langkah terstruktur"
        icon={getStepIcon(currentStep)}
        primaryAction={{
          label: "Kembali",
          onClick: handleBack,
          icon: ArrowLeft
        }}
      />

      <div className="container mx-auto p-6 max-w-4xl">
        {/* Stepper */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <Stepper steps={steps} currentStep={currentStep} />
          </CardContent>
        </Card>

        {/* Form Content - Sama seperti tambah tapi dengan data pre-filled */}
        <form onSubmit={(e) => e.preventDefault()} className="space-y-6">
          {/* Step 1: Personal & Account Information */}
          {currentStep === 0 && (
            <div className="space-y-6">
              {/* Photo Upload Section */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg font-semibold flex items-center gap-2">
                    <Camera className="h-5 w-5" />
                    Foto Pegawai
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col items-center space-y-4">
                    {previewImage ? (
                      <div className="relative">
                        <div className="w-48 h-48 rounded-full overflow-hidden border-4 border-white shadow-lg">
                          <img
                            src={previewImage}
                            alt="Preview Foto"
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          className="mt-3"
                          onClick={removePreview}
                        >
                          <X className="h-4 w-4 mr-1" />
                          Hapus Foto
                        </Button>
                      </div>
                    ) : (
                      <label className="w-48 h-48 rounded-full border-3 border-dashed border-gray-300 flex flex-col items-center justify-center cursor-pointer hover:border-primary transition-colors">
                        <Camera className="h-8 w-8 text-gray-400 mb-2" />
                        <span className="text-sm font-medium text-gray-600">Upload Foto</span>
                        <span className="text-xs text-gray-400">JPG, PNG, GIF (Max: 2MB)</span>
                        <input
                          type="file"
                          id="foto_karyawan"
                          accept="image/*"
                          onChange={handleFileChange}
                          className="hidden"
                        />
                      </label>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Personal Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg font-semibold">Informasi Personal</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Nama Lengkap *</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => handleInputChange('name', e.target.value)}
                        placeholder="Masukkan nama lengkap"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="nip">NIP (Nomor Induk Pegawai) *</Label>
                      <Input
                        id="nip"
                        value={formData.nip}
                        onChange={(e) => handleInputChange('nip', e.target.value)}
                        placeholder="Masukkan NIP"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="email">Email *</Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        placeholder="nama@email.com"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="telepon">Nomor Telepon</Label>
                      <Input
                        id="telepon"
                        value={formData.telepon}
                        onChange={(e) => handleInputChange('telepon', e.target.value)}
                        placeholder="08xxxxxxxxxx"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="gender">Jenis Kelamin</Label>
                      <Select value={formData.gender} onValueChange={(value) => handleInputChange('gender', value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Pilih Jenis Kelamin" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Laki-Laki">Laki-Laki</SelectItem>
                          <SelectItem value="Perempuan">Perempuan</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="tgl_lahir">Tanggal Lahir</Label>
                      <Input
                        id="tgl_lahir"
                        type="date"
                        value={formData.tgl_lahir}
                        onChange={(e) => handleInputChange('tgl_lahir', e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="status_nikah">Status Pernikahan</Label>
                      <Select value={formData.status_nikah} onValueChange={(value) => handleInputChange('status_nikah', value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Pilih Status Pernikahan" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Menikah">Menikah</SelectItem>
                          <SelectItem value="Lajang">Lajang</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="tgl_join">Tanggal Masuk Perusahaan</Label>
                      <Input
                        id="tgl_join"
                        type="date"
                        value={formData.tgl_join}
                        onChange={(e) => handleInputChange('tgl_join', e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="rekening">Nomor Rekening</Label>
                      <Input
                        id="rekening"
                        value={formData.rekening}
                        onChange={(e) => handleInputChange('rekening', e.target.value)}
                        placeholder="Masukkan nomor rekening"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Account Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg font-semibold">Informasi Akun & Jabatan</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="username">Username</Label>
                      <Input
                        id="username"
                        value={formData.username}
                        onChange={(e) => handleInputChange('username', e.target.value)}
                        placeholder="Masukkan username"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="password">Password (Kosongkan jika tidak ingin mengubah)</Label>
                      <Input
                        id="password"
                        type="password"
                        value={formData.password}
                        onChange={(e) => handleInputChange('password', e.target.value)}
                        placeholder="Masukkan password baru"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="lokasi_id">Lokasi Kantor *</Label>
                      <Select value={formData.lokasi_id} onValueChange={(value) => handleInputChange('lokasi_id', value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Pilih Lokasi Kantor" />
                        </SelectTrigger>
                        <SelectContent>
                          {lokasiList.map((lokasi) => (
                            <SelectItem key={lokasi.id} value={lokasi.id.toString()}>
                              {lokasi.namaLokasi}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="jabatan_id">Jabatan *</Label>
                      <Select value={formData.jabatan_id} onValueChange={(value) => handleInputChange('jabatan_id', value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Pilih Jabatan" />
                        </SelectTrigger>
                        <SelectContent>
                          {jabatanList.map((jabatan) => (
                            <SelectItem key={jabatan.id} value={jabatan.id.toString()}>
                              {jabatan.nama}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="is_admin">Level User *</Label>
                      <Select 
                        key={`level-user-${formData.is_admin}-${roleList.length}`}
                        value={formData.is_admin || ''} 
                        onValueChange={(value) => handleInputChange('is_admin', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Pilih Level User" />
                        </SelectTrigger>
                        <SelectContent>
                          {roleList.map((role) => (
                            <SelectItem key={role.roleId} value={role.roleName}>
                              {role.roleName}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Step 2: Address Details */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg font-semibold flex items-center gap-2">
                    <MapPin className="h-5 w-5" />
                    Informasi Alamat
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="alamat">Alamat Lengkap *</Label>
                    <Textarea
                      id="alamat"
                      value={formData.alamat}
                      onChange={(e) => handleInputChange('alamat', e.target.value)}
                      placeholder="Masukkan alamat lengkap"
                      rows={3}
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Provinsi *</Label>
                      <Popover open={provinsiOpen} onOpenChange={setProvinsiOpen}>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            role="combobox"
                            aria-expanded={provinsiOpen}
                            className="w-full justify-between"
                            disabled={loadingProvinsi}
                          >
                            {formData.provinsi ? 
                              provinsiList.find((provinsi) => provinsi.kode === formData.provinsi)?.nama || formData.provinsi
                              : "Pilih Provinsi..."
                            }
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-full p-0">
                          <Command>
                            <CommandInput placeholder="Cari provinsi..." />
                            <CommandEmpty>Provinsi tidak ditemukan.</CommandEmpty>
                            <CommandGroup className="max-h-64 overflow-y-auto">
                              {provinsiList.map((provinsi) => (
                                <CommandItem
                                  key={provinsi.kode}
                                  value={provinsi.nama.toLowerCase()}
                                  onSelect={() => {
                                    handleInputChange('provinsi', provinsi.kode)
                                    setProvinsiOpen(false)
                                  }}
                                >
                                  <Check
                                    className={cn(
                                      "mr-2 h-4 w-4",
                                      formData.provinsi === provinsi.kode ? "opacity-100" : "opacity-0"
                                    )}
                                  />
                                  {provinsi.nama}
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </Command>
                        </PopoverContent>
                      </Popover>
                    </div>

                    <div className="space-y-2">
                      <Label>Kota/Kabupaten *</Label>
                      <Popover open={kotaOpen} onOpenChange={setKotaOpen}>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            role="combobox"
                            aria-expanded={kotaOpen}
                            className="w-full justify-between"
                            disabled={!formData.provinsi || loadingKota}
                          >
                            {formData.kota ? 
                              kotaList.find((kota) => kota.kode === formData.kota)?.nama || formData.kota
                              : "Pilih Kota/Kabupaten..."
                            }
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-full p-0">
                          <Command>
                            <CommandInput placeholder="Cari kota/kabupaten..." />
                            <CommandEmpty>Kota/Kabupaten tidak ditemukan.</CommandEmpty>
                            <CommandGroup className="max-h-64 overflow-y-auto">
                              {kotaList.map((kota) => (
                                <CommandItem
                                  key={kota.kode}
                                  value={kota.nama.toLowerCase()}
                                  onSelect={() => {
                                    handleInputChange('kota', kota.kode)
                                    setKotaOpen(false)
                                  }}
                                >
                                  <Check
                                    className={cn(
                                      "mr-2 h-4 w-4",
                                      formData.kota === kota.kode ? "opacity-100" : "opacity-0"
                                    )}
                                  />
                                  {kota.nama}
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </Command>
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Kecamatan</Label>
                      <Popover open={kecamatanOpen} onOpenChange={setKecamatanOpen}>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            role="combobox"
                            aria-expanded={kecamatanOpen}
                            className="w-full justify-between"
                            disabled={!formData.kota}
                          >
                            {formData.kecamatan ? 
                              kecamatanList.find((kecamatan) => kecamatan.kode === formData.kecamatan)?.nama || formData.kecamatan
                              : "Pilih Kecamatan..."
                            }
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-full p-0">
                          <Command>
                            <CommandInput placeholder="Cari kecamatan..." />
                            <CommandEmpty>Kecamatan tidak ditemukan.</CommandEmpty>
                            <CommandGroup className="max-h-64 overflow-y-auto">
                              {kecamatanList.map((kecamatan) => (
                                <CommandItem
                                  key={kecamatan.kode}
                                  value={kecamatan.nama.toLowerCase()}
                                  onSelect={() => {
                                    handleInputChange('kecamatan', kecamatan.kode)
                                    setKecamatanOpen(false)
                                  }}
                                >
                                  <Check
                                    className={cn(
                                      "mr-2 h-4 w-4",
                                      formData.kecamatan === kecamatan.kode ? "opacity-100" : "opacity-0"
                                    )}
                                  />
                                  {kecamatan.nama}
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </Command>
                        </PopoverContent>
                      </Popover>
                    </div>

                    <div className="space-y-2">
                      <Label>Kelurahan/Desa</Label>
                      <Popover open={kelurahanOpen} onOpenChange={setKelurahanOpen}>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            role="combobox"
                            aria-expanded={kelurahanOpen}
                            className="w-full justify-between"
                            disabled={!formData.kecamatan}
                          >
                            {formData.kelurahan ? 
                              kelurahanList.find((kelurahan) => kelurahan.kode === formData.kelurahan)?.nama || formData.kelurahan
                              : "Pilih Kelurahan/Desa..."
                            }
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-full p-0">
                          <Command>
                            <CommandInput placeholder="Cari kelurahan/desa..." />
                            <CommandEmpty>Kelurahan/Desa tidak ditemukan.</CommandEmpty>
                            <CommandGroup className="max-h-64 overflow-y-auto">
                              {kelurahanList.map((kelurahan) => (
                                <CommandItem
                                  key={kelurahan.kode}
                                  value={kelurahan.nama.toLowerCase()}
                                  onSelect={() => {
                                    handleInputChange('kelurahan', kelurahan.kode)
                                    setKelurahanOpen(false)
                                  }}
                                >
                                  <Check
                                    className={cn(
                                      "mr-2 h-4 w-4",
                                      formData.kelurahan === kelurahan.kode ? "opacity-100" : "opacity-0"
                                    )}
                                  />
                                  {kelurahan.nama}
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </Command>
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="kodePos">Kode Pos</Label>
                      <Input
                        id="kodePos"
                        value={formData.kodePos}
                        onChange={(e) => handleInputChange('kodePos', e.target.value)}
                        placeholder="Masukkan kode pos"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Location Picker */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg font-semibold flex items-center gap-2">
                    <MapPin className="h-5 w-5" />
                    Lokasi GPS (Opsional)
                  </CardTitle>
                  <CardDescription>
                    Pilih lokasi untuk menandai alamat pegawai pada peta
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Search and Current Location */}
                  <div className="flex flex-col sm:flex-row gap-2">
                    <div className="flex-1 flex gap-2">
                      <Input
                        placeholder="Cari lokasi..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && searchLocation()}
                      />
                      <Button type="button" variant="outline" onClick={searchLocation}>
                        <Search className="h-4 w-4" />
                      </Button>
                    </div>
                    <Button type="button" variant="outline" onClick={getCurrentLocation}>
                      Lokasi Saat Ini
                    </Button>
                  </div>

                  {/* Selected Address Display */}
                  {selectedAddress && (
                    <div className="p-3 bg-muted rounded-lg">
                      <p className="text-sm font-medium">Lokasi Terpilih:</p>
                      <p className="text-sm text-muted-foreground">{selectedAddress}</p>
                    </div>
                  )}

                  {/* Map Container */}
                  <div className="relative">
                    <div 
                      ref={mapRef}
                      className="w-full h-64 bg-muted rounded-lg"
                      style={{ minHeight: '300px' }}
                    />
                    {!mapLoaded && (
                      <div className="absolute inset-0 flex items-center justify-center bg-muted rounded-lg">
                        <div className="text-center">
                          <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-2" />
                          <p className="text-sm text-muted-foreground">Memuat peta...</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Coordinate Display */}
                  {(formData.latitude || formData.longitude) && (
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <Label className="text-sm font-medium">Latitude</Label>
                        <Input
                          value={formData.latitude}
                          onChange={(e) => handleInputChange('latitude', e.target.value)}
                          placeholder="0.000000"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-sm font-medium">Longitude</Label>
                        <Input
                          value={formData.longitude}
                          onChange={(e) => handleInputChange('longitude', e.target.value)}
                          placeholder="0.000000"
                        />
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {/* Step 3: Salary & Benefits */}
          {currentStep === 2 && (
            <div className="space-y-6">
              {/* Penambahan (Income) */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg font-semibold text-green-700">Komponen Penambah Gaji</CardTitle>
                  <CardDescription>Komponen-komponen yang menambah total gaji pegawai</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="gaji_pokok">Gaji Pokok</Label>
                      <Input
                        id="gaji_pokok"
                        value={formData.gaji_pokok}
                        onChange={(e) => handleInputChange('gaji_pokok', formatCurrency(e.target.value))}
                        placeholder="0"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="makan_transport">Makan & Transport</Label>
                      <Input
                        id="makan_transport"
                        value={formData.makan_transport}
                        onChange={(e) => handleInputChange('makan_transport', formatCurrency(e.target.value))}
                        placeholder="0"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="lembur">Lembur</Label>
                      <Input
                        id="lembur"
                        value={formData.lembur}
                        onChange={(e) => handleInputChange('lembur', formatCurrency(e.target.value))}
                        placeholder="0"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="kehadiran">Bonus Kehadiran</Label>
                      <Input
                        id="kehadiran"
                        value={formData.kehadiran}
                        onChange={(e) => handleInputChange('kehadiran', formatCurrency(e.target.value))}
                        placeholder="0"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="thr">THR</Label>
                      <Input
                        id="thr"
                        value={formData.thr}
                        onChange={(e) => handleInputChange('thr', formatCurrency(e.target.value))}
                        placeholder="0"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="bonus">Bonus</Label>
                      <Input
                        id="bonus"
                        value={formData.bonus}
                        onChange={(e) => handleInputChange('bonus', formatCurrency(e.target.value))}
                        placeholder="0"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Pengurangan (Deductions) */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg font-semibold text-red-700">Komponen Pengurangan Gaji</CardTitle>
                  <CardDescription>Komponen-komponen yang mengurangi total gaji pegawai</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="izin">Potongan Izin</Label>
                      <Input
                        id="izin"
                        value={formData.izin}
                        onChange={(e) => handleInputChange('izin', formatCurrency(e.target.value))}
                        placeholder="0"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="terlambat">Potongan Terlambat</Label>
                      <Input
                        id="terlambat"
                        value={formData.terlambat}
                        onChange={(e) => handleInputChange('terlambat', formatCurrency(e.target.value))}
                        placeholder="0"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="mangkir">Potongan Mangkir</Label>
                      <Input
                        id="mangkir"
                        value={formData.mangkir}
                        onChange={(e) => handleInputChange('mangkir', formatCurrency(e.target.value))}
                        placeholder="0"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="saldo_kasbon">Saldo Kasbon</Label>
                      <Input
                        id="saldo_kasbon"
                        value={formData.saldo_kasbon}
                        onChange={(e) => handleInputChange('saldo_kasbon', formatCurrency(e.target.value))}
                        placeholder="0"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Izin Settings */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg font-semibold text-blue-700">Pengaturan Izin</CardTitle>
                  <CardDescription>Batas maksimal izin yang dapat digunakan pegawai</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="izin_cuti">Izin Cuti (hari/bulan)</Label>
                      <Input
                        id="izin_cuti"
                        type="number"
                        min="0"
                        value={formData.izin_cuti}
                        onChange={(e) => handleInputChange('izin_cuti', parseInt(e.target.value) || 0)}
                        placeholder="0"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="izin_lainnya">Izin Lainnya (hari/bulan)</Label>
                      <Input
                        id="izin_lainnya"
                        type="number"
                        min="0"
                        value={formData.izin_lainnya}
                        onChange={(e) => handleInputChange('izin_lainnya', parseInt(e.target.value) || 0)}
                        placeholder="0"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="izin_telat">Izin Terlambat (menit/bulan)</Label>
                      <Input
                        id="izin_telat"
                        type="number"
                        min="0"
                        value={formData.izin_telat}
                        onChange={(e) => handleInputChange('izin_telat', parseInt(e.target.value) || 0)}
                        placeholder="0"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="izin_pulang_cepat">Izin Pulang Cepat (menit/bulan)</Label>
                      <Input
                        id="izin_pulang_cepat"
                        type="number"
                        min="0"
                        value={formData.izin_pulang_cepat}
                        onChange={(e) => handleInputChange('izin_pulang_cepat', parseInt(e.target.value) || 0)}
                        placeholder="0"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Step 4: Preview */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg font-semibold flex items-center gap-2">
                    <Eye className="h-5 w-5" />
                    Preview Data Pegawai
                  </CardTitle>
                  <CardDescription>
                    Periksa kembali semua data sebelum menyimpan perubahan
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Photo Preview */}
                  {previewImage && (
                    <div className="flex justify-center">
                      <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-white shadow-lg">
                        <img
                          src={previewImage}
                          alt="Foto Pegawai"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    </div>
                  )}

                  {/* Personal Information */}
                  <div className="space-y-4">
                    <h3 className="font-semibold text-lg">Informasi Personal</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm font-medium text-muted-foreground">Nama Lengkap</Label>
                        <p className="font-medium">{formData.name}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-muted-foreground">NIP</Label>
                        <p className="font-medium">{formData.nip}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-muted-foreground">Email</Label>
                        <p className="font-medium">{formData.email}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-muted-foreground">Telepon</Label>
                        <p className="font-medium">{formData.telepon}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-muted-foreground">Jenis Kelamin</Label>
                        <p className="font-medium">{formData.gender}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-muted-foreground">Status Pernikahan</Label>
                        <p className="font-medium">{formData.status_nikah}</p>
                      </div>
                    </div>
                  </div>

                  {/* Account Information */}
                  <div className="space-y-4">
                    <h3 className="font-semibold text-lg">Informasi Akun & Jabatan</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm font-medium text-muted-foreground">Username</Label>
                        <p className="font-medium">{formData.username}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-muted-foreground">Lokasi Kantor</Label>
                        <p className="font-medium">
                          {lokasiList.find(l => l.id.toString() === formData.lokasi_id)?.namaLokasi || '-'}
                        </p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-muted-foreground">Jabatan</Label>
                        <p className="font-medium">
                          {jabatanList.find(j => j.id.toString() === formData.jabatan_id)?.nama || '-'}
                        </p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-muted-foreground">Level User</Label>
                        <p className="font-medium">{formData.is_admin}</p>
                      </div>
                    </div>
                  </div>

                  {/* Address Information */}
                  <div className="space-y-4">
                    <h3 className="font-semibold text-lg">Informasi Alamat</h3>
                    <div className="space-y-2">
                      <div>
                        <Label className="text-sm font-medium text-muted-foreground">Alamat Lengkap</Label>
                        <p className="font-medium">{formData.alamat}</p>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                          <Label className="text-sm font-medium text-muted-foreground">Provinsi</Label>
                          <p className="font-medium">
                            {provinsiList.find(p => p.kode === formData.provinsi)?.nama || formData.provinsi || '-'}
                          </p>
                        </div>
                        <div>
                          <Label className="text-sm font-medium text-muted-foreground">Kota</Label>
                          <p className="font-medium">
                            {kotaList.find(k => k.kode === formData.kota)?.nama || formData.kota || '-'}
                          </p>
                        </div>
                        <div>
                          <Label className="text-sm font-medium text-muted-foreground">Kecamatan</Label>
                          <p className="font-medium">
                            {kecamatanList.find(kec => kec.kode === formData.kecamatan)?.nama || formData.kecamatan || '-'}
                          </p>
                        </div>
                        <div>
                          <Label className="text-sm font-medium text-muted-foreground">Kelurahan</Label>
                          <p className="font-medium">
                            {kelurahanList.find(kel => kel.kode === formData.kelurahan)?.nama || formData.kelurahan || '-'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Salary Information */}
                  <div className="space-y-4">
                    <h3 className="font-semibold text-lg">Informasi Gaji & Tunjangan</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h4 className="font-medium text-green-700 mb-2">Penambahan</h4>
                        <div className="space-y-1 text-sm">
                          <div className="flex justify-between">
                            <span>Gaji Pokok:</span>
                            <span>Rp {formData.gaji_pokok || '0'}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Makan & Transport:</span>
                            <span>Rp {formData.makan_transport || '0'}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Lembur:</span>
                            <span>Rp {formData.lembur || '0'}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Bonus Kehadiran:</span>
                            <span>Rp {formData.kehadiran || '0'}</span>
                          </div>
                        </div>
                      </div>
                      <div>
                        <h4 className="font-medium text-red-700 mb-2">Pengurangan</h4>
                        <div className="space-y-1 text-sm">
                          <div className="flex justify-between">
                            <span>Potongan Izin:</span>
                            <span>Rp {formData.izin || '0'}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Potongan Terlambat:</span>
                            <span>Rp {formData.terlambat || '0'}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Potongan Mangkir:</span>
                            <span>Rp {formData.mangkir || '0'}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Saldo Kasbon:</span>
                            <span>Rp {formData.saldo_kasbon || '0'}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between mt-8">
            <Button 
              type="button" 
              variant="outline" 
              onClick={handlePrevious} 
              disabled={currentStep === 0}
            >
              <ChevronLeft className="h-4 w-4 mr-2" />
              Sebelumnya
            </Button>
            {currentStep < steps.length - 1 ? (
              <Button type="button" onClick={handleNext}>
                Selanjutnya
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            ) : (
              <Button type="button" onClick={handleSubmit} disabled={loading}>
                <Save className="h-4 w-4 mr-2" />
                {loading ? 'Menyimpan...' : 'Simpan Perubahan'}
              </Button>
            )}
          </div>
        </form>
      </div>
    </div>
  )
}
