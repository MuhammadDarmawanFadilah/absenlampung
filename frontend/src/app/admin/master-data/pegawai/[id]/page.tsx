'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useParams } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { showErrorToast } from "@/components/ui/toast-utils"
import { ArrowLeft, User, MapPin, Phone, Mail, Calendar, Building2, Edit, Shield, Eye, CheckCircle, XCircle, History, Clock, Camera, Timer, Zap, AlertCircle } from 'lucide-react'
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
  kota?: string;
  kecamatan?: string;
  kelurahan?: string;
  kodePos?: string;
  // Display names for location
  provinsiNama?: string;
  kotaNama?: string;
  kecamatanNama?: string;
  kelurahanNama?: string;
  // Photo URL
  photoUrl?: string;
  // Financial data
  gajiPokok?: number;
  makanTransport?: number;
  lembur?: number;
  thr?: number;
  bonus?: number;
  saldoKasbon?: number;
  // Permission data
  izinCuti?: number;
  izinLainnya?: number;
  izinTelat?: number;
  izinPulangCepat?: number;
}

interface AbsensiHistory {
  id: number;
  tanggal: string;
  waktu: string;
  type: 'masuk' | 'pulang';
  shift: string;
  lokasi: string;
  jarak: number;
  photoUrl?: string;
  status: 'hadir' | 'terlambat' | 'pulang_cepat' | 'alpha';
  keterangan?: string;
  latitude: number;
  longitude: number;
  createdAt: string;
}

export default function DetailPegawaiPage() {
  const router = useRouter()
  const params = useParams()
  const [loading, setLoading] = useState(true)
  const [pegawaiData, setPegawaiData] = useState<PegawaiDetail | null>(null)
  const [absensiHistory, setAbsensiHistory] = useState<AbsensiHistory[]>([])
  const [loadingHistory, setLoadingHistory] = useState(false)
  const [activeTab, setActiveTab] = useState('detail')
  const { toast } = useToast()

  useEffect(() => {
    if (params.id) {
      loadPegawaiData()
    }
  }, [params.id])

  useEffect(() => {
    if (activeTab === 'absensi' && pegawaiData) {
      loadAbsensiHistory()
    }
  }, [activeTab, pegawaiData])

  const loadAbsensiHistory = async () => {
    try {
      setLoadingHistory(true)
      const currentMonth = new Date().toISOString().slice(0, 7) // YYYY-MM format
      
      const response = await fetch(getApiUrl(`api/absensi/pegawai/${pegawaiData?.id}/history?month=${currentMonth}`), {
        headers: { 
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
          'Content-Type': 'application/json'
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        setAbsensiHistory(data || [])
      } else {
        console.error('Failed to load absensi history')
      }
    } catch (error) {
      console.error('Error loading absensi history:', error)
    } finally {
      setLoadingHistory(false)
    }
  }

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
    const photoUrl = pegawaiData.photoUrl
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

  const formatTime = (timeString: string) => {
    return timeString.substring(0, 5)
  }

  const formatAbsensiDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      weekday: 'short',
      day: '2-digit',
      month: 'short'
    })
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'hadir':
        return <Badge variant="default" className="bg-green-100 text-green-800 border-green-200">
          <CheckCircle className="w-3 h-3 mr-1" />
          Hadir
        </Badge>
      case 'terlambat':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 border-yellow-200">
          <AlertCircle className="w-3 h-3 mr-1" />
          Terlambat
        </Badge>
      case 'pulang_cepat':
        return <Badge variant="outline" className="bg-orange-100 text-orange-800 border-orange-200">
          <Timer className="w-3 h-3 mr-1" />
          Pulang Cepat
        </Badge>
      case 'alpha':
        return <Badge variant="destructive" className="bg-red-100 text-red-800 border-red-200">
          <XCircle className="w-3 h-3 mr-1" />
          Alpha
        </Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const getTypeBadge = (type: string) => {
    return type === 'masuk' ? (
      <Badge variant="default" className="bg-blue-100 text-blue-800 border-blue-200">
        <Zap className="w-3 h-3 mr-1" />
        Masuk
      </Badge>
    ) : (
      <Badge variant="secondary" className="bg-purple-100 text-purple-800 border-purple-200">
        <Timer className="w-3 h-3 mr-1" />
        Pulang
      </Badge>
    )
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

      <div className="container mx-auto p-6 max-w-6xl space-y-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="detail" className="flex items-center">
              <User className="w-4 h-4 mr-2" />
              Detail Pegawai
            </TabsTrigger>
            <TabsTrigger value="absensi" className="flex items-center">
              <History className="w-4 h-4 mr-2" />
              Histori Absensi
            </TabsTrigger>
          </TabsList>

          <TabsContent value="detail" className="space-y-6">
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
          </TabsContent>

          <TabsContent value="absensi" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center">
                  <History className="w-5 h-5 mr-2" />
                  Histori Absensi Bulan Ini
                </CardTitle>
                <CardDescription>
                  Riwayat kehadiran pegawai untuk bulan {new Date().toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loadingHistory ? (
                  <div className="text-center py-8">
                    <div className="flex items-center justify-center space-x-2">
                      <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                      <span>Memuat data absensi...</span>
                    </div>
                  </div>
                ) : absensiHistory.length === 0 ? (
                  <div className="text-center py-8">
                    <History className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Belum Ada Data Absensi</h3>
                    <p className="text-muted-foreground">Pegawai belum melakukan absensi bulan ini.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Tanggal</TableHead>
                          <TableHead>Waktu</TableHead>
                          <TableHead>Jenis</TableHead>
                          <TableHead>Shift</TableHead>
                          <TableHead>Lokasi</TableHead>
                          <TableHead>Jarak</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Foto</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {absensiHistory.map((item) => (
                          <TableRow key={item.id}>
                            <TableCell>
                              <div>
                                <div className="font-medium">
                                  {formatAbsensiDate(item.tanggal)}
                                </div>
                                <div className="text-sm text-gray-500">
                                  {new Date(item.tanggal).toLocaleDateString('id-ID', { 
                                    day: '2-digit', 
                                    month: 'short' 
                                  })}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center">
                                <Clock className="w-4 h-4 mr-2 text-gray-400" />
                                <span className="font-mono">{formatTime(item.waktu)}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              {getTypeBadge(item.type)}
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">
                                {item.shift}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center">
                                <MapPin className="w-4 h-4 mr-2 text-gray-400" />
                                <span className="text-sm">{item.lokasi}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <span className="text-sm font-mono">
                                {Math.round(item.jarak)} m
                              </span>
                            </TableCell>
                            <TableCell>
                              {getStatusBadge(item.status)}
                            </TableCell>
                            <TableCell>
                              {item.photoUrl ? (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => window.open(item.photoUrl, '_blank')}
                                >
                                  <Camera className="w-4 h-4 mr-1" />
                                  Lihat
                                </Button>
                              ) : (
                                <span className="text-gray-400">-</span>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
