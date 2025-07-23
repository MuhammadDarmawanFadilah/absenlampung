'use client'

import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { showErrorToast, showSuccessToast } from "@/components/ui/toast-utils"
import { ArrowLeft, Edit, Trash2, Download, FileText, User, FolderOpen, Calendar } from 'lucide-react'
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/AuthContext"
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog"
import { getApiUrl } from "@/lib/config"

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

export default function DetailFilePegawaiPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const router = useRouter()
  const { user } = useAuth()
  const [file, setFile] = useState<FilePegawaiResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [paramId, setParamId] = useState<string>('')

  useEffect(() => {
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
        const data = await response.json()
        setFile(data)
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

  const handleDownload = async () => {
    if (!file) return
    
    try {
      const response = await fetch(getApiUrl(`files/download/documents/${file.fileName}`), {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      })

      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = file.fileName
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
        
        showSuccessToast(`File ${file.fileName} berhasil diunduh`)
      } else {
        showErrorToast('Gagal mengunduh file')
      }
    } catch (error) {
      console.error('Error downloading file:', error)
      showErrorToast('Gagal mengunduh file')
    }
  }

  const handleEdit = () => {
    router.push(`/admin/file-pegawai/${paramId}/edit`)
  }

  const handleDelete = () => {
    setIsDeleteOpen(true)
  }

  const submitDelete = async () => {
    if (!file) return

    try {
      setLoading(true)
      const response = await fetch(getApiUrl(`admin/file-pegawai/${file.id}`), {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      })
      
      if (response.ok) {
        showSuccessToast('File pegawai berhasil dihapus')
        router.push('/admin/file-pegawai')
      } else {
        const errorData = await response.json()
        showErrorToast(errorData.message || 'Gagal menghapus file pegawai')
      }
    } catch (error) {
      console.error('Error deleting file:', error)
      showErrorToast('Gagal menghapus file pegawai')
    } finally {
      setLoading(false)
      setIsDeleteOpen(false)
    }
  }

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'N/A'
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(1024))
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i]
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!file) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">File tidak ditemukan</h2>
          <Button onClick={() => router.push('/admin/file-pegawai')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Kembali ke Daftar File
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="flex justify-between items-start mb-6">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              onClick={() => router.push('/admin/file-pegawai')}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Kembali
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{file.judul}</h1>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant={file.isActive ? "default" : "secondary"}>
                  {file.isActive ? "Aktif" : "Nonaktif"}
                </Badge>
                <Badge variant="outline">{file.kategoriNama}</Badge>
              </div>
            </div>
          </div>
          
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleDownload}
            >
              <Download className="w-4 h-4 mr-2" />
              Download
            </Button>
            <Button
              variant="outline"
              onClick={handleEdit}
            >
              <Edit className="w-4 h-4 mr-2" />
              Edit
            </Button>
            <Button
              variant="outline"
              onClick={handleDelete}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Hapus
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="space-y-6">
          {/* Basic Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Informasi File
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600">Judul File</label>
                    <p className="text-gray-900 font-medium">{file.judul}</p>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-gray-600">Nama File</label>
                    <p className="text-gray-900">{file.fileName}</p>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-gray-600">Tipe File</label>
                    <p className="text-gray-900">{file.fileType || 'N/A'}</p>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-gray-600">Ukuran File</label>
                    <p className="text-gray-900">{formatFileSize(file.fileSize)}</p>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600 flex items-center gap-2">
                      <User className="w-4 h-4" />
                      Pegawai
                    </label>
                    <p className="text-gray-900 font-medium">{file.pegawaiNama}</p>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-gray-600 flex items-center gap-2">
                      <FolderOpen className="w-4 h-4" />
                      Kategori
                    </label>
                    <p className="text-gray-900">{file.kategoriNama}</p>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-gray-600 flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      Tanggal Dibuat
                    </label>
                    <p className="text-gray-900">{formatDate(file.createdAt)}</p>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-gray-600 flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      Terakhir Diperbarui
                    </label>
                    <p className="text-gray-900">{formatDate(file.updatedAt)}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Description */}
          {file.deskripsi && (
            <Card>
              <CardHeader>
                <CardTitle>Deskripsi File</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="prose max-w-none">
                  <div className="whitespace-pre-wrap text-gray-900">
                    {file.deskripsi}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Delete Confirmation Dialog */}
        <ConfirmationDialog
          open={isDeleteOpen}
          onOpenChange={setIsDeleteOpen}
          title="Hapus File Pegawai"
          description={`Apakah Anda yakin ingin menghapus file "${file.judul}"? Tindakan ini tidak dapat dibatalkan.`}
          confirmText="Hapus"
          cancelText="Batal"
          variant="destructive"
          onConfirm={submitDelete}
          loading={loading}
        />
      </div>
    </div>
  )
}
