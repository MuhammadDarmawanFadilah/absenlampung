'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useParams } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { showErrorToast } from "@/components/ui/toast-utils"
import { ArrowLeft, User, MapPin, Phone, Mail, Calendar, Building2, Edit, Shield, Eye, CheckCircle, XCircle } from 'lucide-react'
import { AdminPageHeader } from "@/components/AdminPageHeader"
import { useToast } from "@/hooks/use-toast"
import { getApiUrl } from "@/lib/config"
import { Skeleton } from "@/components/ui/skeleton"

interface PegawaiDetail {
  id: number;
  nip?: string;
  namaLengkap?: string;
  fullName?: string;
  email?: string;
  noTelp?: string;
  phoneNumber?: string;
  alamat?: string;
  jenisKelamin?: string;
  tanggalLahir?: string;
  tempatLahir?: string;
  pendidikan?: string;
  tanggalMasuk?: string;
  statusNikah?: string;
  rekening?: string;
  username?: string;
  role?: string;
  jabatan?: {
    id: number;
    nama: string;
    deskripsi?: string;
  };
  lokasi?: {
    id: number;
    namaLokasi: string;
    alamat?: string;
  };
  isActive?: boolean;
  status?: string;
  createdAt?: string;
  updatedAt?: string;
  // Location data
  latitude?: number;
  longitude?: number;
  provinsi?: string;
  provinsiNama?: string;
  kota?: string;
  kotaNama?: string;
  kecamatan?: string;
  kecamatanNama?: string;
  kelurahan?: string;
  kelurahanNama?: string;
  kodePos?: string;
  fotoKaryawan?: string;
  photoUrl?: string;
  // Salary & Benefits
  gajiPokok?: number;
  makanTransport?: number;
  lembur?: number;
  kehadiran?: number;
  thr?: number;
  bonus?: number;
  izin?: number;
  terlambat?: number;
  mangkir?: number;
  saldoKasbon?: number;
  izinCuti?: number;
  izinLainnya?: number;
  izinTelat?: number;
  izinPulangCepat?: number;
}

export default function DetailPegawaiPage() {
  const router = useRouter()
  const params = useParams()
  const [loading, setLoading] = useState(true)
  const [pegawaiData, setPegawaiData] = useState<PegawaiDetail | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    if (params.id) {
      loadPegawaiData()
    }
  }, [params.id])

  const loadPegawaiData = async () => {
    try {
      setLoading(true)
      const response = await fetch(getApiUrl(`api/pegawai/${params.id}`), {
        headers: { 
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
          'Content-Type': 'application/json'
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        setPegawaiData(data)
      } else {
        const errorText = await response.text()
        showErrorToast(errorText || 'Gagal memuat data pegawai')
        router.push('/admin/master-data/pegawai')
      }
    } catch (error) {
      console.error('Error loading pegawai data:', error)
      showErrorToast('Gagal memuat data pegawai')
      router.push('/admin/master-data/pegawai')
    } finally {
      setLoading(false)
    }
  }

  const handleBack = () => {
    router.push('/admin/master-data/pegawai')
  }

  const handleEdit = () => {
    router.push(`/admin/master-data/pegawai/${params.id}/edit`)
  }

  const getProfileImage = () => {
    if (!pegawaiData) return null
    const photoUrl = pegawaiData.photoUrl || pegawaiData.fotoKaryawan
    if (!photoUrl) return null
    
    if (photoUrl.startsWith('http')) {
      return photoUrl
    }
    
    return `${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8080'}/api/upload/photos/${photoUrl}`
  }

  const formatCurrency = (value: number | undefined) => {
    if (!value) return 'Rp 0'
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(value)
  }

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return '-'
    try {
      return new Date(dateString).toLocaleDateString('id-ID', {
        day: '2-digit',
        month: 'long',
        year: 'numeric'
      })
    } catch {
      return dateString
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <AdminPageHeader
          title="Detail Pegawai"
          description="Informasi lengkap data pegawai"
          icon={User}
          primaryAction={{
            label: "Kembali",
            onClick: handleBack,
            icon: ArrowLeft
          }}
        />
        <div className="container mx-auto p-6 max-w-4xl">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-1">
              <CardContent className="p-6">
                <div className="flex flex-col items-center space-y-4">
                  <Skeleton className="w-32 h-32 rounded-full" />
                  <Skeleton className="h-6 w-32" />
                  <Skeleton className="h-4 w-24" />
                </div>
              </CardContent>
            </Card>
            <Card className="lg:col-span-2">
              <CardContent className="p-6 space-y-4">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="flex justify-between">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-32" />
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    )
  }

  if (!pegawaiData) {
    return (
      <div className="min-h-screen bg-background">
        <AdminPageHeader
          title="Detail Pegawai"
          description="Informasi lengkap data pegawai"
          icon={User}
          primaryAction={{
            label: "Kembali",
            onClick: handleBack,
            icon: ArrowLeft
          }}
        />
        <div className="container mx-auto p-6 max-w-4xl">
          <Card>
            <CardContent className="p-6 text-center">
              <User className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Data Pegawai Tidak Ditemukan</h3>
              <p className="text-muted-foreground mb-4">Data pegawai yang Anda cari tidak ditemukan atau telah dihapus.</p>
              <Button onClick={handleBack}>Kembali ke Daftar Pegawai</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <AdminPageHeader
        title="Detail Pegawai"
        description={`Informasi lengkap data ${pegawaiData.namaLengkap || pegawaiData.fullName}`}
        icon={User}
        primaryAction={{
          label: "Kembali",
          onClick: handleBack,
          icon: ArrowLeft
        }}
        secondaryActions={[{
          label: "Edit Pegawai",
          onClick: handleEdit,
          icon: Edit
        }]}
      />

      <div className="container mx-auto p-6 max-w-4xl space-y-6">
        {/* Profile Card */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-1">
            <CardContent className="p-6">
              <div className="flex flex-col items-center space-y-4">
                <div className="w-32 h-32 rounded-full overflow-hidden bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white text-4xl font-semibold border-4 border-white shadow-lg">
                  {getProfileImage() ? (
                    <img 
                      src={getProfileImage()!}
                      alt={`Foto ${pegawaiData.namaLengkap || pegawaiData.fullName}`}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                        const parent = target.parentElement;
                        const name = pegawaiData.namaLengkap || pegawaiData.fullName || '';
                        if (parent && name && name.length > 0) {
                          parent.innerHTML = `<span class="text-4xl">${name.charAt(0).toUpperCase()}</span>`;
                        }
                      }}
                    />
                  ) : (
                    <span className="text-4xl">
                      {(pegawaiData.namaLengkap || pegawaiData.fullName || '').charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
                <div className="text-center">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                    {pegawaiData.namaLengkap || pegawaiData.fullName}
                  </h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {pegawaiData.nip || 'NIP tidak tersedia'}
                  </p>
                </div>
                <Badge 
                  className={
                    (pegawaiData.isActive || pegawaiData.status === 'AKTIF')
                      ? 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400' 
                      : 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400'
                  }
                >
                  {(pegawaiData.isActive || pegawaiData.status === 'AKTIF') ? (
                    <>
                      <CheckCircle className="h-3 w-3 mr-1" />
                      AKTIF
                    </>
                  ) : (
                    <>
                      <XCircle className="h-3 w-3 mr-1" />
                      TIDAK AKTIF
                    </>
                  )}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Basic Information */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <User className="h-5 w-5" />
                <span>Informasi Personal</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Email:</span>
                  <span className="font-medium">{pegawaiData.email || '-'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">No. Telepon:</span>
                  <span className="font-medium">{pegawaiData.noTelp || pegawaiData.phoneNumber || '-'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Jenis Kelamin:</span>
                  <span className="font-medium">{pegawaiData.jenisKelamin === 'L' ? 'Laki-laki' : pegawaiData.jenisKelamin === 'P' ? 'Perempuan' : '-'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Tanggal Lahir:</span>
                  <span className="font-medium">{formatDate(pegawaiData.tanggalLahir)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Status Nikah:</span>
                  <span className="font-medium">{pegawaiData.statusNikah || '-'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Tanggal Masuk:</span>
                  <span className="font-medium">{formatDate(pegawaiData.tanggalMasuk)}</span>
                </div>
              </div>
              <div className="pt-2">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Alamat:</span>
                  <span className="font-medium text-right max-w-xs">{pegawaiData.alamat || '-'}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Job Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Building2 className="h-5 w-5" />
              <span>Informasi Pekerjaan</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Jabatan:</span>
              <span className="font-medium">{pegawaiData.jabatan?.nama || '-'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Role:</span>
              <Badge variant={pegawaiData.role === 'ADMIN' ? 'default' : 'secondary'}>
                <Shield className="h-3 w-3 mr-1" />
                {pegawaiData.role || 'EMPLOYEE'}
              </Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Lokasi Kerja:</span>
              <span className="font-medium">{pegawaiData.lokasi?.namaLokasi || '-'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Username:</span>
              <span className="font-medium">{pegawaiData.username || '-'}</span>
            </div>
          </CardContent>
        </Card>

        {/* Location Information */}
        {(pegawaiData.latitude && pegawaiData.longitude) && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <MapPin className="h-5 w-5" />
                <span>Informasi Lokasi</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Provinsi:</span>
                  <span className="font-medium">{pegawaiData.provinsiNama || pegawaiData.provinsi || '-'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Kota/Kabupaten:</span>
                  <span className="font-medium">{pegawaiData.kotaNama || pegawaiData.kota || '-'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Kecamatan:</span>
                  <span className="font-medium">{pegawaiData.kecamatanNama || pegawaiData.kecamatan || '-'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Kelurahan:</span>
                  <span className="font-medium">{pegawaiData.kelurahanNama || pegawaiData.kelurahan || '-'}</span>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Latitude:</span>
                  <span className="font-mono text-sm">{pegawaiData.latitude?.toFixed(6)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Longitude:</span>
                  <span className="font-mono text-sm">{pegawaiData.longitude?.toFixed(6)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Financial Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Calendar className="h-5 w-5" />
              <span>Informasi Keuangan & Izin</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Komponen Gaji</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Gaji Pokok:</span>
                  <span className="font-medium">{formatCurrency(pegawaiData.gajiPokok)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Makan & Transport:</span>
                  <span className="font-medium">{formatCurrency(pegawaiData.makanTransport)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Lembur:</span>
                  <span className="font-medium">{formatCurrency(pegawaiData.lembur)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">THR:</span>
                  <span className="font-medium">{formatCurrency(pegawaiData.thr)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Bonus:</span>
                  <span className="font-medium">{formatCurrency(pegawaiData.bonus)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Saldo Kasbon:</span>
                  <span className="font-medium">{formatCurrency(pegawaiData.saldoKasbon)}</span>
                </div>
              </div>
            </div>
            
            <div className="border-t pt-4">
              <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Informasi Izin</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{pegawaiData.izinCuti || 0}</div>
                  <div className="text-xs text-gray-600">Izin Cuti</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-600">{pegawaiData.izinLainnya || 0}</div>
                  <div className="text-xs text-gray-600">Izin Lainnya</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">{pegawaiData.izinTelat || 0}</div>
                  <div className="text-xs text-gray-600">Izin Telat</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">{pegawaiData.izinPulangCepat || 0}</div>
                  <div className="text-xs text-gray-600">Pulang Cepat</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex justify-between">
          <Button variant="outline" onClick={handleBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Kembali
          </Button>
          <Button onClick={handleEdit}>
            <Edit className="h-4 w-4 mr-2" />
            Edit Pegawai
          </Button>
        </div>
      </div>
    </div>
  )
}
