'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
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
import { Search, Plus, MoreHorizontal, Edit, Trash2, MapPin, AlertTriangle, Eye } from 'lucide-react'
import { AdminPageHeader } from "@/components/AdminPageHeader"
import AdminFilters from "@/components/AdminFilters"
import { useToast } from "@/hooks/use-toast"
import { getApiUrl } from "@/lib/config"

interface LokasiResponse {
  id: number
  namaLokasi: string
  latitude?: number
  longitude?: number
  radius?: number
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export default function LokasiKantorMasterDataPage() {
  const router = useRouter()
  const [lokasiList, setLokasiList] = useState<LokasiResponse[]>([])
  const [loading, setLoading] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [isToggleOpen, setIsToggleOpen] = useState(false)
  const [selectedLokasi, setSelectedLokasi] = useState<LokasiResponse | null>(null)
  
  const { toast } = useToast()

  const handleViewDetail = (lokasi: LokasiResponse) => {
    router.push(`/admin/master-data/lokasi-kantor/${lokasi.id}`)
  }
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(0)
  const [pageSize, setPageSize] = useState(25)
  const [totalElements, setTotalElements] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [sortBy, setSortBy] = useState('namaLokasi')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')
  
  // Load data from backend
  useEffect(() => {
    setMounted(true)
  }, [])
  
  useEffect(() => {
    if (mounted) {
      fetchLokasiList()
    }
  }, [mounted, currentPage, pageSize, sortBy, sortDir, searchTerm])

  const fetchLokasiList = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        size: pageSize.toString(),
        sort: `${sortBy},${sortDir}`,
        ...(searchTerm && { search: searchTerm })
      })

      const response = await fetch(getApiUrl(`/lokasi?${params}`), {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setLokasiList(data.content || [])
        setTotalElements(data.totalElements || 0)
        setTotalPages(data.totalPages || 0)
      } else {
        showErrorToast('Gagal memuat data lokasi kantor')
      }
    } catch (error) {
      showErrorToast('Terjadi kesalahan saat memuat data')
    } finally {
      setLoading(false)
    }
  }

  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(column)
      setSortDir('asc')
    }
  }

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  const handlePageSizeChange = (size: number) => {
    setPageSize(size)
    setCurrentPage(0)
  }

  const handleEdit = (lokasi: LokasiResponse) => {
    router.push(`/admin/master-data/lokasi-kantor/${lokasi.id}/edit`)
  }

  const openDeleteDialog = (lokasi: LokasiResponse) => {
    setSelectedLokasi(lokasi)
    setIsDeleteOpen(true)
  }

  const openToggleDialog = (lokasi: LokasiResponse) => {
    setSelectedLokasi(lokasi)
    setIsToggleOpen(true)
  }

  const handleDelete = async () => {
    if (!selectedLokasi) return

    setLoading(true)
    try {
      const response = await fetch(getApiUrl(`/lokasi/${selectedLokasi.id}`), {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      })

      if (response.ok) {
        showSuccessToast('Lokasi kantor berhasil dihapus')
        fetchLokasiList()
      } else {
        showErrorToast('Gagal menghapus lokasi kantor')
      }
    } catch (error) {
      showErrorToast('Terjadi kesalahan saat menghapus lokasi kantor')
    } finally {
      setLoading(false)
      setIsDeleteOpen(false)
      setSelectedLokasi(null)
    }
  }

  const handleToggleStatus = async () => {
    if (!selectedLokasi) return

    setLoading(true)
    try {
      const response = await fetch(getApiUrl(`/lokasi/${selectedLokasi.id}/toggle-status`), {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      })

      if (response.ok) {
        const newStatus = !selectedLokasi.isActive
        showSuccessToast(`Status lokasi kantor berhasil ${newStatus ? 'diaktifkan' : 'dinonaktifkan'}`)
        fetchLokasiList()
      } else {
        showErrorToast('Gagal mengubah status lokasi kantor')
      }
    } catch (error) {
      showErrorToast('Terjadi kesalahan saat mengubah status')
    } finally {
      setLoading(false)
      setIsToggleOpen(false)
      setSelectedLokasi(null)
    }
  }

  if (!mounted) return null

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Lokasi Kantor"
        description="Kelola data lokasi kantor dan koordinat"
        icon={MapPin}
        action={
          <Button onClick={() => router.push('/admin/master-data/lokasi-kantor/tambah')}>
            <Plus className="h-4 w-4 mr-2" />
            Tambah Lokasi
          </Button>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle>Daftar Lokasi Kantor</CardTitle>
          <CardDescription>
            Total {totalElements} lokasi kantor terdaftar
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AdminFilters
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            searchPlaceholder="Cari nama lokasi..."
          />

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px]">No</TableHead>
                  <SortableHeader
                    label="Nama Lokasi"
                    sortKey="namaLokasi"
                    currentSort={sortBy}
                    currentDirection={sortDir}
                    onSort={handleSort}
                  />
                  <TableHead>Koordinat</TableHead>
                  <TableHead>Radius</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[100px]">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center">
                      <LoadingSpinner size="sm" />
                    </TableCell>
                  </TableRow>
                ) : lokasiList.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground">
                      Tidak ada data lokasi kantor
                    </TableCell>
                  </TableRow>
                ) : (
                  lokasiList.map((lokasi, index) => (
                    <TableRow key={lokasi.id}>
                      <TableCell>{currentPage * pageSize + index + 1}</TableCell>
                      <TableCell className="font-medium">{lokasi.namaLokasi}</TableCell>
                      <TableCell>
                        {lokasi.latitude && lokasi.longitude ? (
                          <span className="text-sm">
                            {lokasi.latitude.toFixed(6)}, {lokasi.longitude.toFixed(6)}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {lokasi.radius ? `${lokasi.radius}m` : '-'}
                      </TableCell>
                      <TableCell>
                        <Badge variant={lokasi.isActive ? "default" : "secondary"}>
                          {lokasi.isActive ? "Aktif" : "Tidak Aktif"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleViewDetail(lokasi)}>
                              <Eye className="mr-2 h-4 w-4" />
                              Detail
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleEdit(lokasi)}>
                              <Edit className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => openToggleDialog(lokasi)}>
                              <Switch className="mr-2 h-4 w-4" />
                              {lokasi.isActive ? 'Nonaktifkan' : 'Aktifkan'}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => openDeleteDialog(lokasi)}
                              className="text-destructive"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
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

          {totalPages > 1 && (
            <div className="mt-6">
              <ServerPagination
                currentPage={currentPage}
                totalPages={totalPages}
                pageSize={pageSize}
                totalElements={totalElements}
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
        title="Konfirmasi Hapus"
        description={`Apakah Anda yakin ingin menghapus lokasi kantor "${selectedLokasi?.namaLokasi}"? Tindakan ini tidak dapat dibatalkan.`}
        onConfirm={handleDelete}
        confirmText="Hapus"
        confirmVariant="destructive"
        icon={AlertTriangle}
        loading={loading}
      />

      {/* Toggle Status Confirmation Dialog */}
      <ConfirmationDialog
        open={isToggleOpen}
        onOpenChange={setIsToggleOpen}
        title="Konfirmasi Perubahan Status"
        description={`Apakah Anda yakin ingin ${selectedLokasi?.isActive ? 'menonaktifkan' : 'mengaktifkan'} lokasi kantor "${selectedLokasi?.namaLokasi}"?`}
        onConfirm={handleToggleStatus}
        confirmText={selectedLokasi?.isActive ? 'Nonaktifkan' : 'Aktifkan'}
        icon={AlertTriangle}
        loading={loading}
      />
    </div>
  )
}
