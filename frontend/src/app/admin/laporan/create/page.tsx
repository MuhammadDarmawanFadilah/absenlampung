"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
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
  Download,
  FileCheck
} from 'lucide-react';
import { laporanAPI, LaporanRequest, LaporanWizardRequest } from '@/lib/laporan-api';
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
  selectedJenisLaporanIds: number[];
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

// Helper function to extract original filename
const getOriginalFileName = (uniqueFileName: string) => {
  try {
    const parts = uniqueFileName.split('_');
    if (parts.length >= 3) {
      return parts.slice(2).join('_'); // Return the originalName.ext part
    }
  } catch (e) {
    console.warn('Could not extract original filename from:', uniqueFileName);
  }
  return uniqueFileName; // Fallback to the unique filename
};

// File Preview Modal Component (copied from edit jenis laporan page)
function FilePreviewModal({ 
  file, 
  isOpen, 
  onClose 
}: { 
  file: File | string | null;
  isOpen: boolean;
  onClose: () => void;
}) {
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (file && typeof file === 'string') {
      // For permanent files, use regular file serving endpoint - assume documents subdirectory
      const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8080';
      const fileName = file.replace('documents/', ''); // Remove prefix if exists
      setBlobUrl(`${API_BASE_URL}/api/files/preview/documents/${fileName}`);
      setIsLoading(false);
      setError(null);
    } else if (file && typeof file !== 'string') {
      try {
        const url = URL.createObjectURL(file);
        setBlobUrl(url);
        setIsLoading(false);
        setError(null);
      } catch (err) {
        console.error('Error creating object URL:', err);
        setError('Gagal memuat preview file');
        setIsLoading(false);
      }
    } else {
      setBlobUrl(null);
      setIsLoading(false);
      setError(null);
    }
  }, [file]);

  // Add keyboard support for ESC key
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden'; // Prevent background scrolling
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = ''; // Restore scrolling
    };
  }, [isOpen, onClose]);

  if (!file) return null;

  const fileName = typeof file === 'string' ? file : file.name;
  const fileExtension = fileName.split('.').pop()?.toLowerCase();

  const renderPreview = () => {
    if (error) {
      return (
        <div className="flex flex-col items-center justify-center h-full text-white">
          <X className="h-16 w-16 mb-4 text-red-400" />
          <p className="text-lg mb-2">Gagal memuat preview</p>
          <p className="text-sm text-gray-300">{error}</p>
        </div>
      );
    }

    if (isLoading || !blobUrl) {
      return (
        <div className="flex flex-col items-center justify-center h-full text-white">
          <RefreshCw className="h-16 w-16 mb-4 animate-spin text-blue-400" />
          <p className="text-lg">Memuat preview...</p>
        </div>
      );
    }
    
    switch (fileExtension) {
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
        return (
          <div className="flex items-center justify-center h-full">
            <img 
              src={blobUrl} 
              alt={fileName}
              className="max-w-full max-h-full object-contain"
              style={{ maxHeight: 'calc(100vh - 120px)' }}
            />
          </div>
        );

      case 'mp4':
      case 'avi':
      case 'mov':
        return (
          <div className="flex items-center justify-center h-full">
            <video 
              src={blobUrl} 
              controls 
              className="max-w-full max-h-full"
              style={{ maxHeight: 'calc(100vh - 120px)' }}
            >
              Browser Anda tidak mendukung video playback.
            </video>
          </div>
        );

      default:
        return (
          <div className="flex flex-col items-center justify-center h-full text-white">
            <FileText className="h-16 w-16 mb-4 text-gray-400" />
            <p className="text-lg mb-2">Preview tidak tersedia</p>
            <p className="text-sm text-gray-300">File: {fileName}</p>
            <Button onClick={downloadFile} className="mt-4" variant="secondary">
              <Download className="h-4 w-4 mr-2" />
              Download File
            </Button>
          </div>
        );
    }
  };

  const downloadFile = () => {
    if (typeof file === 'string') {
      const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8080';
      
      // Check if it's a temp file or permanent file
      const isTempFile = /^\d{8}_\d{6}_/.test(file);
      
      let downloadUrl;
      let downloadFileName;
      
      if (isTempFile) {
        // Use temp file download endpoint
        downloadUrl = `${API_BASE_URL}/api/temp-files/download/${file}`;
        downloadFileName = getOriginalFileName(file);
      } else {
        // Use permanent file download endpoint - assume documents subdirectory
        const fileName = file.replace('documents/', ''); // Remove prefix if exists
        downloadUrl = `${API_BASE_URL}/api/files/download/documents/${fileName}`;
        downloadFileName = getOriginalFileName(fileName);
      }
      
      // Force download for server files using fetch and blob
      fetch(downloadUrl)
        .then(response => {
          if (!response.ok) throw new Error('Download failed');
          return response.blob();
        })
        .then(blob => {
          const url = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = downloadFileName;
          link.style.display = 'none';
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          window.URL.revokeObjectURL(url);
          
          toast({
            title: "Download berhasil",
            description: `File berhasil didownload`,
          });
        })
        .catch(error => {
          console.error('Download error:', error);
          toast({
            title: "Download gagal",
            description: "Gagal mendownload file",
            variant: "destructive",
          });
        });
    } else {
      // For File objects
      const url = URL.createObjectURL(file);
      const link = document.createElement('a');
      link.href = url;
      link.download = file.name;
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-10 bg-black bg-opacity-80 text-white p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Eye className="h-6 w-6" />
          <div>
            <h3 className="font-medium">{fileName}</h3>
            <p className="text-sm text-gray-300">Preview Template</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button onClick={downloadFile} variant="secondary" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Download
          </Button>
          <Button onClick={onClose} variant="secondary" size="sm">
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="w-full h-full pt-20 pb-4">
        {renderPreview()}
      </div>
    </div>
  );
}

export default function CreateLaporanPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Form data
  const [formData, setFormData] = useState<LaporanFormData>({
    nama: '',
    deskripsi: '',
    status: 'AKTIF',
    selectedJenisLaporanIds: []
  });
  
  // Jenis laporan state - changed to array for multi-select
  const [jenisLaporanList, setJenisLaporanList] = useState<JenisLaporanWithTahapan[]>([]);
  const [selectedJenisLaporanList, setSelectedJenisLaporanList] = useState<JenisLaporanWithTahapan[]>([]);
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
  
  // File preview state
  const [previewFile, setPreviewFile] = useState<string | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  
  // Layout state
  const [layout, setLayout] = useState<1 | 2 | 3 | 4 | 5>(3);
  
  // Load jenis laporan data
  useEffect(() => {
    if (currentStep === 1) {
      loadJenisLaporan();
    }
  }, [currentStep, filters]);
  
  const loadJenisLaporan = async () => {
    try {
      setLoading(true);
      // Use search API with tahapan for jenis laporan with pagination and filters
      const response = await jenisLaporanAPI.searchWithTahapan({
        page: filters.page,
        size: filters.size,
        sortBy: filters.sortBy,
        sortDirection: filters.sortDirection,
        nama: filters.nama,
        status: 'AKTIF' // Only load active jenis laporan
      });
      
      // Data already includes tahapan details from the backend
      setJenisLaporanList(response.content);
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
  
  // Helper function to check if file is image or video
  const isImageOrVideo = (fileName: string): boolean => {
    if (!fileName) return false;
    const extension = fileName.toLowerCase().split('.').pop();
    const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'];
    const videoExtensions = ['mp4', 'avi', 'mov', 'wmv', 'flv', 'webm'];
    return imageExtensions.includes(extension || '') || videoExtensions.includes(extension || '');
  };
  
  // Template preview and download handlers
  const handleTemplatePreview = (templateFileName: string) => {
    if (!templateFileName) return;
    setPreviewFile(templateFileName);
    setIsPreviewOpen(true);
  };
  
  const handleTemplateDownload = (templateFileName: string) => {
    if (!templateFileName) return;
    
    const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8080';
    
    // Check if it's a temp file or permanent file
    const isTempFile = /^\d{8}_\d{6}_/.test(templateFileName);
    
    let downloadUrl;
    let downloadFileName;
    
    if (isTempFile) {
      // Use temp file download endpoint
      downloadUrl = `${API_BASE_URL}/api/temp-files/download/${templateFileName}`;
      downloadFileName = getOriginalFileName(templateFileName);
    } else {
      // Use permanent file download endpoint - assume documents subdirectory
      const fileName = templateFileName.replace('documents/', ''); // Remove prefix if exists
      downloadUrl = `${API_BASE_URL}/api/files/download/documents/${fileName}`;
      downloadFileName = getOriginalFileName(fileName);
    }
    
    // Force download using fetch and blob
    fetch(downloadUrl)
      .then(response => {
        if (!response.ok) throw new Error('Download failed');
        return response.blob();
      })
      .then(blob => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = downloadFileName;
        link.style.display = 'none';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        
        toast({
          title: "Download berhasil",
          description: `Template berhasil didownload`,
        });
      })
      .catch(error => {
        console.error('Download error:', error);
        toast({
          title: "Download gagal",
          description: "Gagal mendownload template",
          variant: "destructive",
        });
      });
  };
  
  // Jenis laporan selection - updated for multi-select
  const handleSelectJenisLaporan = (jenisLaporan: JenisLaporanWithTahapan) => {
    const isAlreadySelected = selectedJenisLaporanList.some(
      selected => selected.jenisLaporanId === jenisLaporan.jenisLaporanId
    );
    
    if (isAlreadySelected) {
      // Remove from selection
      const newSelection = selectedJenisLaporanList.filter(
        selected => selected.jenisLaporanId !== jenisLaporan.jenisLaporanId
      );
      setSelectedJenisLaporanList(newSelection);
      setFormData({
        ...formData,
        selectedJenisLaporanIds: newSelection.map(jl => jl.jenisLaporanId)
      });
    } else {
      // Add to selection
      const newSelection = [...selectedJenisLaporanList, jenisLaporan];
      setSelectedJenisLaporanList(newSelection);
      setFormData({
        ...formData,
        selectedJenisLaporanIds: newSelection.map(jl => jl.jenisLaporanId)
      });
    }
  };
  
  const handleUnselectJenisLaporan = (jenisLaporanId: number) => {
    const newSelection = selectedJenisLaporanList.filter(
      selected => selected.jenisLaporanId !== jenisLaporanId
    );
    setSelectedJenisLaporanList(newSelection);
    setFormData({
      ...formData,
      selectedJenisLaporanIds: newSelection.map(jl => jl.jenisLaporanId)
    });
  };
  
  const handleClearAllSelection = () => {
    setSelectedJenisLaporanList([]);
    setFormData({
      ...formData,
      selectedJenisLaporanIds: []
    });
  };
  
  // Validation functions
  const validateStep1 = () => {
    return formData.nama.trim() !== '' && formData.deskripsi.trim() !== '';
  };

  const validateStep2 = () => {
    return selectedJenisLaporanList.length > 0;
  };
  
  // Submit function - create laporan with wizard
  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);
      
      // Use createLaporanWizard that supports multiple jenis laporan
      const requestData = {
        namaLaporan: formData.nama,
        deskripsi: formData.deskripsi,
        status: formData.status,
        jenisLaporanIds: formData.selectedJenisLaporanIds
      };

      await laporanAPI.createWizard(requestData);
      
      toast({
        title: "Sukses",
        description: `Laporan berhasil dibuat dengan ${selectedJenisLaporanList.length} jenis laporan`,
      });
      
      router.push('/admin/laporan');
    } catch (error: any) {
      console.error('Error creating laporan:', error);
      toast({
        title: "Error",
        description: error.message || "Gagal membuat laporan",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Status styling
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'DRAFT':
        return 'bg-gray-100 text-gray-800';
      case 'DALAM_PROSES':
        return 'bg-blue-100 text-blue-800';
      case 'SELESAI':
        return 'bg-green-100 text-green-800';
      case 'DITOLAK':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  
  const getStatusDisplay = (status: string) => {
    switch (status) {
      case 'DRAFT':
        return 'Draft';
      case 'DALAM_PROSES':
        return 'Dalam Proses';
      case 'SELESAI':
        return 'Selesai';
      case 'DITOLAK':
        return 'Ditolak';
      default:
        return status;
    }
  };

  // Render step content
  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Informasi Dasar Laporan
              </CardTitle>
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
                    <SelectItem value="TIDAK_AKTIF">Tidak Aktif</SelectItem>
                    <SelectItem value="DRAFT">Draft</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        );

      case 1:
        return (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Search className="h-5 w-5" />
                    Pilih Jenis Laporan
                  </span>
                  {selectedJenisLaporanList.length > 0 && (
                    <div className="flex items-center gap-2">
                      <Badge className="bg-green-600 text-white">
                        {selectedJenisLaporanList.length} Dipilih
                      </Badge>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleClearAllSelection}
                        className="text-red-600 hover:text-red-700"
                      >
                        <X className="h-4 w-4 mr-1" />
                        Hapus Semua
                      </Button>
                    </div>
                  )}
                </CardTitle>
                <p className="text-gray-600 text-sm mt-2">
                  Pilih satu atau lebih jenis laporan yang sesuai dengan kebutuhan Anda. 
                  Anda dapat memilih beberapa jenis laporan sekaligus.
                </p>
              </CardHeader>
              <CardContent>
                  {/* Quick Tips */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-5 h-5 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs mt-0.5">
                        ℹ
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium text-blue-900 mb-1">Tips Memilih Jenis Laporan</h4>
                        <ul className="text-sm text-blue-800 space-y-1">
                          <li>• Klik pada kartu jenis laporan untuk memilih atau membatalkan pilihan</li>
                          <li>• Anda dapat memilih multiple jenis laporan sekaligus</li>
                          <li>• Laporan yang dipilih akan ditampilkan dengan highlight biru</li>
                          <li>• Gunakan layout view untuk mengatur tampilan yang nyaman</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                  
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
                      {jenisLaporanList.map((jenisLaporan) => {
                        const isSelected = selectedJenisLaporanList.some(
                          selected => selected.jenisLaporanId === jenisLaporan.jenisLaporanId
                        );
                        
                        return (
                          <Card 
                            key={jenisLaporan.jenisLaporanId} 
                            className={`cursor-pointer transition-all hover:shadow-md ${
                              isSelected
                                ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200' 
                                : 'border-gray-200 hover:border-gray-300'
                            }`}
                            onClick={() => handleSelectJenisLaporan(jenisLaporan)}
                          >
                            <CardContent className="p-4">
                              <div className="space-y-3">
                                <div className="flex items-start justify-between">
                                  <h3 className="font-semibold text-sm">{jenisLaporan.nama}</h3>
                                  {isSelected && (
                                    <div className="flex items-center gap-1">
                                      <Check className="h-5 w-5 text-blue-600" />
                                      <Badge className="bg-blue-600 text-white text-xs">
                                        Dipilih
                                      </Badge>
                                    </div>
                                  )}
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
                        );
                      })}
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
            {selectedJenisLaporanList.length > 0 && (
              <Card className="border-green-500 bg-green-50">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <Check className="h-5 w-5 text-green-600" />
                      Jenis Laporan Terpilih ({selectedJenisLaporanList.length})
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleClearAllSelection}
                      className="text-red-600 hover:text-red-700"
                    >
                      <X className="h-4 w-4" />
                      Hapus Semua
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Selected items in responsive grid matching the selection layout */}
                    <div className={`grid gap-3 ${
                      layout === 1 ? 'grid-cols-1' :
                      layout === 2 ? 'grid-cols-2' :
                      layout === 3 ? 'grid-cols-3' :
                      layout === 4 ? 'grid-cols-4' :
                      'grid-cols-5'
                    }`}>
                      {selectedJenisLaporanList.map((jenisLaporan) => (
                        <Card key={jenisLaporan.jenisLaporanId} className="border border-green-200 bg-white">
                          <CardContent className="p-3">
                            <div className="space-y-2">
                              <div className="flex items-start justify-between">
                                <h4 className="font-semibold text-sm text-gray-900">{jenisLaporan.nama}</h4>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleUnselectJenisLaporan(jenisLaporan.jenisLaporanId)}
                                  className="text-red-600 hover:text-red-700 h-6 w-6 p-0"
                                >
                                  <X className="h-3 w-3" />
                                </Button>
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
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                    
                    {/* Summary of all tahapan */}
                    <div className="mt-4 p-4 bg-white rounded-lg border border-green-200">
                      <h4 className="font-semibold text-gray-900 mb-3">Ringkasan Tahapan Seluruh Jenis Laporan</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {selectedJenisLaporanList.map((jenisLaporan) => (
                          <div key={jenisLaporan.jenisLaporanId} className="space-y-2">
                            <h5 className="font-medium text-sm text-gray-800">{jenisLaporan.nama}</h5>
                            {jenisLaporan.tahapanList && jenisLaporan.tahapanList.length > 0 ? (
                              <div className="space-y-1">
                                {jenisLaporan.tahapanList.map((tahapan) => (
                                  <div key={tahapan.tahapanLaporanId} className="flex items-center gap-2 text-xs">
                                    <span className="flex-shrink-0 w-5 h-5 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs">
                                      {tahapan.urutanTahapan}
                                    </span>
                                    <span className="text-gray-600 truncate">{tahapan.nama}</span>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="text-xs text-gray-500">Tidak ada tahapan</p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
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
                  Preview & Konfirmasi Laporan
                </CardTitle>
                <p className="text-gray-600 text-sm mt-2">
                  Tinjau informasi laporan sebelum menyimpan
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
                          <p className="text-sm text-gray-600">Jenis Laporan Dipilih</p>
                          <p className="font-semibold text-gray-900">{selectedJenisLaporanList.length} jenis laporan</p>
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
                          <p className="font-semibold text-gray-900">
                            {selectedJenisLaporanList.reduce((total, jenis) => total + (jenis.tahapanList?.length || 0), 0)}
                          </p>
                        </div>
                        <Calendar className="h-8 w-8 text-purple-500" />
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Description */}
                <Card>
                  <CardContent className="p-4">
                    <p className="text-sm text-gray-600 mb-2">Deskripsi Laporan</p>
                    <p className="text-gray-900">{formData.deskripsi}</p>
                  </CardContent>
                </Card>

                {/* Jenis Laporan Details */}
                {selectedJenisLaporanList.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Detail Jenis Laporan Terpilih</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {/* Layout Options for Preview */}
                      <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                        <div className="space-y-3">
                          <Label className="text-base font-medium">Layout Tampilan Tahapan</Label>
                          <p className="text-sm text-gray-600">Pilih tata letak untuk menampilkan tahapan dalam preview</p>
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
                      </div>
                      
                      <div className="space-y-6">
                        {selectedJenisLaporanList.map((jenisLaporan, index) => (
                          <div key={jenisLaporan.jenisLaporanId} className="space-y-4">
                            <div className="flex items-center gap-3">
                              <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-sm">
                                {index + 1}
                              </div>
                              <div className="flex-1">
                                <h4 className="font-semibold text-gray-900 mb-1">{jenisLaporan.nama}</h4>
                                <p className="text-gray-600 text-sm">{jenisLaporan.deskripsi}</p>
                              </div>
                            </div>
                            
                            {jenisLaporan.tahapanList && jenisLaporan.tahapanList.length > 0 && (
                              <div className="ml-11">
                                <h5 className="font-semibold text-gray-900 mb-3">Tahapan yang Akan Dilalui</h5>
                                <div className={`grid gap-4 ${
                                  layout === 1 ? 'grid-cols-1' :
                                  layout === 2 ? 'grid-cols-1 lg:grid-cols-2' :
                                  layout === 3 ? 'grid-cols-1 lg:grid-cols-2 xl:grid-cols-3' :
                                  layout === 4 ? 'grid-cols-1 lg:grid-cols-2 xl:grid-cols-4' :
                                  'grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-5'
                                }`}>
                                  {jenisLaporan.tahapanList.map((tahapan: any) => (
                                    <Card key={tahapan.tahapanLaporanId} className="border border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
                                      <CardContent className="p-4">
                                        <div className="space-y-3">
                                          <div className="flex items-center gap-3">
                                            <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-blue-600 to-indigo-600 text-white rounded-full flex items-center justify-center font-bold text-sm">
                                              {tahapan.urutanTahapan}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                              <h4 className="font-bold text-gray-900 text-base mb-1 truncate">{tahapan.nama}</h4>
                                            </div>
                                          </div>
                                          
                                          <p className="text-gray-700 text-sm leading-relaxed line-clamp-3">{tahapan.deskripsi}</p>
                                          
                                          {/* Template Section */}
                                          {tahapan.templateTahapan && (
                                            <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                                              <div className="flex items-center justify-between mb-2">
                                                <div className="flex items-center gap-1">
                                                  <FileText className="h-4 w-4 text-blue-600" />
                                                  <span className="font-medium text-blue-900 text-xs truncate">{getOriginalFileName(tahapan.templateTahapan)}</span>
                                                </div>
                                                <Badge variant="secondary" className="text-xs">
                                                  {tahapan.templateTahapan.split('.').pop()?.toUpperCase()}
                                                </Badge>
                                              </div>
                                              <div className="flex flex-wrap gap-1">
                                                {isImageOrVideo(tahapan.templateTahapan) && (
                                                  <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => handleTemplatePreview(tahapan.templateTahapan)}
                                                    className="text-blue-600 border-blue-300 hover:bg-blue-100 h-7 text-xs"
                                                  >
                                                    <Eye className="h-3 w-3 mr-1" />
                                                    Preview
                                                  </Button>
                                                )}
                                                <Button
                                                  variant="outline"
                                                  size="sm"
                                                  onClick={() => handleTemplateDownload(tahapan.templateTahapan)}
                                                  className="text-green-600 border-green-300 hover:bg-green-100 h-7 text-xs"
                                                >
                                                  <Download className="h-3 w-3 mr-1" />
                                                  Download
                                                </Button>
                                              </div>
                                            </div>
                                          )}
                                          
                                          {/* File Types Section */}
                                          {tahapan.jenisFileIzin && tahapan.jenisFileIzin.length > 0 && (
                                            <div className="p-2 bg-gray-50 rounded-lg border border-gray-200">
                                              <div className="flex items-center gap-1 mb-1">
                                                <FileCheck className="h-3 w-3 text-gray-600" />
                                                <span className="font-medium text-gray-800 text-xs">File Diizinkan:</span>
                                              </div>
                                              <div className="flex flex-wrap gap-1">
                                                {tahapan.jenisFileIzin.slice(0, 3).map((type: string, index: number) => (
                                                  <Badge key={index} variant="outline" className="text-xs h-5">
                                                    {type.toUpperCase()}
                                                  </Badge>
                                                ))}
                                                {tahapan.jenisFileIzin.length > 3 && (
                                                  <Badge variant="outline" className="text-xs h-5">
                                                    +{tahapan.jenisFileIzin.length - 3}
                                                  </Badge>
                                                )}
                                              </div>
                                            </div>
                                          )}
                                          
                                          {/* Status Info */}
                                          <div className="flex items-center gap-2 text-xs">
                                            <div className="flex items-center gap-1 text-blue-600">
                                              <div className="w-1.5 h-1.5 bg-blue-600 rounded-full"></div>
                                              <span>Tahapan ke-{tahapan.urutanTahapan}</span>
                                            </div>
                                            {tahapan.templateTahapan && (
                                              <div className="flex items-center gap-1 text-green-600">
                                                <div className="w-1.5 h-1.5 bg-green-600 rounded-full"></div>
                                                <span className="truncate">Template tersedia</span>
                                              </div>
                                            )}
                                          </div>
                                        </div>
                                      </CardContent>
                                    </Card>
                                  ))}
                                </div>
                              </div>
                            )}
                            
                            {index < selectedJenisLaporanList.length - 1 && (
                              <hr className="border-gray-200" />
                            )}
                          </div>
                        ))}
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
              <h1 className="text-3xl font-bold tracking-tight">Buat Laporan Baru</h1>
              <p className="text-muted-foreground">
                Buat laporan baru dengan mengikuti tahapan yang telah ditentukan
              </p>
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
                        Menyimpan...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4" />
                        Buat Laporan
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* File Preview Modal */}
      <FilePreviewModal
        file={previewFile}
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
      />
    </div>
  );
}
