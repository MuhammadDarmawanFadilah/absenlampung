'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog"
import { showErrorToast, showSuccessToast } from "@/components/ui/toast-utils"
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { ArrowLeft, FileText, User, Calendar, Download, Edit, Trash2 } from 'lucide-react'
import { AdminPageHeader } from "@/components/AdminPageHeader"
import { useAuth } from "@/contexts/AuthContext"
import { getApiUrl } from "@/lib/config"
import ProtectedRoute from "@/components/ProtectedRoute"

interface FileItem {
  id: string
  filename: string
  originalName: string
  judul: string
  deskripsi: string
  fileSize: number
  mimeType: string
  uploadedBy: string
  uploadedAt: string
  kategoriNama?: string
  isActive: boolean
}

export default function FileDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const [file, setFile] = useState<FileItem | null>(null)
  const [loading, setLoading] = useState(true)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [mounted, setMounted] = useState(false)

  const fileId = params.id as string

  useEffect(() => {
    setMounted(true)
    if (fileId) {
      fetchFileDetail()
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

  const handleDownload = async () => {
    if (!file) return

    try {
      const response = await fetch(getApiUrl(`/api/files/download/${file.filename}`), {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      })

      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = file.originalName
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
        
        showSuccessToast(`File ${file.originalName} berhasil diunduh`)
      } else {
        showErrorToast('Gagal mengunduh file')
      }
    } catch (error) {
      console.error('Error downloading file:', error)
      showErrorToast('Gagal mengunduh file')
    }
  }

  const handleEdit = () => {
    router.push(`/file-manager/${fileId}/edit`)
  }

  const handleDelete = () => {
    setIsDeleteOpen(true)
  }

  const submitDelete = async () => {
    if (!file) return

    try {
      setDeleteLoading(true)
      const response = await fetch(getApiUrl(`/api/files/${file.id}`), {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      })
      
      if (response.ok) {
        showSuccessToast('File berhasil dihapus')
        router.push('/file-manager')
      } else {
        const errorData = await response.json()
        showErrorToast(errorData.message || 'Gagal menghapus file')
      }
    } catch (error) {
      console.error('Error deleting file:', error)
      showErrorToast('Gagal menghapus file')
    } finally {
      setDeleteLoading(false)
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
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

  if (!mounted) {
    return (
      <ProtectedRoute requireAuth={true}>
        <div className="container mx-auto p-6">
          <div className="flex items-center justify-center min-h-[400px]">
            <LoadingSpinner />
          </div>
        </div>
      </ProtectedRoute>
    )
  }

  if (loading) {
    return (
      <ProtectedRoute requireAuth={true}>
        <div className="min-h-screen bg-background">
          <div className="container mx-auto p-6">
            <div className="flex items-center justify-center min-h-[400px]">
              <LoadingSpinner />
            </div>
          </div>
        </div>
      </ProtectedRoute>
    )
  }

  if (!file) {
    return (
      <ProtectedRoute requireAuth={true}>
        <div className="min-h-screen bg-background">
          <div className="container mx-auto p-6">
            <div className="flex items-center justify-center min-h-[400px]">
              <div className="text-center">
                <FileText className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h2 className="text-xl font-semibold mb-2">File tidak ditemukan</h2>
                <p className="text-muted-foreground mb-4">File yang Anda cari tidak dapat ditemukan.</p>
                <Button onClick={() => router.push('/file-manager')}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Kembali ke File Manager
                </Button>
              </div>
            </div>
          </div>
        </div>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute requireAuth={true}>
      <div className="min-h-screen bg-background">
        <AdminPageHeader
          title="Detail File"
          description="Informasi lengkap file yang diupload"
          icon={FileText}
          primaryAction={{
            label: "Download",
            onClick: handleDownload,
            icon: Download
          }}
          secondaryActions={[
            {
              label: "Edit",
              onClick: handleEdit,
              icon: Edit,
              variant: "outline"
            },
            {
              label: "Hapus",
              onClick: handleDelete,
              icon: Trash2,
              variant: "destructive"
            }
          ]}
          breadcrumb={[
            { label: "File Manager", href: "/file-manager" },
            { label: "Detail File" }
          ]}
        />

        <div className="container mx-auto p-6 space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Content */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Informasi File
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold mb-2">{file.judul}</h3>
                    {file.deskripsi && (
                      <p className="text-muted-foreground">{file.deskripsi}</p>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Nama File Asli</label>
                      <p className="text-sm mt-1">{file.originalName}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Ukuran File</label>
                      <p className="text-sm mt-1">{formatFileSize(file.fileSize)}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Tipe File</label>
                      <p className="text-sm mt-1">
                        <Badge variant="outline">{file.mimeType}</Badge>
                      </p>
                    </div>
                    {file.kategoriNama && (
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Kategori</label>
                        <p className="text-sm mt-1">
                          <Badge variant="secondary">{file.kategoriNama}</Badge>
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Informasi Upload
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Diupload oleh</label>
                    <p className="text-sm mt-1">{file.uploadedBy}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Tanggal Upload</label>
                    <p className="text-sm mt-1 flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {formatDate(file.uploadedAt)}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Status</label>
                    <p className="text-sm mt-1">
                      <Badge variant={file.isActive ? "default" : "secondary"}>
                        {file.isActive ? "Aktif" : "Nonaktif"}
                      </Badge>
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Aksi File</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button 
                    onClick={handleDownload} 
                    className="w-full"
                    size="sm"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download File
                  </Button>
                  <Button 
                    onClick={handleEdit} 
                    variant="outline" 
                    className="w-full"
                    size="sm"
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Detail
                  </Button>
                  <Button 
                    onClick={handleDelete} 
                    variant="destructive" 
                    className="w-full"
                    size="sm"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Hapus File
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        {/* Delete Confirmation Dialog */}
        <ConfirmationDialog
          open={isDeleteOpen}
          onOpenChange={setIsDeleteOpen}
          title="Hapus File"
          description={`Apakah Anda yakin ingin menghapus file "${file.judul}"? Tindakan ini tidak dapat dibatalkan.`}
          confirmText="Hapus"
          cancelText="Batal"
          variant="destructive"
          onConfirm={submitDelete}
          loading={deleteLoading}
        />
      </div>
    </ProtectedRoute>
  )
}
