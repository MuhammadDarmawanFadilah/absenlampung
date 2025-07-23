"use client";

import { useRouter } from "next/navigation";
import { PegawaiSearchDropdown } from "@/components/PegawaiSearchDropdown";
import { useAuth } from "@/contexts/AuthContext";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Trash2, Eye, Edit, Plus, Search, Filter, ChevronLeft, ChevronRight, Grid, List, Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast-simple";
import { getApiUrl } from "@/lib/config";

interface SubmissionLaporan {
  id: number;
  judul: string;
  konten: string;
  lokasi: string;
  tanggalLaporan: string;
  status: string;
  tanggalBuat: string;
  tahapanLaporanId: number;
  jenisLaporanId: number;
  laporanId: number;
  pemilihanId: number;
  userId: number;
  userName: string;
  files: string[];
  // Related entity names for display
  pemilihanJudul?: string;
  laporanNama?: string;
  jenisLaporanNama?: string;
  tahapanLaporanNama?: string;
}

interface PemilihanOption {
  pemilihanId: number;
  judulPemilihan: string;
  status: string;
}

interface LaporanOption {
  laporanId: number;
  namaLaporan: string;
  status: string;
}

interface JenisLaporanOption {
  jenisLaporanId: number;
  nama: string;
  status: string;
}

interface TahapanLaporanOption {
  tahapanLaporanId: number;
  nama: string;
  status: string;
}

interface PaginationInfo {
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

interface PaginatedResponse<T> {
  content: T[];
  page: PaginationInfo;
}

export default function LaporanSayaPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { toast } = useToast();
  const [submissions, setSubmissions] = useState<SubmissionLaporan[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');

  // Pagination state
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  const pageSizeOptions = [
    { value: "5", label: "5 per halaman" },
    { value: "10", label: "10 per halaman" },
    { value: "25", label: "25 per halaman" },
    { value: "100", label: "100 per halaman" },
    { value: "1000", label: "1000 per halaman" }
  ];

  // Filter options data
  const [pemilihanOptions, setPemilihanOptions] = useState<PemilihanOption[]>([]);
  const [laporanOptions, setLaporanOptions] = useState<LaporanOption[]>([]);
  const [jenisLaporanOptions, setJenisLaporanOptions] = useState<JenisLaporanOption[]>([]);
  const [tahapanLaporanOptions, setTahapanLaporanOptions] = useState<TahapanLaporanOption[]>([]);
  const [pegawaiOptions, setPegawaiOptions] = useState<any[]>([]);

  // Applied filter values
  const [appliedFilters, setAppliedFilters] = useState({
    pemilihanId: '',
    laporanId: '',
    jenisLaporanId: '',
    tahapanLaporanId: '',
    pegawaiId: ''
  });

  // Input filter values (for form)
  const [inputFilters, setInputFilters] = useState({
    pemilihanId: '',
    laporanId: '',
    jenisLaporanId: '',
    tahapanLaporanId: '',
    pegawaiId: ''
  });

  const statusOptions = [
    { value: "ALL", label: "Semua Status" },
    { value: "DRAFT", label: "Draft" },
    { value: "SUBMITTED", label: "Dikirim" },
    { value: "REVIEWED", label: "Direview" },
    { value: "APPROVED", label: "Disetujui" },
    { value: "REJECTED", label: "Ditolak" }
  ];

  useEffect(() => {
    if (user?.id) {
      loadSubmissions();
      loadPemilihanOptions();
      if (user?.role?.roleName === 'ADMIN') {
        loadPegawaiOptions();
      }
    }
  }, [user, appliedFilters, currentPage, pageSize]);

  useEffect(() => {
    // Reset to first page when filters change
    setCurrentPage(0);
  }, [appliedFilters, searchQuery]);

  useEffect(() => {
    if (inputFilters.pemilihanId) {
      loadLaporanOptions(parseInt(inputFilters.pemilihanId));
      // Reset dependent fields when pemilihan changes
      setInputFilters(prev => ({
        ...prev,
        laporanId: '',
        jenisLaporanId: '',
        tahapanLaporanId: ''
      }));
      // Clear dependent options
      setJenisLaporanOptions([]);
      setTahapanLaporanOptions([]);
    } else {
      setLaporanOptions([]);
      setJenisLaporanOptions([]);
      setTahapanLaporanOptions([]);
    }
  }, [inputFilters.pemilihanId]);

  useEffect(() => {
    if (inputFilters.laporanId) {
      loadJenisLaporanOptions(parseInt(inputFilters.laporanId));
      // Reset dependent fields when laporan changes
      setInputFilters(prev => ({
        ...prev,
        jenisLaporanId: '',
        tahapanLaporanId: ''
      }));
      // Clear dependent options
      setTahapanLaporanOptions([]);
    } else {
      setJenisLaporanOptions([]);
      setTahapanLaporanOptions([]);
    }
  }, [inputFilters.laporanId]);

  useEffect(() => {
    if (inputFilters.jenisLaporanId) {
      loadTahapanLaporanOptions(parseInt(inputFilters.jenisLaporanId));
      // Reset dependent fields when jenis laporan changes
      setInputFilters(prev => ({
        ...prev,
        tahapanLaporanId: ''
      }));
    } else {
      setTahapanLaporanOptions([]);
    }
  }, [inputFilters.jenisLaporanId]);

  const loadPegawaiOptions = async () => {
    try {
      const response = await fetch(getApiUrl('pegawai/list'), {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setPegawaiOptions(data);
      }
    } catch (error) {
      console.error('Error loading pegawai:', error);
    }
  };

  const loadPemilihanOptions = async () => {
    try {
      const response = await fetch(getApiUrl('pemilihan'), {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setPemilihanOptions(data);
      }
    } catch (error) {
      console.error('Error loading pemilihan:', error);
    }
  };

  const loadLaporanOptions = async (pemilihanId: number) => {
    try {
      const response = await fetch(getApiUrl(`laporan/pemilihan/${pemilihanId}`), {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setLaporanOptions(data);
      }
    } catch (error) {
      console.error('Error loading laporan:', error);
    }
  };

  const loadJenisLaporanOptions = async (laporanId: number) => {
    try {
      const response = await fetch(getApiUrl(`laporan/${laporanId}/jenis-laporan`), {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setJenisLaporanOptions(data);
      }
    } catch (error) {
      console.error('Error loading jenis laporan:', error);
    }
  };

  const loadTahapanLaporanOptions = async (jenisLaporanId: number) => {
    try {
      const response = await fetch(getApiUrl(`jenis-laporan/${jenisLaporanId}/tahapan`), {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setTahapanLaporanOptions(data);
      }
    } catch (error) {
      console.error('Error loading tahapan laporan:', error);
    }
  };

  const loadSubmissions = async () => {
    setLoading(true);
    try {
      let url = getApiUrl(`detail-laporan/user/${user?.id}`);
      
      // Add filter parameters if applied
      const params = new URLSearchParams();
      params.append('page', currentPage.toString());
      params.append('size', pageSize.toString());
      
      if (searchQuery.trim()) {
        params.append('search', searchQuery.trim());
      }
      
      if (appliedFilters.pemilihanId) params.append('pemilihanId', appliedFilters.pemilihanId);
      if (appliedFilters.laporanId) params.append('laporanId', appliedFilters.laporanId);
      if (appliedFilters.jenisLaporanId) params.append('jenisLaporanId', appliedFilters.jenisLaporanId);
      if (appliedFilters.tahapanLaporanId) params.append('tahapanLaporanId', appliedFilters.tahapanLaporanId);
      if (appliedFilters.pegawaiId && user?.role?.roleName === 'ADMIN') params.append('pegawaiId', appliedFilters.pegawaiId);
      
      url += `?${params.toString()}`;

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      });

      if (response.ok) {
        const data: PaginatedResponse<SubmissionLaporan> = await response.json();
        setSubmissions(data.content);
        setTotalElements(data.page.totalElements);
        setTotalPages(data.page.totalPages);
      } else {
        toast({
          title: "Error",
          description: "Gagal memuat data laporan",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error loading submissions:', error);
      toast({
        title: "Error",
        description: "Gagal memuat data laporan",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filterSubmissions = () => {
    // No need for client-side filtering since server handles it
    return;
  };

  const applyFilters = () => {
    setAppliedFilters({ ...inputFilters });
    setCurrentPage(0); // Reset to first page when filters change
  };

  const clearFilters = () => {
    const emptyFilters = {
      pemilihanId: '',
      laporanId: '',
      jenisLaporanId: '',
      tahapanLaporanId: '',
      pegawaiId: ''
    };
    setInputFilters(emptyFilters);
    setAppliedFilters(emptyFilters);
    
    // Clear dependent options
    setLaporanOptions([]);
    setJenisLaporanOptions([]);
    setTahapanLaporanOptions([]);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Apakah Anda yakin ingin menghapus laporan ini?")) {
      return;
    }

    try {
      const response = await fetch(getApiUrl(`detail-laporan/${id}/user/${user?.id}`), {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      });

      if (response.ok) {
        toast({
          title: "Berhasil",
          description: "Laporan berhasil dihapus",
        });
        loadSubmissions();
      } else {
        toast({
          title: "Error",
          description: "Gagal menghapus laporan",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error deleting submission:', error);
      toast({
        title: "Error",
        description: "Gagal menghapus laporan",
        variant: "destructive",
      });
    }
  };

  const downloadFile = async (fileName: string) => {
    try {
      const response = await fetch(getApiUrl(`files/download/documents/${fileName}`), {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      });
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        toast({
          title: "Berhasil",
          description: `File ${fileName} berhasil diunduh`,
        });
      } else {
        toast({
          title: "Error",
          description: "Gagal mengunduh file",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error downloading file:', error);
      toast({
        title: "Error",
        description: "Gagal mengunduh file",
        variant: "destructive",
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'DRAFT': return 'bg-gray-100 text-gray-800';
      case 'SUBMITTED': return 'bg-blue-100 text-blue-800';
      case 'REVIEWED': return 'bg-yellow-100 text-yellow-800';
      case 'APPROVED': return 'bg-green-100 text-green-800';
      case 'REJECTED': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'DRAFT': return 'Draft';
      case 'SUBMITTED': return 'Dikirim';
      case 'REVIEWED': return 'Direview';
      case 'APPROVED': return 'Disetujui';
      case 'REJECTED': return 'Ditolak';
      default: return status;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="w-full mx-auto px-4 sm:px-6 lg:px-8 max-w-full">
        <div className="flex justify-between items-center mb-6 pt-8">
          <h1 className="text-2xl font-bold text-gray-900">Laporan Saya</h1>
          <Button onClick={() => router.push('/laporan-saya/buat')}>
            <Plus className="w-4 h-4 mr-2" />
            Buat Laporan Baru
          </Button>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="space-y-4">              {/* Search Row */}
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <Label htmlFor="search">Cari Laporan</Label>
                  <Input
                    id="search"
                    placeholder="Cari berdasarkan judul atau konten..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>

              {/* Category Filters Row */}
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <div>
                  <Label htmlFor="pemilihan">Pemilihan</Label>
                  <Select 
                    value={inputFilters.pemilihanId} 
                    onValueChange={(value) => setInputFilters(prev => ({ ...prev, pemilihanId: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Semua Pemilihan" />
                    </SelectTrigger>
                    <SelectContent>
                      {pemilihanOptions.map((option) => (
                        <SelectItem key={option.pemilihanId} value={option.pemilihanId.toString()}>
                          {option.judulPemilihan}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="laporan">Laporan</Label>
                  <Select 
                    value={inputFilters.laporanId} 
                    onValueChange={(value) => setInputFilters(prev => ({ ...prev, laporanId: value }))}
                    disabled={!inputFilters.pemilihanId}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Semua Laporan" />
                    </SelectTrigger>
                    <SelectContent>
                      {laporanOptions.map((option) => (
                        <SelectItem key={option.laporanId} value={option.laporanId.toString()}>
                          {option.namaLaporan}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="jenisLaporan">Jenis Laporan</Label>
                  <Select 
                    value={inputFilters.jenisLaporanId} 
                    onValueChange={(value) => setInputFilters(prev => ({ ...prev, jenisLaporanId: value }))}
                    disabled={!inputFilters.laporanId}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Semua Jenis" />
                    </SelectTrigger>
                    <SelectContent>
                      {jenisLaporanOptions.map((option) => (
                        <SelectItem key={option.jenisLaporanId} value={option.jenisLaporanId.toString()}>
                          {option.nama}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="tahapanLaporan">Tahapan</Label>
                  <Select 
                    value={inputFilters.tahapanLaporanId} 
                    onValueChange={(value) => setInputFilters(prev => ({ ...prev, tahapanLaporanId: value }))}
                    disabled={!inputFilters.jenisLaporanId}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Semua Tahapan" />
                    </SelectTrigger>
                    <SelectContent>
                      {tahapanLaporanOptions.map((option) => (
                        <SelectItem key={option.tahapanLaporanId} value={option.tahapanLaporanId.toString()}>
                          {option.nama}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {user?.role?.roleName === 'ADMIN' && (
                  <div>
                    <Label htmlFor="pegawai">Pegawai</Label>
                    <PegawaiSearchDropdown
                      value={inputFilters.pegawaiId}
                      onValueChange={(value) => setInputFilters(prev => ({ ...prev, pegawaiId: value }))}
                      onPegawaiIdChange={(pegawaiId) => setInputFilters(prev => ({ ...prev, pegawaiId: pegawaiId }))}
                      placeholder="Semua Pegawai..."
                      includeAllOption={true}
                    />
                  </div>
                )}
              </div>

              {/* Page Size Row */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <Label htmlFor="pageSize">Items per Halaman</Label>
                  <Select
                    value={pageSize.toString()}
                    onValueChange={(value) => {
                      setPageSize(parseInt(value));
                      setCurrentPage(0);
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {pageSizeOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Filter Action Buttons */}
              <div className="flex gap-2">
                <Button onClick={applyFilters} variant="default" size="sm">
                  Terapkan Filter
                </Button>
                <Button onClick={clearFilters} variant="outline" size="sm">
                  Reset Filter
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Submissions List */}
        {submissions.length === 0 ? (
          <Card className="shadow-sm border-gray-200/50">
            <CardContent className="p-12 text-center">
              <div className="text-gray-500 mb-4">
                <Plus className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <p className="text-lg font-medium">Belum ada laporan</p>
                <p className="text-sm">Mulai buat laporan pertama Anda</p>
              </div>
              <Button 
                className="mt-6 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-8 py-3"
                onClick={() => router.push('/laporan-saya/buat')}
              >
                <Plus className="w-4 h-4 mr-2" />
                Buat Laporan Pertama
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Results Header */}
            <div className="flex justify-between items-center mb-6">
              <div className="text-sm text-gray-600">
                Menampilkan {((currentPage) * pageSize) + 1} - {Math.min((currentPage + 1) * pageSize, totalElements)} dari {totalElements} laporan
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant={viewMode === 'list' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                  className="h-9 px-3"
                >
                  <List className="w-4 h-4 mr-1" />
                  List
                </Button>
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                  className="h-9 px-3"
                >
                  <Grid className="w-4 h-4 mr-1" />
                  Grid
                </Button>
              </div>
            </div>

            {/* Submissions Grid */}
            <div className={viewMode === 'grid' ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8" : "space-y-4 mb-8"}>
              {submissions.map((submission) => (
                <Card key={submission.id} className="shadow-sm border-gray-200/50 hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    {viewMode === 'list' ? (
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-3">
                            <h3 className="text-lg font-semibold text-gray-900">{submission.judul}</h3>
                            <Badge className={getStatusColor(submission.status)}>
                              {getStatusLabel(submission.status)}
                            </Badge>
                          </div>
                          
                          <div className="text-gray-600 mb-4 line-clamp-2 text-sm leading-relaxed">
                            {submission.konten}
                          </div>
                          
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-sm text-gray-500 mb-4">
                            <div className="flex flex-col">
                              <span className="font-medium text-gray-700 mb-1">Nama Pegawai:</span> 
                              <span className="text-gray-900">{submission.userName}</span>
                            </div>
                            <div className="flex flex-col">
                              <span className="font-medium text-gray-700 mb-1">Lokasi:</span> 
                              <span className="text-gray-900">{submission.lokasi || '-'}</span>
                            </div>
                            <div className="flex flex-col">
                              <span className="font-medium text-gray-700 mb-1">Tanggal Laporan:</span> 
                              <span className="text-gray-900">{submission.tanggalLaporan}</span>
                            </div>
                            <div className="flex flex-col">
                              <span className="font-medium text-gray-700 mb-1">Nama Pemilihan:</span> 
                              <span className="text-gray-900">{submission.pemilihanJudul || '-'}</span>
                            </div>
                          </div>

                          {submission.files && submission.files.length > 0 && (
                            <div className="space-y-2 mb-3">
                              <div className="flex items-center justify-between">
                                <span className="text-sm font-medium text-gray-700">Lampiran ({submission.files.length} file):</span>
                              </div>
                              <div className="flex flex-wrap gap-1">
                                {submission.files.map((file: string, index: number) => (
                                  <div key={index} className="flex items-center gap-1">
                                    <Badge 
                                      variant="outline" 
                                      className="text-xs bg-blue-50 text-blue-700 border-blue-200 cursor-pointer hover:bg-blue-100"
                                      onClick={() => downloadFile(file)}
                                    >
                                      <Download className="w-3 h-3 mr-1" />
                                      {file.length > 20 ? `${file.substring(0, 20)}...` : file}
                                    </Badge>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>

                        <div className="flex gap-2 ml-6">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => router.push(`/laporan-saya/${submission.id}`)}
                            className="h-9 w-9 p-0 border-gray-300 hover:bg-blue-50 hover:border-blue-300"
                            title="Lihat detail"
                          >
                            <Eye className="w-4 h-4 text-blue-600" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => router.push(`/laporan-saya/${submission.id}/edit`)}
                            disabled={submission.status === 'APPROVED'}
                            className="h-9 w-9 p-0 border-gray-300 hover:bg-green-50 hover:border-green-300 disabled:opacity-50"
                            title="Edit laporan"
                          >
                            <Edit className="w-4 h-4 text-green-600" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(submission.id)}
                            disabled={submission.status === 'APPROVED'}
                            className="h-9 w-9 p-0 border-gray-300 hover:bg-red-50 hover:border-red-300 disabled:opacity-50"
                            title="Hapus laporan"
                          >
                            <Trash2 className="w-4 h-4 text-red-600" />
                          </Button>
                        </div>
                      </div>
                    ) : (
                      /* Grid View */
                      <div className="space-y-4">
                        <div className="flex items-center gap-3 mb-3">
                          <h3 className="text-lg font-semibold text-gray-900 line-clamp-1">{submission.judul}</h3>
                        </div>
                        
                        <div className="flex justify-between items-center mb-3">
                          <Badge className={getStatusColor(submission.status)}>
                            {getStatusLabel(submission.status)}
                          </Badge>
                          <div className="text-xs text-gray-500">
                            {new Date(submission.tanggalBuat).toLocaleDateString('id-ID')}
                          </div>
                        </div>
                        
                        <div className="text-gray-600 mb-4 line-clamp-3 text-sm leading-relaxed">
                          {submission.konten}
                        </div>
                        
                        <div className="space-y-3 text-sm text-gray-500">
                          <div className="flex flex-col">
                            <span className="font-medium text-gray-700 mb-1">Nama Pegawai:</span> 
                            <span className="text-gray-900">{submission.userName}</span>
                          </div>
                          <div className="flex flex-col">
                            <span className="font-medium text-gray-700 mb-1">Lokasi:</span> 
                            <span className="text-gray-900">{submission.lokasi || '-'}</span>
                          </div>
                          <div className="flex flex-col">
                            <span className="font-medium text-gray-700 mb-1">Tanggal Laporan:</span> 
                            <span className="text-gray-900">{submission.tanggalLaporan}</span>
                          </div>
                          <div className="flex flex-col">
                            <span className="font-medium text-gray-700 mb-1">Nama Pemilihan:</span> 
                            <span className="text-gray-900">{submission.pemilihanJudul || '-'}</span>
                          </div>
                        </div>

                        {submission.files && submission.files.length > 0 && (
                          <div className="space-y-2">
                            <div className="text-sm font-medium text-gray-700">
                              Lampiran ({submission.files.length} file):
                            </div>
                            <div className="flex flex-wrap gap-1">
                              {submission.files.map((file: string, index: number) => (
                                <Badge 
                                  key={index}
                                  variant="outline" 
                                  className="text-xs bg-blue-50 text-blue-700 border-blue-200 cursor-pointer hover:bg-blue-100"
                                  onClick={() => downloadFile(file)}
                                >
                                  <Download className="w-3 h-3 mr-1" />
                                  {file.length > 15 ? `${file.substring(0, 15)}...` : file}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}

                        <div className="flex justify-between items-center pt-4 border-t border-gray-100">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => router.push(`/laporan-saya/${submission.id}`)}
                            className="flex-1 mr-2 text-xs"
                          >
                            <Eye className="w-3 h-3 mr-1" />
                            Lihat
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => router.push(`/laporan-saya/${submission.id}/edit`)}
                            disabled={submission.status === 'APPROVED'}
                            className="flex-1 mr-2 text-xs disabled:opacity-50"
                          >
                            <Edit className="w-3 h-3 mr-1" />
                            Edit
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(submission.id)}
                            disabled={submission.status === 'APPROVED'}
                            className="flex-1 text-xs text-red-600 hover:bg-red-50 disabled:opacity-50"
                          >
                            <Trash2 className="w-3 h-3 mr-1" />
                            Hapus
                          </Button>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <Card className="shadow-sm border-gray-200/50">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-600">
                      Halaman {currentPage + 1} dari {totalPages}
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
                        disabled={currentPage === 0}
                        className="h-9 px-3 border-gray-300"
                      >
                        <ChevronLeft className="w-4 h-4 mr-1" />
                        Sebelumnya
                      </Button>
                      
                      {/* Page Numbers */}
                      <div className="flex gap-1">
                        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                          const pageNum = Math.max(0, Math.min(totalPages - 5, currentPage - 2)) + i;
                          if (pageNum >= totalPages) return null;
                          return (
                            <Button
                              key={pageNum}
                              variant={currentPage === pageNum ? "default" : "outline"}
                              size="sm"
                              onClick={() => setCurrentPage(pageNum)}
                              className={`h-9 w-9 p-0 ${
                                currentPage === pageNum 
                                  ? "bg-blue-600 text-white border-blue-600" 
                                  : "border-gray-300 hover:bg-gray-50"
                              }`}
                            >
                              {pageNum + 1}
                            </Button>
                          );
                        })}
                      </div>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(Math.min(totalPages - 1, currentPage + 1))}
                        disabled={currentPage >= totalPages - 1}
                        className="h-9 px-3 border-gray-300"
                      >
                        Selanjutnya
                        <ChevronRight className="w-4 h-4 ml-1" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>
    </div>
  );
}
