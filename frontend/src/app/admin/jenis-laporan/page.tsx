"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { toast } from '@/hooks/use-toast';
import { 
  Search, 
  Plus, 
  Edit, 
  Trash2, 
  Eye,
  RefreshCw,
  Filter,
  MoreHorizontal,
  ChevronDown,
  ChevronRight,
  FileText,
  CheckCircle,
  Clock,
  XCircle
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { jenisLaporanAPI, JenisLaporan, JenisLaporanFilterRequest, JenisLaporanStats } from '@/lib/api';

// Status color mapping
const getStatusColor = (status: string) => {
  switch (status) {
    case 'AKTIF':
      return 'bg-green-100 text-green-800';
    case 'TIDAK_AKTIF':
      return 'bg-red-100 text-red-800';
    case 'DRAFT':
      return 'bg-gray-100 text-gray-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

// Status display names
const getStatusDisplay = (status: string) => {
  switch (status) {
    case 'AKTIF':
      return 'Aktif';
    case 'TIDAK_AKTIF':
      return 'Tidak Aktif';
    case 'DRAFT':
      return 'Draft';
    default:
      return status;
  }
};

export default function AdminJenisLaporanPage() {
  const router = useRouter();
  
  // State management
  const [jenisLaporan, setJenisLaporan] = useState<JenisLaporan[]>([]);
  const [stats, setStats] = useState<JenisLaporanStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [expandedItems, setExpandedItems] = useState<Set<number>>(new Set());
  
  // Dialog states
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedJenisLaporan, setSelectedJenisLaporan] = useState<JenisLaporan | null>(null);

  // Load data functions
  const loadStats = useCallback(async () => {
    try {
      const statsData = await jenisLaporanAPI.getStats();
      setStats(statsData);
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  }, []);

  const loadJenisLaporan = useCallback(async () => {
    try {
      setLoading(true);
      const filters: JenisLaporanFilterRequest = {
        page: currentPage,
        size: pageSize,
        sortBy: 'createdAt',
        sortDirection: 'desc',
      };

      if (searchQuery) {
        filters.nama = searchQuery;
      }
      if (selectedStatus && selectedStatus !== 'ALL') {
        filters.status = selectedStatus as any;
      }

      const response = await jenisLaporanAPI.searchWithTahapan(filters);
      setJenisLaporan(response.content);
      setTotalElements(response.totalElements);
      setTotalPages(response.totalPages);
    } catch (error) {
      console.error('Error loading jenis laporan:', error);
      toast({
        title: "Error",
        description: "Gagal memuat data jenis laporan",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [currentPage, pageSize, searchQuery, selectedStatus]);

  // Effects
  useEffect(() => {
    loadStats();
  }, [loadStats]);

  useEffect(() => {
    loadJenisLaporan();
  }, [loadJenisLaporan]);

  // Search handler with debounce
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setCurrentPage(0);
      loadJenisLaporan();
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  // Filter change handlers
  const handleStatusChange = (value: string) => {
    setSelectedStatus(value);
    setCurrentPage(0);
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedStatus('ALL');
    setCurrentPage(0);
  };

  // Navigation functions
  const handleCreate = () => {
    router.push('/admin/jenis-laporan/create');
  };

  const handleEdit = (jenisLaporan: JenisLaporan) => {
    router.push(`/admin/jenis-laporan/${jenisLaporan.jenisLaporanId}/edit`);
  };

  const handleView = (jenisLaporan: JenisLaporan) => {
    router.push(`/admin/jenis-laporan/${jenisLaporan.jenisLaporanId}`);
  };

  // Dialog handlers
  const openViewDialog = (jenisLaporan: JenisLaporan) => {
    setSelectedJenisLaporan(jenisLaporan);
    setIsViewDialogOpen(true);
  };

  const openDeleteDialog = (jenisLaporan: JenisLaporan) => {
    setSelectedJenisLaporan(jenisLaporan);
    setIsDeleteDialogOpen(true);
  };

  // Delete function
  const handleDelete = async () => {
    if (!selectedJenisLaporan) return;

    try {
      await jenisLaporanAPI.delete(selectedJenisLaporan.jenisLaporanId);
      toast({
        title: "Sukses",
        description: "Jenis laporan berhasil dihapus",
      });
      setIsDeleteDialogOpen(false);
      setSelectedJenisLaporan(null);
      loadJenisLaporan();
      loadStats();
    } catch (error: any) {
      console.error('Error deleting jenis laporan:', error);
      toast({
        title: "Error",
        description: error.message || "Gagal menghapus jenis laporan",
        variant: "destructive",
      });
    }
  };

  // Expand/collapse handlers
  const toggleExpanded = async (jenisLaporanId: number) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(jenisLaporanId)) {
      newExpanded.delete(jenisLaporanId);
    } else {
      newExpanded.add(jenisLaporanId);
    }
    setExpandedItems(newExpanded);
  };

  // Pagination
  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
  };

  const handlePageSizeChange = (newSize: string) => {
    setPageSize(parseInt(newSize));
    setCurrentPage(0);
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Manajemen Jenis Laporan</h1>
          <p className="text-muted-foreground">
            Kelola jenis laporan dan tahapan proses dalam sistem
          </p>
        </div>
        <Button onClick={handleCreate} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Tambah Jenis Laporan
        </Button>
      </div>

      {/* Statistics Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <FileText className="h-8 w-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">Total Jenis</p>
                  <p className="text-2xl font-bold">{stats.total}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <CheckCircle className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">Aktif</p>
                  <p className="text-2xl font-bold">{stats.totalAktif}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <XCircle className="h-8 w-8 text-red-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">Tidak Aktif</p>
                  <p className="text-2xl font-bold">{stats.totalTidakAktif}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Clock className="h-8 w-8 text-gray-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">Draft</p>
                  <p className="text-2xl font-bold">{stats.totalDraft}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Filter & Pencarian
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="search">Cari Jenis Laporan</Label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Nama jenis laporan..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={selectedStatus} onValueChange={handleStatusChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Semua Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Semua Status</SelectItem>
                  <SelectItem value="AKTIF">Aktif</SelectItem>
                  <SelectItem value="TIDAK_AKTIF">Tidak Aktif</SelectItem>
                  <SelectItem value="DRAFT">Draft</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>&nbsp;</Label>
              <div className="flex gap-2">
                <Button variant="outline" onClick={clearFilters} className="flex-1">
                  Reset Filter
                </Button>
                <Button variant="outline" onClick={loadJenisLaporan}>
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Data Table */}
      <Card>
        <CardHeader>
          <CardTitle>Daftar Jenis Laporan</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center items-center py-8">
              <RefreshCw className="h-8 w-8 animate-spin" />
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12"></TableHead>
                    <TableHead>Nama Jenis Laporan</TableHead>
                    <TableHead>Deskripsi</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Jumlah Tahapan</TableHead>
                    <TableHead>Tanggal Dibuat</TableHead>
                    <TableHead className="text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {jenisLaporan.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8">
                        Tidak ada data jenis laporan
                      </TableCell>
                    </TableRow>
                  ) : (
                    jenisLaporan.map((item) => (
                      <React.Fragment key={item.jenisLaporanId}>
                        <TableRow className="cursor-pointer hover:bg-gray-50">
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => toggleExpanded(item.jenisLaporanId)}
                            >
                              {expandedItems.has(item.jenisLaporanId) ? (
                                <ChevronDown className="h-4 w-4" />
                              ) : (
                                <ChevronRight className="h-4 w-4" />
                              )}
                            </Button>
                          </TableCell>
                          <TableCell className="font-medium">
                            {item.nama}
                          </TableCell>
                          <TableCell className="max-w-xs truncate">
                            {item.deskripsi}
                          </TableCell>
                          <TableCell>
                            <Badge className={getStatusColor(item.status)}>
                              {getStatusDisplay(item.status)}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline">
                                {item.tahapanList?.length || 0} tahapan
                              </Badge>
                            </div>
                          </TableCell>
                          <TableCell>
                            {new Date(item.createdAt).toLocaleDateString('id-ID')}
                          </TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="h-8 w-8 p-0">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Aksi</DropdownMenuLabel>
                                <DropdownMenuItem onClick={() => handleView(item)}>
                                  <Eye className="mr-2 h-4 w-4" />
                                  Lihat Detail
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleEdit(item)}>
                                  <Edit className="mr-2 h-4 w-4" />
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem 
                                  onClick={() => openDeleteDialog(item)}
                                  className="text-red-600"
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Hapus
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>

                        {/* Expanded Row */}
                        {expandedItems.has(item.jenisLaporanId) && (
                          <TableRow>
                            <TableCell colSpan={7} className="bg-gray-50 p-0">
                              <div className="p-4 space-y-4">
                                <h4 className="font-medium text-sm">Tahapan Laporan:</h4>
                                {item.tahapanList && item.tahapanList.length > 0 ? (
                                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                    {item.tahapanList
                                      .sort((a, b) => (a.urutanTahapan || 0) - (b.urutanTahapan || 0))
                                      .map((tahapan) => (
                                        <Card key={tahapan.tahapanLaporanId} className="border-l-4 border-l-blue-500">
                                          <CardContent className="p-3">
                                            <div className="flex items-start justify-between">
                                              <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-1">
                                                  <Badge variant="outline" className="text-xs">
                                                    Urutan {tahapan.urutanTahapan}
                                                  </Badge>
                                                </div>
                                                <h5 className="font-medium text-sm">{tahapan.nama}</h5>
                                                <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                                                  {tahapan.deskripsi}
                                                </p>
                                                {tahapan.jenisFileIzin && (
                                                  <div className="flex flex-wrap gap-1 mt-2">
                                                    {tahapan.jenisFileIzin.slice(0, 3).map((type: string, index: number) => (
                                                      <Badge key={index} variant="secondary" className="text-xs">
                                                        {type}
                                                      </Badge>
                                                    ))}
                                                    {tahapan.jenisFileIzin.length > 3 && (
                                                      <Badge variant="secondary" className="text-xs">
                                                        +{tahapan.jenisFileIzin.length - 3}
                                                      </Badge>
                                                    )}
                                                  </div>
                                                )}
                                                {tahapan.templateTahapan && (
                                                  <div className="text-xs text-blue-600 mt-1">
                                                    Template tersedia
                                                  </div>
                                                )}
                                              </div>
                                            </div>
                                          </CardContent>
                                        </Card>
                                      ))}
                                  </div>
                                ) : (
                                  <p className="text-sm text-gray-500">Tidak ada tahapan</p>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        )}
                      </React.Fragment>
                    ))
                  )}
                </TableBody>
              </Table>

              {/* Pagination */}
              <div className="flex items-center justify-between space-x-2 py-4">
                <div className="flex items-center space-x-2">
                  <p className="text-sm font-medium">Rows per page</p>
                  <Select
                    value={pageSize.toString()}
                    onValueChange={handlePageSizeChange}
                  >
                    <SelectTrigger className="h-8 w-[70px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent side="top">
                      <SelectItem value="5">5</SelectItem>
                      <SelectItem value="10">10</SelectItem>
                      <SelectItem value="25">25</SelectItem>
                      <SelectItem value="50">50</SelectItem>
                      <SelectItem value="100">100</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex items-center space-x-6 lg:space-x-8">
                  <div className="flex w-[100px] items-center justify-center text-sm font-medium">
                    Page {currentPage + 1} of {totalPages}
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      className="h-8 w-8 p-0"
                      onClick={() => handlePageChange(0)}
                      disabled={currentPage === 0}
                    >
                      {'<<'}
                    </Button>
                    <Button
                      variant="outline"
                      className="h-8 w-8 p-0"
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 0}
                    >
                      {'<'}
                    </Button>
                    <Button
                      variant="outline"
                      className="h-8 w-8 p-0"
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage >= totalPages - 1}
                    >
                      {'>'}
                    </Button>
                    <Button
                      variant="outline"
                      className="h-8 w-8 p-0"
                      onClick={() => handlePageChange(totalPages - 1)}
                      disabled={currentPage >= totalPages - 1}
                    >
                      {'>>'}
                    </Button>
                  </div>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* View Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detail Jenis Laporan</DialogTitle>
            <DialogDescription>
              Informasi lengkap tentang jenis laporan dan tahapan-tahapannya.
            </DialogDescription>
          </DialogHeader>
          
          {selectedJenisLaporan && (
            <div className="space-y-6">
              {/* Basic Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Informasi Dasar</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Nama Jenis Laporan</Label>
                      <p className="mt-1 font-medium">{selectedJenisLaporan.nama}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Status</Label>
                      <div className="mt-1">
                        <Badge className={getStatusColor(selectedJenisLaporan.status)}>
                          {getStatusDisplay(selectedJenisLaporan.status)}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Deskripsi</Label>
                    <p className="mt-1 text-sm">{selectedJenisLaporan.deskripsi}</p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Tanggal Dibuat</Label>
                      <p className="mt-1 text-sm">{new Date(selectedJenisLaporan.createdAt).toLocaleDateString('id-ID')}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Terakhir Diupdate</Label>
                      <p className="mt-1 text-sm">{new Date(selectedJenisLaporan.updatedAt).toLocaleDateString('id-ID')}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Tahapan */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">
                    Tahapan Laporan ({selectedJenisLaporan.tahapanList?.length || 0} tahapan)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {selectedJenisLaporan.tahapanList && selectedJenisLaporan.tahapanList.length > 0 ? (
                    <div className="space-y-4">
                      {selectedJenisLaporan.tahapanList
                        .sort((a, b) => (a.urutanTahapan || 0) - (b.urutanTahapan || 0))
                        .map((tahapan) => (
                          <Card key={tahapan.tahapanLaporanId} className="border-l-4 border-l-blue-500">
                            <CardContent className="p-4">
                              <div className="flex items-start justify-between mb-3">
                                <div className="flex items-center gap-2">
                                  <Badge variant="outline">
                                    Urutan {tahapan.urutanTahapan}
                                  </Badge>
                                  <h4 className="font-medium">{tahapan.nama}</h4>
                                </div>
                              </div>
                              <p className="text-sm text-gray-600 mb-3">{tahapan.deskripsi}</p>
                              {tahapan.jenisFileIzin && tahapan.jenisFileIzin.length > 0 && (
                                <div className="mb-3">
                                  <Label className="text-xs font-medium text-muted-foreground">Tipe File yang Diizinkan:</Label>
                                  <div className="flex flex-wrap gap-1 mt-1">
                                    {tahapan.jenisFileIzin.map((type: string, index: number) => (
                                      <Badge key={index} variant="secondary" className="text-xs">
                                        {type.toUpperCase()}
                                      </Badge>
                                    ))}
                                  </div>
                                </div>
                              )}
                              {tahapan.templateTahapan && (
                                <div>
                                  <Label className="text-xs font-medium text-muted-foreground">Template:</Label>
                                  <p className="text-xs text-blue-600 mt-1">{tahapan.templateTahapan}</p>
                                </div>
                              )}
                            </CardContent>
                          </Card>
                        ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500 text-center py-4">Tidak ada tahapan</p>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>
              Tutup
            </Button>
            {selectedJenisLaporan && (
              <Button onClick={() => handleEdit(selectedJenisLaporan)}>
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Apakah Anda yakin?</AlertDialogTitle>
            <AlertDialogDescription>
              Tindakan ini tidak dapat dibatalkan. Jenis laporan "{selectedJenisLaporan?.nama}" 
              dan semua tahapannya akan dihapus secara permanen.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
