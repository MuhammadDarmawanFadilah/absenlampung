"use client";

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { toast } from '@/hooks/use-toast';
import { 
  ArrowLeft,
  ArrowRight,
  Check,
  FileText,
  Search,
  Filter,
  Monitor,
  Tablet,
  Smartphone,
  LayoutGrid,
  Grid3X3,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  X,
  Save,
  Eye,
  Calendar,
  User,
  Building,
  CheckCircle,
  AlertCircle,
  Edit
} from 'lucide-react';
import { laporanAPI, LaporanRequest, Laporan } from '@/lib/laporan-api';
import { jenisLaporanAPI, JenisLaporan, TahapanLaporan, PagedResponse } from '@/lib/api';

// Layout options untuk tampilan jenis laporan
const LAYOUT_OPTIONS = [
  { value: 1, label: '1 per baris', icon: Monitor },
  { value: 2, label: '2 per baris', icon: Tablet },
  { value: 3, label: '3 per baris', icon: LayoutGrid },
  { value: 4, label: '4 per baris', icon: Grid3X3 },
  { value: 5, label: '5 per baris', icon: Smartphone },
];

// Extended JenisLaporan type same as the original
type JenisLaporanWithTahapan = JenisLaporan;

// Form data interface
interface LaporanFormData {
  nama: string;
  deskripsi: string;
  status: 'AKTIF' | 'TIDAK_AKTIF' | 'DRAFT';
  selectedJenisLaporanId?: number;
}

// Stepper Component
function StepperComponent({ currentStep, totalSteps }: { currentStep: number; totalSteps: number }) {
  const steps = [
    { title: 'Informasi Dasar', description: 'Nama, deskripsi, dan status laporan' },
    { title: 'Pilih Jenis Laporan', description: 'Pilih jenis laporan yang sesuai' },
    { title: 'Preview & Konfirmasi', description: 'Tinjau sebelum menyimpan' }
  ];

  return (
    <div className="w-full py-6">
      <div className="flex items-center justify-between">
        {steps.map((step, index) => (
          <div key={index} className="flex items-center">
            <div className="flex flex-col items-center">
              <div className={`
                w-12 h-12 rounded-full flex items-center justify-center text-sm font-medium
                ${index < currentStep 
                  ? 'bg-green-600 text-white' 
                  : index === currentStep 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-200 text-gray-600'
                }
              `}>
                {index < currentStep ? (
                  <Check className="h-5 w-5" />
                ) : (
                  index + 1
                )}
              </div>
              <div className="mt-3 text-center">
                <div className={`text-sm font-medium ${index <= currentStep ? 'text-gray-900' : 'text-gray-500'}`}>
                  {step.title}
                </div>
                <div className={`text-xs ${index <= currentStep ? 'text-gray-600' : 'text-gray-400'}`}>
                  {step.description}
                </div>
              </div>
            </div>
            {index < steps.length - 1 && (
              <div className={`
                flex-1 h-0.5 mx-6 mt-[-15px]
                ${index < currentStep ? 'bg-green-600' : 'bg-gray-200'}
              `} />
            )}
          </div>
        ))}
      </div>
      <div className="mt-6">
        <Progress value={((currentStep) / (totalSteps - 1)) * 100} className="h-3" />
      </div>
    </div>
  );
}

export default function EditLaporanPage() {
  const router = useRouter();
  const params = useParams();
  const laporanId = parseInt(params.id as string);
  
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [originalLaporan, setOriginalLaporan] = useState<Laporan | null>(null);
  
  // Form data
  const [formData, setFormData] = useState<LaporanFormData>({
    nama: '',
    deskripsi: '',
    status: 'AKTIF'
  });
  
  // Jenis laporan state
  const [jenisLaporanList, setJenisLaporanList] = useState<JenisLaporanWithTahapan[]>([]);
  const [selectedJenisLaporan, setSelectedJenisLaporan] = useState<JenisLaporanWithTahapan | null>(null);
  const [loading, setLoading] = useState(false);
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  
  // Filter state untuk jenis laporan
  const [filters, setFilters] = useState({
    page: 0,
    size: 10,
    sortBy: 'updatedAt',
    sortDirection: 'desc' as 'asc' | 'desc',
    nama: '',
    tahapanNama: ''
  });
  
  // Layout state
  const [layout, setLayout] = useState<1 | 2 | 3 | 4 | 5>(3);
  
  // Load initial data
  useEffect(() => {
    loadLaporanData();
  }, [laporanId]);
  
  const loadLaporanData = async () => {
    try {
      setIsLoading(true);
      const laporan = await laporanAPI.getById(laporanId);
      setOriginalLaporan(laporan);
      
      // Set form data
      setFormData({
        nama: laporan.namaLaporan,
        deskripsi: laporan.deskripsi,
        status: laporan.status,
        selectedJenisLaporanId: laporan.jenisLaporanId
      });
      
      // Get jenis laporan with tahapan
      try {
        const jenisLaporanWithTahapan = await jenisLaporanAPI.getWithTahapan(laporan.jenisLaporanId);
        setSelectedJenisLaporan(jenisLaporanWithTahapan);
      } catch (error) {
        console.error('Error loading jenis laporan tahapan:', error);
        // Create basic jenis laporan object from laporan data
        setSelectedJenisLaporan({
          jenisLaporanId: laporan.jenisLaporanId,
          nama: laporan.jenisLaporanNama,
          deskripsi: '',
          status: 'AKTIF',
          createdAt: laporan.createdAt,
          updatedAt: laporan.updatedAt,
          tahapanList: [],
          jumlahTahapan: 0,
          jumlahLaporan: 0
        });
      }
      
    } catch (error: any) {
      console.error('Error loading laporan:', error);
      toast({
        title: "Error",
        description: error.message || "Gagal memuat data laporan",
        variant: "destructive",
      });
      router.push('/admin/laporan');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Load jenis laporan data
  useEffect(() => {
    if (currentStep === 1) {
      loadJenisLaporan();
    }
  }, [currentStep, filters]);
  
  const loadJenisLaporan = async () => {
    try {
      setLoading(true);
      // Use search API for jenis laporan with pagination and filters
      const response = await jenisLaporanAPI.search({
        page: filters.page,
        size: filters.size,
        sortBy: filters.sortBy,
        sortDirection: filters.sortDirection,
        nama: filters.nama,
        status: 'AKTIF' // Only load active jenis laporan
      });
      
      // Load tahapan details for each jenis laporan
      const jenisLaporanWithTahapan = await Promise.all(
        response.content.map(async (jl: JenisLaporan) => {
          try {
            const withTahapan = await jenisLaporanAPI.getWithTahapan(jl.jenisLaporanId);
            return withTahapan;
          } catch (error) {
            console.error(`Error loading tahapan for jenis laporan ${jl.jenisLaporanId}:`, error);
            return jl;
          }
        })
      );
      
      setJenisLaporanList(jenisLaporanWithTahapan);
      setTotalElements(response.totalElements);
      setTotalPages(response.totalPages);
    } catch (error: any) {
      console.error('Error loading jenis laporan:', error);
      toast({
        title: "Error",
        description: error.message || "Gagal memuat data jenis laporan",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };
  
  // Filter functions
  const handleFilterChange = (field: string, value: string | number) => {
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
      sortDirection: 'desc' as 'asc' | 'desc',
      nama: '',
      tahapanNama: ''
    });
  };
  
  // Pagination
  const handlePageChange = (newPage: number) => {
    if (newPage >= 0 && newPage < totalPages) {
      setFilters({ ...filters, page: newPage });
    }
  };
  
  // Navigation functions
  const nextStep = () => {
    if (currentStep < 2) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleCancel = () => {
    router.push('/admin/laporan');
  };
  
  // Jenis laporan selection
  const handleSelectJenisLaporan = (jenisLaporan: JenisLaporanWithTahapan) => {
    setSelectedJenisLaporan(jenisLaporan);
    setFormData({
      ...formData,
      selectedJenisLaporanId: jenisLaporan.jenisLaporanId
    });
  };
  
  const handleUnselectJenisLaporan = () => {
    setSelectedJenisLaporan(null);
    setFormData({
      ...formData,
      selectedJenisLaporanId: undefined
    });
  };
  
  // Validation functions
  const validateStep1 = () => {
    return formData.nama.trim() !== '' && formData.deskripsi.trim() !== '';
  };

  const validateStep2 = () => {
    return selectedJenisLaporan !== null;
  };
  
  // Submit function
  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);
      
      const requestData: LaporanRequest = {
        nama: formData.nama,
        deskripsi: formData.deskripsi,
        status: formData.status,
        jenisLaporanId: formData.selectedJenisLaporanId!
      };

      await laporanAPI.update(laporanId, requestData);
      
      toast({
        title: "Sukses",
        description: "Laporan berhasil diperbarui",
      });
      
      router.push('/admin/laporan');
    } catch (error: any) {
      console.error('Error updating laporan:', error);
      toast({
        title: "Error",
        description: error.message || "Gagal memperbarui laporan",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
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

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="h-12 w-12 animate-spin mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Memuat Data Laporan</h2>
          <p className="text-gray-600">Mohon tunggu sebentar...</p>
        </div>
      </div>
    );
  }

  // Render step content
  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Edit className="h-5 w-5" />
                Edit Informasi Dasar Laporan
              </CardTitle>
              {originalLaporan && (
                <p className="text-sm text-gray-600">
                  Mengedit laporan ID: {originalLaporan.laporanId}
                </p>
              )}
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="nama">Nama Laporan *</Label>
                <Input
                  id="nama"
                  value={formData.nama}
                  onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                  placeholder="Masukkan nama laporan"
                  className="h-12"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="deskripsi">Deskripsi Laporan *</Label>
                <Textarea
                  id="deskripsi"
                  value={formData.deskripsi}
                  onChange={(e) => setFormData({ ...formData, deskripsi: e.target.value })}
                  placeholder="Masukkan deskripsi laporan"
                  rows={5}
                  className="resize-none"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="status">Status *</Label>
                <Select 
                  value={formData.status} 
                  onValueChange={(value: 'AKTIF' | 'TIDAK_AKTIF' | 'DRAFT') => 
                    setFormData({ ...formData, status: value })
                  }
                >
                  <SelectTrigger className="h-12">
                    <SelectValue placeholder="Pilih status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="AKTIF">Aktif</SelectItem>
                    <SelectItem value="DRAFT">Draft</SelectItem>
                    <SelectItem value="TIDAK_AKTIF">Tidak Aktif</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Show original data for comparison */}
              {originalLaporan && (
                <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-3">Data Asli untuk Perbandingan:</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Nama:</span>
                      <p className="font-medium">{originalLaporan.namaLaporan}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Status:</span>
                      <p className="font-medium">{getStatusDisplay(originalLaporan.status)}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Jenis Laporan:</span>
                      <p className="font-medium">{originalLaporan.jenisLaporanNama}</p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        );

      case 1:
        return (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Search className="h-5 w-5" />
                  Ubah Jenis Laporan
                </CardTitle>
                <p className="text-sm text-gray-600">
                  Jenis laporan saat ini: <strong>{originalLaporan?.jenisLaporanNama}</strong>
                </p>
              </CardHeader>
              <CardContent>
                {/* Filter and Layout Controls */}
                <div className="space-y-4 mb-6">
                  {/* Layout Selection */}
                  <div className="space-y-2">
                    <Label className="text-base font-medium">Layout Tampilan</Label>
                    <p className="text-sm text-gray-600 mb-3">Pilih berapa jenis laporan yang ditampilkan per baris</p>
                    <div className="grid grid-cols-5 gap-3">
                      {LAYOUT_OPTIONS.map((option) => {
                        const IconComponent = option.icon;
                        return (
                          <button
                            key={option.value}
                            onClick={() => setLayout(option.value as any)}
                            className={`
                              p-3 rounded-lg border-2 text-center transition-all
                              ${layout === option.value 
                                ? 'border-blue-500 bg-blue-50' 
                                : 'border-gray-200 hover:border-gray-300'
                              }
                            `}
                          >
                            <IconComponent className={`h-6 w-6 mx-auto mb-2 ${
                              layout === option.value ? 'text-blue-600' : 'text-gray-400'
                            }`} />
                            <div className={`text-xs font-medium ${
                              layout === option.value ? 'text-blue-600' : 'text-gray-600'
                            }`}>
                              {option.label}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  
                  {/* Filters */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <Input
                        placeholder="Cari nama jenis laporan..."
                        value={filters.nama}
                        onChange={(e) => handleFilterChange('nama', e.target.value)}
                        className="h-10"
                      />
                    </div>
                    
                    <div>
                      <Input
                        placeholder="Cari nama tahapan..."
                        value={filters.tahapanNama}
                        onChange={(e) => handleFilterChange('tahapanNama', e.target.value)}
                        className="h-10"
                      />
                    </div>
                    
                    <div>
                      <Select value={filters.size.toString()} onValueChange={(value) => handleFilterChange('size', parseInt(value))}>
                        <SelectTrigger className="h-10">
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
                    
                    <div className="flex gap-2">
                      <Button onClick={handleSearch} className="flex items-center gap-2 h-10">
                        <Search className="h-4 w-4" />
                        Cari
                      </Button>
                      <Button variant="outline" onClick={clearFilters} className="h-10">
                        Reset
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Jenis Laporan Grid */}
                {loading ? (
                  <div className="flex justify-center items-center py-12">
                    <RefreshCw className="h-8 w-8 animate-spin" />
                    <span className="ml-2">Memuat data...</span>
                  </div>
                ) : jenisLaporanList.length === 0 ? (
                  <div className="text-center py-12">
                    <FileText className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                    <p className="text-gray-500 text-lg">Tidak ada jenis laporan aktif</p>
                    <p className="text-gray-400 text-sm">Silakan ubah filter atau hubungi administrator</p>
                  </div>
                ) : (
                  <>
                    <div className={`grid gap-4 ${
                      layout === 1 ? 'grid-cols-1' :
                      layout === 2 ? 'grid-cols-2' :
                      layout === 3 ? 'grid-cols-3' :
                      layout === 4 ? 'grid-cols-4' :
                      'grid-cols-5'
                    }`}>
                      {jenisLaporanList.map((jenisLaporan) => (
                        <Card 
                          key={jenisLaporan.jenisLaporanId} 
                          className={`cursor-pointer transition-all hover:shadow-md ${
                            selectedJenisLaporan?.jenisLaporanId === jenisLaporan.jenisLaporanId 
                              ? 'border-blue-500 bg-blue-50' 
                              : jenisLaporan.jenisLaporanId === originalLaporan?.jenisLaporanId
                                ? 'border-green-500 bg-green-50'
                                : 'border-gray-200'
                          }`}
                          onClick={() => handleSelectJenisLaporan(jenisLaporan)}
                        >
                          <CardContent className="p-4">
                            <div className="space-y-3">
                              <div className="flex items-start justify-between">
                                <h3 className="font-semibold text-sm">{jenisLaporan.nama}</h3>
                                <div className="flex items-center gap-1">
                                  {jenisLaporan.jenisLaporanId === originalLaporan?.jenisLaporanId && (
                                    <Badge variant="outline" className="text-xs">
                                      Current
                                    </Badge>
                                  )}
                                  {selectedJenisLaporan?.jenisLaporanId === jenisLaporan.jenisLaporanId && (
                                    <Check className="h-5 w-5 text-blue-600" />
                                  )}
                                </div>
                              </div>
                              
                              <p className="text-xs text-gray-600 line-clamp-2">{jenisLaporan.deskripsi}</p>
                              
                              <div className="flex items-center justify-between">
                                <Badge className={getStatusColor(jenisLaporan.status)} variant="secondary">
                                  {getStatusDisplay(jenisLaporan.status)}
                                </Badge>
                                <span className="text-xs text-gray-500">
                                  {jenisLaporan.tahapanList?.length || 0} tahapan
                                </span>
                              </div>
                              
                              {jenisLaporan.tahapanList && jenisLaporan.tahapanList.length > 0 && (
                                <div className="space-y-1">
                                  <p className="text-xs font-medium text-gray-700">Tahapan:</p>
                                  <div className="space-y-1">
                                    {jenisLaporan.tahapanList.slice(0, 3).map((tahapan) => (
                                      <div key={tahapan.tahapanLaporanId} className="text-xs text-gray-600">
                                        {tahapan.urutanTahapan}. {tahapan.nama}
                                      </div>
                                    ))}
                                    {jenisLaporan.tahapanList.length > 3 && (
                                      <div className="text-xs text-gray-500">
                                        +{jenisLaporan.tahapanList.length - 3} tahapan lainnya
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>

                    {/* Pagination */}
                    <div className="flex items-center justify-between mt-6">
                      <div className="text-sm text-gray-500">
                        Menampilkan {filters.page * filters.size + 1}-{Math.min((filters.page + 1) * filters.size, totalElements)} dari {totalElements} jenis laporan
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

            {/* Selected Jenis Laporan */}
            {selectedJenisLaporan && (
              <Card className="border-green-500 bg-green-50">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <Check className="h-5 w-5 text-green-600" />
                      Jenis Laporan Terpilih
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleUnselectJenisLaporan}
                      className="text-red-600 hover:text-red-700"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-semibold text-lg">{selectedJenisLaporan.nama}</h3>
                      <p className="text-gray-600 mt-1">{selectedJenisLaporan.deskripsi}</p>
                    </div>
                    
                    <div className="flex items-center gap-4">
                      <Badge className={getStatusColor(selectedJenisLaporan.status)}>
                        {getStatusDisplay(selectedJenisLaporan.status)}
                      </Badge>
                      <span className="text-sm text-gray-600">
                        {selectedJenisLaporan.tahapanList?.length || 0} tahapan
                      </span>
                      {selectedJenisLaporan.jenisLaporanId === originalLaporan?.jenisLaporanId && (
                        <Badge variant="outline" className="text-xs">
                          Sama dengan sebelumnya
                        </Badge>
                      )}
                    </div>
                    
                    {selectedJenisLaporan.tahapanList && selectedJenisLaporan.tahapanList.length > 0 && (
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">Tahapan yang akan dilalui:</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          {selectedJenisLaporan.tahapanList.map((tahapan) => (
                            <div key={tahapan.tahapanLaporanId} className="flex items-center gap-2 p-2 bg-white rounded border">
                              <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs">
                                {tahapan.urutanTahapan}
                              </span>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900 truncate">{tahapan.nama}</p>
                                <p className="text-xs text-gray-500 truncate">{tahapan.deskripsi}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="h-5 w-5" />
                  Preview & Konfirmasi Perubahan
                </CardTitle>
                <p className="text-gray-600 text-sm mt-2">
                  Tinjau perubahan sebelum menyimpan
                </p>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card className="border-l-4 border-l-blue-500">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-600">Nama Laporan</p>
                          <p className="font-semibold text-gray-900">{formData.nama}</p>
                          {originalLaporan && formData.nama !== originalLaporan.namaLaporan && (
                            <p className="text-xs text-gray-500">Sebelumnya: {originalLaporan.namaLaporan}</p>
                          )}
                        </div>
                        <Badge className={getStatusColor(formData.status)}>
                          {getStatusDisplay(formData.status)}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card className="border-l-4 border-l-green-500">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-600">Jenis Laporan</p>
                          <p className="font-semibold text-gray-900">{selectedJenisLaporan?.nama}</p>
                          {originalLaporan && selectedJenisLaporan?.jenisLaporanId !== originalLaporan.jenisLaporanId && (
                            <p className="text-xs text-gray-500">Sebelumnya: {originalLaporan.jenisLaporanNama}</p>
                          )}
                        </div>
                        <FileText className="h-8 w-8 text-green-500" />
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card className="border-l-4 border-l-purple-500">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-600">Total Tahapan</p>
                          <p className="font-semibold text-gray-900">{selectedJenisLaporan?.tahapanList?.length || 0}</p>
                        </div>
                        <Calendar className="h-8 w-8 text-purple-500" />
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Changes Summary */}
                {originalLaporan && (
                  <Card className="border-orange-200 bg-orange-50">
                    <CardHeader>
                      <CardTitle className="text-lg text-orange-800">Ringkasan Perubahan</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {formData.nama !== originalLaporan.namaLaporan && (
                          <div className="flex justify-between">
                            <span className="font-medium">Nama:</span>
                            <span>{originalLaporan.namaLaporan} → {formData.nama}</span>
                          </div>
                        )}
                        {formData.status !== originalLaporan.status && (
                          <div className="flex justify-between">
                            <span className="font-medium">Status:</span>
                            <span>{getStatusDisplay(originalLaporan.status)} → {getStatusDisplay(formData.status)}</span>
                          </div>
                        )}
                        {selectedJenisLaporan?.jenisLaporanId !== originalLaporan.jenisLaporanId && (
                          <div className="flex justify-between">
                            <span className="font-medium">Jenis Laporan:</span>
                            <span>{originalLaporan.jenisLaporanNama} → {selectedJenisLaporan?.nama}</span>
                          </div>
                        )}
                        {formData.deskripsi !== originalLaporan.deskripsi && (
                          <div>
                            <span className="font-medium">Deskripsi diubah</span>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Description */}
                <Card>
                  <CardContent className="p-4">
                    <p className="text-sm text-gray-600 mb-2">Deskripsi Laporan</p>
                    <p className="text-gray-900">{formData.deskripsi}</p>
                  </CardContent>
                </Card>

                {/* Jenis Laporan Details */}
                {selectedJenisLaporan && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Detail Jenis Laporan</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div>
                          <h4 className="font-semibold text-gray-900 mb-1">{selectedJenisLaporan.nama}</h4>
                          <p className="text-gray-600 text-sm">{selectedJenisLaporan.deskripsi}</p>
                        </div>
                        
                        {selectedJenisLaporan.tahapanList && selectedJenisLaporan.tahapanList.length > 0 && (
                          <div>
                            <h4 className="font-semibold text-gray-900 mb-3">Tahapan yang Akan Dilalui</h4>
                            <div className="space-y-3">
                              {selectedJenisLaporan.tahapanList.map((tahapan) => (
                                <Card key={tahapan.tahapanLaporanId} className="border border-gray-200">
                                  <CardContent className="p-4">
                                    <div className="flex items-start gap-4">
                                      <div className="flex-shrink-0">
                                        <div className="w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-sm">
                                          {tahapan.urutanTahapan}
                                        </div>
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <div className="flex items-start justify-between">
                                          <div className="flex-1">
                                            <h4 className="font-semibold text-gray-900 mb-1">{tahapan.nama}</h4>
                                            <p className="text-sm text-gray-600 mb-3">{tahapan.deskripsi}</p>
                                            
                                            <div className="flex items-center gap-4 text-sm text-gray-500">
                                              {tahapan.templateTahapan && (
                                                <div className="flex items-center gap-1">
                                                  <FileText className="h-4 w-4" />
                                                  <span>Template tersedia</span>
                                                </div>
                                              )}
                                              {tahapan.jenisFileIzin && tahapan.jenisFileIzin.length > 0 && (
                                                <div className="flex items-center gap-1">
                                                  <span>{tahapan.jenisFileIzin.length} tipe file diizinkan</span>
                                                </div>
                                              )}
                                            </div>
                                          </div>
                                          
                                          {tahapan.jenisFileIzin && tahapan.jenisFileIzin.length > 0 && (
                                            <div className="flex flex-wrap gap-1 ml-4">
                                              {tahapan.jenisFileIzin.slice(0, 4).map(type => (
                                                <Badge key={type} variant="outline" className="text-xs">
                                                  {type.toUpperCase()}
                                                </Badge>
                                              ))}
                                              {tahapan.jenisFileIzin.length > 4 && (
                                                <Badge variant="outline" className="text-xs">
                                                  +{tahapan.jenisFileIzin.length - 4}
                                                </Badge>
                                              )}
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  </CardContent>
                                </Card>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </CardContent>
            </Card>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="w-full py-8 px-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Button 
              variant="ghost" 
              onClick={handleCancel}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Kembali
            </Button>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Edit Laporan</h1>
              <p className="text-muted-foreground">
                Edit laporan dengan mengikuti tahapan yang telah ditentukan
              </p>
              {originalLaporan && (
                <p className="text-sm text-gray-600 mt-1">
                  ID: {originalLaporan.laporanId} • Dibuat: {new Date(originalLaporan.createdAt).toLocaleDateString('id-ID')}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Stepper */}
        <Card className="mb-8">
          <CardContent className="py-6">
            <StepperComponent currentStep={currentStep} totalSteps={3} />
          </CardContent>
        </Card>

        {/* Step Content */}
        <div className="mb-8">
          {renderStepContent()}
        </div>

        {/* Navigation Footer */}
        <Card className="sticky bottom-0 bg-white border-t shadow-lg">
          <CardContent className="py-4">
            <div className="flex justify-between items-center">
              <Button
                variant="outline"
                onClick={handleCancel}
                className="flex items-center gap-2"
              >
                <X className="h-4 w-4" />
                Batal
              </Button>
              
              <div className="flex gap-3">
                {currentStep > 0 && (
                  <Button
                    variant="outline"
                    onClick={prevStep}
                    className="flex items-center gap-2"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Sebelumnya
                  </Button>
                )}
                
                {currentStep < 2 ? (
                  <Button
                    onClick={nextStep}
                    disabled={
                      (currentStep === 0 && !validateStep1()) ||
                      (currentStep === 1 && !validateStep2())
                    }
                    className="flex items-center gap-2"
                  >
                    Selanjutnya
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                ) : (
                  <Button
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
                  >
                    {isSubmitting ? (
                      <>
                        <RefreshCw className="h-4 w-4 animate-spin" />
                        Menyimpan Perubahan...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4" />
                        Simpan Perubahan
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
