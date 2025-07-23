'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { showErrorToast, showSuccessToast } from "@/components/ui/toast-utils"
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { ArrowLeft, Save, FileText, Upload } from 'lucide-react'
import { getApiUrl } from "@/lib/config"
import { SearchableSelectObject } from "@/components/ui/searchable-select-object"
import ProtectedRoute from "@/components/ProtectedRoute"

interface FileItem {
  id: string
  filename: string
  originalName: string
  judul: string
  deskripsi?: string
  fileSize: number
  mimeType: string
  uploadedBy: string
  uploadedAt: string
  kategoriId?: number
  kategoriNama?: string
  isActive: boolean
}

interface KategoriOption {
  id: number
  nama: string
}

export default function FileEditPage() {
  const params = useParams()
  const router = useRouter()
  const [file, setFile] = useState<FileItem | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [formData, setFormData] = useState({
    judul: '',
    deskripsi: '',
    kategoriId: null as number | null
  })
  const [newFile, setNewFile] = useState<File | null>(null)
  const [kategoriOptions, setKategoriOptions] = useState<KategoriOption[]>([])

  const fileId = params.id as string

  useEffect(() => {
    setMounted(true)
    if (fileId) {
      fetchFileDetail()
      loadKategoriOptions()
    }
  }, [fileId])

  const fetchFileDetail = async () => {
    try {
      setLoading(true)
      const response = await fetch(getApiUrl(`/api/files/${fileId}`), {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setFile(data)
        setFormData({
          judul: data.judul || '',
          deskripsi: data.deskripsi || '',
          kategoriId: data.kategoriId || null
        })
      } else {
        showErrorToast('Gagal memuat detail file')
        router.push('/file-manager')
      }
    } catch (error) {
      console.error('Error fetching file detail:', error)
      showErrorToast('Gagal memuat detail file')
      router.push('/file-manager')
    } finally {
      setLoading(false)
    }
  }

  const loadKategoriOptions = async () => {
    try {
      const response = await fetch(getApiUrl('admin/master-data/file-kategori/active'), {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        setKategoriOptions(data)
      }
    } catch (error) {
      console.error('Error loading kategori options:', error)
    }
  }

  const uploadFileToTemp = async (file: File): Promise<string> => {
    const formData = new FormData()
    formData.append('file', file)

    const response = await fetch(getApiUrl('/api/temp-files/upload'), {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
      },
      body: formData
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.message || 'Gagal upload file')
    }

    const data = await response.json()
    return data.data?.fileName || data.fileName
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.judul.trim()) {
      showErrorToast('Judul file harus diisi')
      return
    }
    
    try {
      setSaving(true)
      
      let updateData: any = {
        title: formData.judul.trim(),
        description: formData.deskripsi.trim()
      }

      if (formData.kategoriId) {
        updateData.kategoriId = formData.kategoriId
      }
      
      // If new file is selected, upload it first
      if (newFile) {
        const tempFileName = await uploadFileToTemp(newFile)
        updateData.tempFileName = tempFileName
      }
      
      const response = await fetch(getApiUrl(`/api/files/${fileId}`), {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updateData)
      })

      if (response.ok) {
        showSuccessToast('File berhasil diperbarui')
        router.push(`/file-manager/${fileId}`)
      } else {
        const errorData = await response.json()
        showErrorToast(errorData.message || 'Gagal memperbarui file')
      }
    } catch (error) {
      console.error('Error updating file:', error)
      showErrorToast(error instanceof Error ? error.message : 'Gagal memperbarui file')
    } finally {
      setSaving(false)
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  if (!mounted) {
    return (
      <ProtectedRoute requireAuth={true}>
        <div className="container mx-auto p-6">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="flex flex-col items-center gap-2">
              <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" />
              <span className="text-muted-foreground">Memuat halaman...</span>
            </div>
          </div>
        </div>
      </ProtectedRoute>
    )
  }

  if (loading) {
    return (
      <ProtectedRoute requireAuth={true}>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="flex flex-col items-center gap-2">
            <LoadingSpinner />
            <span className="text-muted-foreground">Memuat file...</span>
          </div>
        </div>
      </ProtectedRoute>
    )
  }

  if (!file) {
    return (
      <ProtectedRoute requireAuth={true}>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">File tidak ditemukan</h3>
            <p className="text-muted-foreground mb-4">File yang Anda cari tidak ada atau telah dihapus</p>
            <Button onClick={() => router.push('/file-manager')}>
              Kembali ke File Manager
            </Button>
          </div>
        </div>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute requireAuth={true}>
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4">
          {/* Header */}
          <div className="flex items-center gap-4 mb-6">
            <Button
              variant="outline"
              onClick={() => router.push(`/file-manager/${fileId}`)}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Kembali
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Edit File</h1>
              <p className="text-gray-600">Edit informasi file: {file.originalName}</p>
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Edit Informasi File
              </CardTitle>
              <CardDescription>
                Perbarui informasi file yang sudah diupload
              </CardDescription>
            </CardHeader>
            
            <CardContent>
              {/* File Info (Read Only) */}
              <div className="bg-gray-50 p-6 rounded-lg mb-8">
                <h4 className="font-medium text-gray-900 mb-4">Informasi File</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Nama File:</span>
                    <p className="font-medium text-gray-900">{file.originalName}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Ukuran:</span>
                    <p className="font-medium text-gray-900">{formatFileSize(file.fileSize)}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Tipe:</span>
                    <p className="font-medium text-gray-900">{file.mimeType}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Status:</span>
                    <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                      file.isActive 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {file.isActive ? 'Aktif' : 'Nonaktif'}
                    </span>
                  </div>
                </div>
              </div>

              {/* File Upload Section */}
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Upload className="w-5 h-5" />
                    Ganti File (Opsional)
                  </CardTitle>
                  <CardDescription>
                    Upload file baru untuk menggantikan file yang ada
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="newFile">Pilih File Baru</Label>
                    <Input
                      id="newFile"
                      type="file"
                      onChange={(e) => setNewFile(e.target.files?.[0] || null)}
                      className="mt-1"
                    />
                    {newFile && (
                      <div className="mt-2 p-3 bg-blue-50 rounded-lg">
                        <p className="text-sm text-blue-800">
                          <strong>File baru dipilih:</strong> {newFile.name} ({(newFile.size / 1024 / 1024).toFixed(2)} MB)
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="judul">Judul File</Label>
                  <Input
                    id="judul"
                    value={formData.judul}
                    onChange={(e) => setFormData(prev => ({ ...prev, judul: e.target.value }))}
                    placeholder="Masukkan judul file"
                    className="h-12"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="deskripsi">Deskripsi</Label>
                  <Textarea
                    id="deskripsi"
                    value={formData.deskripsi}
                    onChange={(e) => setFormData(prev => ({ ...prev, deskripsi: e.target.value }))}
                    placeholder="Masukkan deskripsi file (opsional)"
                    rows={4}
                    className="resize-none"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="kategori">Kategori File</Label>
                  <SearchableSelectObject
                    options={kategoriOptions.map(kategori => ({
                      id: kategori.id,
                      label: kategori.nama
                    }))}
                    value={formData.kategoriId}
                    placeholder="📁 Pilih kategori..."
                    searchPlaceholder="Cari kategori..."
                    emptyText="Tidak ada kategori ditemukan"
                    onValueChange={(value) => setFormData(prev => ({ ...prev, kategoriId: value }))}
                    className="h-12 text-base border-2 border-gray-200 focus:border-blue-500 rounded-md"
                  />
                </div>

                <div className="flex gap-4 pt-6 border-t">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.push(`/file-manager/${fileId}`)}
                    disabled={saving}
                    size="lg"
                  >
                    Batal
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={saving}
                    size="lg"
                    className="min-w-32"
                  >
                    {saving ? (
                      <>
                        <LoadingSpinner className="mr-2" />
                        Menyimpan...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        Simpan Perubahan
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </ProtectedRoute>
  )
}
