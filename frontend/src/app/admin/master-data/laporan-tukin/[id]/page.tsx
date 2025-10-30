'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { 
  ArrowLeft, 
  Download, 
  FileText, 
  Printer, 
  Search, 
  Filter, 
  ChevronDown, 
  ChevronUp,
  Users,
  Calculator,
  TrendingDown,
  TrendingUp
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { laporanTukinAPI, type LaporanTukin, type DetailPegawaiTukin } from '@/lib/api';

// Component untuk Rincian Detail Per Pegawai - Versi Profesional dan Scalable
function RincianDetailPerPegawai({ 
  laporanId,
  formatCurrency, 
  safeFormatDate 
}: {
  laporanId: number;
  formatCurrency: (amount: number) => string;
  safeFormatDate: (dateString: string | null | undefined) => string;
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('nama');
  const [filterBy, setFilterBy] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [expandedEmployees, setExpandedEmployees] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(true);
  const [detailData, setDetailData] = useState<any[]>([]);
  const [stats, setStats] = useState<any>({});
  const { toast } = useToast();

  const itemsPerPage = 10;

  useEffect(() => {
    fetchDetailData();
  }, [laporanId]);

  const fetchDetailData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/admin/master-data/laporan-tukin/${laporanId}/rincian`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
          'Content-Type': 'application/json'
        }
      });
      
      const result = await response.json();
      if (result.success) {
        setDetailData(result.data || []);
        calculateStats(result.data || []);
      } else {
        console.error('Failed to fetch detail data:', result.message);
      }
    } catch (error) {
      console.error('Error fetching detail data:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (data: any[]) => {
    const statistics = {
      totalEmployees: data.length,
      employeesWithDeductions: data.filter(emp => {
        const daysWithDeduction = emp.historiAbsensi?.filter((h: any) => h.nominalPemotongan > 0).length || 0;
        return daysWithDeduction > 0;
      }).length,
      employeesWithoutDeductions: 0,
      totalAttendanceDays: 0,
      totalDeductionDays: 0,
      totalDeductionAmount: 0,
      averageDeductionPerEmployee: 0
    };

    statistics.employeesWithoutDeductions = statistics.totalEmployees - statistics.employeesWithDeductions;

    data.forEach(emp => {
      const attendanceDays = emp.historiAbsensi?.length || 0;
      const deductionDays = emp.historiAbsensi?.filter((h: any) => h.nominalPemotongan > 0).length || 0;
      const deductionAmount = emp.totalPotongan || 0;

      statistics.totalAttendanceDays += attendanceDays;
      statistics.totalDeductionDays += deductionDays;
      statistics.totalDeductionAmount += deductionAmount;
    });

    statistics.averageDeductionPerEmployee = statistics.totalEmployees > 0 
      ? statistics.totalDeductionAmount / statistics.totalEmployees 
      : 0;

    setStats(statistics);
  };

  // Filter dan sort data
  const filteredAndSortedData = useMemo(() => {
    let filtered = detailData.filter(emp => {
      const matchesSearch = emp.namaLengkap?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           emp.nip?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           emp.jabatan?.toLowerCase().includes(searchTerm.toLowerCase());

      if (filterBy === 'all') return matchesSearch;
      
      const daysWithDeduction = emp.historiAbsensi?.filter((h: any) => h.nominalPemotongan > 0).length || 0;
      
      if (filterBy === 'with-deductions') return matchesSearch && daysWithDeduction > 0;
      if (filterBy === 'no-deductions') return matchesSearch && daysWithDeduction === 0;
      if (filterBy === 'high-deductions') {
        const totalDeduction = emp.totalPotongan || 0;
        const baseSalary = emp.tunjanganKinerja || 0;
        const deductionPercentage = baseSalary > 0 ? (totalDeduction / baseSalary) * 100 : 0;
        return matchesSearch && deductionPercentage > 30;
      }
      
      return matchesSearch;
    });

    // Sort data
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'nama':
          return (a.namaLengkap || '').localeCompare(b.namaLengkap || '');
        case 'potongan-desc':
          return (b.totalPotongan || 0) - (a.totalPotongan || 0);
        case 'potongan-asc':
          return (a.totalPotongan || 0) - (b.totalPotongan || 0);
        case 'jabatan':
          return (a.jabatan || '').localeCompare(b.jabatan || '');
        case 'hari-potong':
          const aDays = a.historiAbsensi?.filter((h: any) => h.nominalPemotongan > 0).length || 0;
          const bDays = b.historiAbsensi?.filter((h: any) => h.nominalPemotongan > 0).length || 0;
          return bDays - aDays;
        default:
          return 0;
      }
    });

    return filtered;
  }, [detailData, searchTerm, sortBy, filterBy]);

  // Pagination
  const totalPages = Math.ceil(filteredAndSortedData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedData = filteredAndSortedData.slice(startIndex, startIndex + itemsPerPage);

  const toggleEmployeeExpansion = (empId: number) => {
    const newExpanded = new Set(expandedEmployees);
    if (newExpanded.has(empId)) {
      newExpanded.delete(empId);
    } else {
      newExpanded.add(empId);
    }
    setExpandedEmployees(newExpanded);
  };

  const renderEmployeeDetailCard = (pegawai: any) => {
    const empId = pegawai.pegawai?.id || pegawai.pegawaiId;
    const isExpanded = expandedEmployees.has(empId);
    const daysWithDeduction = pegawai.historiAbsensi?.filter((h: any) => h.nominalPemotongan > 0).length || 0;
    const totalDays = pegawai.historiAbsensi?.length || 0;
    const deductionPercentage = pegawai.tunjanganKinerja > 0 
      ? ((pegawai.totalPotongan || 0) / pegawai.tunjanganKinerja) * 100 
      : 0;

    return (
      <Card key={empId} className="border transition-all duration-200 hover:shadow-md">
        <Collapsible open={isExpanded} onOpenChange={() => toggleEmployeeExpansion(empId)}>
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div>
                    <CardTitle className="text-lg">
                      {pegawai.pegawai?.nama || pegawai.namaLengkap}
                    </CardTitle>
                    <CardDescription className="flex items-center gap-2 mt-1">
                      <Badge variant="outline">{pegawai.pegawai?.nip || pegawai.nip}</Badge>
                      <Badge variant="secondary">{pegawai.pegawai?.jabatan?.nama || pegawai.jabatan}</Badge>
                    </CardDescription>
                  </div>
                </div>
                
                <div className="flex items-center space-x-4">
                  {/* Quick Stats */}
                  <div className="hidden md:flex items-center space-x-6 text-sm">
                    <div className="text-center">
                      <div className="font-semibold text-green-600">
                        {formatCurrency(pegawai.tunjanganKinerja || 0)}
                      </div>
                      <div className="text-xs text-gray-500">Tunjangan</div>
                    </div>
                    
                    <div className="text-center">
                      <div className={`font-semibold ${daysWithDeduction > 0 ? 'text-red-600' : 'text-green-600'}`}>
                        {daysWithDeduction}
                      </div>
                      <div className="text-xs text-gray-500">Hari Potong</div>
                    </div>
                    
                    <div className="text-center">
                      <div className={`font-semibold ${
                        (() => {
                          const totalPotongan = pegawai.totalPotongan || 0;
                          const tunjanganKinerja = pegawai.tunjanganKinerja || 0;
                          const maxPossibleDeduction = pegawai.maxPossibleDeduction || 0;
                          const percentage = maxPossibleDeduction > 0 ? (totalPotongan / maxPossibleDeduction) * 100 : 0;
                          
                          if (percentage === 0) return 'text-green-600';
                          if (percentage <= 5) return 'text-gray-900 dark:text-gray-100';
                          if (percentage <= 30) return 'text-orange-600';
                          return 'text-red-600';
                        })()
                      }`}>
                        {formatCurrency(pegawai.totalPotongan || 0)}
                      </div>
                      <div className="text-xs text-gray-500">Total Potong</div>
                    </div>
                    
                    <div className="text-center">
                      <div className={`font-semibold ${
                        (() => {
                          const totalPotongan = pegawai.totalPotongan || 0;
                          const maxPossibleDeduction = pegawai.maxPossibleDeduction || 0;
                          const percentage = maxPossibleDeduction > 0 ? (totalPotongan / maxPossibleDeduction) * 100 : 0;
                          
                          if (percentage === 0) return 'text-green-600';
                          if (percentage <= 30) return 'text-yellow-600';
                          if (percentage <= 60) return 'text-orange-600';
                          return 'text-red-600';
                        })()
                      }`}>
                        {(() => {
                          const totalPotongan = pegawai.totalPotongan || 0;
                          const maxPossibleDeduction = pegawai.maxPossibleDeduction || 0;
                          const percentage = maxPossibleDeduction > 0 ? (totalPotongan / maxPossibleDeduction) * 100 : 0;
                          return percentage.toFixed(2) + '%';
                        })()}
                      </div>
                      <div className="text-xs text-gray-500">% Potong</div>
                    </div>
                    
                    <div className="text-center">
                      <div className="font-semibold text-blue-600">
                        {formatCurrency(pegawai.tunjanganBersih || 0)}
                      </div>
                      <div className="text-xs text-gray-500">Bersih</div>
                    </div>
                  </div>
                  
                  {/* Status Indicator */}
                  <div className="flex items-center space-x-2">
                    {(() => {
                      const totalPotongan = pegawai.totalPotongan || 0;
                      const maxPossibleDeduction = pegawai.maxPossibleDeduction || 0;
                      const percentage = maxPossibleDeduction > 0 ? (totalPotongan / maxPossibleDeduction) * 100 : 0;
                      
                      if (percentage === 0) {
                        return (
                          <Badge className="bg-green-100 text-green-800 border-green-200">
                            <TrendingUp className="w-3 h-3 mr-1" />
                            Perfect
                          </Badge>
                        );
                      } else if (percentage > 30) {
                        return (
                          <Badge variant="destructive">
                            <TrendingDown className="w-3 h-3 mr-1" />
                            High Cut
                          </Badge>
                        );
                      } else {
                        return (
                          <Badge variant="outline">
                            <TrendingDown className="w-3 h-3 mr-1" />
                            {daysWithDeduction} Days
                          </Badge>
                        );
                      }
                    })()}
                    
                    {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                  </div>
                </div>
              </div>
              
              {/* Mobile Quick Stats */}
              <div className="md:hidden grid grid-cols-3 gap-4 mt-4 pt-4 border-t">
                <div className="text-center">
                  <div className="font-semibold text-green-600">
                    {formatCurrency(pegawai.tunjanganKinerja || 0)}
                  </div>
                  <div className="text-xs text-gray-500">Tunjangan</div>
                </div>
                <div className="text-center">
                  <div className={`font-semibold ${daysWithDeduction > 0 ? 'text-red-600' : 'text-green-600'}`}>
                    {daysWithDeduction} hari
                  </div>
                  <div className="text-xs text-gray-500">Hari Potong</div>
                </div>
                <div className="text-center">
                  <div className={`font-semibold ${
                    (() => {
                      const totalPotongan = pegawai.totalPotongan || 0;
                      const maxPossibleDeduction = pegawai.maxPossibleDeduction || 0;
                      const percentage = maxPossibleDeduction > 0 ? (totalPotongan / maxPossibleDeduction) * 100 : 0;
                      
                      if (percentage === 0) return 'text-green-600';
                      if (percentage <= 30) return 'text-yellow-600';
                      if (percentage <= 60) return 'text-orange-600';
                      return 'text-red-600';
                    })()
                  }`}>
                    {(() => {
                      const totalPotongan = pegawai.totalPotongan || 0;
                      const maxPossibleDeduction = pegawai.maxPossibleDeduction || 0;
                      const percentage = maxPossibleDeduction > 0 ? (totalPotongan / maxPossibleDeduction) * 100 : 0;
                      return percentage.toFixed(2) + '%';
                    })()}
                  </div>
                  <div className="text-xs text-gray-500">% Potong</div>
                </div>
              </div>
            </CardHeader>
          </CollapsibleTrigger>
          
          <CollapsibleContent>
            <CardContent className="pt-0">
              {/* Detailed Employee Information - KEEP AS IS since user likes it */}
              <div className="space-y-6">
                
                {/* Statistics Summary */}
                <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-center">
                    <div>
                      <div className="text-lg font-bold text-blue-600">
                        {formatCurrency(pegawai.totalTukin || pegawai.tunjanganKinerja || 0)}
                      </div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">Tunjangan Dasar</div>
                    </div>
                    <div>
                      <div className="text-lg font-bold text-purple-600">
                        {formatCurrency(pegawai.maxPossibleDeduction || 0)}
                      </div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">
                        Maksimal Pemotongan (60%)
                      </div>
                    </div>
                    <div>
                      <div className={`text-lg font-bold text-red-600 ${pegawai.isTotalCapped ? 'font-black border-2 border-red-600 rounded px-2 py-1' : ''}`}>
                        {formatCurrency(pegawai.totalPotongan || pegawai.potonganAbsen || 0)}
                      </div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">
                        Total Pemotongan
                        {pegawai.isTotalCapped && (
                          <span className="text-red-600 font-bold ml-1">(MAX 100%)</span>
                        )}
                      </div>
                    </div>
                    <div>
                      <div className="text-lg font-bold text-green-600">
                        {formatCurrency((pegawai.totalTukin || pegawai.tunjanganKinerja || 0) - (pegawai.totalPotongan || 0))}
                      </div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">Tunjangan Bersih</div>
                    </div>
                    <div>
                      <div className="text-lg font-bold text-orange-600">
                        {pegawai.historiAbsensi?.filter((h: any) => h.nominalPemotongan > 0).length || 0}
                      </div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">Hari Potong</div>
                    </div>
                  </div>
                </div>
                
                {/* Daily Attendance Details */}
                {pegawai.historiAbsensi && pegawai.historiAbsensi.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-3 text-gray-700 dark:text-gray-300">
                      Rincian Harian dengan Persentase Pemotongan
                      <span className="text-sm text-gray-500 ml-2">
                        ({pegawai.historiAbsensi.filter((h: any) => h.nominalPemotongan > 0).length} dari {pegawai.historiAbsensi.length} hari ada pemotongan)
                      </span>
                    </h4>
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Tanggal</TableHead>
                            <TableHead>Hari</TableHead>
                            <TableHead>Jam Masuk</TableHead>
                            <TableHead>Jam Pulang</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Pemotongan</TableHead>
                            <TableHead>Keterangan</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {pegawai.historiAbsensi.map((absensi: any, index: number) => {
                            const hasDeduction = absensi.nominalPemotongan > 0;
                            return (
                              <TableRow key={index} className={hasDeduction ? 'bg-red-50 dark:bg-red-950 border-l-4 border-l-red-400' : ''}>
                                <TableCell className="font-medium">{safeFormatDate(absensi.tanggal)}</TableCell>
                                <TableCell>{absensi.hari || '-'}</TableCell>
                                <TableCell>{absensi.jamMasuk || '-'}</TableCell>
                                <TableCell>{absensi.jamPulang || '-'}</TableCell>
                                <TableCell>
                                  <Badge 
                                    variant={absensi.statusMasuk === 'HADIR' ? 'default' : 
                                            absensi.statusMasuk === 'TERLAMBAT' ? 'destructive' : 
                                            absensi.statusMasuk === 'TERLAMBAT (DIKOMPENSASI LEMBUR)' ? 'default' :
                                            absensi.statusMasuk === 'LIBUR' ? 'outline' :
                                            absensi.statusMasuk === 'CUTI' ? 'secondary' :
                                            absensi.statusMasuk === 'SAKIT' ? 'secondary' :
                                            'secondary'}
                                    className={absensi.statusMasuk === 'TERLAMBAT (DIKOMPENSASI LEMBUR)' ? 'bg-blue-100 text-blue-800 border-blue-200' : 
                                              absensi.statusMasuk === 'SAKIT' ? 'bg-red-100 text-red-800 border-red-200' : ''}
                                  >
                                    {absensi.status || absensi.statusMasuk || 'HADIR'}
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  {hasDeduction ? (
                                    <div className="text-red-600 text-xs space-y-1">
                                      <div className="font-semibold">
                                        Rp {(absensi.nominalPemotongan || 0).toLocaleString('id-ID')}
                                      </div>
                                      <div className="font-medium">
                                        ({(absensi.persentasePemotongan || 0).toFixed(2)}%)
                                      </div>
                                      {absensi.detailPemotongan && (
                                        <div className="italic text-red-500 text-xs">
                                          {absensi.detailPemotongan}
                                        </div>
                                      )}
                                    </div>
                                  ) : (
                                    <span className="text-green-600 text-xs font-medium">Tidak Ada</span>
                                  )}
                                </TableCell>
                                <TableCell className="text-sm text-gray-600 dark:text-gray-400">
                                  {absensi.keterangan || '-'}
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                )}

              </div>
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </Card>
    );
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-2">
          <Users className="w-5 h-5" />
          <h3 className="text-lg font-semibold">Rincian Detail Per Pegawai</h3>
        </div>
        <div className="text-center py-8">
          <div className="text-lg">Loading data detail...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header dengan Statistics */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Users className="w-5 h-5" />
          <h3 className="text-lg font-semibold">Rincian Detail Per Pegawai</h3>
        </div>
      </div>

      {/* Quick Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{stats.totalEmployees}</div>
              <div className="text-xs text-gray-600 dark:text-gray-400">Total Pegawai</div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{stats.employeesWithoutDeductions}</div>
              <div className="text-xs text-gray-600 dark:text-gray-400">Tanpa Potongan</div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{stats.employeesWithDeductions}</div>
              <div className="text-xs text-gray-600 dark:text-gray-400">Ada Potongan</div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">{stats.totalDeductionDays}</div>
              <div className="text-xs text-gray-600 dark:text-gray-400">Total Hari Potong</div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {formatCurrency(stats.averageDeductionPerEmployee || 0)}
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400">Rata-rata Potong</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filter Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Filter className="w-4 h-4" />
            <span>Filter & Pencarian</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Cari nama, NIP, atau jabatan..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <Select value={filterBy} onValueChange={setFilterBy}>
              <SelectTrigger className="w-full md:w-[200px]">
                <SelectValue placeholder="Filter berdasarkan" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Pegawai</SelectItem>
                <SelectItem value="no-deductions">Tanpa Potongan</SelectItem>
                <SelectItem value="with-deductions">Ada Potongan</SelectItem>
                <SelectItem value="high-deductions">Potongan Tinggi (&gt;30%)</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-full md:w-[200px]">
                <SelectValue placeholder="Urutkan berdasarkan" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="nama">Nama (A-Z)</SelectItem>
                <SelectItem value="jabatan">Jabatan</SelectItem>
                <SelectItem value="potongan-desc">Potongan (Tinggi-Rendah)</SelectItem>
                <SelectItem value="potongan-asc">Potongan (Rendah-Tinggi)</SelectItem>
                <SelectItem value="hari-potong">Hari Potong Terbanyak</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="mt-4 flex flex-col md:flex-row md:justify-between md:items-center gap-4">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Menampilkan {paginatedData.length} dari {filteredAndSortedData.length} pegawai
              {searchTerm && ` untuk pencarian "${searchTerm}"`}
              {filterBy !== 'all' && ` dengan filter ${filterBy.replace('-', ' ')}`}
            </div>
            
            {/* Expand/Collapse All Controls */}
            {paginatedData.length > 0 && (
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const allIds = new Set(paginatedData.map((emp: any) => emp.pegawai?.id || emp.pegawaiId));
                    setExpandedEmployees(allIds);
                  }}
                  disabled={paginatedData.every((emp: any) => expandedEmployees.has(emp.pegawai?.id || emp.pegawaiId))}
                >
                  Buka Semua
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setExpandedEmployees(new Set())}
                  disabled={expandedEmployees.size === 0}
                >
                  Tutup Semua
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Employee Cards */}
      <div className="space-y-4">
        {paginatedData.length > 0 ? (
          paginatedData.map((pegawai: any) => renderEmployeeDetailCard(pegawai))
        ) : (
          <Card>
            <CardContent className="text-center py-8">
              <div className="text-lg text-gray-500 dark:text-gray-400">
                {searchTerm || filterBy !== 'all' 
                  ? 'Tidak ada pegawai yang sesuai dengan kriteria pencarian/filter'
                  : 'Tidak ada data pegawai'
                }
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Halaman {currentPage} dari {totalPages} 
                ({((currentPage - 1) * itemsPerPage) + 1}-{Math.min(currentPage * itemsPerPage, filteredAndSortedData.length)} dari {filteredAndSortedData.length} data)
              </div>
              
              <div className="flex items-center space-x-1">
                {/* First Page */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(1)}
                  disabled={currentPage === 1}
                  className="w-8 h-8"
                >
                  ≪
                </Button>
                
                {/* Previous Page */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="w-8 h-8"
                >
                  ‹
                </Button>
                
                {/* Page Numbers */}
                <div className="flex items-center space-x-1">
                  {(() => {
                    const pages = [];
                    const showEllipsis = totalPages > 7;
                    
                    if (!showEllipsis) {
                      // Show all pages if 7 or fewer
                      for (let i = 1; i <= totalPages; i++) {
                        pages.push(
                          <Button
                            key={i}
                            variant={currentPage === i ? "default" : "outline"}
                            size="sm"
                            onClick={() => setCurrentPage(i)}
                            className="w-8 h-8"
                          >
                            {i}
                          </Button>
                        );
                      }
                    } else {
                      // Always show first page
                      pages.push(
                        <Button
                          key={1}
                          variant={currentPage === 1 ? "default" : "outline"}
                          size="sm"
                          onClick={() => setCurrentPage(1)}
                          className="w-8 h-8"
                        >
                          1
                        </Button>
                      );
                      
                      // Show ellipsis if current page is far from start
                      if (currentPage > 4) {
                        pages.push(
                          <span key="ellipsis1" className="px-2 text-gray-500">...</span>
                        );
                      }
                      
                      // Show pages around current page
                      const start = Math.max(2, currentPage - 1);
                      const end = Math.min(totalPages - 1, currentPage + 1);
                      
                      for (let i = start; i <= end; i++) {
                        if (i !== 1 && i !== totalPages) {
                          pages.push(
                            <Button
                              key={i}
                              variant={currentPage === i ? "default" : "outline"}
                              size="sm"
                              onClick={() => setCurrentPage(i)}
                              className="w-8 h-8"
                            >
                              {i}
                            </Button>
                          );
                        }
                      }
                      
                      // Show ellipsis if current page is far from end
                      if (currentPage < totalPages - 3) {
                        pages.push(
                          <span key="ellipsis2" className="px-2 text-gray-500">...</span>
                        );
                      }
                      
                      // Always show last page
                      if (totalPages > 1) {
                        pages.push(
                          <Button
                            key={totalPages}
                            variant={currentPage === totalPages ? "default" : "outline"}
                            size="sm"
                            onClick={() => setCurrentPage(totalPages)}
                            className="w-8 h-8"
                          >
                            {totalPages}
                          </Button>
                        );
                      }
                    }
                    
                    return pages;
                  })()}
                </div>
                
                {/* Next Page */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="w-8 h-8"
                >
                  ›
                </Button>
                
                {/* Last Page */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(totalPages)}
                  disabled={currentPage === totalPages}
                  className="w-8 h-8"
                >
                  ≫
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}


    </div>
  );
}

// Component tidak diperlukan lagi karena sudah digabung ke RincianDetailPerPegawai

export default function LaporanTukinDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [laporan, setLaporan] = useState<LaporanTukin | null>(null);
  const [detailData, setDetailData] = useState<any[]>([]);

  const months = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];

  useEffect(() => {
    fetchLaporanDetail();
    fetchRincianDetailData();
  }, [params.id]);

  const fetchRincianDetailData = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/admin/master-data/laporan-tukin/${params.id}/rincian`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
          'Content-Type': 'application/json'
        }
      });
      
      const result = await response.json();
      if (result.success) {
        setDetailData(result.data || []);
      }
    } catch (error) {
      console.error('Error fetching rincian detail data:', error);
    }
  };

  const fetchLaporanDetail = async () => {
    setLoading(true);
    try {
      // Use the API client instead of calling Next.js API route
      const result = await laporanTukinAPI.getDetail(Number(params.id));
      
      // Validate that we have the expected data structure
      if (!result || typeof result !== 'object') {
        throw new Error('Data laporan tidak valid atau kosong');
      }
      
      console.log('Laporan detail loaded:', result);
      setLaporan(result);
    } catch (error: any) {
      console.error('Error fetching laporan detail:', error);
      toast({
        title: "Error",
        description: error.message || "Gagal mengambil detail laporan",
        variant: "destructive"
      });
      // Set laporan to null so we show the "not found" message
      setLaporan(null);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return '-';
    
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return dateString; // Return original string if invalid date
      }
      return format(date, 'dd MMMM yyyy', { locale: id });
    } catch (error) {
      console.warn('Invalid date format:', dateString);
      return dateString || '-';
    }
  };

  const safeFormatDate = (dateString: string | null | undefined) => {
    if (!dateString) return '-';
    
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return dateString; // Return original string if invalid date
      }
      return format(date, 'dd/MM/yyyy', { locale: id });
    } catch (error) {
      console.warn('Invalid date format:', dateString);
      return dateString || '-';
    }
  };

  const handlePrint = async () => {
    try {
      // Fetch complete employee detail data first
      await fetchRincianDetailData();
      
      // Create print-friendly popup window
      const printWindow = window.open('', '_blank', 'width=1200,height=800,scrollbars=yes');
      if (!printWindow) {
        toast({
          title: "Error",
          description: "Popup diblokir. Harap izinkan popup untuk print.",
          variant: "destructive"
        });
        return;
      }

      const printContent = generateComprehensivePrintContent();
      
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Laporan Tunjangan Kinerja - ${laporan?.judul}</title>
            <style>
              * { margin: 0; padding: 0; box-sizing: border-box; }
              body { font-family: Arial, sans-serif; font-size: 11px; line-height: 1.3; color: #000; background: #fff; }
              .header { text-align: center; margin-bottom: 20px; border-bottom: 2px solid #000; padding-bottom: 10px; }
              .header h1 { font-size: 18px; font-weight: bold; margin-bottom: 5px; }
              .header p { font-size: 12px; color: #666; }
              .summary { display: flex; justify-content: space-around; margin: 20px 0; border: 1px solid #ccc; background: #f9f9f9; }
              .summary-item { padding: 15px; text-align: center; flex: 1; border-right: 1px solid #ccc; }
              .summary-item:last-child { border-right: none; }
              .summary-item .label { font-size: 10px; color: #666; text-transform: uppercase; }
              .summary-item .value { font-size: 14px; font-weight: bold; margin-top: 5px; color: #333; }
              .section { margin: 25px 0; }
              .section-title { font-size: 14px; font-weight: bold; margin-bottom: 15px; border-bottom: 2px solid #333; padding-bottom: 5px; text-transform: uppercase; }
              table { width: 100%; border-collapse: collapse; margin: 10px 0; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
              th, td { padding: 8px 6px; border: 1px solid #ccc; text-align: left; font-size: 10px; }
              th { background-color: #f5f5f5; font-weight: bold; text-align: center; color: #333; }
              .number { text-align: right; font-family: monospace; }
              .center { text-align: center; }
              .currency { font-family: monospace; color: #2563eb; }
              .employee-section { margin: 30px 0; border: 1px solid #ddd; padding: 15px; background: #fafafa; }
              .employee-header { font-size: 12px; font-weight: bold; margin-bottom: 10px; color: #333; }
              .attendance-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(80px, 1fr)); gap: 2px; margin: 10px 0; }
              .attendance-day { padding: 3px; text-align: center; font-size: 8px; border: 1px solid #ddd; }
              .hadir { background-color: #dcfce7; color: #166534; }
              .alpha { background-color: #fecaca; color: #dc2626; }
              .sakit { background-color: #fef3c7; color: #d97706; }
              .cuti { background-color: #dbeafe; color: #2563eb; }
              .libur { background-color: #f3e8ff; color: #7c3aed; }
              .page-break { page-break-before: always; }
              @media print {
                body { font-size: 10px; }
                .section { margin: 20px 0; }
                table { font-size: 9px; }
                th, td { padding: 4px 3px; }
                .employee-section { margin: 20px 0; padding: 10px; }
                .attendance-grid { grid-template-columns: repeat(10, 1fr); }
                .attendance-day { font-size: 7px; padding: 2px; }
              }
            </style>
          </head>
          <body>
            ${printContent}
          </body>
        </html>
      `);
      
      printWindow.document.close();
      printWindow.focus();
      
      // Auto print after a short delay
      setTimeout(() => {
        printWindow.print();
      }, 1000);
      
      toast({
        title: "Print Preview",
        description: "Jendela print telah dibuka dengan data lengkap Rincian Detail semua Pegawai",
        variant: "default"
      });
    } catch (error: any) {
      console.error('Error printing:', error);
      toast({
        title: "Error",
        description: error.message || "Gagal membuka print preview",
        variant: "destructive"
      });
    }
  };
  const generateComprehensivePrintContent = () => {
    const formatCurrency = (amount: number) => {
      return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0
      }).format(amount);
    };

    return `
      <div class="header">
        <h1>${laporan?.judul || 'Laporan Tunjangan Kinerja'}</h1>
        <p>Periode: ${laporan?.tanggalMulai ? formatDate(laporan.tanggalMulai) : '-'} - ${laporan?.tanggalAkhir ? formatDate(laporan.tanggalAkhir) : '-'}</p>
        <p>Generated: ${laporan?.tanggalGenerate ? formatDate(laporan.tanggalGenerate) : '-'} oleh ${laporan?.generatedBy || '-'}</p>
      </div>

      <div class="summary">
        <div class="summary-item">
          <div class="label">Total Pegawai</div>
          <div class="value">${laporan?.totalPegawai || 0}</div>
        </div>
        <div class="summary-item">
          <div class="label">Total Tunjangan Kinerja</div>
          <div class="value currency">${formatCurrency(laporan?.totalTunjanganKinerja || 0)}</div>
        </div>
        <div class="summary-item">
          <div class="label">Total Potongan</div>
          <div class="value currency">${formatCurrency((laporan?.totalPotonganAbsen || 0) + (laporan?.totalPemotongan || 0))}</div>
        </div>
        <div class="summary-item">
          <div class="label">Total Tunjangan Bersih</div>
          <div class="value currency">${formatCurrency(laporan?.totalTunjanganBersih || 0)}</div>
        </div>
      </div>

      <div class="section">
        <div class="section-title">Ringkasan Tunjangan Kinerja Per Pegawai</div>
        <table>
          <thead>
            <tr>
              <th style="width: 25px;">No</th>
              <th style="width: 90px;">NIP</th>
              <th style="width: 140px;">Nama Pegawai</th>
              <th style="width: 110px;">Jabatan</th>
              <th style="width: 70px;">Lokasi</th>
              <th style="width: 80px;">Tunjangan Kinerja</th>
              <th style="width: 40px;">Masuk</th>
              <th style="width: 70px;">Pot. Absen</th>
              <th style="width: 70px;">Pot. Lain</th>
              <th style="width: 80px;">Tunj. Bersih</th>
            </tr>
          </thead>
          <tbody>
            ${laporan?.detailPegawai?.map((pegawai, index) => {
              const totalMasuk = pegawai.historiAbsensi ? 
                pegawai.historiAbsensi.filter((h: any) => {
                  const status = h.statusMasuk || h.status || 'HADIR';
                  return status !== 'ALPHA' && status !== 'TIDAK_HADIR';
                }).length : 
                (pegawai.statistikAbsen ? (pegawai.statistikAbsen as any).totalHariKerja - (pegawai.statistikAbsen as any).totalAlpha : '-');
              
              return `
                <tr>
                  <td class="center">${index + 1}</td>
                  <td>${pegawai.nip || '-'}</td>
                  <td>${pegawai.namaLengkap}</td>
                  <td>${pegawai.jabatan}</td>
                  <td>${pegawai.lokasi}</td>
                  <td class="number currency">${formatCurrency(pegawai.tunjanganKinerja || 0)}</td>
                  <td class="center">${totalMasuk}</td>
                  <td class="number currency">${formatCurrency(pegawai.potonganAbsen || 0)}</td>
                  <td class="number currency">${formatCurrency(pegawai.pemotonganLain || 0)}</td>
                  <td class="number currency">${formatCurrency(pegawai.tunjanganBersih || 0)}</td>
                </tr>
              `;
            }).join('') || '<tr><td colspan="10" class="center">Tidak ada data pegawai</td></tr>'}
          </tbody>
        </table>
      </div>

      ${detailData && detailData.length > 0 ? `
        <div class="page-break"></div>
        <div class="section">
          <div class="section-title">Rincian Detail Absensi Semua Pegawai</div>
          ${detailData.map((detail, detailIndex) => `
            <div class="employee-section">
              <div class="employee-header">
                ${detailIndex + 1}. ${detail.namaLengkap} (${detail.nip || 'N/A'}) - ${detail.jabatan}
              </div>
              
              <table style="margin-bottom: 15px;">
                <thead>
                  <tr>
                    <th colspan="2" style="background-color: #e3f2fd;">Informasi Pegawai</th>
                    <th colspan="4" style="background-color: #f3e5f5;">Statistik Kehadiran</th>
                    <th colspan="3" style="background-color: #e8f5e8;">Perhitungan Finansial</th>
                  </tr>
                  <tr>
                    <th>Unit Kerja</th>
                    <th>Lokasi</th>
                    <th>Total Hari</th>
                    <th>Hadir</th>
                    <th>Alpha</th>
                    <th>Cuti/Sakit</th>
                    <th>Tunjangan Dasar</th>
                    <th>Potongan</th>
                    <th>Tunjangan Bersih</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>${detail.unitKerja || '-'}</td>
                    <td>${detail.lokasi || '-'}</td>
                    <td class="center">${detail.statistikAbsen?.totalHariKerja || 0}</td>
                    <td class="center">${detail.statistikAbsen?.totalHadir || 0}</td>
                    <td class="center">${detail.statistikAbsen?.totalAlpha || 0}</td>
                    <td class="center">${(detail.statistikAbsen?.totalCuti || 0) + (detail.statistikAbsen?.totalSakit || 0)}</td>
                    <td class="number currency">${formatCurrency(detail.tunjanganKinerja || 0)}</td>
                    <td class="number currency">${formatCurrency((detail.potonganAbsen || 0) + (detail.pemotonganLain || 0))}</td>
                    <td class="number currency">${formatCurrency(detail.tunjanganBersih || 0)}</td>
                  </tr>
                </tbody>
              </table>

              ${detail.historiAbsensi && detail.historiAbsensi.length > 0 ? `
                <div style="margin-top: 15px;">
                  <strong>Rincian Kehadiran Harian:</strong>
                  <div class="attendance-grid">
                    ${detail.historiAbsensi.map((hari: any) => {
                      const status = hari.statusMasuk || hari.status || 'HADIR';
                      const tanggal = new Date(hari.tanggal);
                      const hari_nama = tanggal.getDate();
                      let statusClass = 'hadir';
                      let statusText = 'H';
                      
                      if (status === 'ALPHA' || status === 'TIDAK_HADIR') {
                        statusClass = 'alpha';
                        statusText = 'A';
                      } else if (status === 'SAKIT') {
                        statusClass = 'sakit';
                        statusText = 'S';
                      } else if (status === 'CUTI') {
                        statusClass = 'cuti';
                        statusText = 'C';
                      } else if (status === 'LIBUR') {
                        statusClass = 'libur';
                        statusText = 'L';
                      }
                      
                      return `<div class="attendance-day ${statusClass}" title="${formatDate(hari.tanggal)} - ${status}">${hari_nama}<br/>${statusText}</div>`;
                    }).join('')}
                  </div>
                </div>
              ` : ''}

              ${detail.rincianPemotongan && detail.rincianPemotongan.length > 0 ? `
                <div style="margin-top: 15px;">
                  <strong>Rincian Pemotongan:</strong>
                  <table>
                    <thead>
                      <tr>
                        <th>Jenis Pemotongan</th>
                        <th>Jumlah Hari</th>
                        <th>Tarif per Hari</th>
                        <th>Total Potongan</th>
                        <th>Keterangan</th>
                      </tr>
                    </thead>
                    <tbody>
                      ${detail.rincianPemotongan.map((potongan: any) => `
                        <tr>
                          <td>${potongan.jenisPemotongan || 'Potongan Absen'}</td>
                          <td class="center">${potongan.jumlahHari || 0}</td>
                          <td class="number currency">${formatCurrency(potongan.tarifPerHari || 0)}</td>
                          <td class="number currency">${formatCurrency(potongan.totalPotongan || 0)}</td>
                          <td>${potongan.keterangan || '-'}</td>
                        </tr>
                      `).join('')}
                    </tbody>
                  </table>
                </div>
              ` : ''}

              ${detail.historiAbsensi && detail.historiAbsensi.length > 0 ? `
                <div style="margin-top: 20px;">
                  <strong>Rincian Harian dengan Persentase Pemotongan:</strong>
                  <table style="font-size: 9px;">
                    <thead>
                      <tr style="background-color: #f0f0f0;">
                        <th style="width: 70px;">Tanggal</th>
                        <th style="width: 50px;">Status</th>
                        <th style="width: 55px;">Jam Masuk</th>
                        <th style="width: 55px;">Jam Pulang</th>
                        <th style="width: 60px;">Durasi Kerja</th>
                        <th style="width: 70px;">Potongan (Rp)</th>
                        <th style="width: 50px;">Persentase (%)</th>
                        <th style="width: 80px;">Keterangan</th>
                      </tr>
                    </thead>
                    <tbody>
                      ${detail.historiAbsensi.map((hari: any) => {
                        const tanggal = new Date(hari.tanggal);
                        const tanggalStr = tanggal.toLocaleDateString('id-ID', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric'
                        });
                        
                        const status = hari.statusMasuk || hari.status || 'HADIR';
                        const jamMasuk = hari.jamMasuk || '-';
                        const jamPulang = hari.jamPulang || '-';
                        
                        // Calculate work duration
                        let durasiKerja = '-';
                        if (jamMasuk !== '-' && jamPulang !== '-') {
                          try {
                            const masuk = jamMasuk.includes(':') ? jamMasuk : jamMasuk + ':00';
                            const pulang = jamPulang.includes(':') ? jamPulang : jamPulang + ':00';
                            const masukTime = new Date('2024-01-01T' + masuk);
                            const pulangTime = new Date('2024-01-01T' + pulang);
                            
                            if (pulangTime < masukTime) {
                              pulangTime.setDate(pulangTime.getDate() + 1);
                            }
                            
                            const diffMs = pulangTime.getTime() - masukTime.getTime();
                            const hours = Math.floor(diffMs / (1000 * 60 * 60));
                            const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
                            durasiKerja = hours.toString().padStart(2, '0') + ':' + minutes.toString().padStart(2, '0');
                          } catch (e) {
                            durasiKerja = '-';
                          }
                        }
                        
                        // Calculate daily deduction
                        const totalTunjangan = detail.tunjanganKinerja || 0;
                        const totalHariKerja = detail.historiAbsensi.length;
                        const tunjanganPerHari = totalHariKerja > 0 ? totalTunjangan / totalHariKerja : 0;
                        
                        let potonganHari = 0;
                        let persentasePotongan = 0;
                        let keterangan = '';
                        
                        // Use actual deduction data if available
                        if (hari.nominalPemotongan && hari.nominalPemotongan > 0) {
                          potonganHari = hari.nominalPemotongan;
                          persentasePotongan = hari.persentasePemotongan || 0;
                          keterangan = hari.detailPemotongan || '';
                        } else {
                          // Calculate based on status
                          if (status === 'ALPHA' || status === 'TIDAK_HADIR') {
                            potonganHari = tunjanganPerHari;
                            persentasePotongan = 100;
                            keterangan = 'Tidak hadir';
                          } else if (status === 'SAKIT') {
                            potonganHari = tunjanganPerHari * 0.5;
                            persentasePotongan = 50;
                            keterangan = 'Sakit (50% potongan)';
                          } else if (status === 'CUTI') {
                            potonganHari = 0;
                            persentasePotongan = 0;
                            keterangan = 'Cuti resmi';
                          } else if (status === 'LIBUR') {
                            potonganHari = 0;
                            persentasePotongan = 0;
                            keterangan = 'Hari libur';
                          } else if (hari.menitTerlambat && hari.menitTerlambat > 0) {
                            potonganHari = tunjanganPerHari * 0.1;
                            persentasePotongan = 10;
                            keterangan = 'Terlambat ' + hari.menitTerlambat + ' menit';
                          } else {
                            keterangan = 'Normal';
                          }
                        }
                        
                        return `
                          <tr>
                            <td class="center">${tanggalStr}</td>
                            <td class="center">${status}</td>
                            <td class="center">${jamMasuk}</td>
                            <td class="center">${jamPulang}</td>
                            <td class="center">${durasiKerja}</td>
                            <td class="number currency">${formatCurrency(potonganHari)}</td>
                            <td class="center">${persentasePotongan.toFixed(2)}%</td>
                            <td>${keterangan}</td>
                          </tr>
                        `;
                      }).join('')}
                    </tbody>
                  </table>
                </div>
              ` : ''}
            </div>
          `).join('')}
        </div>
      ` : ''}
    `;
  };

  const generatePrintContent = () => {
    const formatCurrency = (amount: number) => {
      return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0
      }).format(amount);
    };

    return `
      <div class="header">
        <h1>${laporan?.judul || 'Laporan Tunjangan Kinerja'}</h1>
        <p>Periode: ${laporan?.tanggalMulai ? formatDate(laporan.tanggalMulai) : '-'} - ${laporan?.tanggalAkhir ? formatDate(laporan.tanggalAkhir) : '-'}</p>
        <p>Generated: ${laporan?.tanggalGenerate ? formatDate(laporan.tanggalGenerate) : '-'} oleh ${laporan?.generatedBy || '-'}</p>
      </div>

      <div class="summary">
        <div class="summary-item">
          <div class="label">Total Pegawai</div>
          <div class="value">${laporan?.totalPegawai || 0}</div>
        </div>
        <div class="summary-item">
          <div class="label">Total Tunjangan Kinerja</div>
          <div class="value currency">${formatCurrency(laporan?.totalTunjanganKinerja || 0)}</div>
        </div>
        <div class="summary-item">
          <div class="label">Total Potongan</div>
          <div class="value currency">${formatCurrency((laporan?.totalPotonganAbsen || 0) + (laporan?.totalPemotongan || 0))}</div>
        </div>
        <div class="summary-item">
          <div class="label">Total Tunjangan Bersih</div>
          <div class="value currency">${formatCurrency(laporan?.totalTunjanganBersih || 0)}</div>
        </div>
      </div>

      <div class="section">
        <div class="section-title">Detail Tunjangan Kinerja Per Pegawai</div>
        <table>
          <thead>
            <tr>
              <th style="width: 30px;">No</th>
              <th style="width: 100px;">NIP</th>
              <th style="width: 150px;">Nama Pegawai</th>
              <th style="width: 120px;">Jabatan</th>
              <th style="width: 80px;">Lokasi</th>
              <th style="width: 90px;">Tunjangan Kinerja</th>
              <th style="width: 50px;">Masuk</th>
              <th style="width: 80px;">Pot. Absen</th>
              <th style="width: 80px;">Pot. Lain</th>
              <th style="width: 80px;">Total Pot.</th>
              <th style="width: 90px;">Tunj. Bersih</th>
            </tr>
          </thead>
          <tbody>
            ${laporan?.detailPegawai?.map((pegawai, index) => {
              const totalMasuk = pegawai.historiAbsensi ? 
                pegawai.historiAbsensi.filter((h: any) => {
                  const status = h.statusMasuk || h.status || 'HADIR';
                  return status !== 'ALPHA' && status !== 'TIDAK_HADIR';
                }).length : 
                (pegawai.statistikAbsen ? (pegawai.statistikAbsen as any).totalHariKerja - (pegawai.statistikAbsen as any).totalAlpha : '-');
              
              return `
                <tr>
                  <td class="center">${index + 1}</td>
                  <td>${pegawai.nip || '-'}</td>
                  <td>${pegawai.namaLengkap}</td>
                  <td>${pegawai.jabatan}</td>
                  <td>${pegawai.lokasi}</td>
                  <td class="number currency">${formatCurrency(pegawai.tunjanganKinerja || 0)}</td>
                  <td class="center">${totalMasuk}</td>
                  <td class="number currency">${formatCurrency(pegawai.potonganAbsen || 0)}</td>
                  <td class="number currency">${formatCurrency(pegawai.pemotonganLain || 0)}</td>
                  <td class="number currency">${formatCurrency(pegawai.totalPotongan || 0)}</td>
                  <td class="number currency">${formatCurrency(pegawai.tunjanganBersih || 0)}</td>
                </tr>
              `;
            }).join('') || '<tr><td colspan="11" class="center">Tidak ada data pegawai</td></tr>'}
          </tbody>
        </table>
      </div>
    `;
  };

  const handleExportPDF = async () => {
    try {
      const blob = await laporanTukinAPI.downloadPDF(Number(params.id));
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `laporan-tukin-${laporan?.bulan}-${laporan?.tahun}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast({
        title: "PDF Downloaded",
        description: "File PDF laporan berhasil didownload",
        variant: "default"
      });
    } catch (error: any) {
      console.error('Error downloading PDF:', error);
      toast({
        title: "Error",
        description: error.message || "Gagal download PDF",
        variant: "destructive"
      });
    }
  };

  const handleExportExcel = async () => {
    try {
      const blob = await laporanTukinAPI.downloadFile(Number(params.id));
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `laporan-tukin-${laporan?.bulan}-${laporan?.tahun}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error: any) {
      console.error('Error exporting Excel:', error);
      toast({
        title: "Error",
        description: error.message || "Gagal export Excel",
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto py-6">
        <div className="text-center py-8">
          <div className="text-lg">Loading...</div>
        </div>
      </div>
    );
  }

  if (!laporan) {
    return (
      <div className="container mx-auto py-6">
        <div className="text-center py-8">
          <div className="text-lg">Laporan tidak ditemukan</div>
          <Button onClick={() => router.back()} className="mt-4">
            Kembali
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6">
      {/* Header - Responsive Design */}
      <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4 mb-6 print:hidden">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <Button variant="outline" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Kembali
          </Button>
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold">{laporan.judul}</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1 text-sm lg:text-base">
              Periode: {laporan.tanggalMulai ? formatDate(laporan.tanggalMulai) : '-'} - {laporan.tanggalAkhir ? formatDate(laporan.tanggalAkhir) : '-'}
            </p>
          </div>
        </div>
        
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={handlePrint} size="sm">
            <Printer className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Print</span>
          </Button>
          <Button variant="outline" onClick={handleExportPDF} size="sm">
            <Download className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">PDF</span>
          </Button>
          <Button variant="outline" onClick={handleExportExcel} size="sm">
            <FileText className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Excel</span>
          </Button>
        </div>
      </div>

      {/* Summary Cards - Responsive Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400 flex items-center">
              <Users className="w-4 h-4 mr-2" />
              Total Pegawai
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl lg:text-2xl font-bold">{laporan.totalPegawai}</div>
            <p className="text-xs text-gray-500 dark:text-gray-400">Pegawai aktif</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400 flex items-center">
              <Calculator className="w-4 h-4 mr-2" />
              <span className="hidden lg:inline">Total Tunjangan Kinerja</span>
              <span className="lg:hidden">Tunjangan</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg lg:text-2xl font-bold text-green-600">
              <span className="lg:hidden">{formatCurrency(laporan.totalTunjanganKinerja || 0).slice(0, -3)}K</span>
              <span className="hidden lg:inline">{formatCurrency(laporan.totalTunjanganKinerja || 0)}</span>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400">Sebelum potongan</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400 flex items-center">
              <TrendingDown className="w-4 h-4 mr-2" />
              <span className="hidden lg:inline">Total Potongan</span>
              <span className="lg:hidden">Potongan</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg lg:text-2xl font-bold text-red-600">
              <span className="lg:hidden">{formatCurrency((laporan.totalPotonganAbsen || 0) + (laporan.totalPemotongan || 0)).slice(0, -3)}K</span>
              <span className="hidden lg:inline">{formatCurrency((laporan.totalPotonganAbsen || 0) + (laporan.totalPemotongan || 0))}</span>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400">Absen + Lainnya</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400 flex items-center">
              <TrendingUp className="w-4 h-4 mr-2" />
              <span className="hidden lg:inline">Total Tunjangan Bersih</span>
              <span className="lg:hidden">Bersih</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg lg:text-2xl font-bold text-blue-600">
              <span className="lg:hidden">{formatCurrency(laporan.totalTunjanganBersih || 0).slice(0, -3)}K</span>
              <span className="hidden lg:inline">{formatCurrency(laporan.totalTunjanganBersih || 0)}</span>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400">Setelah potongan</p>
          </CardContent>
        </Card>
      </div>

      {/* Detail Pegawai - Desktop dan Mobile Responsive */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Users className="w-5 h-5" />
            <span>Detail Tunjangan Kinerja Per Pegawai</span>
          </CardTitle>
          <CardDescription>
            Rincian perhitungan tunjangan kinerja untuk periode {months[laporan.bulan - 1]} {laporan.tahun}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Mobile Card View */}
          <div className="lg:hidden space-y-4">
            {laporan.detailPegawai && laporan.detailPegawai.length > 0 ? (
              laporan.detailPegawai.map((pegawai, index) => (
                <Card key={pegawai.pegawaiId} className="border-l-4 border-l-blue-500">
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg">{pegawai.namaLengkap}</CardTitle>
                        <CardDescription className="mt-1 space-y-1">
                          <Badge variant="outline" className="text-xs">{pegawai.nip || '-'}</Badge>
                          <Badge variant="secondary" className="text-xs ml-2">{pegawai.jabatan}</Badge>
                          <div className="text-xs text-gray-500 mt-1">{pegawai.lokasi}</div>
                        </CardDescription>
                      </div>
                      <div className="text-right text-xs text-gray-500">#{index + 1}</div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <div className="text-gray-600 dark:text-gray-400">Tunjangan</div>
                        <div className="font-semibold text-green-600">
                          {formatCurrency(pegawai.tunjanganKinerja || 0)}
                        </div>
                      </div>
                      <div>
                        <div className="text-gray-600 dark:text-gray-400">Masuk</div>
                        <div className="font-semibold">
                          {(() => {
                            if (pegawai.historiAbsensi && pegawai.historiAbsensi.length > 0) {
                              const hariMasuk = pegawai.historiAbsensi.filter((h: any) => {
                                const status = h.statusMasuk || h.status || 'HADIR';
                                return status !== 'ALPHA' && status !== 'TIDAK_HADIR';
                              }).length;
                              return hariMasuk;
                            }
                            const statistik = pegawai.statistikAbsen as any;
                            if (statistik) {
                              const totalHariKerja = statistik.totalHariKerja || 0;
                              const totalAlpha = statistik.totalAlpha || 0;
                              return totalHariKerja - totalAlpha;
                            }
                            return '-';
                          })()}
                        </div>
                      </div>
                      <div>
                        <div className="text-gray-600 dark:text-gray-400">Pot. Absen</div>
                        <div className={`font-semibold text-red-600 ${pegawai.isAttendanceCapped ? 'bg-red-100 px-1 rounded' : ''}`}>
                          {formatCurrency(pegawai.potonganAbsen || 0)}
                          {pegawai.isAttendanceCapped && <div className="text-xs">MAX 60%</div>}
                        </div>
                      </div>
                      <div>
                        <div className="text-gray-600 dark:text-gray-400">Pot. Lain</div>
                        <div className={`font-semibold text-red-600 ${pegawai.isOtherDeductionsCapped ? 'bg-red-100 px-1 rounded' : ''}`}>
                          {formatCurrency(pegawai.pemotonganLain || 0)}
                          {pegawai.isOtherDeductionsCapped && <div className="text-xs">MAX 60%</div>}
                        </div>
                      </div>
                      <div>
                        <div className="text-gray-600 dark:text-gray-400">Total Pot.</div>
                        <div className={`font-semibold text-red-600 ${pegawai.isTotalCapped ? 'bg-red-100 px-1 rounded' : ''}`}>
                          {formatCurrency(pegawai.totalPotongan || 0)}
                          {pegawai.isTotalCapped && <div className="text-xs">MAX 60%</div>}
                        </div>
                      </div>
                      <div>
                        <div className="text-gray-600 dark:text-gray-400">Tunj. Bersih</div>
                        <div className="font-bold text-blue-600">
                          {formatCurrency(pegawai.tunjanganBersih || 0)}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                Tidak ada data pegawai
              </div>
            )}
          </div>

          {/* Desktop Table View */}
          <div className="hidden lg:block overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[60px]">No</TableHead>
                  <TableHead>NIP</TableHead>
                  <TableHead>Nama Pegawai</TableHead>
                  <TableHead>Jabatan</TableHead>
                  <TableHead>Lokasi</TableHead>
                  <TableHead className="text-right">Tunjangan Kinerja</TableHead>
                  <TableHead className="text-center">Total Masuk</TableHead>
                  <TableHead className="text-right">Potongan Absen</TableHead>
                  <TableHead className="text-right">Potongan Lain</TableHead>
                  <TableHead className="text-right">Total Potongan</TableHead>
                  <TableHead className="text-right">Tunjangan Bersih</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {laporan.detailPegawai && laporan.detailPegawai.length > 0 ? (
                  laporan.detailPegawai.map((pegawai, index) => (
                    <TableRow key={pegawai.pegawaiId}>
                      <TableCell className="text-center">{index + 1}</TableCell>
                      <TableCell className="font-mono text-sm">{pegawai.nip || '-'}</TableCell>
                      <TableCell className="font-medium">{pegawai.namaLengkap}</TableCell>
                      <TableCell>{pegawai.jabatan}</TableCell>
                      <TableCell>{pegawai.lokasi}</TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(pegawai.tunjanganKinerja || 0)}
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="text-lg font-semibold">
                          {(() => {
                            if (pegawai.historiAbsensi && pegawai.historiAbsensi.length > 0) {
                              const hariMasuk = pegawai.historiAbsensi.filter((h: any) => {
                                const status = h.statusMasuk || h.status || 'HADIR';
                                return status !== 'ALPHA' && status !== 'TIDAK_HADIR';
                              }).length;
                              return hariMasuk;
                            }
                            
                            const statistik = pegawai.statistikAbsen as any;
                            if (statistik) {
                              const totalHariKerja = statistik.totalHariKerja || 0;
                              const totalAlpha = statistik.totalAlpha || 0;
                              return totalHariKerja - totalAlpha;
                            }
                            
                            return '-';
                          })()}
                        </div>
                      </TableCell>
                      <TableCell className={`text-right text-red-600 ${pegawai.isAttendanceCapped ? 'font-black bg-red-100 border-2 border-red-600' : ''}`}>
                        {formatCurrency(pegawai.potonganAbsen || 0)}
                        {pegawai.isAttendanceCapped && (
                          <div className="text-xs font-bold text-red-700">MAX 60%</div>
                        )}
                      </TableCell>
                      <TableCell className={`text-right text-red-600 ${pegawai.isOtherDeductionsCapped ? 'font-black bg-red-100 border-2 border-red-600' : ''}`}>
                        {formatCurrency(pegawai.pemotonganLain || 0)}
                        {pegawai.isOtherDeductionsCapped && (
                          <div className="text-xs font-bold text-red-700">MAX 60%</div>
                        )}
                      </TableCell>
                      <TableCell className={`text-right text-red-600 font-medium ${pegawai.isTotalCapped ? 'font-black bg-red-100 border-2 border-red-600' : ''}`}>
                        {formatCurrency(pegawai.totalPotongan || 0)}
                        {pegawai.isTotalCapped && (
                          <div className="text-xs font-bold text-red-700">MAX 60%</div>
                        )}
                      </TableCell>
                      <TableCell className="text-right font-bold text-blue-600">
                        {formatCurrency(pegawai.tunjanganBersih || 0)}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={11} className="text-center py-8">
                      Tidak ada data pegawai
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Enhanced Detail for Each Employee - Versi Scalable */}
      {laporan?.detailPegawai && laporan.detailPegawai.length > 0 && (
        <RincianDetailPerPegawai 
          laporanId={Number(params.id)}
          formatCurrency={formatCurrency} 
          safeFormatDate={safeFormatDate} 
        />
      )}

      {/* Footer Info - Mobile Responsive */}
      <div className="mt-6 text-sm text-gray-600 dark:text-gray-400 print:block">
        <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4">
          <div>
            <p>Generated pada: {laporan.tanggalGenerate ? formatDate(laporan.tanggalGenerate) : '-'}</p>
            <p>Generated oleh: {laporan.generatedBy}</p>
          </div>
          <div className="lg:text-right">
            <p className="font-medium">Status: <Badge variant="default">{laporan.status}</Badge></p>
            <p className="mt-1">Format: <Badge variant="outline">{laporan.formatLaporan}</Badge></p>
          </div>
        </div>
      </div>

      {/* Responsive Print Styles */}
      <style jsx>{`
        @media print {
          .print\\:hidden {
            display: none !important;
          }
          .print\\:block {
            display: block !important;
          }
          .container {
            max-width: none !important;
            margin: 0 !important;
            padding: 1rem !important;
          }
          table {
            font-size: 10px !important;
          }
          .text-2xl {
            font-size: 1.25rem !important;
          }
          .text-3xl {
            font-size: 1.5rem !important;
          }
          .lg\\:hidden {
            display: none !important;
          }
          .hidden.lg\\:block {
            display: block !important;
          }
        }
        
        @media (max-width: 768px) {
          .container {
            padding-left: 1rem !important;
            padding-right: 1rem !important;
          }
        }
        
        /* Dark mode support */
        @media (prefers-color-scheme: dark) {
          .bg-gray-50 {
            background-color: rgb(17 24 39) !important;
          }
          .text-gray-600 {
            color: rgb(156 163 175) !important;
          }
          .border-gray-200 {
            border-color: rgb(55 65 81) !important;
          }
        }
      `}</style>
    </div>
  );
}
