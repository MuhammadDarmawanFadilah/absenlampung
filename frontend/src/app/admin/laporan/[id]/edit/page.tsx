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
  Loader2,
  Download,
  ExternalLink,
  File,
  Image,
  Video,
  FileIcon,
  Archive
} from 'lucide-react';
import { laporanAPI, LaporanRequest, Laporan, DetailLaporanDTO } from '@/lib/laporan-api';
import { jenisLaporanAPI, JenisLaporan, PagedResponse } from '@/lib/api';

  const LAYOUT_OPTIONS = [
  { value: 1, label: '1 per baris', icon: Monitor },
  { value: 2, label: '2 per baris', icon: Tablet },
  { value: 3, label: '3 per baris', icon: LayoutGrid },
  { value: 4, label: '4 per baris', icon: Grid3X3 },
  { value: 5, label: '5 per baris', icon: Smartphone },
];

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

// File Preview Modal Component
function FilePreviewModal({ 
  file, 
  isOpen, 
  onClose 
}: { 
  file: { nama: string; url: string } | null;
  isOpen: boolean;
  onClose: () => void;
}) {
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (file) {
      setBlobUrl(file.url);
      setIsLoading(false);
      setError(null);
    } else {
      setBlobUrl(null);
      setIsLoading(false);
      setError(null);
    }
  }, [file]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  if (!file) return null;

  const fileName = file.nama;
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
          <Loader2 className="h-16 w-16 mb-4 animate-spin text-blue-400" />
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
    if (file) {
      fetch(file.url)
        .then(response => {
          if (!response.ok) throw new Error('Download failed');
          return response.blob();
        })
        .then(blob => {
          const url = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = fileName;
          link.style.display = 'none';
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          window.URL.revokeObjectURL(url);
          
          toast({
            title: "Download berhasil",
            description: `File ${fileName} berhasil didownload`,
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
    }
  };

  return (
    <div 
      className={`fixed inset-0 z-50 transition-opacity duration-300 ${
        isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
      }`}
    >
      <div className="absolute inset-0 bg-black/90 backdrop-blur-sm" />
      <div className="relative z-10 h-full">
        <div className="flex items-center justify-between p-4">
          <div className="text-white">
            <h2 className="text-xl font-semibold">{fileName}</h2>
            <p className="text-sm text-gray-300">Preview File</p>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              onClick={downloadFile}
              variant="secondary" 
              size="sm"
              className="bg-white/10 border-white/20 text-white hover:bg-white/20"
            >
              <Download className="h-4 w-4 mr-2" />
              Download
            </Button>
            <Button 
              onClick={onClose}
              variant="ghost" 
              size="sm"
              className="text-white hover:bg-white/10"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>
        <div className="h-[calc(100%-80px)] p-4">
          {renderPreview()}
        </div>
      </div>
    </div>
  );
}

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

export default function EditLaporanPage() {
  const router = useRouter();
  const params = useParams();
  const laporanId = parseInt(params.id as string);
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  // Original laporan data
  const [originalLaporan, setOriginalLaporan] = useState<Laporan | null>(null);
  
  // Form data
  const [formData, setFormData] = useState<LaporanFormData>({
    nama: '',
    deskripsi: '',
    status: 'AKTIF',
    selectedJenisLaporanIds: []
  });
  
  // Jenis laporan state
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
    tahapanNama: '',
    status: 'AKTIF' as 'AKTIF' | 'TIDAK_AKTIF' | 'DRAFT' | 'ALL'
  });
  
  // Layout state
  const [layout, setLayout] = useState<1 | 2 | 3 | 4 | 5>(3);
  
  // File preview state
  const [previewFile, setPreviewFile] = useState<{ nama: string; url: string } | null>(null);
  
  // Load laporan data on mount
  useEffect(() => {
    loadLaporanData();
  }, [laporanId]);
  
  // Load jenis laporan data when step changes to 1
  useEffect(() => {
    if (currentStep === 1) {
      loadJenisLaporan();
    }
  }, [currentStep, filters]);
  
  const loadLaporanData = async () => {
    try {
      setIsLoading(true);
      const laporan = await laporanAPI.getById(laporanId);
      setOriginalLaporan(laporan);
      
      // Extract unique jenis laporan IDs from detailLaporanList
      let jenisLaporanIds: number[] = [];
      if (laporan.detailLaporanList && laporan.detailLaporanList.length > 0) {
        const uniqueJenisLaporanIds = new Set(
          laporan.detailLaporanList.map(detail => detail.jenisLaporanId)
        );
        jenisLaporanIds = Array.from(uniqueJenisLaporanIds);
        console.log('Found jenis laporan IDs from detail laporan:', jenisLaporanIds);
      } else {
        // Fallback to primary jenis laporan if no detail laporan
        jenisLaporanIds = [laporan.jenisLaporanId];
        console.log('Using fallback primary jenis laporan ID:', jenisLaporanIds);
      }
      
      // Set form data from existing laporan  
      setFormData({
        nama: laporan.namaLaporan,
        deskripsi: laporan.deskripsi,
        status: laporan.status,
        selectedJenisLaporanIds: jenisLaporanIds
      });
      
      // Load all jenis laporan details
      try {
        const jenisLaporanDetails = await Promise.all(
          jenisLaporanIds.map(async (id) => {
            try {
              return await jenisLaporanAPI.getWithTahapan(id);
            } catch (error) {
              console.error(`Error loading jenis laporan ${id}:`, error);
              return null;
            }
          })
        );
        
        const validJenisLaporan = jenisLaporanDetails.filter(jl => jl !== null);
        setSelectedJenisLaporanList(validJenisLaporan);
        console.log('Loaded jenis laporan details:', validJenisLaporan.map(jl => ({ id: jl.jenisLaporanId, nama: jl.nama })));
      } catch (error) {
        console.error('Error loading jenis laporan details:', error);
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
  
  const loadJenisLaporan = async () => {
    try {
      setLoading(true);
      // Use searchWithTahapan API for jenis laporan with pagination and filters
      const response = await jenisLaporanAPI.searchWithTahapan({
        page: filters.page,
        size: filters.size,
        sortBy: filters.sortBy,
        sortDirection: filters.sortDirection,
        nama: filters.nama,
        status: filters.status === 'ALL' ? undefined : filters.status
      });
      
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
      tahapanNama: '',
      status: 'AKTIF' as 'AKTIF' | 'TIDAK_AKTIF' | 'DRAFT' | 'ALL'
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
    // Reset to original jenis laporan if available
    if (originalLaporan) {
      const originalJenisLaporan = jenisLaporanList.find(jl => jl.jenisLaporanId === originalLaporan.jenisLaporanId);
      if (originalJenisLaporan) {
        setSelectedJenisLaporanList([originalJenisLaporan]);
        setFormData({
          ...formData,
          selectedJenisLaporanIds: [originalLaporan.jenisLaporanId]
        });
      } else {
        setSelectedJenisLaporanList([]);
        setFormData({
          ...formData,
          selectedJenisLaporanIds: []
        });
      }
    } else {
      setSelectedJenisLaporanList([]);
      setFormData({
        ...formData,
        selectedJenisLaporanIds: []
      });
    }
  };
  
  // Validation functions
  const validateStep1 = () => {
    return formData.nama.trim() !== '' && formData.deskripsi.trim() !== '';
  };

  const validateStep2 = () => {
    return selectedJenisLaporanList.length > 0;
  };
  
  // Submit function
  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);
      
      const requestData = {
        namaLaporan: formData.nama,
        deskripsi: formData.deskripsi,
        jenisLaporanIds: formData.selectedJenisLaporanIds
      };

      await laporanAPI.updateWizard(laporanId, requestData);
      
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

  // File utility functions
  const getFileIcon = (fileName: string) => {
    const extension = fileName.split('.').pop()?.toLowerCase();
    switch (extension) {
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
      case 'webp':
        return Image;
      case 'mp4':
      case 'avi':
      case 'mov':
      case 'wmv':
      case 'flv':
        return Video;
      case 'pdf':
        return FileText;
      case 'doc':
      case 'docx':
        return FileText;
      case 'zip':
      case 'rar':
      case '7z':
        return Archive;
      default:
        return File;
    }
  };

  const isImageFile = (fileName: string) => {
    const extension = fileName.split('.').pop()?.toLowerCase();
    return ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(extension || '');
  };

  const isVideoFile = (fileName: string) => {
    const extension = fileName.split('.').pop()?.toLowerCase();
    return ['mp4', 'avi', 'mov', 'wmv', 'flv'].includes(extension || '');
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleDownloadAllFiles = async () => {
    if (!originalLaporan || !originalLaporan.detailLaporanList) {
      toast({
        title: "Info",
        description: "Tidak ada file untuk diunduh",
      });
      return;
    }

    try {
      // For demo purposes, we'll simulate downloading template files from tahapan
      const filesToDownload: { nama: string; url: string }[] = [];
      
      // Collect template files from selected jenis laporan
      selectedJenisLaporanList.forEach(jenisLaporan => {
        jenisLaporan.tahapanList?.forEach(tahapan => {
          if (tahapan.templateTahapan) {
            filesToDownload.push({
              nama: `Template_${jenisLaporan.nama}_${tahapan.nama}.pdf`,
              url: `${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8080'}/api/files/template/${tahapan.tahapanLaporanId}`
            });
          }
        });
      });

      if (filesToDownload.length === 0) {
        toast({
          title: "Info", 
          description: "Tidak ada file template untuk diunduh",
        });
        return;
      }

      // Download each file
      for (const file of filesToDownload) {
        try {
          const link = document.createElement('a');
          link.href = file.url;
          link.download = file.nama;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          
          // Small delay between downloads
          await new Promise(resolve => setTimeout(resolve, 500));
        } catch (error) {
          console.error(`Error downloading ${file.nama}:`, error);
        }
      }

      toast({
        title: "Sukses",
        description: `${filesToDownload.length} template file berhasil diunduh`,
      });
    } catch (error) {
      console.error('Error downloading files:', error);
      toast({
        title: "Error",
        description: "Gagal mengunduh file",
        variant: "destructive",
      });
    }
  };

  const handleDownloadFile = async (file: { nama: string; url: string }) => {
    try {
      const link = document.createElement('a');
      link.href = file.url;
      link.download = file.nama;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast({
        title: "Sukses",
        description: `File ${file.nama} berhasil diunduh`,
      });
    } catch (error) {
      console.error('Error downloading file:', error);
      toast({
        title: "Error", 
        description: "Gagal mengunduh file",
        variant: "destructive",
      });
    }
  };

  const handlePreviewFile = (file: { nama: string; url: string }) => {
    setPreviewFile(file);
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
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Memuat data laporan...</p>
        </div>
      </div>
    );
  }

  // Render step content (reusing the same content from create page with modifications)
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
              <p className="text-sm text-gray-600">
                Ubah informasi dasar laporan sesuai kebutuhan
              </p>
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
                  Pilih Jenis Laporan
                </CardTitle>
                <p className="text-sm text-gray-600">
                  Pilih jenis laporan yang sesuai. Perubahan jenis laporan akan mengubah tahapan yang perlu dilalui.
                </p>
              </CardHeader>
              <CardContent>
                {/* Layout and Filter Controls (reuse from create page) */}
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
                  <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
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
                      <Select value={filters.status} onValueChange={(value) => handleFilterChange('status', value)}>
                        <SelectTrigger className="h-10">
                          <SelectValue placeholder="Status" />
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
                      <Select value={filters.size.toString()} onValueChange={(value) => handleFilterChange('size', parseInt(value))}>
                        <SelectTrigger className="h-10">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="5">5 per halaman</SelectItem>
                          <SelectItem value="10">10 per halaman</SelectItem>
                          <SelectItem value="25">25 per halaman</SelectItem>
                          <SelectItem value="50">50 per halaman</SelectItem>
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

                {/* Jenis Laporan Grid (reuse from create page) */}
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
                        const isOriginal = originalLaporan?.jenisLaporanId === jenisLaporan.jenisLaporanId;
                        
                        return (
                        <Card 
                          key={jenisLaporan.jenisLaporanId} 
                          className={`cursor-pointer transition-all hover:shadow-md ${
                            isSelected
                              ? 'border-blue-500 bg-blue-50' 
                              : isOriginal
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
                                  {isSelected && (
                                    <Check className="h-5 w-5 text-blue-600" />
                                  )}
                                  {isOriginal && !isSelected && (
                                    <div className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                                      Saat ini
                                    </div>
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
              <Card className="border-2 border-blue-500 bg-blue-50">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <Check className="h-5 w-5 text-blue-600" />
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
                  <div className={`grid gap-4 ${
                    layout === 1 ? 'grid-cols-1' :
                    layout === 2 ? 'grid-cols-2' :
                    layout === 3 ? 'grid-cols-3' :
                    layout === 4 ? 'grid-cols-4' :
                    'grid-cols-5'
                  }`}>
                    {selectedJenisLaporanList.map((jenisLaporan, index) => {
                      const isOriginal = originalLaporan?.jenisLaporanId === jenisLaporan.jenisLaporanId;
                      return (
                        <Card key={jenisLaporan.jenisLaporanId} className="border border-blue-300 bg-white">
                          <CardContent className="p-4">
                            <div className="space-y-3">
                              <div className="flex items-start justify-between">
                                <h3 className="font-semibold text-sm">{jenisLaporan.nama}</h3>
                                <div className="flex items-center gap-1">
                                  <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">
                                    {index + 1}
                                  </span>
                                  {isOriginal && (
                                    <Badge className="bg-green-100 text-green-800 text-xs" variant="secondary">
                                      Asli
                                    </Badge>
                                  )}
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleUnselectJenisLaporan(jenisLaporan.jenisLaporanId)}
                                    className="text-red-600 hover:text-red-700 h-6 w-6 p-0"
                                  >
                                    <X className="h-3 w-3" />
                                  </Button>
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
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                  
                  <div className="mt-4 p-3 bg-blue-100 border border-blue-200 rounded-lg">
                    <p className="text-sm text-blue-800">
                      <strong>Info:</strong> Laporan akan memiliki semua tahapan dari {selectedJenisLaporanList.length} jenis laporan yang dipilih.
                    </p>
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
                  Tinjau perubahan laporan sebelum menyimpan
                </p>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Layout Selection for Preview */}
                <div className="space-y-2">
                  <Label className="text-base font-medium">Layout Tampilan Preview</Label>
                  <p className="text-sm text-gray-600 mb-3">Pilih layout untuk preview jenis laporan</p>
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
                {/* Change Summary */}
                {originalLaporan && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card className="border-l-4 border-l-red-500">
                      <CardHeader className="pb-3">
                        <h3 className="font-semibold text-lg">Data Lama</h3>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div>
                          <p className="text-sm text-gray-600">Nama Laporan</p>
                          <p className="font-medium">{originalLaporan.namaLaporan}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Status</p>
                          <Badge className={getStatusColor(originalLaporan.status)}>
                            {getStatusDisplay(originalLaporan.status)}
                          </Badge>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Jenis Laporan</p>
                          <p className="font-medium">{originalLaporan.jenisLaporanNama}</p>
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card className="border-l-4 border-l-green-500">
                      <CardHeader className="pb-3">
                        <h3 className="font-semibold text-lg">Data Baru</h3>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div>
                          <p className="text-sm text-gray-600">Nama Laporan</p>
                          <p className="font-medium">{formData.nama}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Status</p>
                          <Badge className={getStatusColor(formData.status)}>
                            {getStatusDisplay(formData.status)}
                          </Badge>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Jenis Laporan</p>
                          <div className="space-y-1">
                            {selectedJenisLaporanList.map((jl, index) => (
                              <p key={jl.jenisLaporanId} className="font-medium text-sm">
                                {index + 1}. {jl.nama}
                              </p>
                            ))}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}

                {/* Changes Highlight */}
                <Card>
                  <CardContent className="p-4">
                    <h4 className="font-semibold text-gray-900 mb-3">Ringkasan Perubahan</h4>
                    <div className="space-y-2 text-sm">
                      {originalLaporan?.namaLaporan !== formData.nama && (
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                          <span>Nama laporan akan diubah</span>
                        </div>
                      )}
                      {originalLaporan?.deskripsi !== formData.deskripsi && (
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                          <span>Deskripsi laporan akan diubah</span>
                        </div>
                      )}
                      {originalLaporan?.status !== formData.status && (
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                          <span>Status laporan akan diubah</span>
                        </div>
                      )}
                      {!formData.selectedJenisLaporanIds.includes(originalLaporan?.jenisLaporanId || 0) && (
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                          <span className="text-red-700 font-medium">Jenis laporan akan diubah (tahapan akan berubah)</span>
                        </div>
                      )}
                      {originalLaporan?.namaLaporan === formData.nama && 
                       originalLaporan?.deskripsi === formData.deskripsi && 
                       originalLaporan?.status === formData.status && 
                       formData.selectedJenisLaporanIds.includes(originalLaporan?.jenisLaporanId || 0) && 
                       formData.selectedJenisLaporanIds.length === 1 && (
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-gray-500 rounded-full"></div>
                          <span className="text-gray-600">Tidak ada perubahan</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* New Description */}
                <Card>
                  <CardContent className="p-4">
                    <p className="text-sm text-gray-600 mb-2">Deskripsi Laporan Baru</p>
                    <p className="text-gray-900">{formData.deskripsi}</p>
                  </CardContent>
                </Card>

                {/* Jenis Laporan Details */}
                {selectedJenisLaporanList.length > 0 && (
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                      <div>
                        <CardTitle className="text-lg">Detail Jenis Laporan Terpilih ({selectedJenisLaporanList.length})</CardTitle>
                        <p className="text-sm text-gray-600 mt-1">
                          Template dan file terkait jenis laporan yang dipilih
                        </p>
                      </div>
                      <Button
                        onClick={handleDownloadAllFiles}
                        variant="outline"
                        className="flex items-center gap-2"
                      >
                        <Download className="h-4 w-4" />
                        Download Semua Template
                      </Button>
                    </CardHeader>
                    <CardContent>
                      <div className={`grid gap-6 ${
                        layout === 1 ? 'grid-cols-1' :
                        layout === 2 ? 'grid-cols-2' :
                        layout === 3 ? 'grid-cols-3' :
                        layout === 4 ? 'grid-cols-4' :
                        'grid-cols-5'
                      }`}>
                        {selectedJenisLaporanList.map((jenisLaporan, index) => (
                          <Card key={jenisLaporan.jenisLaporanId} className="border rounded-lg">
                            <CardHeader className="pb-3">
                              <div className="flex items-center gap-2 mb-2">
                                <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                                  {index + 1}
                                </span>
                                <h4 className="font-semibold text-gray-900 text-sm">{jenisLaporan.nama}</h4>
                                {originalLaporan?.jenisLaporanId === jenisLaporan.jenisLaporanId && (
                                  <Badge className="bg-green-100 text-green-800 text-xs" variant="secondary">
                                    Asli
                                  </Badge>
                                )}
                              </div>
                              <p className="text-gray-600 text-xs">{jenisLaporan.deskripsi}</p>
                            </CardHeader>
                            <CardContent className="space-y-3">
                              {jenisLaporan.tahapanList && jenisLaporan.tahapanList.length > 0 ? (
                                jenisLaporan.tahapanList.map((tahapan: any) => (
                                  <div key={tahapan.tahapanLaporanId} className="border rounded-lg p-3 bg-gray-50">
                                    <div className="flex items-start gap-3">
                                      <div className="flex-shrink-0">
                                        <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-xs">
                                          {tahapan.urutanTahapan}
                                        </div>
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <h6 className="font-semibold text-gray-900 mb-1 text-xs">{tahapan.nama}</h6>
                                        <p className="text-xs text-gray-600 mb-2 line-clamp-2">{tahapan.deskripsi}</p>
                                        
                                        <div className="flex items-center gap-2 text-xs">
                                          {tahapan.templateTahapan && (
                                            <div className="flex items-center gap-1">
                                              <FileText className="h-3 w-3 text-blue-600" />
                                              <Button
                                                variant="link"
                                                size="sm" 
                                                className="h-auto p-0 text-xs text-blue-600"
                                                onClick={() => handlePreviewFile({
                                                  nama: `Template_${jenisLaporan.nama}_${tahapan.nama}.pdf`,
                                                  url: `${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8080'}/api/files/template/${tahapan.tahapanLaporanId}`
                                                })}
                                              >
                                                Preview Template
                                              </Button>
                                              <Button
                                                variant="link"
                                                size="sm"
                                                className="h-auto p-0 text-xs text-green-600"
                                                onClick={() => handleDownloadFile({
                                                  nama: `Template_${jenisLaporan.nama}_${tahapan.nama}.pdf`,
                                                  url: `${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8080'}/api/files/template/${tahapan.tahapanLaporanId}`
                                                })}
                                              >
                                                <Download className="h-3 w-3 mr-1" />
                                                Download
                                              </Button>
                                            </div>
                                          )}
                                        </div>
                                        
                                        {tahapan.jenisFileIzin && tahapan.jenisFileIzin.length > 0 && (
                                          <div className="mt-2">
                                            <div className="flex flex-wrap gap-1">
                                              {tahapan.jenisFileIzin.slice(0, 3).map((type: any) => (
                                                <Badge key={type} variant="outline" className="text-xs px-1 py-0">
                                                  {type.toUpperCase()}
                                                </Badge>
                                              ))}
                                              {tahapan.jenisFileIzin.length > 3 && (
                                                <Badge variant="outline" className="text-xs px-1 py-0">
                                                  +{tahapan.jenisFileIzin.length - 3}
                                                </Badge>
                                              )}
                                            </div>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                ))
                              ) : (
                                <div className="text-center py-4 text-gray-500">
                                  <FileText className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                                  <p className="text-xs">Tidak ada tahapan</p>
                                </div>
                              )}
                            </CardContent>
                          </Card>
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
      <div className="container mx-auto py-8 px-6 max-w-6xl">
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
                Ubah informasi laporan sesuai kebutuhan
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

      {/* File Preview Modal */}
      <FilePreviewModal
        file={previewFile}
        isOpen={!!previewFile}
        onClose={() => setPreviewFile(null)}
      />
    </div>
  );
}
