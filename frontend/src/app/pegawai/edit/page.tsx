'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { showErrorToast, showSuccessToast } from "@/components/ui/toast-utils"
import { useAuth } from "@/contexts/AuthContext"
import { getApiUrl } from "@/lib/config"
import ProtectedRoute from "@/components/ProtectedRoute"
import { ArrowLeft, Save, User } from 'lucide-react'

interface Pegawai {
  id: number
  nip: string
  fullName: string
  email: string
  phoneNumber: string
  alamat: string
  photoUrl?: string
  jabatan?: string
  provinsi?: string
  kota?: string
  kecamatan?: string
  kelurahan?: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

interface Jabatan {
  id: number
  nama: string
  deskripsi?: string
  isActive: boolean
}

interface Wilayah {
  kode: string
  nama: string
  id?: number
}

export default function EditPegawaiPage() {
  const { user } = useAuth()
  const router = useRouter()
  
  const [pegawai, setPegawai] = useState<Pegawai | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [mounted, setMounted] = useState(false)
  
  // Form data
  const [formData, setFormData] = useState({
    nip: '',
    fullName: '',
    email: '',
    phoneNumber: '',
    address: '',
    jabatanId: '',
    provinsiId: '',
    kotaId: '',
    kecamatanId: '',
    kelurahanId: ''
  })
  
  // Options
  const [jabatanOptions, setJabatanOptions] = useState<Jabatan[]>([])
  const [provinsiOptions, setProvinsiOptions] = useState<Wilayah[]>([])
  const [kotaOptions, setKotaOptions] = useState<Wilayah[]>([])
  const [kecamatanOptions, setKecamatanOptions] = useState<Wilayah[]>([])
  const [kelurahanOptions, setKelurahanOptions] = useState<Wilayah[]>([])

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (mounted && user?.id) {
      loadJabatanOptions()
      loadProvinsiOptions()
      loadPegawaiData()
    } else if (mounted && !user?.id) {
      // Redirect if no user ID available
      showErrorToast('Silakan login terlebih dahulu')
      router.push('/login')
    }
  }, [mounted, user?.id])

  // Load dependent data after pegawai data is loaded
  useEffect(() => {
    if (pegawai && provinsiOptions.length > 0) {
      loadDependentWilayahData()
    }
  }, [pegawai, provinsiOptions])

  const loadDependentWilayahData = async () => {
    if (!pegawai) return

    try {
      // Load kota options if provinsi exists
      if (pegawai.provinsi && provinsiOptions.length > 0) {
        const provinsiFound = provinsiOptions.find(p => p.kode === pegawai.provinsi)
        if (provinsiFound) {
          await loadKotaOptionsByProvinsiKode(provinsiFound.kode)
        }
      }
    } catch (error) {
      console.error('Error loading dependent wilayah data:', error)
    }
  }

  // Load kecamatan after kota is loaded
  useEffect(() => {
    if (pegawai && kotaOptions.length > 0) {
      loadKecamatanData()
    }
  }, [pegawai, kotaOptions])

  const loadKecamatanData = async () => {
    if (!pegawai || !pegawai.kota) return

    try {
      const kotaFound = kotaOptions.find(k => k.kode === pegawai.kota)
      if (kotaFound) {
        await loadKecamatanOptionsByKotaKode(kotaFound.kode)
      }
    } catch (error) {
      console.error('Error loading kecamatan data:', error)
    }
  }

  // Load kelurahan after kecamatan is loaded
  useEffect(() => {
    if (pegawai && kecamatanOptions.length > 0) {
      loadKelurahanData()
    }
  }, [pegawai, kecamatanOptions])

  const loadKelurahanData = async () => {
    if (!pegawai || !pegawai.kecamatan) return

    try {
      const kecamatanFound = kecamatanOptions.find(k => k.kode === pegawai.kecamatan)
      if (kecamatanFound) {
        await loadKelurahanOptionsByKecamatanKode(kecamatanFound.kode)
      }
    } catch (error) {
      console.error('Error loading kelurahan data:', error)
    }
  }

  const loadPegawaiData = async () => {
    try {
      setLoading(true)
      const response = await fetch(getApiUrl(`api/pegawai/${user?.id}`), {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setPegawai(data)
        
        // Map the API response to form data correctly
        setFormData({
          nip: data.nip || '',
          fullName: data.fullName || '',
          email: data.email || '',
          phoneNumber: data.phoneNumber || '',
          address: data.alamat || '', // API uses 'alamat'
          jabatanId: data.jabatan || '', // API returns jabatan as string
          provinsiId: data.provinsi || '', // API returns provinsi as string code
          kotaId: data.kota || '', // API returns kota as string code
          kecamatanId: data.kecamatan || '', // API returns kecamatan as string code
          kelurahanId: data.kelurahan || '' // API returns kelurahan as string code
        })

        // Dependent options will be loaded by useEffect hooks
      } else {
        showErrorToast('Gagal memuat data pegawai')
        router.push('/')
      }
    } catch (error) {
      console.error('Error loading pegawai data:', error)
      showErrorToast('Gagal memuat data pegawai')
      router.push('/')
    } finally {
      setLoading(false)
    }
  }

  const loadJabatanOptions = async () => {
    try {
      const response = await fetch(getApiUrl('api/admin/master-data/jabatan/active'), {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        setJabatanOptions(data)
      }
    } catch (error) {
      console.error('Error loading jabatan options:', error)
    }
  }

  const loadProvinsiOptions = async () => {
    try {
      const response = await fetch(getApiUrl('api/admin/wilayah/provinsi'), {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        setProvinsiOptions(data.content || [])
      }
    } catch (error) {
      console.error('Error loading provinsi options:', error)
    }
  }

  const loadKotaOptionsByProvinsiKode = async (provinsiKode: string) => {
    try {
      const response = await fetch(getApiUrl(`api/admin/wilayah/kota?provinsiKode=${provinsiKode}`), {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        setKotaOptions(data.content || [])
      }
    } catch (error) {
      console.error('Error loading kota options:', error)
    }
  }

  const loadKecamatanOptionsByKotaKode = async (kotaKode: string) => {
    try {
      const response = await fetch(getApiUrl(`api/admin/wilayah/kecamatan?kotaKode=${kotaKode}`), {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        setKecamatanOptions(data.content || [])
      }
    } catch (error) {
      console.error('Error loading kecamatan options:', error)
    }
  }

  const loadKelurahanOptionsByKecamatanKode = async (kecamatanKode: string) => {
    try {
      const response = await fetch(getApiUrl(`api/admin/wilayah/kelurahan?kecamatanKode=${kecamatanKode}`), {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        setKelurahanOptions(data.content || [])
      }
    } catch (error) {
      console.error('Error loading kelurahan options:', error)
    }
  }

  const handleProvinsiChange = (value: string) => {
    setFormData(prev => ({
      ...prev,
      provinsiId: value,
      kotaId: '',
      kecamatanId: '',
      kelurahanId: ''
    }))
    setKotaOptions([])
    setKecamatanOptions([])
    setKelurahanOptions([])
    
    if (value) {
      loadKotaOptionsByProvinsiKode(value)
    }
  }

  const handleKotaChange = (value: string) => {
    setFormData(prev => ({
      ...prev,
      kotaId: value,
      kecamatanId: '',
      kelurahanId: ''
    }))
    setKecamatanOptions([])
    setKelurahanOptions([])
    
    if (value) {
      loadKecamatanOptionsByKotaKode(value)
    }
  }

  const handleKecamatanChange = (value: string) => {
    setFormData(prev => ({
      ...prev,
      kecamatanId: value,
      kelurahanId: ''
    }))
    setKelurahanOptions([])
    
    if (value) {
      loadKelurahanOptionsByKecamatanKode(value)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!user?.id) {
      showErrorToast('User tidak ditemukan')
      return
    }

    try {
      setSaving(true)
      
      const submitData = {
        nip: formData.nip,
        fullName: formData.fullName,
        email: formData.email,
        phoneNumber: formData.phoneNumber,
        alamat: formData.address, // Backend expects 'alamat'
        jabatan: formData.jabatanId || null, // Backend expects jabatan as string
        provinsi: formData.provinsiId || null, // Backend expects provinsi as kode
        kota: formData.kotaId || null, // Backend expects kota as kode
        kecamatan: formData.kecamatanId || null, // Backend expects kecamatan as kode
        kelurahan: formData.kelurahanId || null // Backend expects kelurahan as kode
      }

      const response = await fetch(getApiUrl(`api/pegawai/${user.id}`), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: JSON.stringify(submitData)
      })

      if (response.ok) {
        showSuccessToast('Data pegawai berhasil diperbarui')
        router.push('/')
      } else {
        const errorData = await response.json()
        showErrorToast(errorData.message || 'Gagal memperbarui data pegawai')
      }
    } catch (error) {
      console.error('Error updating pegawai:', error)
      showErrorToast('Gagal memperbarui data pegawai')
    } finally {
      setSaving(false)
    }
  }

  if (!mounted) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <LoadingSpinner />
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="flex flex-col items-center gap-2">
            <LoadingSpinner />
            <span className="text-muted-foreground">Memuat data pegawai...</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <ProtectedRoute requireAuth={true}>
      <div className="min-h-screen bg-background">
        <div className="container mx-auto p-6 space-y-6">
          {/* Header */}
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.back()}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Kembali
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <User className="h-6 w-6" />
                Edit Profil Pegawai
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Perbarui informasi profil Anda
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Informasi Dasar */}
            <Card>
              <CardHeader>
                <CardTitle>Informasi Dasar</CardTitle>
                <CardDescription>
                  Informasi dasar pegawai
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="nip">NIP</Label>
                    <Input
                      id="nip"
                      value={formData.nip}
                      onChange={(e) => setFormData(prev => ({ ...prev, nip: e.target.value }))}
                      placeholder="Masukkan NIP"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="fullName">Nama Lengkap</Label>
                    <Input
                      id="fullName"
                      value={formData.fullName}
                      onChange={(e) => setFormData(prev => ({ ...prev, fullName: e.target.value }))}
                      placeholder="Masukkan nama lengkap"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                      placeholder="Masukkan email"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="phoneNumber">Nomor Telepon</Label>
                    <Input
                      id="phoneNumber"
                      value={formData.phoneNumber}
                      onChange={(e) => setFormData(prev => ({ ...prev, phoneNumber: e.target.value }))}
                      placeholder="Masukkan nomor telepon"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="address">Alamat</Label>
                  <Textarea
                    id="address"
                    value={formData.address}
                    onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                    placeholder="Masukkan alamat lengkap"
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Jabatan */}
            <Card>
              <CardHeader>
                <CardTitle>Jabatan</CardTitle>
                <CardDescription>
                  Informasi jabatan pegawai
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div>
                  <Label htmlFor="jabatan">Jabatan</Label>
                  <Select value={formData.jabatanId} onValueChange={(value) => setFormData(prev => ({ ...prev, jabatanId: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih jabatan" />
                    </SelectTrigger>
                    <SelectContent>
                      {jabatanOptions.map((jabatan) => (
                        <SelectItem key={jabatan.id} value={jabatan.nama}>
                          {jabatan.nama}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Wilayah */}
            <Card>
              <CardHeader>
                <CardTitle>Wilayah</CardTitle>
                <CardDescription>
                  Informasi wilayah tempat bertugas
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="provinsi">Provinsi</Label>
                    <Select value={formData.provinsiId} onValueChange={handleProvinsiChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih provinsi" />
                      </SelectTrigger>
                      <SelectContent>
                        {provinsiOptions.map((provinsi) => (
                          <SelectItem key={provinsi.kode} value={provinsi.kode}>
                            {provinsi.nama}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="kota">Kota/Kabupaten</Label>
                    <Select value={formData.kotaId} onValueChange={handleKotaChange} disabled={!formData.provinsiId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih kota/kabupaten" />
                      </SelectTrigger>
                      <SelectContent>
                        {kotaOptions.map((kota) => (
                          <SelectItem key={kota.kode} value={kota.kode}>
                            {kota.nama}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="kecamatan">Kecamatan</Label>
                    <Select value={formData.kecamatanId} onValueChange={handleKecamatanChange} disabled={!formData.kotaId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih kecamatan" />
                      </SelectTrigger>
                      <SelectContent>
                        {kecamatanOptions.map((kecamatan) => (
                          <SelectItem key={kecamatan.kode} value={kecamatan.kode}>
                            {kecamatan.nama}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="kelurahan">Kelurahan</Label>
                    <Select value={formData.kelurahanId} onValueChange={(value) => setFormData(prev => ({ ...prev, kelurahanId: value }))} disabled={!formData.kecamatanId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih kelurahan" />
                      </SelectTrigger>
                      <SelectContent>
                        {kelurahanOptions.map((kelurahan) => (
                          <SelectItem key={kelurahan.kode} value={kelurahan.kode}>
                            {kelurahan.nama}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Submit Button */}
            <div className="flex justify-end space-x-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                disabled={saving}
              >
                Batal
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? (
                  <>
                    <LoadingSpinner />
                    Menyimpan...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Simpan Perubahan
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </ProtectedRoute>
  )
}
