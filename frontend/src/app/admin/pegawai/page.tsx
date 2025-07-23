"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import ProtectedRoute from "@/components/ProtectedRoute";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { config, getApiUrl } from "@/lib/config";
import { Pencil, Trash2, Plus, Search, UserCheck, UserX, Shield, Users, Eye, MapPin, Vote } from "lucide-react";
import { AdminPageHeader } from "@/components/AdminPageHeader";
import { SortableHeader } from "@/components/ui/sortable-header";
import { ServerPagination } from "@/components/ServerPagination";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

interface Pegawai {
  id: number;
  username: string;
  email: string;
  fullName: string;
  phoneNumber: string;
  nip?: string;
  pendidikan?: string;
  role: string;
  jabatan: string;
  status: string;
  createdAt: string;
  photoUrl?: string;
  alamat?: string;
  provinsi?: string;
  provinsiNama?: string;
  kota?: string;
  kotaNama?: string;
  kecamatan?: string;
  kecamatanNama?: string;
  kelurahan?: string;
  kelurahanNama?: string;
  kodePos?: string;
  latitude?: number;
  longitude?: number;
  totalTps?: number;
  totalPemilihan?: number;
  pemilihanList?: Array<{
    id: number;
    judulPemilihan: string;
    totalLaporan: number;
    totalJenisLaporan: number;
  }>;
}

export default function PegawaiPage() {
  const router = useRouter();
  const [pegawaiList, setPegawaiList] = useState<Pegawai[]>([]);
  
  // Filter states
  const [namaFilter, setNamaFilter] = useState("");
  const [emailFilter, setEmailFilter] = useState("");
  const [phoneFilter, setPhoneFilter] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [selectedJabatan, setSelectedJabatan] = useState<string>("all");
  const [loading, setLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(true);
  
  // Applied filters (only used when search button is pressed)
  const [appliedNamaFilter, setAppliedNamaFilter] = useState("");
  const [appliedEmailFilter, setAppliedEmailFilter] = useState("");
  const [appliedPhoneFilter, setAppliedPhoneFilter] = useState("");
  const [appliedSelectedStatus, setAppliedSelectedStatus] = useState<string>("all");
  const [appliedSelectedJabatan, setAppliedSelectedJabatan] = useState<string>("all");
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [pageSize, setPageSize] = useState(25);
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  const { toast } = useToast();
  const { token } = useAuth();
  
  // Helper function to get authorization headers
  const getAuthHeaders = () => ({
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` })
  });

  useEffect(() => {
    fetchPegawai();
  }, [currentPage, pageSize, appliedNamaFilter, appliedEmailFilter, appliedPhoneFilter, appliedSelectedStatus, appliedSelectedJabatan, sortBy, sortDir]);

  const fetchPegawai = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.append('page', currentPage.toString());
      params.append('size', pageSize.toString());
      params.append('sortBy', sortBy);
      params.append('sortDirection', sortDir);
      if (appliedNamaFilter) params.append('nama', appliedNamaFilter);
      if (appliedEmailFilter) params.append('email', appliedEmailFilter);
      if (appliedPhoneFilter) params.append('phoneNumber', appliedPhoneFilter);
      if (appliedSelectedStatus && appliedSelectedStatus !== "all") params.append('status', appliedSelectedStatus);
      if (appliedSelectedJabatan && appliedSelectedJabatan !== "all") params.append('jabatan', appliedSelectedJabatan);
      
      const response = await fetch(getApiUrl(`/api/pegawai?${params.toString()}`), {
        headers: getAuthHeaders()
      });
      
      if (response.ok) {
        const data = await response.json();
        setPegawaiList(data.pegawai || data);
        setTotalPages(data.totalPages || 0);
        setTotalElements(data.totalElements || 0);
      } else {
        const errorText = await response.text();
        toast({
          title: "Error",
          description: errorText || "Gagal memuat data pegawai",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Gagal memuat data pegawai",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Filter handlers
  const handleApplyFilters = () => {
    setAppliedNamaFilter(namaFilter);
    setAppliedEmailFilter(emailFilter);
    setAppliedPhoneFilter(phoneFilter);
    setAppliedSelectedStatus(selectedStatus);
    setAppliedSelectedJabatan(selectedJabatan);
    setCurrentPage(0);
  };

  const handleResetFilters = () => {
    setNamaFilter("");
    setEmailFilter("");
    setPhoneFilter("");
    setSelectedStatus("all");
    setSelectedJabatan("all");
    setAppliedNamaFilter("");
    setAppliedEmailFilter("");
    setAppliedPhoneFilter("");
    setAppliedSelectedStatus("all");
    setAppliedSelectedJabatan("all");
    setCurrentPage(0);
  };

  const handleNamaFilterChange = (value: string) => {
    setNamaFilter(value);
  };

  const handleEmailFilterChange = (value: string) => {
    setEmailFilter(value);
  };

  const handlePhoneFilterChange = (value: string) => {
    setPhoneFilter(value);
  };

  const handleStatusChange = (value: string) => {
    setSelectedStatus(value);
  };

  const handleJabatanChange = (value: string) => {
    setSelectedJabatan(value);
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

  const handleDelete = async (pegawaiId: number) => {
    if (!confirm('Apakah Anda yakin ingin menghapus pegawai ini?')) return;
    
    try {
      setLoading(true);
      const response = await fetch(getApiUrl(`/api/pegawai/${pegawaiId}`), {
        method: 'DELETE',
        headers: getAuthHeaders()
      });

      if (response.ok) {
        toast({
          title: "Sukses",
          description: "Pegawai berhasil dihapus",
        });
        fetchPegawai();
      } else {
        const errorText = await response.text();
        toast({
          title: "Error",
          description: errorText || "Gagal menghapus pegawai",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Terjadi kesalahan saat menghapus pegawai",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const togglePegawaiStatus = async (pegawaiId: number) => {
    try {
      setLoading(true);
      const response = await fetch(getApiUrl(`/api/pegawai/${pegawaiId}/toggle-status`), {
        method: 'PUT',
        headers: getAuthHeaders()
      });

      if (response.ok) {
        toast({
          title: "Sukses",
          description: "Status pegawai berhasil diubah",
        });
        fetchPegawai();
      } else {
        const errorText = await response.text();
        toast({
          title: "Error",
          description: errorText || "Gagal mengubah status pegawai",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Terjadi kesalahan saat mengubah status pegawai",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const openCreateDialog = () => {
    router.push('/admin/pegawai/create');
  };

  return (
    <ProtectedRoute requireAuth={true} allowedRoles={["ADMIN", "MODERATOR"]}>
      <div className="min-h-screen bg-background">
        <AdminPageHeader
          title="Management Pegawai"
          description="Kelola data pegawai dan TPS yang ditugaskan"
          icon={Users}
          primaryAction={{
            label: "Tambah Pegawai",
            onClick: openCreateDialog,
            icon: Plus
          }}
          stats={[
            {
              label: "Total Pegawai",
              value: totalElements,
              variant: "secondary"
            },
            {
              label: "Pegawai Aktif",
              value: pegawaiList.filter(p => p.status === "AKTIF").length,
              variant: "default"
            }
          ]}
        />

        <div className="container mx-auto p-6 space-y-6">
          {/* Professional Filter Section */}
          {showFilters && (
            <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-gray-200 dark:border-gray-700 shadow-lg">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                    <Search className="h-5 w-5" />
                    Filter Pencarian Pegawai
                  </CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowFilters(false)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    Sembunyikan Filter
                  </Button>
                </div>
              </CardHeader>
            <CardContent className="space-y-4">
              {/* Separated Column Filters */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Name Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Filter Nama
                  </label>
                  <Input
                    placeholder="Cari berdasarkan nama..."
                    value={namaFilter}
                    onChange={(e) => handleNamaFilterChange(e.target.value)}
                    className="w-full"
                  />
                </div>

                {/* Email Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Filter Email
                  </label>
                  <Input
                    placeholder="Cari berdasarkan email..."
                    value={emailFilter}
                    onChange={(e) => handleEmailFilterChange(e.target.value)}
                    className="w-full"
                  />
                </div>

                {/* Phone Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Filter Nomor Telepon
                  </label>
                  <Input
                    placeholder="Cari berdasarkan telepon..."
                    value={phoneFilter}
                    onChange={(e) => handlePhoneFilterChange(e.target.value)}
                    className="w-full"
                  />
                </div>

                {/* Status Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Filter Status
                  </label>
                  <select
                    value={selectedStatus}
                    onChange={(e) => handleStatusChange(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  >
                    <option value="all">Semua Status</option>
                    <option value="AKTIF">Aktif</option>
                    <option value="TIDAK_AKTIF">Tidak Aktif</option>
                    <option value="SUSPEND">Suspend</option>
                  </select>
                </div>
              </div>

              {/* Jabatan Filter */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Filter Jabatan
                  </label>
                  <select
                    value={selectedJabatan}
                    onChange={(e) => handleJabatanChange(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  >
                    <option value="all">Semua Jabatan</option>
                    <option value="Koordinator">Koordinator</option>
                    <option value="Supervisor">Supervisor</option>
                    <option value="Surveyor">Surveyor</option>
                    <option value="Admin TPS">Admin TPS</option>
                    <option value="Petugas Lapangan">Petugas Lapangan</option>
                  </select>
                </div>

                {/* Page Size */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Items per Halaman
                  </label>
                  <select
                    value={pageSize}
                    onChange={(e) => handlePageSizeChange(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  >
                    <option value={10}>10 per halaman</option>
                    <option value={25}>25 per halaman</option>
                    <option value={50}>50 per halaman</option>
                    <option value={100}>100 per halaman</option>
                  </select>
                </div>
              </div>

              {/* Filter Actions */}
              <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-600">
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Menampilkan {pegawaiList.length} dari {totalElements} pegawai
                  {(namaFilter || emailFilter || phoneFilter || selectedStatus !== "all" || selectedJabatan !== "all") && (
                    <span className="ml-2 text-blue-600 dark:text-blue-400">
                      (Filter aktif: {[
                        namaFilter && "Nama", 
                        emailFilter && "Email",
                        phoneFilter && "Telepon",
                        selectedStatus !== "all" && "Status",
                        selectedJabatan !== "all" && "Jabatan"
                      ].filter(Boolean).join(", ")})
                    </span>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={handleResetFilters}
                    className="text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
                  >
                    Reset Filter
                  </Button>
                  <Button
                    onClick={handleApplyFilters}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                    disabled={!namaFilter && !emailFilter && !phoneFilter && selectedStatus === "all" && selectedJabatan === "all"}
                  >
                    <Search className="h-4 w-4 mr-2" />
                    Cari
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
          )}

          {/* Show Filter Button when filters are hidden */}
          {!showFilters && (
            <div className="flex justify-center">
              <Button
                variant="outline"
                onClick={() => setShowFilters(true)}
                className="text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <Search className="h-4 w-4 mr-2" />
                Tampilkan Filter
              </Button>
            </div>
          )}

          {/* Pegawai Table */}
          <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-gray-200 dark:border-gray-700 shadow-lg hover:shadow-xl transition-all">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50/50 dark:bg-gray-800/50">
                      <TableHead className="w-[200px]">
                        <SortableHeader
                          sortKey="fullName"
                          currentSort={{ sortBy, sortDir }}
                          onSort={handleSort}
                        >
                          Informasi Pegawai
                        </SortableHeader>
                      </TableHead>
                      <TableHead className="w-[180px]">Kontak & Data</TableHead>
                      <TableHead className="w-[120px]">
                        <SortableHeader
                          sortKey="jabatan"
                          currentSort={{ sortBy, sortDir }}
                          onSort={handleSort}
                        >
                          Jabatan
                        </SortableHeader>
                      </TableHead>
                      <TableHead className="w-[100px]">
                        <SortableHeader
                          sortKey="status"
                          currentSort={{ sortBy, sortDir }}
                          onSort={handleSort}
                        >
                          Status
                        </SortableHeader>
                      </TableHead>
                      <TableHead className="w-[200px]">Lokasi Tugas</TableHead>
                      <TableHead className="w-[100px]">
                        <SortableHeader
                          sortKey="createdAt"
                          currentSort={{ sortBy, sortDir }}
                          onSort={handleSort}
                        >
                          Terdaftar
                        </SortableHeader>
                      </TableHead>
                      <TableHead className="w-[150px] text-center">Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8">
                          <LoadingSpinner />
                        </TableCell>
                      </TableRow>
                    ) : pegawaiList.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8">
                          <div className="flex flex-col items-center gap-2">
                            <Users className="h-8 w-8 text-muted-foreground" />
                            <span className="text-muted-foreground">
                              {(appliedNamaFilter || appliedEmailFilter || appliedPhoneFilter || appliedSelectedStatus !== "all" || appliedSelectedJabatan !== "all") ? 'Tidak ada pegawai yang ditemukan' : 'Belum ada data pegawai'}
                            </span>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      pegawaiList.map((pegawai) => (
                        <TableRow key={pegawai.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/50 transition-colors">
                          <TableCell className="py-4">
                            <div className="flex items-center gap-3">
                              {/* Profile Photo */}
                              <div className="w-12 h-12 rounded-full overflow-hidden bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white font-semibold border-2 border-gray-200 dark:border-gray-600 shadow-sm">
                                {pegawai.photoUrl ? (
                                  <img 
                                    src={
                                      pegawai.photoUrl.startsWith('http') 
                                        ? pegawai.photoUrl 
                                        : `${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8080'}/api/upload/photos/${pegawai.photoUrl}`
                                    }
                                    alt={`Foto ${pegawai.fullName}`}
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                      // Fallback to initials if image fails to load
                                      const target = e.target as HTMLImageElement;
                                      target.style.display = 'none';
                                      const parent = target.parentElement;
                                      if (parent) {
                                        parent.innerHTML = pegawai.fullName.charAt(0).toUpperCase();
                                      }
                                    }}
                                  />
                                ) : (
                                  <span className="text-lg">
                                    {pegawai.fullName.charAt(0).toUpperCase()}
                                  </span>
                                )}
                              </div>
                              {/* Name and Username */}
                              <div>
                                <div className="font-semibold text-gray-900 dark:text-white">{pegawai.fullName}</div>
                                <div className="text-sm text-gray-500 dark:text-gray-400">@{pegawai.username}</div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="py-4">
                            <div className="space-y-1">
                              <div className="text-sm font-medium text-gray-900 dark:text-white">{pegawai.email}</div>
                              <div className="text-sm text-gray-500 dark:text-gray-400">{pegawai.phoneNumber}</div>
                              {pegawai.nip && (
                                <div className="text-xs text-blue-600 dark:text-blue-400">
                                  <span className="font-medium">NIP:</span> {pegawai.nip}
                                </div>
                              )}
                              {pegawai.pendidikan && (
                                <div className="text-xs text-green-600 dark:text-green-400">
                                  <span className="font-medium">Pendidikan:</span> {pegawai.pendidikan}
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="py-4">
                            <Badge className="bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800 font-medium">
                              <Shield className="h-3 w-3 mr-1" />
                              {pegawai.jabatan}
                            </Badge>
                          </TableCell>
                          <TableCell className="py-4">
                            <Badge 
                              className={
                                pegawai.status === 'AKTIF' 
                                  ? 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800' 
                                  : pegawai.status === 'TIDAK_AKTIF'
                                  ? 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800'
                                  : 'bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-800'
                              }
                            >
                              {pegawai.status === 'AKTIF' ? '🟢' : pegawai.status === 'TIDAK_AKTIF' ? '🔴' : '🟡'} {pegawai.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="py-4">
                            {pegawai.alamat ? (
                              <div className="flex items-start gap-2">
                                <MapPin className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                                <div className="text-sm space-y-0.5">
                                  <div className="font-medium text-gray-900 dark:text-white">
                                    {pegawai.kotaNama || pegawai.kota || 'Kota tidak diketahui'}
                                  </div>
                                  <div className="text-gray-500 dark:text-gray-400">
                                    {pegawai.kecamatanNama || pegawai.kecamatan || 'Kecamatan tidak diketahui'}
                                  </div>
                                  {(pegawai.kelurahanNama || pegawai.kelurahan) && (
                                    <div className="text-xs text-gray-400 dark:text-gray-500">
                                      {pegawai.kelurahanNama || pegawai.kelurahan}
                                    </div>
                                  )}
                                </div>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2 text-gray-400">
                                <MapPin className="h-4 w-4" />
                                <span className="text-sm">Belum diatur</span>
                              </div>
                            )}
                          </TableCell>
                          <TableCell className="py-4">
                            <div className="text-sm text-gray-600 dark:text-gray-400">
                              {new Date(pegawai.createdAt).toLocaleDateString('id-ID', {
                                day: '2-digit',
                                month: 'short',
                                year: 'numeric'
                              })}
                            </div>
                          </TableCell>
                          <TableCell className="py-4">
                            <div className="flex items-center justify-center gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => router.push(`/admin/pegawai/${pegawai.id}`)}
                                className="h-8 w-8 p-0 text-green-600 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-900/20"
                                title="Lihat Detail"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => router.push(`/admin/pegawai/${pegawai.id}/edit`)}
                                className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                                title="Edit"
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => togglePegawaiStatus(pegawai.id)}
                                className={`h-8 w-8 p-0 ${
                                  pegawai.status === 'AKTIF' 
                                    ? 'text-orange-600 hover:text-orange-700 hover:bg-orange-50 dark:hover:bg-orange-900/20' 
                                    : 'text-green-600 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-900/20'
                                }`}
                                title={pegawai.status === 'AKTIF' ? 'Nonaktifkan' : 'Aktifkan'}
                              >
                                {pegawai.status === 'AKTIF' ? <UserX className="h-4 w-4" /> : <UserCheck className="h-4 w-4" />}
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDelete(pegawai.id)}
                                className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                                title="Hapus"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
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
        </div>
      </div>
    </ProtectedRoute>
  );
}
