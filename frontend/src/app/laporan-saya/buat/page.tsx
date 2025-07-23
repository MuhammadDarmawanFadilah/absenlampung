"use client";

import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast-simple";
import { getApiUrl } from "@/lib/config";
import { ArrowLeft, Check, ChevronRight, Upload, X, Eye, Download, File, FileText, ImageIcon, RefreshCw, User, Calendar, MapPin } from "lucide-react";

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

interface SubmissionData {
  judul: string;
  konten: string;
  lokasi: string;
  tanggalLaporan: string;
  uploadedFiles: string[];
  pemilihanId?: number;
  laporanId?: number;
  jenisLaporanId?: number;
  tahapanLaporanId?: number;
}

// File Preview Modal Component
function FilePreviewModal({ 
  file, 
  isOpen, 
  onClose 
}: { 
  file: string | null;
  isOpen: boolean;
  onClose: () => void;
}) {
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (file && typeof file === 'string') {
      // For temp files, use temp file preview endpoint
      const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8080';
      setBlobUrl(`${API_BASE_URL}/api/temp-files/preview/${file}`);
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

  const fileName = file.split('_').slice(2).join('_') || file;
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
          </div>
        );
    }
  };

  const downloadFile = () => {
    const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8080';
    const downloadUrl = `${API_BASE_URL}/api/temp-files/download/${file}`;
    
    fetch(downloadUrl)
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
      })
      .catch(error => {
        console.error('Download error:', error);
      });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black">
      <div className="absolute top-0 left-0 right-0 z-10 bg-black bg-opacity-80 text-white p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Eye className="h-6 w-6" />
          <div>
            <h3 className="font-medium">{fileName}</h3>
            <p className="text-sm text-gray-300">Preview File</p>
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

      <div className="absolute inset-0 pt-20">
        {renderPreview()}
      </div>
    </div>
  );
}

// File Upload Component
function FileUploadComponent({ 
  onFileSelect, 
  onFileRemove,
  accept = "*",
  multiple = false,
  maxFiles = 10,
  currentFiles = []
}: { 
  onFileSelect: (fileName: string) => void;
  onFileRemove: () => void;
  accept?: string;
  multiple?: boolean;
  maxFiles?: number;
  currentFiles?: string[];
}) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputId = `file-upload-${Math.random().toString(36).substr(2, 9)}`;

  const uploadToServer = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(getApiUrl('temp-files/upload'), {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Gagal mengupload file');
    }

    const result = await response.json();
    return result.data.fileName;
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      for (let i = 0; i < files.length; i++) {
        if (currentFiles.length >= maxFiles) {
          break;
        }
        await handleFileUpload(files[i]);
      }
    }
  };

  const handleFileUpload = async (file: File) => {
    try {
      setIsUploading(true);
      const serverFileName = await uploadToServer(file);
      onFileSelect(serverFileName);
    } catch (error: any) {
      console.error('Upload error:', error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = e.dataTransfer.files;
    for (let i = 0; i < files.length; i++) {
      if (currentFiles.length >= maxFiles) {
        break;
      }
      await handleFileUpload(files[i]);
    }
  };

  return (
    <div 
      className={`
        border-2 border-dashed rounded-lg p-6 text-center transition-all cursor-pointer
        ${isDragging 
          ? 'border-blue-500 bg-blue-50' 
          : 'border-gray-300 hover:border-gray-400'
        }
        ${isUploading ? 'opacity-50 pointer-events-none' : ''}
      `}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={() => !isUploading && document.getElementById(fileInputId)?.click()}
    >
      <input
        type="file"
        accept={accept}
        multiple={multiple}
        onChange={handleFileChange}
        className="hidden"
        id={fileInputId}
        disabled={isUploading}
      />
      {isUploading ? (
        <RefreshCw className="h-8 w-8 mx-auto mb-2 animate-spin text-blue-500" />
      ) : (
        <Upload className={`h-8 w-8 mx-auto mb-2 ${isDragging ? 'text-blue-500' : 'text-gray-400'}`} />
      )}
      <p className={`text-sm ${isDragging ? 'text-blue-600' : isUploading ? 'text-blue-600' : 'text-gray-600'}`}>
        {isUploading 
          ? 'Mengupload file...' 
          : isDragging 
            ? 'Lepaskan file di sini' 
            : 'Klik atau drag & drop file'
        }
      </p>
      <p className="text-xs text-gray-400 mt-1">
        Format yang didukung: PDF, Word, Excel, Image, Video • Maksimal {maxFiles} file
      </p>
    </div>
  );
}

// Template Display Component
function TemplateDisplay({ tahapanLaporanId }: { tahapanLaporanId: number }) {
  const [templateData, setTemplateData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadTemplateData = async () => {
      try {
        setLoading(true);
        const response = await fetch(getApiUrl(`tahapan-laporan/${tahapanLaporanId}`), {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
          }
        });
        if (response.ok) {
          const data = await response.json();
          setTemplateData(data);
        }
      } catch (error) {
        console.error('Error loading template data:', error);
      } finally {
        setLoading(false);
      }
    };

    if (tahapanLaporanId) {
      loadTemplateData();
    }
  }, [tahapanLaporanId]);

  const handleTemplateDownload = async (templatePath: string) => {
    try {
      // Check if it's a temp file or permanent file
      const isTempFile = /^\d{8}_\d{6}_/.test(templatePath);
      
      let downloadUrl;
      if (isTempFile) {
        // Use temp file download endpoint
        downloadUrl = getApiUrl(`temp-files/download/${templatePath}`);
      } else {
        // Use permanent file download endpoint - assume documents subdirectory
        const fileName = templatePath.replace('documents/', ''); // Remove prefix if exists
        downloadUrl = getApiUrl(`files/download/documents/${fileName}`);
      }
      
      const response = await fetch(downloadUrl);
      if (!response.ok) throw new Error('Download failed');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Template_${templateData?.nama || 'Tahapan'}.pdf`;
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download error:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-gray-600">
        <RefreshCw className="h-4 w-4 animate-spin" />
        Memuat template...
      </div>
    );
  }

  if (!templateData || !templateData.templateTahapan) {
    return (
      <div className="text-sm text-gray-500 text-center py-2">
        Tidak ada template tersedia untuk tahapan ini
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between bg-white p-3 rounded border">
        <div className="flex items-center gap-3">
          <FileText className="h-5 w-5 text-blue-600" />
          <div>
            <p className="text-sm font-medium text-gray-900">
              Template {templateData.nama}
            </p>
            <p className="text-xs text-gray-500">
              Template untuk tahapan laporan
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleTemplateDownload(templateData.templateTahapan)}
            className="flex items-center gap-1 text-green-600 border-green-300 hover:bg-green-50"
          >
            <Download className="h-3 w-3" />
            Download Template
          </Button>
        </div>
      </div>
      
      {templateData.jenisFileIzin && templateData.jenisFileIzin.length > 0 && (
        <div className="p-3 bg-gray-50 rounded border">
          <div className="flex items-center gap-1 mb-2">
            <File className="h-3 w-3 text-gray-600" />
            <span className="font-medium text-gray-800 text-xs">Jenis File yang Diizinkan:</span>
          </div>
          <div className="flex flex-wrap gap-1">
            {templateData.jenisFileIzin.map((type: string, index: number) => (
              <Badge key={index} variant="secondary" className="text-xs">
                {type.toUpperCase()}
              </Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function BuatLaporanSayaPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewFile, setPreviewFile] = useState<string | null>(null);

  // Options data
  const [pemilihanOptions, setPemilihanOptions] = useState<PemilihanOption[]>([]);
  const [laporanOptions, setLaporanOptions] = useState<LaporanOption[]>([]);
  const [jenisLaporanOptions, setJenisLaporanOptions] = useState<JenisLaporanOption[]>([]);
  const [tahapanLaporanOptions, setTahapanLaporanOptions] = useState<TahapanLaporanOption[]>([]);

  // Form data
  const [submissionData, setSubmissionData] = useState<SubmissionData>({
    judul: "",
    konten: "",
    lokasi: user?.biografi?.alamat || "",
    tanggalLaporan: new Date().toISOString().split('T')[0],
    uploadedFiles: []
  });

  // Auto-populate location from user data
  useEffect(() => {
    const loadLocationData = async () => {
      try {
        const response = await fetch(getApiUrl('auth/me/location'), {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
          }
        });
        
        if (response.ok) {
          const locationData = await response.json();
          const locationParts = [];
          
          if (locationData.kelurahan) locationParts.push(locationData.kelurahan);
          if (locationData.kecamatan) locationParts.push(locationData.kecamatan);
          if (locationData.kota) locationParts.push(locationData.kota);
          if (locationData.provinsi) locationParts.push(locationData.provinsi);
          
          const autoLocation = locationParts.length > 0 ? locationParts.join(', ') : locationData.alamat || "";
          
          setSubmissionData(prev => ({
            ...prev,
            lokasi: autoLocation
          }));
        }
      } catch (error) {
        console.error('Error loading location data:', error);
        // Fallback to biografi data if API fails
        if (user?.biografi) {
          const locationParts = [];
          if (user.biografi.kelurahanNama) locationParts.push(user.biografi.kelurahanNama);
          if (user.biografi.kecamatanNama) locationParts.push(user.biografi.kecamatanNama);
          if (user.biografi.kotaNama) locationParts.push(user.biografi.kotaNama);
          if (user.biografi.provinsiNama) locationParts.push(user.biografi.provinsiNama);
          
          const autoLocation = locationParts.length > 0 ? locationParts.join(', ') : user.biografi.alamat || "";
          
          setSubmissionData(prev => ({
            ...prev,
            lokasi: autoLocation
          }));
        }
      }
    };
    
    if (user) {
      loadLocationData();
    }
  }, [user]);

  const steps = [
    { id: 1, title: "Pilih Pemilihan", description: "Pilih pemilihan, laporan, jenis, dan tahapan" },
    { id: 2, title: "Isi Laporan", description: "Masukkan detail laporan" },
    { id: 3, title: "Preview", description: "Review sebelum submit" }
  ];

  // Helper functions for file handling
  const getFileIcon = (fileName: string) => {
    const extension = fileName.split('.').pop()?.toLowerCase();
    switch (extension) {
      case 'pdf':
        return <FileText className="h-5 w-5 text-red-600" />;
      case 'doc':
      case 'docx':
        return <FileText className="h-5 w-5 text-blue-600" />;
      case 'xlsx':
      case 'xls':
      case 'csv':
        return <File className="h-5 w-5 text-green-600" />;
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
        return <ImageIcon className="h-5 w-5 text-purple-600" />;
      case 'mp4':
      case 'avi':
      case 'mov':
        return <File className="h-5 w-5 text-orange-600" />;
      default:
        return <File className="h-5 w-5 text-gray-600" />;
    }
  };

  const getDisplayName = (fileName: string) => {
    // Extract original name from temp file format: YYYYMMDD_HHMMSS_UUID_originalName.ext
    const parts = fileName.split('_');
    if (parts.length >= 3) {
      return parts.slice(2).join('_'); // Join back the original name parts
    }
    return fileName; // Fallback to server filename
  };

  const handleFilePreview = (fileName: string) => {
    setPreviewFile(fileName);
    setIsPreviewOpen(true);
  };

  const handleFileDownload = (fileName: string) => {
    const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8080';
    const downloadUrl = `${API_BASE_URL}/api/temp-files/download/${fileName}`;
    
    fetch(downloadUrl)
      .then(response => {
        if (!response.ok) throw new Error('Download failed');
        return response.blob();
      })
      .then(blob => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = getDisplayName(fileName);
        link.style.display = 'none';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        
        toast({
          title: "Download berhasil",
          description: `File ${getDisplayName(fileName)} berhasil didownload`,
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
  };

  useEffect(() => {
    loadPemilihanOptions();
  }, []);

  useEffect(() => {
    if (submissionData.pemilihanId) {
      loadLaporanOptions(submissionData.pemilihanId);
      // Reset dependent fields when pemilihan changes
      setSubmissionData(prev => ({
        ...prev,
        laporanId: undefined,
        jenisLaporanId: undefined,
        tahapanLaporanId: undefined
      }));
      // Clear dependent options
      setJenisLaporanOptions([]);
      setTahapanLaporanOptions([]);
    } else {
      setLaporanOptions([]);
      setJenisLaporanOptions([]);
      setTahapanLaporanOptions([]);
    }
  }, [submissionData.pemilihanId]);

  useEffect(() => {
    if (submissionData.laporanId) {
      loadJenisLaporanOptions(submissionData.laporanId);
      // Reset dependent fields when laporan changes
      setSubmissionData(prev => ({
        ...prev,
        jenisLaporanId: undefined,
        tahapanLaporanId: undefined
      }));
      // Clear dependent options
      setTahapanLaporanOptions([]);
    } else {
      setJenisLaporanOptions([]);
      setTahapanLaporanOptions([]);
    }
  }, [submissionData.laporanId]);

  useEffect(() => {
    if (submissionData.jenisLaporanId) {
      loadTahapanLaporanOptions(submissionData.jenisLaporanId);
      // Reset dependent fields when jenis laporan changes
      setSubmissionData(prev => ({
        ...prev,
        tahapanLaporanId: undefined
      }));
    } else {
      setTahapanLaporanOptions([]);
    }
  }, [submissionData.jenisLaporanId]);

  const loadPemilihanOptions = async () => {
    try {
      const response = await fetch(getApiUrl('laporan/dropdown/pemilihan'), {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        // Transform data to match expected format
        const transformedData = data.map((item: any) => ({
          pemilihanId: item.pemilihanId,
          judulPemilihan: item.namaPemilihan,
          status: 'AKTIF'
        }));
        setPemilihanOptions(transformedData);
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
      // Get jenis laporan based on selected pemilihan instead of laporan
      if (submissionData.pemilihanId) {
        const response = await fetch(getApiUrl(`laporan/dropdown/jenis-laporan/${submissionData.pemilihanId}`), {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
          }
        });
        if (response.ok) {
          const data = await response.json();
          setJenisLaporanOptions(data);
        }
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

  const handleNext = () => {
    if (currentStep === 1) {
      if (!submissionData.pemilihanId || !submissionData.laporanId || !submissionData.jenisLaporanId || !submissionData.tahapanLaporanId) {
        toast({
          title: "Error",
          description: "Mohon lengkapi semua pilihan",
          variant: "destructive",
        });
        return;
      }
    }
    
    if (currentStep === 2) {
      if (!submissionData.judul.trim() || !submissionData.konten.trim()) {
        toast({
          title: "Error",
          description: "Mohon isi judul dan deskripsi laporan",
          variant: "destructive",
        });
        return;
      }
    }

    setCurrentStep(prev => Math.min(prev + 1, steps.length));
  };

  const handlePrevious = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const submitData = {
        judul: submissionData.judul,
        konten: submissionData.konten,
        lokasi: submissionData.lokasi,
        tanggalLaporan: submissionData.tanggalLaporan,
        tempFiles: submissionData.uploadedFiles,
        tahapanLaporanId: submissionData.tahapanLaporanId,
        jenisLaporanId: submissionData.jenisLaporanId,
        laporanId: submissionData.laporanId,
        pemilihanId: submissionData.pemilihanId,
        userId: user?.id
      };

      const response = await fetch(getApiUrl('detail-laporan'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: JSON.stringify(submitData),
      });

      if (!response.ok) {
        throw new Error('Gagal menyimpan laporan');
      }

      toast({
        title: "Berhasil",
        description: "Laporan berhasil dibuat!",
      });
      router.push('/laporan-saya');
      
    } catch (error: any) {
      console.error("Error creating laporan:", error);
      toast({
        title: "Error",
        description: error.message || "Gagal membuat laporan",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="max-w-2xl mx-auto">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Pilih Pemilihan</h2>
              <p className="text-gray-600">Lengkapi informasi di bawah untuk menentukan pemilihan dan laporan Anda</p>
            </div>
            
            <div className="space-y-6">
              {/* Pemilihan */}
              <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                      <span className="text-blue-600 font-bold text-sm">1</span>
                    </div>
                    <div>
                      <Label className="text-base font-semibold text-gray-900">Pemilihan</Label>
                      <p className="text-sm text-gray-500">Pilih pemilihan yang terkait</p>
                    </div>
                  </div>
                  {submissionData.pemilihanId && (
                    <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                      <Check className="w-4 h-4 text-green-600" />
                    </div>
                  )}
                </div>
                <Select 
                  value={submissionData.pemilihanId?.toString() || ""} 
                  onValueChange={(value) => {
                    const pemilihanId = value ? parseInt(value) : undefined;
                    setSubmissionData({
                      ...submissionData, 
                      pemilihanId,
                      laporanId: undefined,
                      jenisLaporanId: undefined,
                      tahapanLaporanId: undefined
                    });
                  }}
                >
                  <SelectTrigger className="h-12 border-gray-300 focus:border-blue-500">
                    <SelectValue placeholder="Pilih pemilihan yang terkait..." />
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

              {/* Laporan */}
              <div className={`bg-white p-6 rounded-xl border border-gray-200 shadow-sm transition-all ${
                !submissionData.pemilihanId ? 'opacity-50' : 'hover:shadow-md'
              }`}>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                      <span className="text-blue-600 font-bold text-sm">2</span>
                    </div>
                    <div>
                      <Label className="text-base font-semibold text-gray-900">Laporan</Label>
                      <p className="text-sm text-gray-500">Pilih jenis laporan</p>
                    </div>
                  </div>
                  {submissionData.laporanId && (
                    <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                      <Check className="w-4 h-4 text-green-600" />
                    </div>
                  )}
                </div>
                <Select 
                  value={submissionData.laporanId?.toString() || ""} 
                  onValueChange={(value) => {
                    const laporanId = value ? parseInt(value) : undefined;
                    setSubmissionData({
                      ...submissionData, 
                      laporanId,
                      jenisLaporanId: undefined,
                      tahapanLaporanId: undefined
                    });
                  }}
                  disabled={!submissionData.pemilihanId}
                >
                  <SelectTrigger className="h-12 border-gray-300 focus:border-blue-500">
                    <SelectValue placeholder="Pilih laporan..." />
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

              {/* Jenis Laporan */}
              <div className={`bg-white p-6 rounded-xl border border-gray-200 shadow-sm transition-all ${
                !submissionData.laporanId ? 'opacity-50' : 'hover:shadow-md'
              }`}>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                      <span className="text-blue-600 font-bold text-sm">3</span>
                    </div>
                    <div>
                      <Label className="text-base font-semibold text-gray-900">Jenis Laporan</Label>
                      <p className="text-sm text-gray-500">Tentukan kategori laporan</p>
                    </div>
                  </div>
                  {submissionData.jenisLaporanId && (
                    <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                      <Check className="w-4 h-4 text-green-600" />
                    </div>
                  )}
                </div>
                <Select 
                  value={submissionData.jenisLaporanId?.toString() || ""} 
                  onValueChange={(value) => {
                    const jenisLaporanId = value ? parseInt(value) : undefined;
                    setSubmissionData({
                      ...submissionData, 
                      jenisLaporanId,
                      tahapanLaporanId: undefined
                    });
                  }}
                  disabled={!submissionData.laporanId}
                >
                  <SelectTrigger className="h-12 border-gray-300 focus:border-blue-500">
                    <SelectValue placeholder="Pilih jenis laporan..." />
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

              {/* Tahapan Laporan */}
              <div className={`bg-white p-6 rounded-xl border border-gray-200 shadow-sm transition-all ${
                !submissionData.jenisLaporanId ? 'opacity-50' : 'hover:shadow-md'
              }`}>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                      <span className="text-blue-600 font-bold text-sm">4</span>
                    </div>
                    <div>
                      <Label className="text-base font-semibold text-gray-900">Tahapan Laporan</Label>
                      <p className="text-sm text-gray-500">Pilih tahapan proses</p>
                    </div>
                  </div>
                  {submissionData.tahapanLaporanId && (
                    <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                      <Check className="w-4 h-4 text-green-600" />
                    </div>
                  )}
                </div>
                <Select 
                  value={submissionData.tahapanLaporanId?.toString() || ""} 
                  onValueChange={(value) => {
                    const tahapanLaporanId = value ? parseInt(value) : undefined;
                    setSubmissionData({
                      ...submissionData, 
                      tahapanLaporanId
                    });
                  }}
                  disabled={!submissionData.jenisLaporanId}
                >
                  <SelectTrigger className="h-12 border-gray-300 focus:border-blue-500">
                    <SelectValue placeholder="Pilih tahapan laporan..." />
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

              {/* Template Lampiran Display */}
              {submissionData.tahapanLaporanId && (
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-xl border border-blue-200">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                      <FileText className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <Label className="text-base font-semibold text-blue-900">Template Lampiran Tersedia</Label>
                      <p className="text-sm text-blue-700">Unduh template untuk membantu menyusun laporan</p>
                    </div>
                  </div>
                  <TemplateDisplay tahapanLaporanId={submissionData.tahapanLaporanId} />
                </div>
              )}
            </div>
          </div>
        );

      case 2:
        return (
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Isi Detail Laporan</h2>
              <p className="text-gray-600">Berikan informasi lengkap mengenai laporan yang akan disampaikan</p>
            </div>
            
            <div className="space-y-8">
              {/* Metadata Section */}
              <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <User className="w-5 h-5 text-blue-600" />
                  Informasi Laporan
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                    <User className="w-8 h-8 text-gray-600 bg-white rounded-lg p-1.5" />
                    <div className="flex-1">
                      <p className="text-sm text-gray-600 font-medium">Dibuat oleh</p>
                      <p className="font-semibold text-gray-900">{user?.fullName || user?.username || 'User'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                    <Calendar className="w-8 h-8 text-gray-600 bg-white rounded-lg p-1.5" />
                    <div className="flex-1">
                      <p className="text-sm text-gray-600 font-medium">Tanggal Laporan</p>
                      <p className="font-semibold text-gray-900">{submissionData.tanggalLaporan}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                    <MapPin className="w-8 h-8 text-gray-600 bg-white rounded-lg p-1.5" />
                    <div className="flex-1">
                      <p className="text-sm text-gray-600 font-medium">Lokasi</p>
                      <p className="font-semibold text-gray-900">{submissionData.lokasi || 'Belum diatur'}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Form Fields */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Left Column */}
                <div className="space-y-6">
                  <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                    <Label htmlFor="judul" className="text-base font-semibold text-gray-900 flex items-center gap-2 mb-3">
                      <FileText className="w-5 h-5 text-blue-600" />
                      Judul Laporan *
                    </Label>
                    <Input
                      id="judul"
                      value={submissionData.judul}
                      onChange={(e) => setSubmissionData({...submissionData, judul: e.target.value})}
                      placeholder="Masukkan judul laporan yang descriptif..."
                      className="h-12 border-gray-300 focus:border-blue-500"
                    />
                  </div>

                  <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                    <Label htmlFor="konten" className="text-base font-semibold text-gray-900 flex items-center gap-2 mb-3">
                      <File className="w-5 h-5 text-blue-600" />
                      Deskripsi Laporan *
                    </Label>
                    <Textarea
                      id="konten"
                      value={submissionData.konten}
                      onChange={(e) => setSubmissionData({...submissionData, konten: e.target.value})}
                      placeholder="Jelaskan detail laporan secara menyeluruh...&#10;&#10;Sertakan:&#10;- Kronologi kejadian&#10;- Bukti yang ditemukan&#10;- Dampak yang terjadi&#10;- Rekomendasi tindak lanjut"
                      rows={15}
                      className="resize-none border-gray-300 focus:border-blue-500"
                    />
                    <div className="flex justify-end items-center mt-2">
                      <p className="text-sm text-gray-400">
                        {submissionData.konten.length} karakter
                      </p>
                    </div>
                  </div>
                </div>

                {/* Right Column - File Upload */}
                <div className="space-y-6">
                  <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                      <Label className="text-base font-semibold text-gray-900 flex items-center gap-2">
                        <Upload className="w-5 h-5 text-blue-600" />
                        Lampiran Dokumen
                      </Label>
                      <Badge variant="outline" className="text-sm font-medium">
                        {submissionData.uploadedFiles.length}/10 file
                      </Badge>
                    </div>
                    
                    <FileUploadComponent
                      onFileSelect={(fileName) => {
                        setSubmissionData({
                          ...submissionData, 
                          uploadedFiles: [...submissionData.uploadedFiles, fileName]
                        });
                      }}
                      onFileRemove={() => {}}
                      accept="*"
                      multiple={true}
                      maxFiles={10}
                      currentFiles={submissionData.uploadedFiles}
                    />

                    {submissionData.uploadedFiles.length > 0 && (
                      <div className="mt-6">
                        <Label className="text-sm font-semibold text-gray-700 mb-3 block">
                          File Terupload ({submissionData.uploadedFiles.length}):
                        </Label>
                        <div className="space-y-2 max-h-60 overflow-y-auto">
                          {submissionData.uploadedFiles.map((file, index) => (
                            <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border hover:bg-gray-100 transition-colors">
                              <div className="flex items-center space-x-3 flex-1 min-w-0">
                                {getFileIcon(file)}
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium truncate text-gray-900">
                                    {getDisplayName(file)}
                                  </p>
                                  <p className="text-xs text-gray-500">
                                    File terupload berhasil
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center space-x-1 ml-3">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleFilePreview(file)}
                                  className="h-8 w-8 p-0 hover:bg-blue-50 hover:border-blue-300"
                                  title="Preview file"
                                >
                                  <Eye className="h-3 w-3 text-blue-600" />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleFileDownload(file)}
                                  className="h-8 w-8 p-0 hover:bg-green-50 hover:border-green-300"
                                  title="Download file"
                                >
                                  <Download className="h-3 w-3 text-green-600" />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={async () => {
                                    try {
                                      await fetch(getApiUrl(`temp-files/${file}`), {
                                        method: 'DELETE',
                                      });
                                      
                                      setSubmissionData({
                                        ...submissionData,
                                        uploadedFiles: submissionData.uploadedFiles.filter((_, i) => i !== index)
                                      });
                                      
                                      toast({
                                        title: "Berhasil",
                                        description: "File berhasil dihapus",
                                      });
                                    } catch (error) {
                                      toast({
                                        title: "Error",
                                        description: "Gagal menghapus file",
                                        variant: "destructive",
                                      });
                                    }
                                  }}
                                  className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50 hover:border-red-300"
                                  title="Hapus file"
                                >
                                  <X className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 3:
        const selectedPemilihan = pemilihanOptions.find(p => p.pemilihanId === submissionData.pemilihanId);
        const selectedLaporan = laporanOptions.find(l => l.laporanId === submissionData.laporanId);
        const selectedJenis = jenisLaporanOptions.find(j => j.jenisLaporanId === submissionData.jenisLaporanId);
        const selectedTahapan = tahapanLaporanOptions.find(t => t.tahapanLaporanId === submissionData.tahapanLaporanId);

        return (
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Preview Laporan</h2>
              <p className="text-gray-600">Periksa kembali informasi laporan sebelum disubmit</p>
            </div>
            
            <div className="space-y-6">
              {/* Konteks Laporan */}
              <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-blue-600" />
                  Informasi Pemilihan
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <Label className="text-sm font-medium text-gray-600">Pemilihan</Label>
                    <p className="text-gray-900 font-semibold mt-1">{selectedPemilihan?.judulPemilihan}</p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <Label className="text-sm font-medium text-gray-600">Laporan</Label>
                    <p className="text-gray-900 font-semibold mt-1">{selectedLaporan?.namaLaporan}</p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <Label className="text-sm font-medium text-gray-600">Jenis Laporan</Label>
                    <p className="text-gray-900 font-semibold mt-1">{selectedJenis?.nama}</p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <Label className="text-sm font-medium text-gray-600">Tahapan</Label>
                    <p className="text-gray-900 font-semibold mt-1">{selectedTahapan?.nama}</p>
                  </div>
                </div>
              </div>

              {/* Detail Laporan */}
              <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <File className="w-5 h-5 text-blue-600" />
                  Detail Laporan
                </h3>
                <div className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Judul Laporan</Label>
                    <p className="text-gray-900 font-semibold mt-1 p-3 bg-gray-50 rounded-lg">
                      {submissionData.judul}
                    </p>
                  </div>

                  <div>
                    <Label className="text-sm font-medium text-gray-600">Deskripsi Laporan</Label>
                    <div className="text-gray-900 mt-1 p-4 bg-gray-50 rounded-lg max-h-40 overflow-y-auto">
                      <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed">
                        {submissionData.konten}
                      </pre>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <Label className="text-sm font-medium text-gray-600">Tanggal Laporan</Label>
                      <p className="text-gray-900 font-semibold mt-1">
                        {new Date(submissionData.tanggalLaporan).toLocaleDateString('id-ID', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </p>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <Label className="text-sm font-medium text-gray-600">Lokasi</Label>
                      <p className="text-gray-900 font-semibold mt-1">{submissionData.lokasi}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Lampiran */}
              {submissionData.uploadedFiles.length > 0 && (
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Upload className="w-5 h-5 text-blue-600" />
                    Lampiran Dokumen ({submissionData.uploadedFiles.length} file)
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {submissionData.uploadedFiles.map((file, index) => (
                      <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border">
                        {getFileIcon(file)}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate text-gray-900">
                            {getDisplayName(file)}
                          </p>
                          <p className="text-xs text-gray-500">
                            File lampiran
                          </p>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleFilePreview(file)}
                          className="h-8 w-8 p-0 hover:bg-blue-50"
                          title="Preview file"
                        >
                          <Eye className="h-3 w-3 text-blue-600" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Summary Info */}
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-6 rounded-xl border border-green-200">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
                    <Check className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-green-900">Siap untuk Disubmit</h3>
                    <p className="text-sm text-green-700">Laporan telah lengkap dan siap dikirim untuk diproses</p>
                  </div>
                </div>
                <div className="text-sm text-green-800">
                  <p>• Semua informasi wajib telah diisi</p>
                  <p>• Total {submissionData.uploadedFiles.length} file lampiran</p>
                  <p>• Laporan akan masuk ke sistem untuk ditinjau oleh tim terkait</p>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <div className="w-full max-w-7xl mx-auto px-6 py-12">
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-8 py-8">
            <div className="text-center">
              <h1 className="text-3xl font-bold text-white mb-2">Buat Laporan Baru</h1>
              <p className="text-blue-100">Laporkan temuan atau kejadian dengan mudah dan terstruktur</p>
            </div>
          </div>

          <div className="p-8">
            {/* Enhanced Stepper */}
            <div className="mb-12">
              <div className="flex items-center justify-between relative">
                {/* Progress Line */}
                <div className="absolute top-6 left-6 right-6 h-0.5 bg-gray-200">
                  <div 
                    className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 transition-all duration-500 ease-out"
                    style={{ width: `${((currentStep - 1) / (steps.length - 1)) * 100}%` }}
                  />
                </div>
                
                {steps.map((step, index) => (
                  <div key={step.id} className="relative flex flex-col items-center z-10">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center text-sm font-semibold transition-all duration-300 border-4 ${
                      currentStep > step.id 
                        ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white border-green-500 shadow-lg' 
                        : currentStep === step.id
                        ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white border-blue-500 shadow-lg'
                        : 'bg-white text-gray-400 border-gray-200'
                    }`}>
                      {currentStep > step.id ? (
                        <Check className="w-6 h-6" />
                      ) : (
                        <span className="text-base">{step.id}</span>
                      )}
                    </div>
                    <div className="mt-4 text-center min-w-0 max-w-32">
                      <p className={`text-sm font-semibold transition-colors duration-300 ${
                        currentStep >= step.id ? 'text-gray-900' : 'text-gray-400'
                      }`}>
                        {step.title}
                      </p>
                      <p className={`text-xs mt-1 transition-colors duration-300 ${
                        currentStep >= step.id ? 'text-gray-600' : 'text-gray-400'
                      }`}>
                        {step.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Enhanced Content Area */}
            <div className="bg-gray-50 rounded-xl p-8 min-h-[500px]">
              {renderStepContent()}
            </div>

            {/* Enhanced Navigation */}
            <div className="flex justify-between items-center mt-8 pt-6 border-t border-gray-200">
              <Button
                variant="outline"
                onClick={handlePrevious}
                disabled={currentStep === 1}
                className="px-6 py-3 text-gray-600 border-gray-300 hover:bg-gray-50"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Sebelumnya
              </Button>

              <div className="flex items-center space-x-3">
                <div className="text-sm text-gray-500">
                  Langkah {currentStep} dari {steps.length}
                </div>
                {currentStep < steps.length ? (
                  <Button 
                    onClick={handleNext}
                    className="px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold rounded-lg shadow-lg transition-all duration-200"
                  >
                    Selanjutnya
                    <ChevronRight className="w-4 h-4 ml-2" />
                  </Button>
                ) : (
                  <Button 
                    onClick={handleSubmit} 
                    disabled={submitting}
                    className="px-8 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold rounded-lg shadow-lg transition-all duration-200 disabled:opacity-50"
                  >
                    {submitting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Menyimpan...
                      </>
                    ) : (
                      <>
                        Submit Laporan
                        <Check className="w-4 h-4 ml-2" />
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* File Preview Modal */}
        <FilePreviewModal
          file={previewFile}
          isOpen={isPreviewOpen}
          onClose={() => setIsPreviewOpen(false)}
        />
      </div>
    </div>
  );
}
