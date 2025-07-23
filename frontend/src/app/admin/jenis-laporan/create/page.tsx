"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { toast } from '@/hooks/use-toast';
import { 
  ArrowLeft,
  ArrowRight,
  Plus,
  ArrowUp,
  ArrowDown,
  Upload,
  File,
  X,
  Check,
  ImageIcon,
  Download,
  RefreshCw,
  FileText,
  Save,
  Eye,
  Edit3,
  Grid3X3,
  LayoutGrid,
  Monitor,
  Smartphone,
  Tablet,
  Maximize2,
  ExternalLink,
  Video,
  Archive
} from 'lucide-react';
import { jenisLaporanAPI, JenisLaporanRequest } from '@/lib/api';

// Environment variables
const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8080';
const TEMP_FILE_UPLOAD_ENDPOINT = process.env.NEXT_PUBLIC_TEMP_FILE_UPLOAD_ENDPOINT || '/api/temp-files/upload';
const TEMP_FILE_PREVIEW_ENDPOINT = process.env.NEXT_PUBLIC_TEMP_FILE_PREVIEW_ENDPOINT || '/api/temp-files/preview';
const TEMP_FILE_DOWNLOAD_ENDPOINT = process.env.NEXT_PUBLIC_TEMP_FILE_DOWNLOAD_ENDPOINT || '/api/temp-files/download';
const TEMP_FILE_DELETE_ENDPOINT = process.env.NEXT_PUBLIC_TEMP_FILE_DELETE_ENDPOINT || '/api/temp-files';
const TEMP_FILE_BULK_DELETE_ENDPOINT = process.env.NEXT_PUBLIC_TEMP_FILE_BULK_DELETE_ENDPOINT || '/api/temp-files/bulk';
const TEMP_FILE_CLEANUP_ENDPOINT = process.env.NEXT_PUBLIC_TEMP_FILE_CLEANUP_ENDPOINT || '/api/temp-files/cleanup';

// Interfaces
interface TahapanFormData {
  id?: number;
  nama: string;
  deskripsi: string;
  templateFile?: File;
  templateFileName?: string;
  jenisFileIzin: string[];
  urutanTahapan: number;
  layoutPosition?: number; // For manual position input
}

interface JenisLaporanFormData {
  nama: string;
  deskripsi: string;
  status: 'AKTIF' | 'TIDAK_AKTIF' | 'DRAFT';
  tahapanList: TahapanFormData[];
  layout: 1 | 2 | 3 | 4 | 5;
}

// File type options with better grouping
const FILE_TYPE_OPTIONS = {
  'PDF': [
    { value: 'pdf', label: 'PDF' }
  ],
  'Word': [
    { value: 'doc', label: 'DOC' },
    { value: 'docx', label: 'DOCX' }
  ],
  'Excel': [
    { value: 'xlsx', label: 'XLSX' },
    { value: 'xls', label: 'XLS' },
    { value: 'csv', label: 'CSV' }
  ],
  'Image': [
    { value: 'jpg', label: 'JPG' },
    { value: 'jpeg', label: 'JPEG' },
    { value: 'png', label: 'PNG' },
    { value: 'gif', label: 'GIF' }
  ],
  'Video': [
    { value: 'mp4', label: 'MP4' },
    { value: 'avi', label: 'AVI' },
    { value: 'mov', label: 'MOV' }
  ],
  'Other': [
    { value: 'txt', label: 'TXT' },
    { value: 'zip', label: 'ZIP' },
    { value: 'rar', label: 'RAR' }
  ]
};

// Status color mapping
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

// Layout options
const LAYOUT_OPTIONS = [
  { value: 1, label: '1 per baris', icon: Monitor },
  { value: 2, label: '2 per baris', icon: Tablet },
  { value: 3, label: '3 per baris', icon: LayoutGrid },
  { value: 4, label: '4 per baris', icon: Grid3X3 },
  { value: 5, label: '5 per baris', icon: Smartphone },
];

// Stepper Component
function StepperComponent({ currentStep, totalSteps }: { currentStep: number; totalSteps: number }) {
  const steps = [
    { title: 'Informasi Dasar', description: 'Nama, deskripsi, dan status' },
    { title: 'Tahapan Laporan', description: 'Atur tahapan dan template' },
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

// File Preview Modal Component
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
      // For server files, use the server preview URL directly
      setBlobUrl(`${API_BASE_URL}${TEMP_FILE_PREVIEW_ENDPOINT}/${file}`);
      setIsLoading(false);
      setError(null);
    } else if (file && typeof file !== 'string') {
      try {
        setIsLoading(true);
        setError(null);
        // Create blob URL for File objects
        const url = URL.createObjectURL(file);
        setBlobUrl(url);
        setIsLoading(false);
        
        // Cleanup function
        return () => {
          URL.revokeObjectURL(url);
          setBlobUrl(null);
        };
      } catch (err) {
        setError('Gagal membuat preview file');
        setIsLoading(false);
        console.error('Error creating blob URL:', err);
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

  const fileName = typeof file === 'string' ? 
    file.split('_').slice(2).join('_') || file : // Extract original name from server filename
    file.name;
  const fileExtension = fileName.split('.').pop()?.toLowerCase();

  const renderPreview = () => {
    if (error) {
      return (
        <div className="flex flex-col items-center justify-center h-full text-white">
          <X className="h-24 w-24 mb-4 text-red-500" />
          <p className="text-lg font-medium text-red-500">Error</p>
          <p className="text-sm text-red-400">{error}</p>
          <button 
            onClick={() => {
              setError(null);
              if (file && typeof file === 'string') {
                setBlobUrl(`${API_BASE_URL}${TEMP_FILE_PREVIEW_ENDPOINT}/${file}`);
              } else if (file && typeof file !== 'string') {
                try {
                  const url = URL.createObjectURL(file);
                  setBlobUrl(url);
                } catch (err) {
                  setError('Gagal membuat preview file');
                }
              }
            }}
            className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-2 transition-colors"
          >
            <RefreshCw className="h-4 w-4" />
            Coba Lagi
          </button>
        </div>
      );
    }

    if (isLoading || !blobUrl) {
      return (
        <div className="flex flex-col items-center justify-center h-full text-white">
          <RefreshCw className="h-24 w-24 mb-4 animate-spin text-blue-500" />
          <p className="text-lg font-medium">Memuat preview...</p>
          <p className="text-sm opacity-80">File: {fileName}</p>
          {typeof file !== 'string' && (
            <p className="text-xs opacity-60">Ukuran: {(file.size / 1024).toFixed(1)} KB</p>
          )}
        </div>
      );
    }
    
    switch (fileExtension) {
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
        return (
          <div className="flex items-center justify-center h-full p-4">
            <img 
              src={blobUrl} 
              alt="Preview" 
              className="max-w-full max-h-full object-contain"
              onError={(e) => {
                console.error('Image load error:', e);
                setError('Gagal memuat gambar. Pastikan file adalah gambar yang valid.');
              }}
              onLoad={() => {
                console.log('Image loaded successfully:', fileName);
              }}
            />
          </div>
        );
      case 'mp4':
      case 'avi':
      case 'mov':
        return (
          <div className="flex items-center justify-center h-full p-4">
            <video 
              controls 
              className="max-w-full max-h-full"
              onError={(e) => {
                console.error('Video load error:', e);
                setError('Gagal memuat video');
              }}
            >
              <source src={blobUrl} type={`video/${fileExtension}`} />
              Browser Anda tidak mendukung video player.
            </video>
          </div>
        );
      default:
        return (
          <div className="flex flex-col items-center justify-center h-full text-white">
            <File className="h-24 w-24 mb-4 text-gray-400" />
            <p className="text-lg font-medium">File siap untuk didownload</p>
            <p className="text-sm opacity-80">File: {fileName}</p>
            {typeof file !== 'string' && (
              <>
                <p className="text-xs opacity-60">Ukuran: {(file.size / 1024).toFixed(1)} KB</p>
                <p className="text-xs opacity-60 mt-2">Tipe: {fileExtension?.toUpperCase()}</p>
                <p className="text-xs opacity-60">MIME: {file.type || 'Tidak diketahui'}</p>
              </>
            )}
            <button 
              onClick={downloadFile}
              className="mt-4 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-2 transition-colors"
            >
              <Download className="h-5 w-5" />
              Download File
            </button>
          </div>
        );
    }
  };

  const downloadFile = () => {
    if (typeof file === 'string') {
      // Force download for server files using fetch and blob
      fetch(`${API_BASE_URL}${TEMP_FILE_DOWNLOAD_ENDPOINT}/${file}`)
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
            <h2 className="text-lg font-semibold">{fileName}</h2>
            <p className="text-sm opacity-80">
              {fileExtension?.toUpperCase()} • 
              {typeof file === 'string' ? ' Server file' : ` ${(file.size / 1024).toFixed(1)} KB`}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={downloadFile}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-2 transition-colors"
          >
            <Download className="h-4 w-4" />
            Download
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg flex items-center gap-2 transition-colors"
          >
            <X className="h-4 w-4" />
            Close
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="w-full h-full pt-20 pb-4">
        {renderPreview()}
      </div>
    </div>
  );
}

// File Upload Component
function FileUploadComponent({ 
  onFileSelect, 
  currentFile, 
  onFileRemove,
  accept = "*" 
}: { 
  onFileSelect: (file: File | string) => void;
  currentFile?: File | string;
  onFileRemove: () => void;
  accept?: string;
}) {
  const [isDragging, setIsDragging] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputId = `file-upload-${Math.random().toString(36).substr(2, 9)}`;

  const uploadToServer = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${API_BASE_URL}${TEMP_FILE_UPLOAD_ENDPOINT}`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Gagal mengupload file');
    }

    const result = await response.json();
    return result.data.fileName; // Return the unique filename from server
  };

  const deleteFromServer = async (fileName: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}${TEMP_FILE_DELETE_ENDPOINT}/${fileName}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        console.log('File deleted from server:', fileName);
      } else {
        console.error('Failed to delete file from server:', fileName);
      }
    } catch (error) {
      console.error('Error deleting file from server:', error);
    }
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      await handleFileUpload(file);
    }
  };

  const handleFileUpload = async (file: File) => {
    try {
      setIsUploading(true);
      const serverFileName = await uploadToServer(file);
      onFileSelect(serverFileName); // Pass server filename instead of File object
      toast({
        title: "Upload berhasil",
        description: `File ${file.name} berhasil diupload`,
      });
    } catch (error: any) {
      console.error('Upload error:', error);
      toast({
        title: "Upload gagal",
        description: error.message || "Gagal mengupload file",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileRemove = async () => {
    // Delete from server if it's a server file
    if (typeof currentFile === 'string') {
      await deleteFromServer(currentFile);
    }
    onFileRemove();
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
    if (files.length > 0) {
      await handleFileUpload(files[0]);
    }
  };

  const getFileIcon = (fileName: string) => {
    const extension = fileName.split('.').pop()?.toLowerCase();
    switch (extension) {
      case 'pdf':
        return <File className="h-6 w-6 text-red-600" />;
      case 'doc':
      case 'docx':
        return <File className="h-6 w-6 text-blue-600" />;
      case 'xlsx':
      case 'xls':
      case 'csv':
        return <File className="h-6 w-6 text-green-600" />;
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
        return <ImageIcon className="h-6 w-6 text-purple-600" />;
      case 'mp4':
      case 'avi':
      case 'mov':
        return <File className="h-6 w-6 text-orange-600" />;
      case 'zip':
      case 'rar':
        return <File className="h-6 w-6 text-yellow-600" />;
      default:
        return <File className="h-6 w-6 text-gray-600" />;
    }
  };

  const canPreview = (fileName: string) => {
    const extension = fileName.split('.').pop()?.toLowerCase();
    return ['jpg', 'jpeg', 'png', 'gif', 'mp4', 'avi', 'mov'].includes(extension || '');
  };

  const handlePreview = () => {
    setIsPreviewOpen(true);
  };

  const handleDownload = () => {
    if (typeof currentFile === 'string') {
      // For server files, force download using fetch and blob
      fetch(`${API_BASE_URL}${TEMP_FILE_DOWNLOAD_ENDPOINT}/${currentFile}`)
        .then(response => {
          if (!response.ok) throw new Error('Download failed');
          return response.blob();
        })
        .then(blob => {
          const url = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = getDisplayName(currentFile);
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
    }
  };

  const getDisplayName = (file: File | string) => {
    if (typeof file === 'string') {
      // Extract original name from server filename format: YYYYMMDD_HHMMSS_UUID_originalName.ext
      const parts = file.split('_');
      if (parts.length >= 3) {
        return parts.slice(2).join('_'); // Join back the original name parts
      }
      return file; // Fallback to server filename
    }
    return file.name;
  };

  const getFileSize = (file: File | string) => {
    if (typeof file === 'string') {
      return 'File di server'; // We don't have size info for server files immediately
    }
    return `${(file.size / 1024).toFixed(1)} KB`;
  };

  return (
    <>
      <div className="space-y-2">
        {!currentFile ? (
          <div 
            className={`
              border-2 border-dashed rounded-lg p-4 text-center transition-all cursor-pointer
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
              onChange={handleFileChange}
              className="hidden"
              id={fileInputId}
              disabled={isUploading}
            />
            {isUploading ? (
              <RefreshCw className="h-6 w-6 mx-auto mb-2 animate-spin text-blue-500" />
            ) : (
              <Upload className={`h-6 w-6 mx-auto mb-2 ${isDragging ? 'text-blue-500' : 'text-gray-400'}`} />
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
              Semua format file didukung • Maksimal 50MB
            </p>
          </div>
        ) : (
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border">
            <div className="flex items-center space-x-3">
              {getFileIcon(getDisplayName(currentFile))}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  {getDisplayName(currentFile)}
                </p>
                <div className="flex items-center gap-2">
                  <p className="text-xs text-gray-500">
                    {getFileSize(currentFile)}
                  </p>
                  <span className="text-xs text-green-600 bg-green-100 px-2 py-0.5 rounded-full">
                    {typeof currentFile === 'string' ? 'Tersimpan di server' : 'Dalam memori'}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-1">
              {canPreview(getDisplayName(currentFile)) ? (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handlePreview}
                  title="Preview file"
                  className="h-8 w-8 p-0"
                >
                  <Eye className="h-3 w-3" />
                </Button>
              ) : null}
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleDownload}
                title="Download file"
                className="h-8 w-8 p-0"
              >
                <Download className="h-3 w-3" />
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleFileRemove}
                className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                title="Hapus file"
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Preview Modal */}
      <FilePreviewModal
        file={currentFile || null}
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
      />
    </>
  );
}

// Helper functions for file handling in preview
const getDisplayName = (fileName: string) => {
  if (typeof fileName === 'string') {
    // Check if it's a temp file or permanent file
    const isTempFile = /^\d{8}_\d{6}_/.test(fileName);
    
    if (isTempFile) {
      // Extract original name from temp file format: YYYYMMDD_HHMMSS_UUID_originalName.ext
      const parts = fileName.split('_');
      if (parts.length >= 3) {
        return parts.slice(2).join('_'); // Join back the original name parts
      }
    } else {
      // For permanent files, remove the documents/ prefix and extract original name
      const cleanFileName = fileName.replace('documents/', '');
      const parts = cleanFileName.split('_');
      if (parts.length >= 3) {
        return parts.slice(2).join('_'); // Join back the original name parts
      }
      return cleanFileName; // Fallback to filename without prefix
    }
    return fileName; // Fallback to server filename
  }
  return fileName;
};

const canPreviewFile = (fileName: string) => {
  const extension = fileName.split('.').pop()?.toLowerCase();
  return ['jpg', 'jpeg', 'png', 'gif', 'mp4', 'avi', 'mov'].includes(extension || '');
};

const handleFileDownload = (fileName: string) => {
  if (!fileName) return;
  
  // Check if it's a temp file or permanent file
  const isTempFile = /^\d{8}_\d{6}_/.test(fileName);
  
  let downloadUrl;
  if (isTempFile) {
    // Use temp file download endpoint
    downloadUrl = `${API_BASE_URL}${TEMP_FILE_DOWNLOAD_ENDPOINT}/${fileName}`;
  } else {
    // Use permanent file download endpoint - assume documents subdirectory
    const cleanFileName = fileName.replace('documents/', ''); // Remove prefix if exists
    downloadUrl = `${API_BASE_URL}/api/files/download/documents/${cleanFileName}`;
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

const handleFilePreview = (fileName: string) => {
  if (!fileName) return;
  
  // Check if it's a temp file or permanent file
  const isTempFile = /^\d{8}_\d{6}_/.test(fileName);
  
  let previewUrl;
  if (isTempFile) {
    // Use temp file preview endpoint
    previewUrl = `${API_BASE_URL}${TEMP_FILE_PREVIEW_ENDPOINT}/${fileName}`;
  } else {
    // Use permanent file preview endpoint - assume documents subdirectory
    const cleanFileName = fileName.replace('documents/', ''); // Remove prefix if exists
    previewUrl = `${API_BASE_URL}/api/files/preview/documents/${cleanFileName}`;
  }
  
  // Open preview in new tab
  window.open(previewUrl, '_blank');
};

const getFileIconPreview = (fileName: string) => {
  const extension = fileName.split('.').pop()?.toLowerCase();
  switch (extension) {
    case 'pdf':
      return <FileText className="h-4 w-4 text-red-600" />;
    case 'doc':
    case 'docx':
      return <FileText className="h-4 w-4 text-blue-600" />;
    case 'xlsx':
    case 'xls':
    case 'csv':
      return <File className="h-4 w-4 text-green-600" />;
    case 'jpg':
    case 'jpeg':
    case 'png':
    case 'gif':
      return <ImageIcon className="h-4 w-4 text-purple-600" />;
    case 'mp4':
    case 'avi':
    case 'mov':
      return <Video className="h-4 w-4 text-orange-600" />;
    case 'zip':
    case 'rar':
      return <Archive className="h-4 w-4 text-yellow-600" />;
    default:
      return <File className="h-4 w-4 text-gray-600" />;
  }
};

export default function CreateJenisLaporanPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [previewFile, setPreviewFile] = useState<string | null>(null);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  
  const [formData, setFormData] = useState<JenisLaporanFormData>({
    nama: '',
    deskripsi: '',
    status: 'AKTIF',
    tahapanList: [],
    layout: 1
  });

  // Handle modal preview for preview step
  const handleModalPreview = (fileName: string) => {
    if (!fileName) return;
    setPreviewFile(fileName);
    setIsPreviewModalOpen(true);
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

  const handleCancel = async () => {
    // Cleanup temporary files before leaving
    const tempFileNames = getTempFileNames();
    if (tempFileNames.length > 0) {
      await cleanupTempFiles(tempFileNames);
      console.log('Cleaned up temporary files on cancel:', tempFileNames);
    }
    
    router.push('/admin/jenis-laporan');
  };

  // Tahapan functions
  const addTahapan = () => {
    const newTahapan: TahapanFormData = {
      nama: '',
      deskripsi: '',
      jenisFileIzin: [],
      urutanTahapan: formData.tahapanList.length + 1,
      layoutPosition: formData.tahapanList.length + 1
    };
    setFormData({
      ...formData,
      tahapanList: [...formData.tahapanList, newTahapan]
    });
  };

  // Cleanup function for temporary files
  const cleanupTempFiles = async (fileNames: string[]) => {
    if (!fileNames || fileNames.length === 0) return;
    
    try {
      const response = await fetch(`${API_BASE_URL}${TEMP_FILE_BULK_DELETE_ENDPOINT}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ fileNames }),
      });

      if (response.ok) {
        const result = await response.json();
        console.log('Temp files cleanup result:', result);
      } else {
        console.error('Failed to cleanup temp files:', response.statusText);
      }
    } catch (error) {
      console.error('Error cleaning up temp files:', error);
    }
  };

  // Get all temp filenames from tahapan list
  const getTempFileNames = (): string[] => {
    const tempFiles: string[] = [];
    formData.tahapanList.forEach(tahapan => {
      if (tahapan.templateFileName && typeof tahapan.templateFileName === 'string') {
        tempFiles.push(tahapan.templateFileName);
      }
    });
    return tempFiles;
  };

  const removeTahapan = (index: number) => {
    const tahapanToRemove = formData.tahapanList[index];
    
    // Cleanup temp file if exists
    if (tahapanToRemove.templateFileName && typeof tahapanToRemove.templateFileName === 'string') {
      cleanupTempFiles([tahapanToRemove.templateFileName]);
    }
    
    const newTahapanList = formData.tahapanList.filter((_, i) => i !== index);
    // Reorder urutan
    const reorderedList = newTahapanList.map((tahapan, i) => ({
      ...tahapan,
      urutanTahapan: i + 1,
      layoutPosition: i + 1
    }));
    setFormData({
      ...formData,
      tahapanList: reorderedList
    });
  };

  const updateTahapan = (index: number, field: keyof TahapanFormData, value: any) => {
    const newTahapanList = [...formData.tahapanList];
    newTahapanList[index] = {
      ...newTahapanList[index],
      [field]: value
    };
    setFormData({
      ...formData,
      tahapanList: newTahapanList
    });
  };

  const moveTahapan = (index: number, direction: 'up' | 'down') => {
    const newTahapanList = [...formData.tahapanList];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    
    if (targetIndex >= 0 && targetIndex < newTahapanList.length) {
      // Swap elements
      [newTahapanList[index], newTahapanList[targetIndex]] = 
      [newTahapanList[targetIndex], newTahapanList[index]];
      
      // Update urutan
      newTahapanList[index].urutanTahapan = index + 1;
      newTahapanList[targetIndex].urutanTahapan = targetIndex + 1;
      newTahapanList[index].layoutPosition = index + 1;
      newTahapanList[targetIndex].layoutPosition = targetIndex + 1;
      
      setFormData({
        ...formData,
        tahapanList: newTahapanList
      });
    }
  };

  const moveToPosition = (index: number, newPosition: number) => {
    if (newPosition < 1 || newPosition > formData.tahapanList.length) {
      return;
    }

    const newTahapanList = [...formData.tahapanList];
    const tahapan = newTahapanList[index];
    
    // Remove from current position
    newTahapanList.splice(index, 1);
    
    // Insert at new position (convert to 0-based index)
    newTahapanList.splice(newPosition - 1, 0, tahapan);
    
    // Update all positions
    const reorderedList = newTahapanList.map((t, i) => ({
      ...t,
      urutanTahapan: i + 1,
      layoutPosition: i + 1
    }));

    setFormData({
      ...formData,
      tahapanList: reorderedList
    });
  };

  const addFileType = (tahapanIndex: number, fileType: string) => {
    const currentTypes = formData.tahapanList[tahapanIndex].jenisFileIzin;
    if (!currentTypes.includes(fileType)) {
      updateTahapan(tahapanIndex, 'jenisFileIzin', [...currentTypes, fileType]);
    }
  };

  const removeFileType = (tahapanIndex: number, fileType: string) => {
    const currentTypes = formData.tahapanList[tahapanIndex].jenisFileIzin;
    updateTahapan(tahapanIndex, 'jenisFileIzin', currentTypes.filter(type => type !== fileType));
  };

  // File type management functions
  const toggleFileType = (tahapanIndex: number, fileType: string) => {
    const currentTypes = formData.tahapanList[tahapanIndex].jenisFileIzin;
    if (currentTypes.includes(fileType)) {
      removeFileType(tahapanIndex, fileType);
    } else {
      addFileType(tahapanIndex, fileType);
    }
  };

  const toggleFileTypeGroup = (tahapanIndex: number, category: string) => {
    const groupTypes = FILE_TYPE_OPTIONS[category as keyof typeof FILE_TYPE_OPTIONS].map(opt => opt.value);
    const currentTypes = formData.tahapanList[tahapanIndex].jenisFileIzin;
    
    // Check if all types in this group are already selected
    const allSelected = groupTypes.every(type => currentTypes.includes(type));
    
    if (allSelected) {
      // Remove all types from this group
      const newTypes = currentTypes.filter(type => !groupTypes.includes(type));
      updateTahapan(tahapanIndex, 'jenisFileIzin', newTypes);
    } else {
      // Add all types from this group
      const newTypes = [...new Set([...currentTypes, ...groupTypes])];
      updateTahapan(tahapanIndex, 'jenisFileIzin', newTypes);
    }
  };

  const isGroupSelected = (tahapanIndex: number, category: string) => {
    const groupTypes = FILE_TYPE_OPTIONS[category as keyof typeof FILE_TYPE_OPTIONS].map(opt => opt.value);
    const currentTypes = formData.tahapanList[tahapanIndex].jenisFileIzin;
    return groupTypes.every(type => currentTypes.includes(type));
  };

  const isGroupPartiallySelected = (tahapanIndex: number, category: string) => {
    const groupTypes = FILE_TYPE_OPTIONS[category as keyof typeof FILE_TYPE_OPTIONS].map(opt => opt.value);
    const currentTypes = formData.tahapanList[tahapanIndex].jenisFileIzin;
    return groupTypes.some(type => currentTypes.includes(type)) && !groupTypes.every(type => currentTypes.includes(type));
  };

  const selectAllFileTypes = (tahapanIndex: number) => {
    const allTypes = Object.values(FILE_TYPE_OPTIONS).flat().map(opt => opt.value);
    updateTahapan(tahapanIndex, 'jenisFileIzin', allTypes);
  };

  const clearAllFileTypes = (tahapanIndex: number) => {
    updateTahapan(tahapanIndex, 'jenisFileIzin', []);
  };

  // Demo function to add sample tahapan for testing
  const addSampleTahapan = () => {
    const sampleTahapan: TahapanFormData[] = [
      {
        nama: 'Pengajuan Proposal',
        deskripsi: 'Tahap awal pengajuan proposal penelitian dengan dokumen lengkap',
        jenisFileIzin: ['pdf', 'docx'],
        urutanTahapan: 1,
        layoutPosition: 1
      },
      {
        nama: 'Review Akademik',
        deskripsi: 'Proses review akademik oleh tim reviewer yang berpengalaman',
        jenisFileIzin: ['pdf', 'doc'],
        urutanTahapan: 2,
        layoutPosition: 2
      },
      {
        nama: 'Perbaikan Dokumen',
        deskripsi: 'Tahap perbaikan dokumen berdasarkan masukan dari reviewer',
        jenisFileIzin: ['pdf', 'docx', 'txt'],
        urutanTahapan: 3,
        layoutPosition: 3
      },
      {
        nama: 'Approval Final',
        deskripsi: 'Persetujuan final dari pihak yang berwenang',
        jenisFileIzin: ['pdf'],
        urutanTahapan: 4,
        layoutPosition: 4
      },
      {
        nama: 'Publikasi',
        deskripsi: 'Tahap publikasi hasil penelitian',
        jenisFileIzin: ['pdf', 'jpg', 'png'],
        urutanTahapan: 5,
        layoutPosition: 5
      }
    ];
    
    setFormData({
      ...formData,
      tahapanList: sampleTahapan
    });
  };

  // Validation functions
  const validateStep1 = () => {
    return formData.nama.trim() !== '' && formData.deskripsi.trim() !== '';
  };

  const validateStep2 = () => {
    return formData.tahapanList.length > 0 && 
           formData.tahapanList.every(tahapan => 
             tahapan.nama.trim() !== '' && tahapan.deskripsi.trim() !== ''
           );
  };

  // Submit function
  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);
      
      const requestData: JenisLaporanRequest = {
        nama: formData.nama,
        deskripsi: formData.deskripsi,
        status: formData.status,
        tahapanList: formData.tahapanList.map(tahapan => ({
          nama: tahapan.nama,
          deskripsi: tahapan.deskripsi,
          templateTahapan: tahapan.templateFileName || '',
          urutanTahapan: tahapan.urutanTahapan,
          jenisFileIzin: tahapan.jenisFileIzin,
          status: 'AKTIF'
        }))
      };

      console.log('Sending data to backend:', requestData);
      console.log('Tahapan count:', requestData.tahapanList?.length);
      console.log('Individual tahapan:', requestData.tahapanList);

      await jenisLaporanAPI.create(requestData);
      
      // Cleanup temporary files after successful submission
      const tempFileNames = getTempFileNames();
      if (tempFileNames.length > 0) {
        await cleanupTempFiles(tempFileNames);
        console.log('Cleaned up temporary files after submission:', tempFileNames);
      }
      
      toast({
        title: "Sukses",
        description: "Jenis laporan berhasil dibuat",
      });
      
      router.push('/admin/jenis-laporan');
    } catch (error: any) {
      console.error('Error creating jenis laporan:', error);
      toast({
        title: "Error",
        description: error.message || "Gagal membuat jenis laporan",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
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
                <Edit3 className="h-5 w-5" />
                Informasi Dasar Jenis Laporan
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="nama">Nama Jenis Laporan *</Label>
                <Input
                  id="nama"
                  value={formData.nama}
                  onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                  placeholder="Masukkan nama jenis laporan"
                  className="h-12"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="deskripsi">Deskripsi *</Label>
                <Textarea
                  id="deskripsi"
                  value={formData.deskripsi}
                  onChange={(e) => setFormData({ ...formData, deskripsi: e.target.value })}
                  placeholder="Masukkan deskripsi jenis laporan"
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
                <div className="flex justify-between items-center">
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Tahapan Laporan
                  </CardTitle>
                  <div className="flex gap-2">
                    <Button 
                      type="button"
                      variant="outline" 
                      onClick={addSampleTahapan} 
                      className="flex items-center gap-2"
                    >
                      <RefreshCw className="h-4 w-4" />
                      Contoh Data
                    </Button>
                    <Button onClick={addTahapan} className="flex items-center gap-2">
                      <Plus className="h-4 w-4" />
                      Tambah Tahapan
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {/* Layout Selection */}
                <div className="mb-6">
                  <Label className="text-base font-medium">Layout Tampilan Tahapan</Label>
                  <p className="text-sm text-gray-600 mb-3">Pilih berapa tahapan yang ditampilkan per baris dalam preview</p>
                  <div className="grid grid-cols-5 gap-3">
                    {LAYOUT_OPTIONS.map((option) => {
                      const IconComponent = option.icon;
                      return (
                        <button
                          key={option.value}
                          onClick={() => setFormData({ ...formData, layout: option.value as any })}
                          className={`
                            p-3 rounded-lg border-2 text-center transition-all
                            ${formData.layout === option.value 
                              ? 'border-blue-500 bg-blue-50' 
                              : 'border-gray-200 hover:border-gray-300'
                            }
                          `}
                        >
                          <IconComponent className={`h-6 w-6 mx-auto mb-2 ${
                            formData.layout === option.value ? 'text-blue-600' : 'text-gray-400'
                          }`} />
                          <div className={`text-xs font-medium ${
                            formData.layout === option.value ? 'text-blue-600' : 'text-gray-600'
                          }`}>
                            {option.label}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <Separator className="my-6" />

                {formData.tahapanList.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <FileText className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                    <p className="text-lg">Belum ada tahapan</p>
                    <p className="text-sm">Klik "Tambah Tahapan" untuk memulai membuat tahapan laporan</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* Layout-based Tahapan Forms */}
                    {(() => {
                      const columnsPerRow = formData.layout;
                      const totalItems = formData.tahapanList.length;
                      const rows = [];
                      let currentIndex = 0;

                      // Create rows until all items are placed
                      while (currentIndex < totalItems) {
                        const rowItems = [];
                        
                        // Fill this row with up to columnsPerRow items
                        for (let col = 0; col < columnsPerRow; col++) {
                          if (currentIndex < totalItems) {
                            rowItems.push({ item: formData.tahapanList[currentIndex], index: currentIndex });
                            currentIndex++;
                          } else {
                            rowItems.push(null); // Empty slot
                          }
                        }

                        rows.push(rowItems);
                      }

                      return rows.map((rowItems, rowIndex) => (
                        <div key={rowIndex} className="w-full">
                          {/* Flexbox Row */}
                          <div className="flex gap-4 w-full mb-6">
                            {rowItems.map((itemData, colIndex) => {
                              const flexBasis = `${100 / columnsPerRow}%`;
                              
                              if (itemData === null) {
                                // Empty slot
                                return (
                                  <div
                                    key={`empty-${rowIndex}-${colIndex}`}
                                    className="border-2 border-dashed border-gray-300 bg-gray-50 rounded-lg p-6 flex flex-col items-center justify-center"
                                    style={{ 
                                      flexBasis: flexBasis,
                                      minWidth: 0,
                                      minHeight: '350px'
                                    }}
                                  >
                                    <div className="w-12 h-12 bg-gray-400 text-white rounded-full flex items-center justify-center font-bold text-lg mb-3">
                                      +
                                    </div>
                                    <p className="text-gray-500 font-medium text-sm">Slot Kosong</p>
                                  </div>
                                );
                              }

                              const { item: tahapan, index } = itemData;

                              // Filled slot with form
                              return (
                                <Card
                                  key={`filled-${rowIndex}-${colIndex}`}
                                  className="border-l-4 border-l-blue-500"
                                  style={{ 
                                    flexBasis: flexBasis,
                                    minWidth: 0
                                  }}
                                >
                                  <CardHeader className="pb-3">
                                    <div className="flex justify-between items-start">
                                      <div className="flex items-center space-x-2">
                                        <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-sm">
                                          {tahapan.urutanTahapan}
                                        </div>
                                        <h4 className="font-semibold text-base">
                                          {tahapan.nama || `Tahapan ${tahapan.urutanTahapan}`}
                                        </h4>
                                      </div>
                                      <div className="flex items-center space-x-1">
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={() => moveTahapan(index, 'up')}
                                          disabled={index === 0}
                                          title="Pindah ke atas"
                                        >
                                          <ArrowUp className="h-3 w-3" />
                                        </Button>
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={() => moveTahapan(index, 'down')}
                                          disabled={index === formData.tahapanList.length - 1}
                                          title="Pindah ke bawah"
                                        >
                                          <ArrowDown className="h-3 w-3" />
                                        </Button>
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={() => removeTahapan(index)}
                                          className="text-red-600 hover:text-red-700"
                                          title="Hapus tahapan"
                                        >
                                          <X className="h-3 w-3" />
                                        </Button>
                                      </div>
                                    </div>
                                  </CardHeader>
                                  <CardContent className="space-y-3">
                                    <div className="space-y-2">
                                      <Label className="text-sm">Nama Tahapan *</Label>
                                      <Input
                                        value={tahapan.nama}
                                        onChange={(e) => updateTahapan(index, 'nama', e.target.value)}
                                        placeholder="Masukkan nama tahapan"
                                        className="h-9 text-sm"
                                      />
                                    </div>
                                    
                                    <div className="space-y-2">
                                      <Label className="text-sm">Urutan</Label>
                                      <Input
                                        type="number"
                                        min="1"
                                        max={formData.tahapanList.length}
                                        value={tahapan.urutanTahapan}
                                        onChange={(e) => {
                                          const newPos = parseInt(e.target.value);
                                          if (newPos >= 1 && newPos <= formData.tahapanList.length) {
                                            moveToPosition(index, newPos);
                                          }
                                        }}
                                        className="h-9 text-sm"
                                      />
                                    </div>
                                    
                                    <div className="space-y-2">
                                      <Label className="text-sm">Deskripsi Tahapan *</Label>
                                      <Textarea
                                        value={tahapan.deskripsi}
                                        onChange={(e) => updateTahapan(index, 'deskripsi', e.target.value)}
                                        placeholder="Masukkan deskripsi tahapan"
                                        rows={2}
                                        className="resize-none text-sm"
                                      />
                                    </div>

                                    <div className="space-y-2">
                                      <Label className="text-sm">Template Laporan</Label>
                                      <FileUploadComponent
                                        onFileSelect={(fileName) => {
                                          updateTahapan(index, 'templateFile', undefined);
                                          updateTahapan(index, 'templateFileName', fileName);
                                        }}
                                        currentFile={tahapan.templateFile || tahapan.templateFileName}
                                        onFileRemove={() => {
                                          updateTahapan(index, 'templateFile', undefined);
                                          updateTahapan(index, 'templateFileName', undefined);
                                        }}
                                      />
                                    </div>

                                    <div className="space-y-2">
                                      <div className="flex items-center justify-between">
                                        <Label className="text-sm">Tipe File yang Diizinkan</Label>
                                        <div className="flex gap-1">
                                          <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            onClick={() => selectAllFileTypes(index)}
                                            className="text-xs px-2 py-1 h-6"
                                          >
                                            All
                                          </Button>
                                          <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            onClick={() => clearAllFileTypes(index)}
                                            className="text-xs px-2 py-1 h-6"
                                          >
                                            Clear
                                          </Button>
                                        </div>
                                      </div>
                                      
                                      {/* Selected file types */}
                                      {tahapan.jenisFileIzin.length > 0 && (
                                        <div className="flex flex-wrap gap-1 mb-2 p-2 bg-gray-50 rounded">
                                          {tahapan.jenisFileIzin.map((fileType) => (
                                            <Badge
                                              key={fileType}
                                              variant="secondary"
                                              className="flex items-center gap-1 py-0.5 px-2 text-xs"
                                            >
                                              {fileType.toUpperCase()}
                                              <button
                                                type="button"
                                                onClick={() => removeFileType(index, fileType)}
                                                className="ml-1 hover:bg-gray-300 rounded-full p-0.5"
                                              >
                                                <X className="h-2 w-2" />
                                              </button>
                                            </Badge>
                                          ))}
                                        </div>
                                      )}

                                      {/* Grouped File type checkboxes */}
                                      <div className="grid grid-cols-3 gap-2 text-xs">
                                        {Object.entries(FILE_TYPE_OPTIONS).map(([category, options]) => (
                                          <div key={category} className="space-y-1 border border-gray-200 rounded p-2">
                                            {/* Group checkbox */}
                                            <div className="flex items-center space-x-1 border-b border-gray-300 pb-1">
                                              <Checkbox
                                                id={`${index}-group-${category}`}
                                                checked={isGroupSelected(index, category)}
                                                onCheckedChange={() => toggleFileTypeGroup(index, category)}
                                                className={`h-3 w-3 ${isGroupPartiallySelected(index, category) ? 'bg-blue-200' : ''}`}
                                              />
                                              <Label 
                                                htmlFor={`${index}-group-${category}`}
                                                className="text-xs font-bold text-gray-800 cursor-pointer"
                                              >
                                                {category} {isGroupPartiallySelected(index, category) && '(Sebagian)'}
                                              </Label>
                                            </div>
                                            {/* Individual file type checkboxes */}
                                            <div className="space-y-1 ml-3">
                                              {options.map((option) => (
                                                <div key={option.value} className="flex items-center space-x-1">
                                                  <Checkbox
                                                    id={`${index}-${option.value}`}
                                                    checked={tahapan.jenisFileIzin.includes(option.value)}
                                                    onCheckedChange={() => toggleFileType(index, option.value)}
                                                    className="h-3 w-3"
                                                  />
                                                  <Label 
                                                    htmlFor={`${index}-${option.value}`}
                                                    className="text-xs cursor-pointer"
                                                  >
                                                    {option.label}
                                                  </Label>
                                                </div>
                                              ))}
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  </CardContent>
                                </Card>
                              );
                            })}
                          </div>
                        </div>
                      ));
                    })()}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="h-5 w-5" />
                  Preview & Konfirmasi
                </CardTitle>
                <p className="text-gray-600 text-sm mt-2">
                  Tinjau informasi jenis laporan sebelum menyimpan
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
                        <Badge className={`${getStatusColor(formData.status)}`}>
                          {getStatusDisplay(formData.status)}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card className="border-l-4 border-l-green-500">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-600">Total Tahapan</p>
                          <p className="font-semibold text-gray-900">{formData.tahapanList.length}</p>
                        </div>
                        <FileText className="h-8 w-8 text-green-500" />
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card className="border-l-4 border-l-purple-500">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-600">Layout Tampilan</p>
                          <p className="font-semibold text-gray-900">{formData.layout} kolom per baris</p>
                        </div>
                        <LayoutGrid className="h-8 w-8 text-purple-500" />
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Description */}
                <Card>
                  <CardContent className="p-4">
                    <p className="text-sm text-gray-600 mb-2">Deskripsi</p>
                    <p className="text-gray-900">{formData.deskripsi}</p>
                  </CardContent>
                </Card>

                {/* Tahapan Preview */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Tahapan Laporan</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {formData.tahapanList.length === 0 ? (
                      <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                        <FileText className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                        <p className="text-gray-500 font-medium">Belum ada tahapan</p>
                        <p className="text-gray-400 text-sm">Kembali ke langkah sebelumnya untuk menambah tahapan</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {formData.tahapanList.map((tahapan, index) => (
                          <Card key={index} className="border border-gray-200">
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
                                        {tahapan.jenisFileIzin && tahapan.jenisFileIzin.length > 0 && (
                                          <div className="flex items-center gap-1">
                                            <span>{tahapan.jenisFileIzin.length} tipe file</span>
                                          </div>
                                        )}
                                      </div>

                                      {/* Template File */}
                                      {tahapan.templateFileName && (
                                        <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                                          <Label className="text-sm font-medium text-blue-800 mb-2 block">
                                            Template Tersedia:
                                          </Label>
                                          <div className="flex items-center justify-between bg-white p-3 rounded border">
                                            <div className="flex items-center gap-3">
                                              {getFileIconPreview(getDisplayName(tahapan.templateFileName))}
                                              <div>
                                                <p className="text-sm font-medium text-gray-900">
                                                  {getDisplayName(tahapan.templateFileName)}
                                                </p>
                                                <p className="text-xs text-gray-500">Template tahapan laporan</p>
                                              </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                              {canPreviewFile(getDisplayName(tahapan.templateFileName)) && (
                                                <Button
                                                  type="button"
                                                  variant="outline"
                                                  size="sm"
                                                  onClick={() => tahapan.templateFileName && handleModalPreview(tahapan.templateFileName)}
                                                  className="flex items-center gap-1"
                                                >
                                                  <Eye className="h-3 w-3" />
                                                  Preview
                                                </Button>
                                              )}
                                              <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                onClick={() => tahapan.templateFileName && handleFileDownload(tahapan.templateFileName)}
                                                className="flex items-center gap-1"
                                              >
                                                <Download className="h-3 w-3" />
                                                Download
                                              </Button>
                                            </div>
                                          </div>
                                        </div>
                                      )}
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
                    )}
                  </CardContent>
                </Card>
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
      <div className="w-full max-w-[95vw] mx-auto py-8 px-6">
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
              <h1 className="text-3xl font-bold tracking-tight">Tambah Jenis Laporan</h1>
              <p className="text-muted-foreground">
                Buat jenis laporan baru dengan tahapan-tahapan yang diperlukan
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
                        Simpan Jenis Laporan
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Preview Modal */}
        <FilePreviewModal
          file={previewFile}
          isOpen={isPreviewModalOpen}
          onClose={() => {
            setIsPreviewModalOpen(false);
            setPreviewFile(null);
          }}
        />
      </div>
    </div>
  );
}
