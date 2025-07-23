"use client";

import React, { useState, useEffect } from 'react';
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { toast } from '@/hooks/use-toast';
import { 
  Plus,
  Search,
  Filter,
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  RefreshCw,
  FileText,
  ChevronLeft,
  ChevronRight,
  BarChart3,
  Calendar,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  SortAsc,
  SortDesc,
  User
} from 'lucide-react';
import { laporanAPI, Laporan, LaporanFilterRequest, LaporanPageResponse } from '@/lib/laporan-api';

export default function LaporanListPage() {
  const router = useRouter();
  
  // Data state
  const [laporanList, setLaporanList] = useState<Laporan[]>([]);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    aktif: 0,
    tidakAktif: 0,
    draft: 0
  });
  
  // Pagination state
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  
  // Filter state
  const [filters, setFilters] = useState<LaporanFilterRequest>({
    page: 0,
    size: 10,
    sortBy: 'updatedAt',
    sortDirection: 'desc',
    namaLaporan: '',
    status: 'ALL',
    jenisLaporanNama: ''
  });
  
  // UI state
  const [deletingId, setDeletingId] = useState<number | null>(null);
  
  // Load data on mount and filter changes
  useEffect(() => {
    loadLaporanData();
  }, [filters]);
  
  // Update stats when laporan list changes
  useEffect(() => {
    loadStats();
  }, [laporanList]);
  
  const loadLaporanData = async () => {
    try {
      setLoading(true);
      const response: LaporanPageResponse = await laporanAPI.getAll(filters);
      setLaporanList(response.content);
      setTotalElements(response.totalElements);
      setTotalPages(response.totalPages);
    } catch (error: any) {
      console.error('Error loading laporan:', error);
      toast({
        title: "Error",
        description: error.message || "Gagal memuat data laporan",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };
  
  const loadStats = async () => {
    try {
      // Calculate stats from loaded data instead of separate API call
      const total = laporanList.length;
      const aktif = laporanList.filter(l => l.status === 'AKTIF').length;
      const tidakAktif = laporanList.filter(l => l.status === 'TIDAK_AKTIF').length;
      const draft = laporanList.filter(l => l.status === 'DRAFT').length;
      
      setStats({
        total,
        aktif,
        tidakAktif,
        draft
      });
    } catch (error: any) {
      console.error('Error calculating stats:', error);
    }
  };
  
  // Filter functions
  const handleFilterChange = (field: keyof LaporanFilterRequest, value: string | number) => {
    setFilters({
      ...filters,
      [field]: value,
      page: 0 // Reset to first page when filtering
    });
  };
  
  const handleSearch = () => {
    setFilters({ ...filters, page: 0 });
  };
  
  const clearFilters = () => {
    setFilters({
      page: 0,
      size: filters.size,
      sortBy: 'updatedAt',
      sortDirection: 'desc',
      namaLaporan: '',
      status: 'ALL',
      jenisLaporanNama: ''
    });
  };
  
  // Pagination
  const handlePageChange = (newPage: number) => {
    if (newPage >= 0 && newPage < totalPages) {
      setFilters({ ...filters, page: newPage });
    }
  };
  
  // Sorting
  const handleSort = (field: string) => {
    const newDirection = filters.sortBy === field && filters.sortDirection === 'asc' ? 'desc' : 'asc';
    setFilters({
      ...filters,
      sortBy: field,
      sortDirection: newDirection,
      page: 0
    });
  };
  
  // CRUD actions
  const handleCreate = () => {
    router.push('/admin/laporan/create');
  };
  
  const handleView = (id: number) => {
    router.push(`/admin/laporan/${id}`);
  };
  
  const handleEdit = (id: number) => {
    router.push(`/admin/laporan/${id}/edit`);
  };
  
  const handleDelete = async (id: number) => {
    try {
      setDeletingId(id);
      await laporanAPI.delete(id);
      toast({
        title: "Sukses",
        description: "Laporan berhasil dihapus",
      });
      loadLaporanData();
      loadStats();
    } catch (error: any) {
      console.error('Error deleting laporan:', error);
      toast({
        title: "Error",
        description: error.message || "Gagal menghapus laporan",
        variant: "destructive",
      });
    } finally {
      setDeletingId(null);
    }
  };
  
  // Status styling
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
  
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'AKTIF':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'TIDAK_AKTIF':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'DRAFT':
        return <Clock className="h-4 w-4 text-gray-600" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-600" />;
    }
  };
  
  const getSortIcon = (field: string) => {
    if (filters.sortBy !== field) return null;
    return filters.sortDirection === 'asc' ? 
      <SortAsc className="h-4 w-4" /> : 
      <SortDesc className="h-4 w-4" />;
  };

  return (
    <div className="container mx-auto py-8 px-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Manajemen Laporan</h1>
          <p className="text-muted-foreground">
            Kelola semua laporan dalam sistem
          </p>
        </div>
        <Button onClick={handleCreate} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Buat Laporan Baru
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Laporan</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <BarChart3 className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Aktif</p>
                <p className="text-2xl font-bold text-green-600">{stats.aktif}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Draft</p>
                <p className="text-2xl font-bold text-gray-600">{stats.draft}</p>
              </div>
              <Clock className="h-8 w-8 text-gray-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Tidak Aktif</p>
                <p className="text-2xl font-bold text-red-600">{stats.tidakAktif}</p>
              </div>
              <XCircle className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Jenis Laporan Unik</p>
                <p className="text-2xl font-bold text-purple-600">{[...new Set(laporanList.map(l => l.jenisLaporanId))].length}</p>
              </div>
              <FileText className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filter & Pencarian
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div>
              <Label htmlFor="namaLaporan">Nama Laporan</Label>
              <Input
                id="namaLaporan"
                placeholder="Cari nama laporan..."
                value={filters.namaLaporan}
                onChange={(e) => handleFilterChange('namaLaporan', e.target.value)}
                className="mt-1"
              />
            </div>
            
            <div>
              <Label htmlFor="jenisLaporanNama">Jenis Laporan</Label>
              <Input
                id="jenisLaporanNama"
                placeholder="Cari jenis laporan..."
                value={filters.jenisLaporanNama}
                onChange={(e) => handleFilterChange('jenisLaporanNama', e.target.value)}
                className="mt-1"
              />
            </div>
            
            <div>
              <Label htmlFor="status">Status</Label>
              <Select value={filters.status} onValueChange={(value) => handleFilterChange('status', value)}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Semua status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Semua Status</SelectItem>
                  <SelectItem value="AKTIF">Aktif</SelectItem>
                  <SelectItem value="TIDAK_AKTIF">Tidak Aktif</SelectItem>
                  <SelectItem value="DRAFT">Draft</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="size">Per Halaman</Label>
              <Select value={filters.size.toString()} onValueChange={(value) => handleFilterChange('size', parseInt(value))}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5 per halaman</SelectItem>
                  <SelectItem value="10">10 per halaman</SelectItem>
                  <SelectItem value="25">25 per halaman</SelectItem>
                  <SelectItem value="50">50 per halaman</SelectItem>
                  <SelectItem value="100">100 per halaman</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-end gap-2">
              <Button onClick={handleSearch} className="flex items-center gap-2">
                <Search className="h-4 w-4" />
                Cari
              </Button>
              <Button variant="outline" onClick={clearFilters}>
                Reset
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Daftar Laporan
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={loadLaporanData}
              disabled={loading}
              className="flex items-center gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <RefreshCw className="h-8 w-8 animate-spin" />
              <span className="ml-2">Memuat data...</span>
            </div>
          ) : laporanList.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-500 text-lg">Tidak ada laporan ditemukan</p>
              <p className="text-gray-400 text-sm mb-4">Silakan ubah filter atau buat laporan baru</p>
              <Button onClick={handleCreate} className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Buat Laporan Pertama
              </Button>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead 
                      className="cursor-pointer hover:bg-gray-50"
                      onClick={() => handleSort('namaLaporan')}
                    >
                      <div className="flex items-center gap-2">
                        Nama Laporan
                        {getSortIcon('namaLaporan')}
                      </div>
                    </TableHead>
                    <TableHead>Jenis Laporan</TableHead>
                    <TableHead>Detail Laporan</TableHead>
                    <TableHead>Tahapan</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead 
                      className="cursor-pointer hover:bg-gray-50"
                      onClick={() => handleSort('createdAt')}
                    >
                      <div className="flex items-center gap-2">
                        Dibuat
                        {getSortIcon('createdAt')}
                      </div>
                    </TableHead>
                    <TableHead 
                      className="cursor-pointer hover:bg-gray-50"
                      onClick={() => handleSort('updatedAt')}
                    >
                      <div className="flex items-center gap-2">
                        Diubah
                        {getSortIcon('updatedAt')}
                      </div>
                    </TableHead>
                    <TableHead className="text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {laporanList.map((laporan) => (
                    <TableRow key={laporan.laporanId}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{laporan.namaLaporan}</p>
                          <p className="text-sm text-gray-500 line-clamp-1">{laporan.deskripsi}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-gray-400" />
                          <span className="text-sm">{laporan.jenisLaporanNama}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-gray-400" />
                          <span className="text-sm text-gray-600">
                            {laporan.detailLaporanList && laporan.detailLaporanList.length > 0 
                              ? `${laporan.detailLaporanList.length} detail` 
                              : 'Belum ada detail'}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-gray-400" />
                          <span className="text-sm text-gray-600">
                            {laporan.tahapanList && laporan.tahapanList.length > 0 
                              ? `${laporan.tahapanList.length} tahapan` 
                              : 'Belum ada tahapan'}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getStatusIcon(laporan.status)}
                          <Badge className={getStatusColor(laporan.status)}>
                            {getStatusDisplay(laporan.status)}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-gray-400" />
                          <span className="text-sm">
                            {new Date(laporan.createdAt).toLocaleDateString('id-ID')}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-gray-400" />
                          <span className="text-sm">
                            {new Date(laporan.updatedAt).toLocaleDateString('id-ID')}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleView(laporan.laporanId)}>
                              <Eye className="h-4 w-4 mr-2" />
                              Lihat Detail
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleEdit(laporan.laporanId)}>
                              <Edit className="h-4 w-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <DropdownMenuItem 
                                  className="text-red-600 focus:text-red-600"
                                  onSelect={(e) => e.preventDefault()}
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Hapus
                                </DropdownMenuItem>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Konfirmasi Penghapusan</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Apakah Anda yakin ingin menghapus laporan "{laporan.namaLaporan}"? 
                                    Tindakan ini tidak dapat dibatalkan.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Batal</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleDelete(laporan.laporanId)}
                                    disabled={deletingId === laporan.laporanId}
                                    className="bg-red-600 hover:bg-red-700"
                                  >
                                    {deletingId === laporan.laporanId ? (
                                      <>
                                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                                        Menghapus...
                                      </>
                                    ) : (
                                      <>
                                        <Trash2 className="h-4 w-4 mr-2" />
                                        Hapus
                                      </>
                                    )}
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination */}
              <div className="flex items-center justify-between mt-6">
                <div className="text-sm text-gray-500">
                  Menampilkan {filters.page * filters.size + 1}-{Math.min((filters.page + 1) * filters.size, totalElements)} dari {totalElements} laporan
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(filters.page - 1)}
                    disabled={filters.page === 0}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Sebelumnya
                  </Button>
                  <span className="text-sm">
                    Halaman {filters.page + 1} dari {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(filters.page + 1)}
                    disabled={filters.page >= totalPages - 1}
                  >
                    Selanjutnya
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
