"use client";

import { useState, useEffect } from "react";
import { Plus, Search, MoreHorizontal, Edit, Trash2, Eye, Filter, X } from "lucide-react";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast-simple";
import { pemilihanApi, PemilihanDTO } from "@/lib/pemilihan-api";
import { PemilihanWilayahFilter } from "@/components/PemilihanWilayahFilter";
import { ProvinsiSearchDropdown } from "@/components/ProvinsiSearchDropdown";
import { KotaSearchDropdown } from "@/components/KotaSearchDropdown";
import { KecamatanSearchDropdown } from "@/components/KecamatanSearchDropdown";

interface PemilihanStats {
  totalPemilihan: number;
  statusAktif: number;
  statusTidakAktif: number;
  statusDraft: number;
  totalLaporan: number;
  tingkatProvinsi: number;
  tingkatKota: number;
  tingkatKecamatan: number;
  tingkatKelurahan: number;
}

interface PaginatedResponse {
  content: PemilihanDTO[];
  totalElements: number;
  totalPages: number;
  currentPage: number;
  size: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

export default function PemilihanPage() {
  const [pemilihan, setPemilihan] = useState<PemilihanDTO[]>([]);
  const [stats, setStats] = useState<PemilihanStats>({
    totalPemilihan: 0,
    statusAktif: 0,
    statusTidakAktif: 0,
    statusDraft: 0,
    totalLaporan: 0,
    tingkatProvinsi: 0,
    tingkatKota: 0,
    tingkatKecamatan: 0,
    tingkatKelurahan: 0,
  });
  
  // Filter states
  const [namaFilter, setNamaFilter] = useState("");
  const [provinsiFilter, setProvinsiFilter] = useState("");
  const [kotaFilter, setKotaFilter] = useState("");
  const [kecamatanFilter, setKecamatanFilter] = useState("");
  const [provinsiKode, setProvinsiKode] = useState(""); // Track provinsi kode
  const [kotaKode, setKotaKode] = useState(""); // Track kota kode for kecamatan filtering
  const [kecamatanKode, setKecamatanKode] = useState(""); // Track kecamatan kode
  const [selectedTingkat, setSelectedTingkat] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [showFilters, setShowFilters] = useState(false);
  
  // Legacy search query for backward compatibility
  const [searchQuery, setSearchQuery] = useState("");
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [hasNext, setHasNext] = useState(false);
  const [hasPrevious, setHasPrevious] = useState(false);
  
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadData();
  }, [currentPage, pageSize]);

  const loadData = async (overrideFilters?: {
    namaFilter?: string;
    provinsiFilter?: string;
    kotaFilter?: string;
    kecamatanFilter?: string;
    provinsiKode?: string;
    kotaKode?: string;
    kecamatanKode?: string;
    selectedTingkat?: string;
    selectedStatus?: string;
  }) => {
    setLoading(true);
    try {
      // Use override filters if provided, otherwise use current state
      const filters = overrideFilters || {
        namaFilter,
        provinsiFilter,
        kotaFilter,
        kecamatanFilter,
        provinsiKode,
        kotaKode,
        kecamatanKode,
        selectedTingkat,
        selectedStatus
      };
      
      // Convert filter values for API call
      const apiStatusFilter = filters.selectedStatus === "all" ? "" : (filters.selectedStatus || "");
      const apiTingkatFilter = filters.selectedTingkat === "all" ? "" : (filters.selectedTingkat || "");
      
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api";
      console.log("API URL:", apiUrl);
      console.log("Filters:", { 
        ...filters,
        apiStatusFilter, 
        apiTingkatFilter 
      });
      
      // Build URL with individual filter parameters
      const params = new URLSearchParams({
        page: currentPage.toString(),
        size: pageSize.toString()
      });
      
      if (filters.namaFilter && filters.namaFilter.trim()) {
        params.append('keyword', filters.namaFilter.trim());
      }
      if (apiTingkatFilter) {
        params.append('tingkat', apiTingkatFilter);
      }
      if (apiStatusFilter) {
        params.append('status', apiStatusFilter);
      }
      if (filters.provinsiKode && filters.provinsiKode.trim()) {
        params.append('provinsi', filters.provinsiKode.trim());
      }
      if (filters.kotaKode && filters.kotaKode.trim()) {
        params.append('kota', filters.kotaKode.trim());
      }
      if (filters.kecamatanKode && filters.kecamatanKode.trim()) {
        params.append('kecamatan', filters.kecamatanKode.trim());
      }
      
      // Load pemilihan with pagination
      const pemilihanUrl = `${apiUrl}/pemilihan/search-paged?${params.toString()}`;
      console.log("Pemilihan URL:", pemilihanUrl);
      
      const pemilihanResponse = await fetch(pemilihanUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!pemilihanResponse.ok) {
        throw new Error(`HTTP error! status: ${pemilihanResponse.status}`);
      }
      
      const pemilihanData: PaginatedResponse = await pemilihanResponse.json();
      
      setPemilihan(pemilihanData.content);
      setTotalElements(pemilihanData.totalElements);
      setTotalPages(pemilihanData.totalPages);
      setHasNext(pemilihanData.hasNext);
      setHasPrevious(pemilihanData.hasPrevious);
      
      // Load statistics (for backwards compatibility, use keyword for nama filter)
      const statsParams = new URLSearchParams();
      if (filters.namaFilter && filters.namaFilter.trim()) {
        statsParams.append('keyword', filters.namaFilter.trim());
      }
      if (apiTingkatFilter) {
        statsParams.append('tingkat', apiTingkatFilter);
      }
      if (apiStatusFilter) {
        statsParams.append('status', apiStatusFilter);
      }
      
      const statsUrl = `${apiUrl}/pemilihan/statistics?${statsParams.toString()}`;
      console.log("Stats URL:", statsUrl);
      
      const statsResponse = await fetch(statsUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!statsResponse.ok) {
        throw new Error(`HTTP error! status: ${statsResponse.status}`);
      }
      
      const statsData: PemilihanStats = await statsResponse.json();
      setStats(statsData);
      
    } catch (error: any) {
      console.error("Error loading data:", error);
      toast({
        title: "Error",
        description: "Gagal memuat data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setCurrentPage(0); // Reset to first page
    loadData(); // Load data with current filters
  };

  const handleClearFilters = () => {
    setNamaFilter("");
    setProvinsiFilter("");
    setKotaFilter("");
    setKecamatanFilter("");
    setProvinsiKode("");
    setKotaKode("");
    setKecamatanKode("");
    setSelectedTingkat("all");
    setSelectedStatus("all");
    setSearchQuery("");
    setCurrentPage(0);
    
    // Load data with cleared filters immediately
    loadData({
      namaFilter: "",
      provinsiFilter: "",
      kotaFilter: "",
      kecamatanFilter: "",
      provinsiKode: "",
      kotaKode: "",
      kecamatanKode: "",
      selectedTingkat: "all",
      selectedStatus: "all"
    });
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Apakah Anda yakin ingin menghapus pemilihan ini?")) {
      return;
    }

    try {
      await pemilihanApi.delete(id);
      toast({
        title: "Sukses",
        description: "Pemilihan berhasil dihapus",
      });
      loadData(); // Reload data
    } catch (error: any) {
      console.error("Error deleting pemilihan:", error);
      toast({
        title: "Error",
        description: "Gagal menghapus pemilihan",
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      AKTIF: { color: "bg-green-100 text-green-800", label: "Aktif" },
      TIDAK_AKTIF: { color: "bg-red-100 text-red-800", label: "Tidak Aktif" },
      DRAFT: { color: "bg-yellow-100 text-yellow-800", label: "Draft" },
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || 
                  { color: "bg-gray-100 text-gray-800", label: status };
    
    return (
      <Badge className={config.color}>
        {config.label}
      </Badge>
    );
  };

  const formatTingkat = (tingkat: string) => {
    const tingkatMap: { [key: string]: string } = {
      'provinsi': 'Provinsi',
      'kota': 'Kota/Kabupaten',
      'kecamatan': 'Kecamatan',
      'kelurahan': 'Kelurahan/Desa'
    };
    return tingkatMap[tingkat] || tingkat;
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
        {/* Enhanced Header */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200/50 p-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                  <Eye className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">Manajemen Pemilihan</h1>
                  <p className="text-gray-600 mt-1">
                    Kelola dan pantau proses pemilihan alumni secara terpusat
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4 text-sm text-gray-500 mt-4">
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>Total: {stats.totalPemilihan} Pemilihan</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span>Aktif: {stats.statusAktif}</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                  <span>Draft: {stats.statusDraft}</span>
                </div>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <Link href="/admin/pemilihan/create">
                <Button className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-lg">
                  <Plus className="mr-2 h-4 w-4" />
                  Tambah Pemilihan
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Enhanced Statistics Dashboard */}
        <div className="grid gap-6">
          {/* Main Statistics */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200/50 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Ringkasan Statistik</h2>
              <div className="text-sm text-gray-500">Data Real-time</div>
            </div>
            
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
              <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 rounded-lg p-6 border border-blue-200/50">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-blue-600 mb-1">Total Pemilihan</p>
                    <p className="text-3xl font-bold text-blue-900">{stats.totalPemilihan}</p>
                    <p className="text-xs text-blue-600/70 mt-1">Keseluruhan data</p>
                  </div>
                  <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center">
                    <Eye className="w-6 h-6 text-white" />
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-green-50 to-green-100/50 rounded-lg p-6 border border-green-200/50">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-green-600 mb-1">Status Aktif</p>
                    <p className="text-3xl font-bold text-green-900">{stats.statusAktif}</p>
                    <p className="text-xs text-green-600/70 mt-1">Sedang berjalan</p>
                  </div>
                  <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center">
                    <Search className="w-6 h-6 text-white" />
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-yellow-50 to-yellow-100/50 rounded-lg p-6 border border-yellow-200/50">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-yellow-600 mb-1">Status Draft</p>
                    <p className="text-3xl font-bold text-yellow-900">{stats.statusDraft}</p>
                    <p className="text-xs text-yellow-600/70 mt-1">Belum dipublikasi</p>
                  </div>
                  <div className="w-12 h-12 bg-yellow-500 rounded-lg flex items-center justify-center">
                    <Edit className="w-6 h-6 text-white" />
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-red-50 to-red-100/50 rounded-lg p-6 border border-red-200/50">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-red-600 mb-1">Tidak Aktif</p>
                    <p className="text-3xl font-bold text-red-900">{stats.statusTidakAktif}</p>
                    <p className="text-xs text-red-600/70 mt-1">Non-aktif</p>
                  </div>
                  <div className="w-12 h-12 bg-red-500 rounded-lg flex items-center justify-center">
                    <X className="w-6 h-6 text-white" />
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-purple-50 to-purple-100/50 rounded-lg p-6 border border-purple-200/50">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-purple-600 mb-1">Total Laporan</p>
                    <p className="text-3xl font-bold text-purple-900">{stats.totalLaporan}</p>
                    <p className="text-xs text-purple-600/70 mt-1">Laporan masuk</p>
                  </div>
                  <div className="w-12 h-12 bg-purple-500 rounded-lg flex items-center justify-center">
                    <Filter className="w-6 h-6 text-white" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200/50">
          <div className="p-6 border-b border-gray-200/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg flex items-center justify-center">
                  <Filter className="w-5 h-5 text-gray-600" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Filter & Pencarian</h2>
                  <p className="text-sm text-gray-500">Gunakan filter untuk mempersempit hasil pencarian</p>
                </div>
              </div>
              <Button
                variant={showFilters ? "default" : "outline"}
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
                className={showFilters ? "bg-blue-600 hover:bg-blue-700" : ""}
              >
                <Filter className="mr-2 h-4 w-4" />
                {showFilters ? 'Tutup Filter' : 'Buka Filter'}
              </Button>
            </div>
          </div>
          
          <div className="p-6">
            <div className="space-y-6">
              {/* Advanced Filters */}
              {showFilters && (
                <div className="bg-gray-50/50 rounded-lg p-6 border border-gray-200/50">
                  <div className="grid gap-6 md:grid-cols-4">
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-gray-700">Nama Pemilihan</label>
                      <Input
                        placeholder="Cari nama pemilihan..."
                        value={namaFilter}
                        onChange={(e) => setNamaFilter(e.target.value)}
                        className="bg-white border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-gray-700">Provinsi</label>
                      <ProvinsiSearchDropdown
                        value={provinsiFilter}
                        onValueChange={(value) => {
                          setProvinsiFilter(value);
                          // Clear dependent filters when provinsi changes
                          if (value !== provinsiFilter) {
                            setKotaFilter("");
                            setKecamatanFilter("");
                            setKotaKode("");
                            setKecamatanKode("");
                          }
                        }}
                        onProvinsiKodeChange={(kode) => {
                          setProvinsiKode(kode);
                          // Clear dependent fields when provinsi kode changes
                          if (kode !== provinsiKode) {
                            setKotaFilter("");
                            setKecamatanFilter("");
                            setKotaKode("");
                            setKecamatanKode("");
                          }
                        }}
                        placeholder="Pilih provinsi..."
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-gray-700">Kota/Kabupaten</label>
                      <KotaSearchDropdown
                        value={kotaFilter}
                        onValueChange={(value) => {
                          setKotaFilter(value);
                          // Clear dependent filters when kota changes
                          if (value !== kotaFilter) {
                            setKecamatanFilter("");
                          }
                        }}
                        onKotaKodeChange={(kode) => {
                          setKotaKode(kode);
                          // Clear kecamatan when kota kode changes
                          if (kode !== kotaKode) {
                            setKecamatanFilter("");
                            setKecamatanKode("");
                          }
                        }}
                        provinsiFilter={provinsiFilter}
                        placeholder="Pilih kota/kabupaten..."
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-gray-700">Kecamatan</label>
                      <KecamatanSearchDropdown
                        value={kecamatanFilter}
                        onValueChange={setKecamatanFilter}
                        onKecamatanKodeChange={(kode) => {
                          setKecamatanKode(kode);
                        }}
                        kotaKode={kotaKode}
                        placeholder="Pilih kecamatan..."
                      />
                    </div>
                  </div>
                  
                  <div className="grid gap-6 md:grid-cols-4 mt-4">
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-gray-700">Tingkat Pemilihan</label>
                      <select
                        value={selectedTingkat}
                        onChange={(e) => setSelectedTingkat(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                      >
                        <option value="all">🌐 Semua Tingkat</option>
                        <option value="provinsi">🏛️ Provinsi</option>
                        <option value="kota">🏙️ Kota/Kabupaten</option>
                        <option value="kecamatan">🏘️ Kecamatan</option>
                        <option value="kelurahan">🏠 Kelurahan/Desa</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-gray-700">Status Pemilihan</label>
                      <select
                        value={selectedStatus}
                        onChange={(e) => setSelectedStatus(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                      >
                        <option value="all">🔍 Semua Status</option>
                        <option value="AKTIF">✅ Aktif</option>
                        <option value="TIDAK_AKTIF">❌ Tidak Aktif</option>
                        <option value="DRAFT">📝 Draft</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-gray-700">Items per Halaman</label>
                      <select
                        value={pageSize}
                        onChange={(e) => {
                          setPageSize(parseInt(e.target.value));
                          setCurrentPage(0);
                        }}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                      >
                        <option value={5}>5 per halaman</option>
                        <option value={10}>10 per halaman</option>
                        <option value={25}>25 per halaman</option>
                        <option value={50}>50 per halaman</option>
                        <option value={100}>100 per halaman</option>
                        <option value={1000}>1000 per halaman</option>
                      </select>
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
                      onClick={handleClearFilters} 
                      className="border-gray-300 hover:bg-gray-50 px-8 py-2"
                    >
                      <X className="mr-2 h-4 w-4" />
                      Reset Filter
                    </Button>
                  </div>
                  
                  {(namaFilter || provinsiFilter || kotaFilter || kecamatanFilter || selectedStatus !== "all" || selectedTingkat !== "all") && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <div className="flex flex-wrap gap-2">
                        <span className="text-sm font-medium text-gray-600">Filter aktif:</span>
                        {namaFilter && (
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            Nama: "{namaFilter}"
                          </span>
                        )}
                        {provinsiFilter && (
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                            Provinsi: "{provinsiFilter}"
                          </span>
                        )}
                        {kotaFilter && (
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                            Kota: "{kotaFilter}"
                          </span>
                        )}
                        {kecamatanFilter && (
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-teal-100 text-teal-800">
                            Kecamatan: "{kecamatanFilter}"
                          </span>
                        )}
                        {selectedStatus !== "all" && (
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            Status: {selectedStatus}
                          </span>
                        )}
                        {selectedTingkat !== "all" && (
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                            Tingkat: {selectedTingkat}
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Enhanced Data Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200/50">
          <div className="p-6 border-b border-gray-200/50">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Daftar Pemilihan</h2>
                <p className="text-sm text-gray-500 mt-1">
                  Menampilkan {pemilihan.length} dari {totalElements} total data
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm text-gray-600">Tampilkan:</span>
                <select
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(parseInt(e.target.value));
                    setCurrentPage(0);
                  }}
                  className="w-20 px-2 py-1 border border-gray-300 rounded-md bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                  <option value={1000}>1000</option>
                </select>
                <span className="text-sm text-gray-600">data per halaman</span>
              </div>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-gray-50/50">
                <TableRow className="border-gray-200/50">
                  <TableHead className="font-semibold text-gray-700 py-4">Judul Pemilihan</TableHead>
                  <TableHead className="font-semibold text-gray-700 py-4">Tingkat</TableHead>
                  <TableHead className="font-semibold text-gray-700 py-4">Wilayah</TableHead>
                  <TableHead className="font-semibold text-gray-700 py-4">Status</TableHead>
                  <TableHead className="font-semibold text-gray-700 py-4">Total Laporan</TableHead>
                  <TableHead className="font-semibold text-gray-700 py-4">Tanggal Mulai</TableHead>
                  <TableHead className="font-semibold text-gray-700 py-4">Tanggal Akhir</TableHead>
                  <TableHead className="font-semibold text-gray-700 py-4 w-[100px] text-center">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-12">
                      <div className="flex flex-col items-center justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
                        <span className="text-gray-600 font-medium">Memuat data...</span>
                        <span className="text-sm text-gray-400">Harap tunggu sebentar</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : pemilihan.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-12">
                      <div className="flex flex-col items-center justify-center">
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                          <Search className="w-8 h-8 text-gray-400" />
                        </div>
                        <h3 className="text-lg font-medium text-gray-900 mb-2">Tidak ada data pemilihan</h3>
                        <p className="text-gray-500 text-center max-w-sm">
                          Belum ada data pemilihan yang tersedia atau data tidak sesuai dengan filter yang diterapkan
                        </p>
                        <div className="mt-4">
                          <Link href="/admin/pemilihan/create">
                            <Button className="bg-blue-600 hover:bg-blue-700">
                              <Plus className="mr-2 h-4 w-4" />
                              Buat Pemilihan Pertama
                            </Button>
                          </Link>
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  pemilihan.map((item, index) => (
                    <TableRow key={item.pemilihanId} className={index % 2 === 0 ? "bg-white" : "bg-gray-50/30"}>
                      <TableCell className="py-4">
                        <div className="max-w-xs">
                          <div className="font-semibold text-gray-900 mb-1">{item.judulPemilihan}</div>
                          {item.deskripsi && (
                            <div className="text-sm text-gray-500 line-clamp-2">
                              {item.deskripsi.length > 60 
                                ? item.deskripsi.substring(0, 60) + "..." 
                                : item.deskripsi}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="py-4">
                        <Badge variant="outline" className="font-medium">
                          {formatTingkat(item.tingkatPemilihan || "")}
                        </Badge>
                      </TableCell>
                      <TableCell className="py-4">
                        <span className="text-gray-700 font-medium">
                          {item.wilayahTingkat || '-'}
                        </span>
                      </TableCell>
                      <TableCell className="py-4">{getStatusBadge(item.status)}</TableCell>
                      <TableCell className="py-4">
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className="font-medium">
                            {item.totalLaporan || 0}
                          </Badge>
                          <span className="text-xs text-gray-500">laporan</span>
                        </div>
                      </TableCell>
                      <TableCell className="py-4">
                        <span className="text-gray-600 font-medium">
                          {(item.tanggalMulai || item.tanggalAktif) ? new Date(item.tanggalMulai || item.tanggalAktif!).toLocaleDateString('id-ID', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric'
                          }) : '-'}
                        </span>
                      </TableCell>
                      <TableCell className="py-4">
                        <span className="text-gray-600 font-medium">
                          {(item.tanggalSelesai || item.tanggalBerakhir) ? new Date(item.tanggalSelesai || item.tanggalBerakhir!).toLocaleDateString('id-ID', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric'
                          }) : '-'}
                        </span>
                      </TableCell>
                      <TableCell className="py-4 text-center">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0 hover:bg-gray-100">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-40">
                            <Link href={`/admin/pemilihan/${item.pemilihanId}`}>
                              <DropdownMenuItem className="cursor-pointer">
                                <Eye className="mr-2 h-4 w-4" />
                                Lihat Detail
                              </DropdownMenuItem>
                            </Link>
                            <Link href={`/admin/pemilihan/${item.pemilihanId}/edit`}>
                              <DropdownMenuItem className="cursor-pointer">
                                <Edit className="mr-2 h-4 w-4" />
                                Edit
                              </DropdownMenuItem>
                            </Link>
                            <DropdownMenuItem
                              className="text-red-600 cursor-pointer"
                              onClick={() => handleDelete(item.pemilihanId!)}
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

          {/* Enhanced Pagination */}
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
                  
                  {/* Page Numbers */}
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
