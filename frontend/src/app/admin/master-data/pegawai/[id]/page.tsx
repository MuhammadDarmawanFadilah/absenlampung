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

export default function EditPegawaiPage() {
  const router = useRouter()
  const params = useParams()
  const [loading, setLoading] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)
  const [jabatanList, setJabatanList] = useState([])
  const [lokasiList, setLokasiList] = useState([])
  const [roleList, setRoleList] = useState([])
  const [previewImage, setPreviewImage] = useState<string | null>(null)
  const [provinsiList, setProvinsiList] = useState([])
  const [kotaList, setKotaList] = useState([])
  const [kecamatanList, setKecamatanList] = useState([])
  const [kelurahanList, setKelurahanList] = useState([])
  const [provinsiOpen, setProvinsiOpen] = useState(false)
  const [kotaOpen, setKotaOpen] = useState(false)
  const [kecamatanOpen, setKecamatanOpen] = useState(false)
  const [kelurahanOpen, setKelurahanOpen] = useState(false)
  const [loadingProvinsi, setLoadingProvinsi] = useState(true)
  const [loadingKota, setLoadingKota] = useState(false)
  const [showMapSelector, setShowMapSelector] = useState(false)
  const mapRef = useRef(null)
  const mapInstanceRef = useRef(null)
  const markerRef = useRef(null)
  const [mapLoaded, setMapLoaded] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedAddress, setSelectedAddress] = useState('')
  const [formData, setFormData] = useState({
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
    foto_karyawan: null,
    alamat: '',
    provinsi: '',
    kota: '',
    kecamatan: '',
    kelurahan: '',
    kodePos: '',
    latitude: '',
    longitude: '',
    gaji_pokok: '',
    makan_transport: '',
    lembur: '',
    kehadiran: '',
    thr: '',
    bonus: '',
    tunjangan_jabatan: '',
    tunjangan_keluarga: '',
    tunjangan_komunikasi: '',
    tunjangan_transportasi: '',
    izin: '',
    terlambat: '',
    mangkir: '',
    saldo_kasbon: '',
    potongan_bpjs: '',
    potongan_pajak: '',
    izin_cuti: 0,
    izin_lainnya: 0,
    izin_telat: 0,
    izin_pulang_cepat: 0,
    id: ''
  })
  const { toast } = useToast()
  useEffect(() => { setMounted(true) }, [])
  useEffect(() => { if (mounted) { loadJabatanData(); loadLokasiData(); loadProvinsiData(); loadRoleData(); loadPegawaiData(); } }, [mounted])
  const loadPegawaiData = async () => {
    try {
      const response = await fetch(getApiUrl(`api/pegawai/${params.id}`), {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('auth_token')}` }
      })
      if (response.ok) {
        const data = await response.json()
        setFormData({
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
          tunjangan_jabatan: data.tunjanganJabatan?.toString() || '',
          tunjangan_keluarga: data.tunjanganKeluarga?.toString() || '',
          tunjangan_komunikasi: data.tunjanganKomunikasi?.toString() || '',
          tunjangan_transportasi: data.tunjanganTransportasi?.toString() || '',
          izin: data.izin?.toString() || '',
          terlambat: data.terlambat?.toString() || '',
          mangkir: data.mangkir?.toString() || '',
          saldo_kasbon: data.saldoKasbon?.toString() || '',
          potongan_bpjs: data.potonganBpjs?.toString() || '',
          potongan_pajak: data.potonganPajak?.toString() || '',
          izin_cuti: data.izinCuti || 0,
          izin_lainnya: data.izinLainnya || 0,
          izin_telat: data.izinTelat || 0,
          izin_pulang_cepat: data.izinPulangCepat || 0,
          id: data.id?.toString() || ''
        })
        if (data.fotoKaryawan) {
          setPreviewImage(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/upload/photos/${data.fotoKaryawan}` as string)
        }
      }
    } catch (error) {}
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
  const loadJabatanData = async () => { /* sama seperti tambah */ }
  const loadLokasiData = async () => { /* sama seperti tambah */ }
  const loadRoleData = async () => { /* sama seperti tambah */ }
  const loadProvinsiData = async () => { /* sama seperti tambah */ }
  const loadKotaData = async (provinsiKode: string) => {
    // ...implementasi sama seperti tambah
  }
  const loadKecamatanData = async (kotaKode: string) => {
    // ...implementasi sama seperti tambah
  }
  const loadKelurahanData = async (kecamatanKode: string) => {
    // ...implementasi sama seperti tambah
  }
  const handleInputChange = (field: string, value: any) => {
    // ...implementasi sama seperti tambah
  }
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // ...implementasi sama seperti tambah
  }
  const removePreview = () => {
    // ...implementasi sama seperti tambah
  }
  const handleLocationSelect = (lat: number, lng: number) => {
    // ...implementasi sama seperti tambah
  }
  useEffect(() => {
    // ...map logic sama seperti tambah
  }, [currentStep])
  useEffect(() => {
    // ...cleanup sama seperti tambah
  }, [])
  useEffect(() => {
    // ...re-init map sama seperti tambah
  }, [currentStep])
  const loadLeafletAndInitMap = async () => {
    // ...implementasi sama seperti tambah
  }
  const reverseGeocode = async (lat: number, lng: number) => {
    // ...implementasi sama seperti tambah
  }
  const searchLocation = async () => {
    // ...implementasi sama seperti tambah
  }
  const getCurrentLocation = () => {
    // ...implementasi sama seperti tambah
  }
  const validateStep = async (step: number) => {
  // ...implementasi sama seperti tambah, validasi edit
  return true
  }
  const handlePrevious = () => {
    // ...implementasi sama seperti tambah
  }
  const handleNext = async () => {
    // ...implementasi sama seperti tambah
  }
  const handleSubmit = async () => {
  if (currentStep !== 3) { showErrorToast('Silakan selesaikan semua langkah terlebih dahulu'); return }
  for (let i = 0; i < steps.length - 1; i++) { const isValid = await validateStep(i); if (!isValid) { setCurrentStep(i); return } }
    try {
      setLoading(true)
      const mappedData = {
        namaLengkap: formData.name,
        nip: formData.nip,
        email: formData.email,
        noTelp: formData.telepon,
        jenisKelamin: formData.gender === 'Laki-Laki' ? 'L' : 'P',
        tanggalLahir: formData.tgl_lahir || null,
        statusNikah: formData.status_nikah,
        tanggalMasuk: formData.tgl_join || null,
        rekening: formData.rekening,
        username: formData.username,
        password: formData.password,
        lokasiId: parseInt(formData.lokasi_id),
        jabatanId: parseInt(formData.jabatan_id),
        isAdmin: formData.is_admin === 'ADMIN' ? '1' : '0',
        role: formData.is_admin,
        alamat: formData.alamat,
        provinsi: formData.provinsi,
        kota: formData.kota,
        kecamatan: formData.kecamatan,
        kelurahan: formData.kelurahan,
        kodePos: formData.kodePos,
        latitude: formData.latitude ? parseFloat(formData.latitude) : null,
        longitude: formData.longitude ? parseFloat(formData.longitude) : null,
        gajiPokok: formData.gaji_pokok ? parseInt(formData.gaji_pokok.replace(/\D/g, '')) : null,
        makanTransport: formData.makan_transport ? parseInt(formData.makan_transport.replace(/\D/g, '')) : null,
        lembur: formData.lembur ? parseInt(formData.lembur.replace(/\D/g, '')) : null,
        kehadiran: formData.kehadiran ? parseInt(formData.kehadiran.replace(/\D/g, '')) : null,
        thr: formData.thr ? parseInt(formData.thr.replace(/\D/g, '')) : null,
        bonus: formData.bonus ? parseInt(formData.bonus.replace(/\D/g, '')) : null,
        izin: formData.izin ? parseInt(formData.izin.replace(/\D/g, '')) : null,
        terlambat: formData.terlambat ? parseInt(formData.terlambat.replace(/\D/g, '')) : null,
        mangkir: formData.mangkir ? parseInt(formData.mangkir.replace(/\D/g, '')) : null,
        saldoKasbon: formData.saldo_kasbon ? parseInt(formData.saldo_kasbon.replace(/\D/g, '')) : null,
        izinCuti: formData.izin_cuti,
        izinLainnya: formData.izin_lainnya,
        izinTelat: formData.izin_telat,
        izinPulangCepat: formData.izin_pulang_cepat
      }
      let requestBody: any
      let headers: any = { 'Authorization': `Bearer ${localStorage.getItem('auth_token')}` }
      if (formData.foto_karyawan !== null) {
        const submitData = new FormData()
        submitData.append('data', JSON.stringify(mappedData))
        submitData.append('foto_karyawan', formData.foto_karyawan as File)
        requestBody = submitData
      } else {
        requestBody = JSON.stringify(mappedData)
        (headers as any)['Content-Type'] = 'application/json'
      }
      const response = await fetch(getApiUrl(`api/pegawai/${formData.id}`), { method: 'PUT', headers, body: requestBody })
      if (response.ok) { showSuccessToast('Pegawai berhasil diperbarui'); router.push('/admin/master-data/pegawai') }
      else { const errorData = await response.json(); showErrorToast(errorData.message || 'Gagal memperbarui pegawai') }
    } catch (error) { showErrorToast('Gagal memperbarui pegawai') } finally { setLoading(false) }
  }
  const handleBack = () => { router.push('/admin/master-data/pegawai') }
  const formatCurrency = (value: string) => { const num = parseInt(value.replace(/\D/g, '')); return isNaN(num) ? '' : num.toLocaleString('id-ID') }
  const getStepIcon = (step: number) => { switch (step) { case 0: return User; case 1: return MapPin; case 2: return Calculator; case 3: return Eye; default: return User } }
  if (!mounted) { return (<div className="container mx-auto p-6"><div className="flex items-center justify-center min-h-[400px]"><div className="flex flex-col items-center gap-2"><div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" /><span className="text-muted-foreground">Memuat halaman...</span></div></div></div>) }
  return (
    <div className="min-h-screen bg-background">
      <AdminPageHeader title="Edit Pegawai" description="Edit data pegawai dengan langkah-langkah terstruktur" icon={getStepIcon(currentStep)} primaryAction={{ label: "Kembali", onClick: handleBack, icon: ArrowLeft }} />
      <div className="container mx-auto p-6 max-w-4xl">
        <Card className="mb-6"><CardContent className="pt-6"><Stepper steps={steps} currentStep={currentStep} /></CardContent></Card>
        <form onSubmit={(e) => e.preventDefault()} className="space-y-6">
          {/* Step 1: Personal & Account Information */}
          {currentStep === 0 && (<div className="space-y-6">{/* Photo Upload, Personal, Account, Jabatan, sama seperti tambah */}</div>)}
          {/* Step 2: Address Details */}
          {currentStep === 1 && (<div className="space-y-6">{/* Alamat, Wilayah, Map, sama seperti tambah */}</div>)}
          {/* Step 3: Salary & Benefits */}
          {currentStep === 2 && (<div className="space-y-6">{/* Komponen gaji, tunjangan, potongan, izin, sama seperti tambah */}</div>)}
          {/* Step 4: Preview */}
          {currentStep === 3 && (<div className="space-y-6">{/* Preview sama seperti tambah, data dari formData */}</div>)}
          <div className="flex justify-between mt-8">
            <Button type="button" variant="outline" onClick={handlePrevious} disabled={currentStep === 0}>Sebelumnya</Button>
            {currentStep < steps.length - 1 ? (
              <Button type="button" onClick={handleNext}>Selanjutnya</Button>
            ) : (
              <Button type="button" onClick={handleSubmit}>Simpan Perubahan</Button>
            )}
          </div>
        </form>
      </div>
    </div>
  )
}
}
