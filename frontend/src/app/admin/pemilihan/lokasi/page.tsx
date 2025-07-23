"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import ProtectedRoute from "@/components/ProtectedRoute";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { getApiUrl } from "@/lib/config";
import { MapPin, Calendar, Building2, Search, Filter, Users, Eye, ArrowLeft, Vote, Building, Home, Trees, Landmark, X } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { SortableHeader } from "@/components/ui/sortable-header";
import { ServerPagination } from "@/components/ServerPagination";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { AdminPageHeader } from "@/components/AdminPageHeader";
import PemilihanMap from "@/components/PemilihanMap";

interface PemilihanLocation {
  id: number;
  namaPemilihan: string;
  tingkatPemilihan: string;
  status: string;
  tanggalMulai: string;
  tanggalSelesai: string;
  provinsiNama: string;
  kotaNama: string;
  kecamatanNama: string;
  kelurahanNama: string;
  alamatLengkap: string;
  latitude: number;
  longitude: number;
  jumlahTps: number;
  jumlahPemilih: number;
  deskripsi?: string;
  totalLaporan?: number;
  createdAt?: string;
  updatedAt?: string;
  wilayahTingkat?: string;
}

export default function PemilihanLokasiPage() {
  const router = useRouter();
  const [pemilihanList, setPemilihanList] = useState<PemilihanLocation[]>([]);
  const [allPemilihanLocations, setAllPemilihanLocations] = useState<PemilihanLocation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [mapCenter, setMapCenter] = useState<[number, number]>([-2.548926, 118.0148634]);
  const [mapZoom, setMapZoom] = useState(5);

  // Filter states
  const [namaFilter, setNamaFilter] = useState("");
  const [provinsiFilter, setProvinsiFilter] = useState("");
  const [kotaFilter, setKotaFilter] = useState("");
  const [kecamatanFilter, setKecamatanFilter] = useState("");
  const [selectedTingkat, setSelectedTingkat] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [showFilters, setShowFilters] = useState(false);

  // Applied filters (only used when search button is pressed)
  const [appliedNamaFilter, setAppliedNamaFilter] = useState("");
  const [appliedProvinsiFilter, setAppliedProvinsiFilter] = useState("");
  const [appliedKotaFilter, setAppliedKotaFilter] = useState("");
  const [appliedKecamatanFilter, setAppliedKecamatanFilter] = useState("");
  const [appliedSelectedTingkat, setAppliedSelectedTingkat] = useState<string>("all");
  const [appliedSelectedStatus, setAppliedSelectedStatus] = useState<string>("all");

  // Pagination states
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [pageSize, setPageSize] = useState(25);
  const [sortBy, setSortBy] = useState('namaPemilihan');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  const { toast } = useToast();
  const { token } = useAuth();

  // Helper function to get authorization headers
  const getAuthHeaders = () => ({
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` })
  });

  // Helper function to get tingkat icon
  const getTingkatIcon = (tingkat: string) => {
    const tingkatLower = tingkat?.toLowerCase() || '';
    switch (tingkatLower) {
      case 'provinsi':
        return '🏛️';
      case 'kota':
      case 'kabupaten':
        return '🏙️';
      case 'kecamatan':
        return '🏘️';
      case 'kelurahan':
      case 'desa':
        return '🏠';
      default:
        return '📍';
    }
  };

  // Helper function to get tingkat color
  const getTingkatColor = (tingkat: string) => {
    const tingkatLower = tingkat?.toLowerCase() || '';
    switch (tingkatLower) {
      case 'provinsi':
        return 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900/20 dark:text-purple-400 dark:border-purple-800';
      case 'kota':
      case 'kabupaten':
        return 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800';
      case 'kecamatan':
        return 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-900/20 dark:text-orange-400 dark:border-orange-800';
      case 'kelurahan':
      case 'desa':
        return 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-900/20 dark:text-gray-400 dark:border-gray-800';
    }
  };

  // Helper function to format tingkat display name
  const formatTingkat = (tingkat: string) => {
    const tingkatMap: { [key: string]: string } = {
      'provinsi': 'Provinsi',
      'kota': 'Kota/Kabupaten',
      'kabupaten': 'Kota/Kabupaten',
      'kecamatan': 'Kecamatan',
      'kelurahan': 'Kelurahan/Desa',
      'desa': 'Kelurahan/Desa'
    };
    return tingkatMap[tingkat?.toLowerCase()] || tingkat;
  };

  useEffect(() => {
    fetchPemilihanLocations();
    fetchAllPemilihanLocations();
  }, [currentPage, pageSize, appliedNamaFilter, appliedProvinsiFilter, appliedKotaFilter, appliedKecamatanFilter, appliedSelectedTingkat, appliedSelectedStatus, sortBy, sortDir]);

  const fetchAllPemilihanLocations = async () => {
    try {
      const params = new URLSearchParams();
      if (appliedNamaFilter) params.append('nama', appliedNamaFilter);
      if (appliedProvinsiFilter) params.append('provinsi', appliedProvinsiFilter);
      if (appliedKotaFilter) params.append('kota', appliedKotaFilter);
      if (appliedKecamatanFilter) params.append('kecamatan', appliedKecamatanFilter);
      if (appliedSelectedTingkat && appliedSelectedTingkat !== "all") params.append('tingkat', appliedSelectedTingkat);
      if (appliedSelectedStatus && appliedSelectedStatus !== "all") params.append('status', appliedSelectedStatus);

      const response = await fetch(getApiUrl(`/api/pemilihan/map-locations?${params.toString()}`), {
        headers: getAuthHeaders()
      });

      if (response.ok) {
        const data = await response.json();
        setAllPemilihanLocations(data);
        
        // Auto-center map if results are filtered
        if (data.length > 0 && (appliedProvinsiFilter || appliedKotaFilter || appliedKecamatanFilter)) {
          const avgLat = data.reduce((sum: number, loc: PemilihanLocation) => sum + loc.latitude, 0) / data.length;
          const avgLng = data.reduce((sum: number, loc: PemilihanLocation) => sum + loc.longitude, 0) / data.length;
          setMapCenter([avgLat, avgLng]);
          setMapZoom(appliedKecamatanFilter ? 12 : appliedKotaFilter ? 10 : appliedProvinsiFilter ? 8 : 5);
        }
      }
    } catch (error) {
      console.error('Error fetching all pemilihan locations:', error);
    }
  };

  const fetchPemilihanLocations = async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams();
      params.append('page', currentPage.toString());
      params.append('size', pageSize.toString());
      
      if (appliedNamaFilter) params.append('keyword', appliedNamaFilter);
      if (appliedSelectedTingkat && appliedSelectedTingkat !== "all") params.append('tingkat', appliedSelectedTingkat);
      if (appliedSelectedStatus && appliedSelectedStatus !== "all") params.append('status', appliedSelectedStatus);

      const response = await fetch(getApiUrl(`/api/pemilihan/search-paged?${params.toString()}`), {
        headers: getAuthHeaders()
      });

      if (response.ok) {
        const data = await response.json();
        // Filter only pemilihan with location data
        const pemilihanWithLocation = (data.content || data).filter((p: any) => 
          p.latitude && p.longitude
        );
        setPemilihanList(pemilihanWithLocation);
        setTotalPages(data.totalPages || 0);
        setTotalElements(pemilihanWithLocation.length);
      } else {
        const errorText = await response.text();
        toast({
          title: "Error",
          description: errorText || "Gagal memuat data lokasi pemilihan",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error fetching pemilihan locations:', error);
      toast({
        title: "Error",
        description: "Gagal memuat data lokasi pemilihan",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Filter handlers
  const handleApplyFilters = () => {
    setAppliedNamaFilter(namaFilter);
    setAppliedProvinsiFilter(provinsiFilter);
    setAppliedKotaFilter(kotaFilter);
    setAppliedKecamatanFilter(kecamatanFilter);
    setAppliedSelectedTingkat(selectedTingkat);
    setAppliedSelectedStatus(selectedStatus);
    setCurrentPage(0);
  };

  const handleResetFilters = () => {
    setNamaFilter("");
    setProvinsiFilter("");
    setKotaFilter("");
    setKecamatanFilter("");
    setSelectedTingkat("all");
    setSelectedStatus("all");
    setAppliedNamaFilter("");
    setAppliedProvinsiFilter("");
    setAppliedKotaFilter("");
    setAppliedKecamatanFilter("");
    setAppliedSelectedTingkat("all");
    setAppliedSelectedStatus("all");
    setCurrentPage(0);
  };

  const handleSort = (newSortBy: string, newSortDir: 'asc' | 'desc') => {
    setSortBy(newSortBy);
    setSortDir(newSortDir);
    setCurrentPage(0);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handlePageSizeChange = (size: number) => {
    setPageSize(size);
    setCurrentPage(0);
  };

  const handlePemilihanClick = (pemilihanId: number) => {
    router.push(`/admin/pemilihan/${pemilihanId}`);
  };

  // Get unique provinces and cities for statistics
  const uniqueProvinces = new Set(allPemilihanLocations.map(p => p.provinsiNama)).size;
  const uniqueCities = new Set(allPemilihanLocations.map(p => p.kotaNama)).size;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <ProtectedRoute requireAuth={true} allowedRoles={["ADMIN", "MODERATOR"]}>
      <div className="min-h-screen bg-gray-50/30">
        <div className="space-y-8 p-6">
          {/* Enhanced Header */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200/50 p-8">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                    <MapPin className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold text-gray-900">Lokasi Pemilihan</h1>
                    <p className="text-gray-600 mt-1">
                      Peta dan daftar lokasi pemilihan yang memiliki data koordinat
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4 text-sm text-gray-500 mt-4">
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span>Total: {allPemilihanLocations.length} Lokasi</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span>Aktif: {allPemilihanLocations.filter(p => p.status === 'AKTIF').length}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                    <span>Provinsi: {uniqueProvinces}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                    <span>Kota: {uniqueCities}</span>
                  </div>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  variant="outline"
                  onClick={() => router.push('/admin/pemilihan')}
                  className="border-gray-300 hover:bg-gray-50"
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Kembali ke Pemilihan
                </Button>
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
                    <h2 className="text-lg font-semibold text-gray-900">Filter & Pencarian Lokasi</h2>
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
                        <label className="text-sm font-semibold text-gray-700">Filter Nama Pemilihan</label>
                        <Input
                          placeholder="Cari nama pemilihan..."
                          value={namaFilter}
                          onChange={(e) => setNamaFilter(e.target.value)}
                          className="bg-white border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-semibold text-gray-700">Filter Provinsi</label>
                        <Input
                          placeholder="Cari provinsi..."
                          value={provinsiFilter}
                          onChange={(e) => setProvinsiFilter(e.target.value)}
                          className="bg-white border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-semibold text-gray-700">Filter Kota/Kabupaten</label>
                        <Input
                          placeholder="Cari kota/kabupaten..."
                          value={kotaFilter}
                          onChange={(e) => setKotaFilter(e.target.value)}
                          className="bg-white border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-semibold text-gray-700">Filter Kecamatan</label>
                        <Input
                          placeholder="Cari kecamatan..."
                          value={kecamatanFilter}
                          onChange={(e) => setKecamatanFilter(e.target.value)}
                          className="bg-white border-gray-300 focus:border-blue-500 focus:ring-blue-500"
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
                          <option value="PROVINSI">🏛️ Provinsi</option>
                          <option value="KOTA">🏙️ Kota</option>
                          <option value="KABUPATEN">🏙️ Kabupaten</option>
                          <option value="KECAMATAN">🏘️ Kecamatan</option>
                          <option value="KELURAHAN">🏠 Kelurahan</option>
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
                          <option value="SELESAI">✔️ Selesai</option>
                          <option value="DRAFT">📝 Draft</option>
                          <option value="DIBATALKAN">❌ Dibatalkan</option>
                        </select>
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-semibold text-gray-700">Items per Halaman</label>
                        <select
                          value={pageSize}
                          onChange={(e) => handlePageSizeChange(Number(e.target.value))}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                        >
                          <option value={25}>25 per halaman</option>
                          <option value={50}>50 per halaman</option>
                          <option value={100}>100 per halaman</option>
                          <option value={1000}>1000 per halaman</option>
                        </select>
                      </div>

                      <div className="flex items-end">
                        <div className="flex gap-4">
                          <Button 
                            onClick={handleApplyFilters} 
                            className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 px-8 py-3 shadow-sm"
                          >
                            <Search className="mr-2 h-4 w-4" />
                            Cari & Filter
                          </Button>
                          <Button 
                            variant="outline" 
                            onClick={handleResetFilters} 
                            className="border-gray-300 hover:bg-gray-50 px-8 py-3"
                          >
                            <X className="mr-2 h-4 w-4" />
                            Reset
                          </Button>
                        </div>
                      </div>
                    </div>
                    
                    {(namaFilter || provinsiFilter || kotaFilter || kecamatanFilter || selectedTingkat !== "all" || selectedStatus !== "all") && (
                      <div className="mt-4 pt-4 border-t border-gray-200">
                        <div className="flex flex-wrap gap-2">
                          <span className="text-sm font-medium text-gray-600">Filter aktif:</span>
                          {namaFilter && (
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              Pencarian: "{namaFilter}"
                            </span>
                          )}
                          {provinsiFilter && (
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                              Provinsi: "{provinsiFilter}"
                            </span>
                          )}
                          {kotaFilter && (
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              Kota: "{kotaFilter}"
                            </span>
                          )}
                          {kecamatanFilter && (
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                              Kecamatan: "{kecamatanFilter}"
                            </span>
                          )}
                          {selectedTingkat !== "all" && (
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              Tingkat: {selectedTingkat}
                            </span>
                          )}
                          {selectedStatus !== "all" && (
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                              Status: {selectedStatus}
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

          {/* Enhanced Map Section */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200/50">
            <div className="p-6 border-b border-gray-200/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-100 to-blue-200 rounded-lg flex items-center justify-center">
                    <MapPin className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">Peta Lokasi Pemilihan</h2>
                    <p className="text-sm text-gray-500">Visualisasi geografis semua lokasi pemilihan</p>
                  </div>
                </div>
                <Badge variant="outline" className="font-medium">
                  {allPemilihanLocations.length} Lokasi Terpetakan
                </Badge>
              </div>
            </div>
            <div className="p-0">
              {isLoading ? (
                <div className="h-[600px] flex items-center justify-center">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4 mx-auto"></div>
                    <p className="text-gray-600 font-medium">Memuat peta lokasi...</p>
                    <p className="text-sm text-gray-400">Harap tunggu sebentar</p>
                  </div>
                </div>
              ) : (
                <PemilihanMap
                  locations={allPemilihanLocations}
                  center={mapCenter}
                  zoom={mapZoom}
                  onPemilihanClick={handlePemilihanClick}
                />
              )}
            </div>
          </div>


        </div>
      </div>
    </ProtectedRoute>
  );
}
