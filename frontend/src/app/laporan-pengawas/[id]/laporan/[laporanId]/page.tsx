"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Search, Eye, Filter, X, FileText, Folder } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast-simple";
import { laporanAPI, Laporan } from "@/lib/laporan-api";
import { jenisLaporanAPI, JenisLaporan } from "@/lib/api";

interface PaginatedResponse {
  content: JenisLaporan[];
  totalElements: number;
  totalPages: number;
  currentPage: number;
  size: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

export default function LaporanJenisPage() {
  const params = useParams();
  const router = useRouter();
  const [laporan, setLaporan] = useState<Laporan | null>(null);
  const [jenisLaporan, setJenisLaporan] = useState<JenisLaporan[]>([]);
  
  // Filter states
  const [namaJenisFilter, setNamaJenisFilter] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [hasNext, setHasNext] = useState(false);
  const [hasPrevious, setHasPrevious] = useState(false);
  
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const pemilihanId = params?.id as string;
  const laporanId = params?.laporanId as string;

  useEffect(() => {
    if (laporanId) {
      loadLaporan();
    }
  }, [laporanId]);

  useEffect(() => {
    if (laporanId) {
      loadLaporan();
      loadJenisLaporan();
    }
  }, [laporanId, currentPage, pageSize]);

  const loadLaporan = async () => {
    try {
      const response = await laporanAPI.getById(parseInt(laporanId));
      setLaporan(response);
    } catch (error: any) {
      console.error("Error loading laporan:", error);
      toast({
        title: "Error",
        description: "Gagal memuat data laporan",
        variant: "destructive",
      });
    }
  };

  const loadJenisLaporan = async (filterOverride?: string) => {
    setLoading(true);
    try {
      // Get jenis laporan directly from the API endpoint 
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/laporan/${laporanId}/jenis-laporan`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch jenis laporan');
      }
      
      const jenisLaporanData = await response.json();
      
      // Use filter override if provided, otherwise use state
      const filterValue = filterOverride !== undefined ? filterOverride : namaJenisFilter;
      
      // Apply name filter if any
      let filteredData = jenisLaporanData;
      if (filterValue && filterValue.trim()) {
        filteredData = jenisLaporanData.filter((jl: any) => 
          jl.nama.toLowerCase().includes(filterValue.toLowerCase())
        );
      }
      
      // Apply client-side pagination
      const startIndex = currentPage * pageSize;
      const endIndex = startIndex + pageSize;
      const paginatedData = filteredData.slice(startIndex, endIndex);
      
      setJenisLaporan(paginatedData);
      setTotalElements(filteredData.length);
      setTotalPages(Math.ceil(filteredData.length / pageSize));
      setHasNext(endIndex < filteredData.length);
      setHasPrevious(currentPage > 0);
      
    } catch (error: any) {
      console.error('Error loading jenis laporan:', error);
      setJenisLaporan([]);
      setTotalElements(0);
      setTotalPages(0);
      toast({
        title: "Error",
        description: "Gagal memuat data jenis laporan",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setCurrentPage(0);
    loadJenisLaporan();
  };

  const handleClearFilter = async () => {
    setNamaJenisFilter("");
    setCurrentPage(0);
    await loadJenisLaporan("");
  };

  const getPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;
    let startPage = Math.max(0, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages - 1, startPage + maxVisiblePages - 1);
    
    if (endPage - startPage < maxVisiblePages - 1) {
      startPage = Math.max(0, endPage - maxVisiblePages + 1);
    }
    
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    
    return pages;
  };

  return (
    <div className="min-h-screen bg-gray-50/30">
      <div className="space-y-8 p-6">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200/50 p-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <Button variant="ghost" onClick={() => router.push(`/laporan-pengawas/${pemilihanId}`)}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Kembali
                </Button>
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center">
                  <Folder className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">Jenis Laporan</h1>
                  <p className="text-gray-600 mt-1">
                    {laporan?.namaLaporan || 'Memuat...'}
                  </p>
                </div>
              </div>
              
              {/* Breadcrumb Navigation */}
              <div className="flex items-center gap-2 mt-4">
                <div className="flex items-center text-sm text-gray-600">
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => router.push('/laporan-pengawas')}
                    className="p-0 h-auto text-blue-600 hover:text-blue-800 font-medium"
                  >
                    Laporan Pengawas
                  </Button>
                  <span className="mx-2 text-gray-400">→</span>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => router.push(`/laporan-pengawas/${pemilihanId}`)}
                    className="p-0 h-auto text-blue-600 hover:text-blue-800 font-medium"
                  >
                    Daftar Laporan
                  </Button>
                  <span className="mx-2 text-gray-400">→</span>
                  <span className="text-gray-900 font-medium">{laporan?.namaLaporan || 'Jenis Laporan'}</span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <Button
                variant={showFilters ? "default" : "outline"}
                onClick={() => setShowFilters(!showFilters)}
                className={showFilters ? "bg-blue-600 hover:bg-blue-700" : ""}
              >
                <Filter className="mr-2 h-4 w-4" />
                {showFilters ? 'Tutup Filter' : 'Buka Filter'}
              </Button>
            </div>
          </div>
        </div>

        {/* Filters */}
        {showFilters && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200/50">
            <div className="p-6 border-b border-gray-200/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg flex items-center justify-center">
                  <Filter className="w-5 h-5 text-gray-600" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Filter Jenis Laporan</h2>
                  <p className="text-sm text-gray-500">Cari jenis laporan berdasarkan nama</p>
                </div>
              </div>
            </div>
            
            <div className="p-6">
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700">Nama Jenis Laporan</label>
                  <Input
                    placeholder="Cari nama jenis laporan..."
                    value={namaJenisFilter}
                    onChange={(e) => setNamaJenisFilter(e.target.value)}
                    className="bg-white border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700">Items per Halaman</label>
                  <Select
                    value={pageSize.toString()}
                    onValueChange={(value) => {
                      setPageSize(parseInt(value));
                      setCurrentPage(0);
                    }}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="5">5 per halaman</SelectItem>
                      <SelectItem value="10">10 per halaman</SelectItem>
                      <SelectItem value="25">25 per halaman</SelectItem>
                      <SelectItem value="100">100 per halaman</SelectItem>
                      <SelectItem value="1000">1000 per halaman</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="flex justify-center items-center gap-4 mt-6">
                <Button 
                  onClick={handleSearch} 
                  className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-sm px-8 py-2"
                >
                  <Search className="mr-2 h-4 w-4" />
                  Cari Data
                </Button>
                
                <Button 
                  variant="outline" 
                  onClick={handleClearFilter} 
                  className="border-gray-300 hover:bg-gray-50 px-8 py-2"
                >
                  <X className="mr-2 h-4 w-4" />
                  Reset Filter
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Data Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200/50">
          <div className="p-6 border-b border-gray-200/50">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Daftar Jenis Laporan</h2>
                <p className="text-sm text-gray-500 mt-1">
                  Menampilkan {jenisLaporan.length} dari {totalElements} total jenis laporan
                </p>
              </div>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-gray-50/50">
                <TableRow className="border-gray-200/50">
                  <TableHead className="font-semibold text-gray-700 py-4">Urutan</TableHead>
                  <TableHead className="font-semibold text-gray-700 py-4">Nama Jenis</TableHead>
                  <TableHead className="font-semibold text-gray-700 py-4">Deskripsi</TableHead>
                  <TableHead className="font-semibold text-gray-700 py-4">Status</TableHead>
                  <TableHead className="font-semibold text-gray-700 py-4 w-[100px] text-center">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-12">
                      <div className="flex flex-col items-center justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
                        <span className="text-gray-600 font-medium">Memuat data...</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : jenisLaporan.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-12">
                      <div className="flex flex-col items-center justify-center">
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                          <Folder className="w-8 h-8 text-gray-400" />
                        </div>
                        <h3 className="text-lg font-medium text-gray-900 mb-2">Tidak ada jenis laporan</h3>
                        <p className="text-gray-500 text-center max-w-sm">
                          Belum ada jenis laporan yang tersedia
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  jenisLaporan.map((item, index) => (
                    <TableRow key={item.jenisLaporanId} className={index % 2 === 0 ? "bg-white" : "bg-gray-50/30"}>
                      <TableCell className="py-4">
                        <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-sm">
                          {index + 1}
                        </div>
                      </TableCell>
                      <TableCell className="py-4">
                        <div className="font-semibold text-gray-900">{item.nama}</div>
                      </TableCell>
                      <TableCell className="py-4">
                        <div className="max-w-xs">
                          {item.deskripsi && (
                            <div className="text-sm text-gray-500 line-clamp-2">
                              {item.deskripsi.length > 80 
                                ? item.deskripsi.substring(0, 80) + "..." 
                                : item.deskripsi}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="py-4">
                        <Badge className={
                          item.status === 'AKTIF' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }>
                          {item.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="py-4 text-center">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => router.push(`/laporan-pengawas/${pemilihanId}/laporan/${laporanId}/jenis/${item.jenisLaporanId}`)}
                          className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          Detail Tahapan
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="p-6 border-t border-gray-200/50">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-sm text-gray-600">
                  Halaman <span className="font-medium">{currentPage + 1}</span> dari{' '}
                  <span className="font-medium">{totalPages}</span> | 
                  Total <span className="font-medium">{totalElements}</span> data
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(0)}
                    disabled={!hasPrevious}
                    className="px-3"
                  >
                    First
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(currentPage - 1)}
                    disabled={!hasPrevious}
                    className="px-3"
                  >
                    Previous
                  </Button>
                  
                  {getPageNumbers().map((page) => (
                    <Button
                      key={page}
                      variant={page === currentPage ? "default" : "outline"}
                      size="sm"
                      onClick={() => setCurrentPage(page)}
                      className={page === currentPage ? "bg-blue-600 hover:bg-blue-700 px-3" : "px-3"}
                    >
                      {page + 1}
                    </Button>
                  ))}
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(currentPage + 1)}
                    disabled={!hasNext}
                    className="px-3"
                  >
                    Next
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(totalPages - 1)}
                    disabled={!hasNext}
                    className="px-3"
                  >
                    Last
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
