'use client'

import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { showErrorToast, showSuccessToast } from "@/components/ui/toast-utils"
import { ArrowLeft, Save, FileText, User, FolderOpen, Upload } from 'lucide-react'
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/AuthContext"
import { getApiUrl } from "@/lib/config"

interface PegawaiOption {
  id: number
  fullName: string
}

interface KategoriOption {
  id: number
  nama: string
}

interface FilePegawaiResponse {
  id: number
  judul: string
  deskripsi?: string
  fileName: string
  fileType?: string
  fileSize?: number
  pegawaiId: number
  pegawaiNama: string
  kategoriId: number
  kategoriNama: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export default function EditFilePegawaiPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const router = useRouter()
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [paramId, setParamId] = useState<string>('')
  
  const [formData, setFormData] = useState({
    judul: '',
    deskripsi: '',
    pegawaiId: null as number | null,
    kategoriId: null as number | null
  })
  
  const [fileInfo, setFileInfo] = useState({
    fileName: '',
    fileType: '',
    fileSize: 0
  })
  
  const [newFile, setNewFile] = useState<File | null>(null)
  const [pegawaiOptions, setPegawaiOptions] = useState<PegawaiOption[]>([])
  const [kategoriOptions, setKategoriOptions] = useState<KategoriOption[]>([])

  useEffect(() => {
    setMounted(true)
    
    // Handle async params
    const initializeParams = async () => {
      const resolvedParams = await params
      setParamId(resolvedParams.id)
    }
    
    initializeParams()
  }, [params])

  useEffect(() => {
    if (paramId) {
      loadFileData()
      loadOptions()
    }
  }, [paramId])

  const loadFileData = async () => {
    try {
      setLoading(true)
      const response = await fetch(getApiUrl(`admin/file-pegawai/${paramId}`), {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      })
      
      if (response.ok) {
        const data: FilePegawaiResponse = await response.json()
        setFormData({
          judul: data.judul,
          deskripsi: data.deskripsi || '',
          pegawaiId: data.pegawaiId,
          kategoriId: data.kategoriId
        })
        setFileInfo({
          fileName: data.fileName,
          fileType: data.fileType || '',
          fileSize: data.fileSize || 0
        })
      } else {
        showErrorToast('File tidak ditemukan')
        router.push('/admin/file-pegawai')
      }
    } catch (error) {
      console.error('Error loading file data:', error)
      showErrorToast('Gagal memuat data file')
      router.push('/admin/file-pegawai')
    } finally {
      setLoading(false)
    }
  }

  const loadOptions = async () => {
    try {
      // Load pegawai options
      const pegawaiResponse = await fetch(getApiUrl('admin/pegawai/active'), {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      })
      
      if (pegawaiResponse.ok) {
        const pegawaiData = await pegawaiResponse.json()
        setPegawaiOptions(pegawaiData)
      }

      // Load kategori options
      const kategoriResponse = await fetch(getApiUrl('admin/master-data/file-kategori/active'), {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      })
      
      if (kategoriResponse.ok) {
        const kategoriData = await kategoriResponse.json()
        setKategoriOptions(kategoriData)
      }
    } catch (error) {
      console.error('Error loading options:', error)
      showErrorToast('Gagal memuat data')
    }
  }

  const uploadFile = async (file: File): Promise<string> => {
    const formData = new FormData()
    formData.append('file', file)

    const response = await fetch(getApiUrl('files/upload/temp'), {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
      },
      body: formData
    })

    if (!response.ok) {
      throw new Error('Gagal upload file')
    }

    const data = await response.json()
    return data.fileName || data.filename || file.name
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.judul.trim()) {
      showErrorToast('Judul file harus diisi')
      return
    }
    
    if (!formData.pegawaiId) {
      showErrorToast('Pegawai harus dipilih')
      return
    }
    
    if (!formData.kategoriId) {
      showErrorToast('Kategori file harus dipilih')
      return
    }

    try {
      setSaving(true)
      
      let fileName = fileInfo.fileName
      let fileType = fileInfo.fileType
      let fileSize = fileInfo.fileSize
      
      // If new file is selected, upload it
      if (newFile) {
        fileName = await uploadFile(newFile)
        fileType = newFile.type
        fileSize = newFile.size
      }
      
      const updateData = {
        judul: formData.judul.trim(),
        deskripsi: formData.deskripsi.trim(),
        fileName: fileName,
        fileType: fileType,
        fileSize: fileSize,
        pegawaiId: formData.pegawaiId,
        kategoriId: formData.kategoriId,
        isActive: true
      }

      const response = await fetch(getApiUrl(`admin/file-pegawai/${paramId}`), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: JSON.stringify(updateData)
      })

      if (response.ok) {
        showSuccessToast('File pegawai berhasil diperbarui')
        router.push(`/admin/file-pegawai/${paramId}`)
      } else {
        const errorData = await response.json()
        showErrorToast(errorData.message || 'Gagal memperbarui file pegawai')
      }
    } catch (error) {
      console.error('Error updating file pegawai:', error)
      showErrorToast(error instanceof Error ? error.message : 'Gagal memperbarui file pegawai')
    } finally {
      setSaving(false)
    }
  }

  const formatFileSize = (bytes: number) => {
    if (!bytes) return 'N/A'
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(1024))
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i]
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="outline"
            onClick={() => router.push(`/admin/file-pegawai/${paramId}`)}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Kembali
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Edit File Pegawai</h1>
            <p className="text-gray-600">Perbarui informasi file pegawai</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Informasi File
              </CardTitle>
              <CardDescription>
                Perbarui informasi dasar file pegawai
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="judul">Judul File *</Label>
                  <Input
                    id="judul"
                    value={formData.judul}
                    onChange={(e) => setFormData({ ...formData, judul: e.target.value })}
                    placeholder="Masukkan judul file"
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="pegawai">Pegawai *</Label>
                  <select 
                    id="pegawai"
                    className="w-full p-2 border rounded-md mt-1"
                    value={formData.pegawaiId || ''}
                    onChange={(e) => setFormData({ ...formData, pegawaiId: e.target.value ? Number(e.target.value) : null })}
                    disabled={user?.role?.roleName === 'USER'}
                  >
                    <option value="">Pilih Pegawai</option>
                    {pegawaiOptions.map(pegawai => (
                      <option key={pegawai.id} value={pegawai.id}>
                        {pegawai.fullName}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <Label htmlFor="kategori">Kategori File *</Label>
                  <select 
                    id="kategori"
                    className="w-full p-2 border rounded-md mt-1"
                    value={formData.kategoriId || ''}
                    onChange={(e) => setFormData({ ...formData, kategoriId: e.target.value ? Number(e.target.value) : null })}
                  >
                    <option value="">Pilih Kategori</option>
                    {kategoriOptions.map(kategori => (
                      <option key={kategori.id} value={kategori.id}>
                        {kategori.nama}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div>
                <Label htmlFor="deskripsi">Deskripsi File</Label>
                <Textarea
                  id="deskripsi"
                  value={formData.deskripsi}
                  onChange={(e) => setFormData({ ...formData, deskripsi: e.target.value })}
                  placeholder="Masukkan deskripsi file (opsional)"
                  className="mt-1"
                  rows={4}
                />
              </div>
            </CardContent>
          </Card>

          {/* File Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="w-5 h-5" />
                File
              </CardTitle>
              <CardDescription>
                Informasi file saat ini dan opsi untuk menggantinya
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Current File Info */}
              <div className="p-4 bg-gray-50 rounded-lg">
                <h4 className="font-medium mb-2">File Saat Ini:</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Nama File:</span>
                    <p className="font-medium">{fileInfo.fileName}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Tipe:</span>
                    <p className="font-medium">{fileInfo.fileType || 'N/A'}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Ukuran:</span>
                    <p className="font-medium">{formatFileSize(fileInfo.fileSize)}</p>
                  </div>
                </div>
              </div>

              {/* New File Upload */}
              <div>
                <Label htmlFor="newFile">Ganti File (Opsional)</Label>
                <Input
                  id="newFile"
                  type="file"
                  onChange={(e) => setNewFile(e.target.files?.[0] || null)}
                  className="mt-1"
                />
                {newFile && (
                  <div className="mt-2 p-3 bg-blue-50 rounded-lg">
                    <p className="text-sm text-blue-800">
                      <strong>File baru dipilih:</strong> {newFile.name} ({formatFileSize(newFile.size)})
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push(`/admin/file-pegawai/${paramId}`)}
            >
              Batal
            </Button>
            <Button
              type="submit"
              disabled={saving}
            >
              {saving ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                  Menyimpan...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Save className="w-4 h-4" />
                  Simpan Perubahan
                </div>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
