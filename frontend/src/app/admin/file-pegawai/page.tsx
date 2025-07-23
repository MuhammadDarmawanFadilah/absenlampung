'use client'

import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog"
import { showErrorToast, showSuccessToast } from "@/components/ui/toast-utils"
import { SortableHeader } from '@/components/ui/sortable-header'
import { ServerPagination } from '@/components/ServerPagination'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { Search, Plus, MoreHorizontal, Edit, Trash2, FileText, AlertTriangle, Eye, Download } from 'lucide-react'
import { AdminPageHeader } from "@/components/AdminPageHeader"
import AdminFilters from "@/components/AdminFilters"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/contexts/AuthContext"
import { useRouter } from "next/navigation"
import { getApiUrl } from "@/lib/config"

interface FilePegawaiGroupResponse {
  id: number
  pegawaiId: number
  pegawaiNama: string
  kategoriId: number
  kategoriNama: string
  isActive: boolean
  createdAt: string
  updatedAt: string
  files: FilePegawaiFileInfo[]
}

interface FilePegawaiFileInfo {
  id: number
  judul: string
  deskripsi?: string
  fileName: string
  fileType?: string
  fileSize?: number
  isActive: boolean
  createdAt: string
  updatedAt: string
}

interface PegawaiOption {
  id: number
  fullName: string
}

interface KategoriOption {
  id: number
  nama: string
}

export default function FilePegawaiPage() {
  const [fileList, setFileList] = useState<FilePegawaiGroupResponse[]>([])
  const [loading, setLoading] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedPegawai, setSelectedPegawai] = useState<number | null>(null)
  const [selectedKategori, setSelectedKategori] = useState<number | null>(null)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [isToggleOpen, setIsToggleOpen] = useState(false)
  const [selectedFile, setSelectedFile] = useState<FilePegawaiGroupResponse | null>(null)
  const [pegawaiOptions, setPegawaiOptions] = useState<PegawaiOption[]>([])
  const [kategoriOptions, setKategoriOptions] = useState<KategoriOption[]>([])
  
  const { toast } = useToast()
  const { user } = useAuth()
  const router = useRouter()

  const handleViewDetail = (file: FilePegawaiGroupResponse) => {
    router.push(`/admin/file-pegawai/${file.id}`)
  }
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(0)
  const [pageSize, setPageSize] = useState(25)
  const [totalElements, setTotalElements] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [sortBy, setSortBy] = useState('createdAt')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')
  
  // Load data from backend
  useEffect(() => {
    setMounted(true)
  }, [])
  
  useEffect(() => {
    if (mounted) {
      loadFileData()
      loadPegawaiOptions()
      loadKategoriOptions()
    }
  }, [mounted, currentPage, pageSize, searchTerm, selectedPegawai, selectedKategori, sortBy, sortDir])

  const loadFileData = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: currentPage.toString(),
        size: pageSize.toString(),
        sortBy,
        sortDir
      })
      
      if (searchTerm) params.append('search', searchTerm)
      if (selectedPegawai) params.append('pegawaiId', selectedPegawai.toString())
      if (selectedKategori) params.append('kategoriId', selectedKategori.toString())
      
      const response = await fetch(
        getApiUrl(`api/admin/file-pegawai?${params.toString()}`),
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
          }
        }
      )
      
      if (response.ok) {
        const data = await response.json()
        setFileList(data.content || [])
        setTotalElements(data.totalElements || 0)
        setTotalPages(data.totalPages || 0)
      } else {
        showErrorToast('Gagal memuat data file pegawai')
      }
    } catch (error) {
      console.error('Error loading file data:', error)
      showErrorToast('Gagal memuat data file pegawai')
    } finally {
      setLoading(false)
    }
  }

  const loadPegawaiOptions = async () => {
    try {
      const response = await fetch(getApiUrl('api/pegawai/active'), {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        setPegawaiOptions(data)
      }
    } catch (error) {
      console.error('Error loading pegawai options:', error)
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

  const handleSort = (newSortBy: string, newSortDir: 'asc' | 'desc') => {
    setSortBy(newSortBy)
    setSortDir(newSortDir)
    setCurrentPage(0) // Reset to first page when sorting
  }

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }
  
  const handlePageSizeChange = (size: number) => {
    setPageSize(size)
    setCurrentPage(0) // Reset to first page when changing page size
  }

  const handleSearchChange = (value: string) => {
    setSearchTerm(value)
    setCurrentPage(0) // Reset to first page when searching
  }

  const handleCreate = () => {
    router.push('/admin/file-pegawai/buat')
  }
  
  const handleEdit = (file: FilePegawaiGroupResponse) => {
    router.push(`/admin/file-pegawai/${file.id}/edit`)
  }
  
  const handleDelete = (file: FilePegawaiGroupResponse) => {
    setSelectedFile(file)
    setIsDeleteOpen(true)
  }

  const handleToggle = (file: FilePegawaiGroupResponse) => {
    setSelectedFile(file)
    setIsToggleOpen(true)
  }

  const handleDownload = async (file: FilePegawaiGroupResponse) => {
    try {
      // For grouped files, download the first file or show a selection dialog
      const firstFile = file.files[0]
      if (!firstFile) return
      
      const response = await fetch(getApiUrl(`files/download/documents/${firstFile.fileName}`), {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      })

      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = firstFile.fileName
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
        
        showSuccessToast(`File ${firstFile.fileName} berhasil diunduh`)
      } else {
        showErrorToast('Gagal mengunduh file')
      }
    } catch (error) {
      console.error('Error downloading file:', error)
      showErrorToast('Gagal mengunduh file')
    }
  }
  
  const submitDelete = async () => {
    if (!selectedFile) return

    try {
      setLoading(true)
      const response = await fetch(getApiUrl(`api/admin/file-pegawai/${selectedFile.id}`), {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      })
      
      if (response.ok) {
        showSuccessToast('File pegawai berhasil dihapus')
        setIsDeleteOpen(false)
        setSelectedFile(null)
        loadFileData()
      } else {
        const errorData = await response.json()
        showErrorToast(errorData.message || 'Gagal menghapus file pegawai')
      }
    } catch (error) {
      console.error('Error deleting file:', error)
      showErrorToast('Gagal menghapus file pegawai')
    } finally {
      setLoading(false)
    }
  }
  
  const submitToggle = async () => {
    if (!selectedFile) return
    
    try {
      setLoading(true)
      const response = await fetch(getApiUrl(`api/admin/file-pegawai/${selectedFile.id}/toggle-active`), {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      })
      
      if (response.ok) {
        showSuccessToast(`Status file berhasil ${selectedFile.isActive ? 'dinonaktifkan' : 'diaktifkan'}`)
        setIsToggleOpen(false)
        loadFileData()
      } else {
        const errorData = await response.json()
        showErrorToast(errorData.message || 'Gagal mengubah status file')
      }
    } catch (error) {
      console.error('Error toggling file status:', error)
      showErrorToast('Gagal mengubah status file')
    } finally {
      setLoading(false)
    }
  }

  const formatFileSize = (bytes?: number) => {
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
  
  return (
    <div className="min-h-screen bg-background">
      <AdminPageHeader
        title="File Pegawai"
        description="Kelola file pegawai dalam sistem"
        icon={FileText}
        primaryAction={{
          label: "Tambah File",
          onClick: handleCreate,
          icon: Plus
        }}
        stats={[
          {
            label: "Total Grup File",
            value: totalElements,
            variant: "secondary"
          }
        ]}
      />

      <div className="container mx-auto p-6 space-y-6">
        {/* Filters */}
        <AdminFilters
          searchValue={searchTerm}
          onSearchChange={handleSearchChange}
          pageSize={pageSize}
          onPageSizeChange={handlePageSizeChange}
          searchPlaceholder="Cari judul atau deskripsi file..."
          totalItems={totalElements}
          currentItems={fileList.length}
        />

        {/* Additional Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Filter Pegawai</label>
                <select 
                  className="w-full p-2 border rounded-md"
                  value={selectedPegawai || ''}
                  onChange={(e) => {
                    setSelectedPegawai(e.target.value ? Number(e.target.value) : null)
                    setCurrentPage(0)
                  }}
                >
                  <option value="">Semua Pegawai</option>
                  {pegawaiOptions.map(pegawai => (
                    <option key={pegawai.id} value={pegawai.id}>
                      {pegawai.fullName}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Filter Kategori</label>
                <select 
                  className="w-full p-2 border rounded-md"
                  value={selectedKategori || ''}
                  onChange={(e) => {
                    setSelectedKategori(e.target.value ? Number(e.target.value) : null)
                    setCurrentPage(0)
                  }}
                >
                  <option value="">Semua Kategori</option>
                  {kategoriOptions.map(kategori => (
                    <option key={kategori.id} value={kategori.id}>
                      {kategori.nama}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Data File Pegawai</CardTitle>
            <CardDescription>
              Daftar grup file pegawai yang tersedia dalam sistem. File dengan pegawai dan kategori yang sama akan digrup menjadi satu data.
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            {/* Table */}
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>
                      <SortableHeader
                        sortKey="judul"
                        currentSort={{ sortBy, sortDir }}
                        onSort={handleSort}
                      >
                        File/Grup File
                      </SortableHeader>
                    </TableHead>
                    <TableHead>
                      <SortableHeader
                        sortKey="pegawaiNama"
                        currentSort={{ sortBy, sortDir }}
                        onSort={handleSort}
                      >
                        Pegawai
                      </SortableHeader>
                    </TableHead>
                    <TableHead>
                      <SortableHeader
                        sortKey="kategoriNama"
                        currentSort={{ sortBy, sortDir }}
                        onSort={handleSort}
                      >
                        Kategori
                      </SortableHeader>
                    </TableHead>
                    <TableHead>File</TableHead>
                    <TableHead>
                      <SortableHeader
                        sortKey="createdAt"
                        currentSort={{ sortBy, sortDir }}
                        onSort={handleSort}
                      >
                        Tanggal
                      </SortableHeader>
                    </TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-32">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-12">
                        <LoadingSpinner />
                      </TableCell>
                    </TableRow>
                  ) : fileList.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-12">
                        <div className="flex flex-col items-center gap-2">
                          <FileText className="h-8 w-8 text-muted-foreground" />
                          <span className="text-muted-foreground">
                            {searchTerm || selectedPegawai || selectedKategori ? 'Tidak ada grup file yang ditemukan' : 'Belum ada data file pegawai'}
                          </span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    fileList.map((file: FilePegawaiGroupResponse) => (
                      <TableRow key={file.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">
                              {file.files.length > 1 
                                ? `${file.files.length} File` 
                                : file.files[0]?.judul || 'Tidak ada file'}
                            </div>
                            {file.files.length === 1 && file.files[0]?.deskripsi && (
                              <div className="text-sm text-muted-foreground truncate max-w-xs">
                                {file.files[0].deskripsi}
                              </div>
                            )}
                            {file.files.length > 1 && (
                              <div className="text-sm text-muted-foreground">
                                {file.files.map(f => f.judul).join(', ').slice(0, 100)}...
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{file.pegawaiNama}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{file.kategoriNama}</Badge>
                        </TableCell>
                        <TableCell>
                          <div>
                            {file.files.length > 1 ? (
                              <div>
                                <div className="text-sm font-medium">{file.files.length} Files</div>
                                <div className="text-xs text-muted-foreground">
                                  Various formats
                                </div>
                              </div>
                            ) : (
                              <div>
                                <div className="text-sm font-medium">{file.files[0]?.fileName}</div>
                                <div className="text-xs text-muted-foreground">
                                  {file.files[0]?.fileType} • {formatFileSize(file.files[0]?.fileSize)}
                                </div>
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {new Date(file.createdAt).toLocaleDateString('id-ID')}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {user?.role?.roleName === 'ADMIN' && (
                              <Switch
                                checked={file.isActive}
                                onCheckedChange={() => handleToggle(file)}
                              />
                            )}
                            <Badge variant={file.isActive ? "default" : "secondary"}>
                              {file.isActive ? "Aktif" : "Nonaktif"}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleViewDetail(file)}>
                                <Eye className="h-4 w-4 mr-2" />
                                Detail
                              </DropdownMenuItem>
                              {file.files.length === 1 && (
                                <DropdownMenuItem onClick={() => handleDownload(file)}>
                                  <Download className="h-4 w-4 mr-2" />
                                  Download
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem onClick={() => handleEdit(file)}>
                                <Edit className="h-4 w-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => handleDelete(file)}
                                className="text-destructive"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Hapus
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
            
            {/* Pagination */}
            {totalPages > 1 && (
              <div className="border-t border-gray-200 dark:border-gray-700">
                <ServerPagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  totalElements={totalElements}
                  pageSize={pageSize}
                  onPageChange={handlePageChange}
                  onPageSizeChange={handlePageSizeChange}
                />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Delete Confirmation Dialog */}
        <ConfirmationDialog
          open={isDeleteOpen}
          onOpenChange={setIsDeleteOpen}
          title="Hapus File Pegawai"
          description={`Apakah Anda yakin ingin menghapus ${selectedFile?.files.length === 1 ? 'file' : `${selectedFile?.files.length} file`} untuk "${selectedFile?.pegawaiNama}"? Tindakan ini tidak dapat dibatalkan.`}
          confirmText="Hapus"
          cancelText="Batal"
          variant="destructive"
          onConfirm={submitDelete}
          loading={loading}
        />

        {/* Toggle Status Confirmation Dialog */}
        <ConfirmationDialog
          open={isToggleOpen}
          onOpenChange={setIsToggleOpen}
          title={`${selectedFile?.isActive ? 'Nonaktifkan' : 'Aktifkan'} File`}
          description={`Apakah Anda yakin ingin ${selectedFile?.isActive ? 'menonaktifkan' : 'mengaktifkan'} ${selectedFile?.files.length === 1 ? 'file' : `${selectedFile?.files.length} file`} untuk "${selectedFile?.pegawaiNama}"?`}
          confirmText={selectedFile?.isActive ? 'Nonaktifkan' : 'Aktifkan'}
          cancelText="Batal"
          variant={selectedFile?.isActive ? "destructive" : "default"}
          onConfirm={submitToggle}
          loading={loading}
        />
      </div>
    </div>
  )
}
