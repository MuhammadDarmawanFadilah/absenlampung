'use client'

import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { showErrorToast, showSuccessToast } from "@/components/ui/toast-utils"
import { ArrowLeft, Plus, Trash2, Upload, FileText, User, FolderOpen, Eye, Download, File, X, ImageIcon, ChevronRight, Check } from 'lucide-react'
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/AuthContext"
import { getApiUrl } from "@/lib/config"
import { SearchableSelectObject } from "@/components/ui/searchable-select-object"

interface PegawaiOption {
  id: number
  fullName: string
}

interface KategoriOption {
  id: number
  nama: string
}

interface FileItem {
  id: string
  judul: string
  deskripsi: string
  tempFileName: string | null
  originalName: string | null
  fileSize: number | null
  fileType: string | null
}

// File Preview Modal Component
function FilePreviewModal({ 
  tempFileName, 
  originalName,
  isOpen, 
  onClose 
}: { 
  tempFileName: string | null;
  originalName: string | null;
  isOpen: boolean;
  onClose: () => void;
}) {
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (tempFileName) {
      setIsLoading(true);
      setError(null);
      const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8080';
      setBlobUrl(`${API_BASE_URL}/api/temp-files/preview/${tempFileName}`);
      setIsLoading(false);
    } else {
      setBlobUrl(null);
      setIsLoading(false);
      setError(null);
    }
  }, [tempFileName]);

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

  if (!tempFileName || !isOpen) return null;

  const fileExtension = originalName?.split('.').pop()?.toLowerCase() || '';

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
          <div className="animate-spin h-16 w-16 border-4 border-white border-t-transparent rounded-full mb-4" />
          <p className="text-lg">Memuat preview...</p>
        </div>
      );
    }
    
    if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(fileExtension)) {
      return (
        <div className="flex items-center justify-center h-full">
          <img 
            src={blobUrl} 
            alt={originalName || 'Preview'} 
            className="max-w-full max-h-full object-contain"
            style={{ maxHeight: 'calc(100vh - 120px)' }}
            onError={() => setError('Gagal memuat gambar')}
          />
        </div>
      );
    } else if (['mp4', 'webm', 'ogg', 'avi', 'mov'].includes(fileExtension)) {
      return (
        <div className="flex items-center justify-center h-full">
          <video 
            src={blobUrl} 
            controls 
            className="max-w-full max-h-full"
            style={{ maxHeight: 'calc(100vh - 120px)' }}
            onError={() => setError('Gagal memuat video')}
          >
            Browser Anda tidak mendukung tag video.
          </video>
        </div>
      );
    } else if (['pdf'].includes(fileExtension)) {
      return (
        <div className="h-full">
          <iframe 
            src={blobUrl} 
            className="w-full h-full border-0"
            title={originalName || 'PDF Preview'}
            onError={() => setError('Gagal memuat PDF')}
          />
        </div>
      );
    } else {
      return (
        <div className="flex items-center justify-center h-full">
          <div className="text-center text-white">
            <File className="h-16 w-16 mx-auto mb-4" />
            <p className="text-lg mb-2">Preview tidak tersedia</p>
            <p className="text-sm text-gray-300">File: {originalName}</p>
            <p className="text-xs text-gray-400 mt-2">Format file tidak didukung untuk preview</p>
          </div>
        </div>
      );
    }
  };

  const downloadFile = () => {
    if (!tempFileName) return;
    
    const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8080';
    const downloadUrl = `${API_BASE_URL}/api/temp-files/download/${tempFileName}`;
    
    fetch(downloadUrl)
      .then(response => {
        if (!response.ok) throw new Error('Download failed');
        return response.blob();
      })
      .then(blob => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = originalName || tempFileName;
        link.style.display = 'none';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        
        showSuccessToast(`File ${originalName} berhasil didownload`);
      })
      .catch(error => {
        console.error('Download error:', error);
        showErrorToast('Gagal mendownload file');
        setError('Gagal mendownload file');
      });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black">
      <div className="absolute top-0 left-0 right-0 z-10 bg-gradient-to-r from-black/90 to-black/80 backdrop-blur-sm text-white p-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="p-2 bg-white/10 rounded-lg">
            <Eye className="h-6 w-6" />
          </div>
          <div>
            <h3 className="font-semibold text-lg">{originalName}</h3>
            <p className="text-sm text-gray-300">Preview File • {fileExtension?.toUpperCase()}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <Button 
            onClick={downloadFile} 
            variant="secondary" 
            size="sm"
            className="bg-white/10 hover:bg-white/20 text-white border-white/20"
          >
            <Download className="h-4 w-4 mr-2" />
            Download
          </Button>
          <Button 
            onClick={onClose} 
            variant="secondary" 
            size="sm"
            className="bg-white/10 hover:bg-white/20 text-white border-white/20"
          >
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

export default function BuatFilePegawaiPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [step, setStep] = useState(1)
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)
  const [previewFile, setPreviewFile] = useState<{tempFileName: string, originalName: string} | null>(null)
  
  // Step 1 data
  const [selectedPegawai, setSelectedPegawai] = useState<number | null>(null)
  const [selectedKategori, setSelectedKategori] = useState<number | null>(null)
  const [pegawaiOptions, setPegawaiOptions] = useState<PegawaiOption[]>([])
  const [kategoriOptions, setKategoriOptions] = useState<KategoriOption[]>([])
  
  // Step 2 data
  const [fileItems, setFileItems] = useState<FileItem[]>([
    { id: '1', judul: '', deskripsi: '', tempFileName: null, originalName: null, fileSize: null, fileType: null }
  ])

  useEffect(() => {
    setMounted(true)
    loadOptions()
    
    // If user is not admin, auto-select current user as pegawai
    if (user && user.role?.roleName === 'USER') {
      setSelectedPegawai(user.id)
    }
  }, [user])

  const loadOptions = async () => {
    try {
      // Load pegawai options
      const pegawaiResponse = await fetch(getApiUrl('pegawai/active'), {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      })
      
      if (pegawaiResponse.ok) {
        const pegawaiData = await pegawaiResponse.json()
        setPegawaiOptions(pegawaiData)
      }

      // Load kategori options
      const kategoriResponse = await fetch(getApiUrl('admin/master-data/file-kategori/active'), {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      })
      
      if (kategoriResponse.ok) {
        const kategoriData = await kategoriResponse.json()
        setKategoriOptions(kategoriData)
      }
    } catch (error) {
      console.error('Error loading options:', error)
      showErrorToast('Gagal memuat data')
    }
  }

  const handleStep1Next = () => {
    if (!selectedPegawai) {
      showErrorToast('Pegawai harus dipilih')
      return
    }
    
    if (!selectedKategori) {
      showErrorToast('Kategori file harus dipilih')
      return
    }
    
    setStep(2)
  }

  const addFileItem = () => {
    const newId = (Date.now() + Math.random()).toString()
    setFileItems([...fileItems, { 
      id: newId, 
      judul: '', 
      deskripsi: '', 
      tempFileName: null, 
      originalName: null, 
      fileSize: null, 
      fileType: null 
    }])
  }

  const removeFileItem = (id: string) => {
    if (fileItems.length === 1) {
      showErrorToast('Minimal harus ada satu file')
      return
    }
    setFileItems(fileItems.filter(item => item.id !== id))
  }

  const updateFileItem = (id: string, field: keyof FileItem, value: any) => {
    setFileItems(fileItems.map(item => 
      item.id === id ? { ...item, [field]: value } : item
    ))
  }

  const uploadFileToTemp = async (file: File): Promise<string> => {
    const formData = new FormData()
    formData.append('file', file)

    const response = await fetch(getApiUrl('temp-files/upload'), {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
      },
      body: formData
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.message || 'Gagal upload file')
    }

    const data = await response.json()
    return data.data.fileName
  }

  const handleFileSelect = async (fileItemId: string, file: File) => {
    try {
      // Show loading state for this specific file
      updateFileItem(fileItemId, 'tempFileName', 'loading')
      
      const tempFileName = await uploadFileToTemp(file)
      console.log('File uploaded successfully:', { tempFileName, originalName: file.name })
      
      // Update all file details together
      setFileItems(prevItems => 
        prevItems.map(item => 
          item.id === fileItemId 
            ? {
                ...item,
                tempFileName: tempFileName,
                originalName: file.name,
                fileSize: file.size,
                fileType: file.type
              }
            : item
        )
      )
      
      showSuccessToast(`File ${file.name} berhasil diupload`)
    } catch (error) {
      console.error('Upload error:', error)
      showErrorToast(error instanceof Error ? error.message : 'Gagal upload file')
      // Reset the file item on error
      setFileItems(prevItems => 
        prevItems.map(item => 
          item.id === fileItemId 
            ? {
                ...item,
                tempFileName: null,
                originalName: null,
                fileSize: null,
                fileType: null
              }
            : item
        )
      )
    }
  }

  const handleFilePreview = (tempFileName: string, originalName: string) => {
    setPreviewFile({ tempFileName, originalName })
    setIsPreviewOpen(true)
  }

  const handleFileDownload = (tempFileName: string, originalName: string) => {
    const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8080';
    const downloadUrl = `${API_BASE_URL}/api/temp-files/download/${tempFileName}`;
    
    fetch(downloadUrl)
      .then(response => {
        if (!response.ok) throw new Error('Download failed');
        return response.blob();
      })
      .then(blob => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = originalName;
        link.style.display = 'none';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        
        showSuccessToast(`File ${originalName} berhasil didownload`);
      })
      .catch(error => {
        console.error('Download error:', error);
        showErrorToast('Gagal mendownload file');
      });
  }

  const getFileIcon = (fileName: string) => {
    const extension = fileName?.split('.').pop()?.toLowerCase() || '';
    
    if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(extension)) {
      return <ImageIcon className="h-6 w-6 text-green-600" />;
    } else if (['mp4', 'webm', 'ogg', 'avi', 'mov'].includes(extension)) {
      return (
        <div className="relative">
          <FileText className="h-6 w-6 text-blue-600" />
          <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-blue-500 rounded-full flex items-center justify-center">
            <span className="text-[8px] text-white font-bold">▶</span>
          </div>
        </div>
      );
    } else if (['pdf'].includes(extension)) {
      return (
        <div className="relative">
          <FileText className="h-6 w-6 text-red-600" />
          <div className="absolute -top-1 -right-1 text-[8px] font-bold text-red-600">PDF</div>
        </div>
      );
    } else if (['doc', 'docx'].includes(extension)) {
      return (
        <div className="relative">
          <FileText className="h-6 w-6 text-blue-800" />
          <div className="absolute -top-1 -right-1 text-[8px] font-bold text-blue-800">W</div>
        </div>
      );
    } else if (['xls', 'xlsx'].includes(extension)) {
      return (
        <div className="relative">
          <FileText className="h-6 w-6 text-green-800" />
          <div className="absolute -top-1 -right-1 text-[8px] font-bold text-green-800">X</div>
        </div>
      );
    } else if (['ppt', 'pptx'].includes(extension)) {
      return (
        <div className="relative">
          <FileText className="h-6 w-6 text-orange-600" />
          <div className="absolute -top-1 -right-1 text-[8px] font-bold text-orange-600">P</div>
        </div>
      );
    } else if (['zip', 'rar', '7z'].includes(extension)) {
      return (
        <div className="relative">
          <FolderOpen className="h-6 w-6 text-purple-600" />
          <div className="absolute -top-1 -right-1 text-[8px] font-bold text-purple-600">Z</div>
        </div>
      );
    } else {
      return <File className="h-6 w-6 text-gray-600" />;
    }
  }

  const handleSubmit = async () => {
    // Validate files
    const invalidItems = fileItems.filter(item => !item.judul.trim() || !item.tempFileName || item.tempFileName === 'loading')
    if (invalidItems.length > 0) {
      showErrorToast('Semua file harus memiliki judul dan file yang dipilih. Pastikan upload file sudah selesai.')
      return
    }

    // Additional validation for file completeness
    const incompleteItems = fileItems.filter(item => 
      !item.tempFileName || 
      !item.originalName || 
      !item.fileSize || 
      item.tempFileName === 'loading'
    )
    
    if (incompleteItems.length > 0) {
      showErrorToast('Beberapa file belum selesai diupload. Mohon tunggu hingga semua file selesai diproses.')
      return
    }

    try {
      setLoading(true)
      console.log('Starting batch file submission process...')
      console.log('Total files to submit:', fileItems.length)
      
      // Prepare batch data
      const batchData = {
        pegawaiId: selectedPegawai,
        kategoriId: selectedKategori,
        files: fileItems.map(fileItem => ({
          judul: fileItem.judul.trim(),
          deskripsi: fileItem.deskripsi.trim(),
          fileName: fileItem.tempFileName,
          fileType: fileItem.fileType,
          fileSize: fileItem.fileSize,
          isActive: true
        }))
      }

      console.log('Sending batch request:', batchData)

      const response = await fetch(getApiUrl('admin/file-pegawai/batch'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: JSON.stringify(batchData)
      })

      console.log('Response status:', response.status)

      if (!response.ok) {
        const errorData = await response.json()
        console.error('Batch submission error:', errorData)
        throw new Error(errorData.message || 'Gagal menyimpan file pegawai')
      }

      const result = await response.json()
      console.log('Batch submission successful:', result)
      
      showSuccessToast(`Berhasil menambahkan ${fileItems.length} file pegawai`)
      router.push('/admin/file-pegawai')
    } catch (error) {
      console.error('Error creating file pegawai:', error)
      showErrorToast(error instanceof Error ? error.message : 'Gagal menambahkan file pegawai')
    } finally {
      setLoading(false)
    }
  }

  if (!mounted) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="flex flex-col items-center gap-2">
            <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" />
            <span className="text-muted-foreground">Memuat halaman...</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
        <div className="max-w-6xl mx-auto px-4 py-8">
          {/* Header Section */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-6 mb-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Button
                  variant="outline"
                  onClick={() => step === 1 ? router.push('/admin/file-pegawai') : setStep(1)}
                  className="h-12 px-4 shadow-md border-gray-200 hover:bg-gray-50 transition-all duration-200"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  {step === 1 ? 'Kembali' : 'Kembali ke Step 1'}
                </Button>
                <div>
                  <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                    Tambah File Pegawai
                  </h1>
                  <p className="text-gray-600 mt-1 font-medium">
                    Step {step} dari 2: {step === 1 ? 'Pilih Pegawai dan Kategori' : 'Upload File'}
                  </p>
                </div>
              </div>
              <div className="hidden md:flex items-center gap-3 text-sm text-gray-500">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span>Required Field</span>
                </div>
              </div>
            </div>
          </div>

          {/* Enhanced Progress Indicator */}
          <div className="mb-10">
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-8">
              <div className="flex items-center justify-center">
                <div className="flex items-center relative">
                  {/* Step 1 Circle */}
                  <div className={`relative flex items-center justify-center w-14 h-14 rounded-full transition-all duration-500 ${
                    step >= 1 
                      ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/30 scale-110' 
                      : 'bg-gray-200 text-gray-500'
                  }`}>
                    <User className="w-6 h-6" />
                    {step >= 1 && (
                      <div className="absolute -inset-2 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full opacity-20 animate-pulse"></div>
                    )}
                  </div>
                  
                  {/* Progress Line */}
                  <div className="relative mx-8">
                    <div className="h-1 w-32 bg-gray-200 rounded-full"></div>
                    <div className={`absolute top-0 left-0 h-1 rounded-full transition-all duration-700 ${
                      step >= 2 ? 'w-full bg-gradient-to-r from-blue-600 to-indigo-600' : 'w-0'
                    }`}></div>
                  </div>
                  
                  {/* Step 2 Circle */}
                  <div className={`relative flex items-center justify-center w-14 h-14 rounded-full transition-all duration-500 ${
                    step >= 2 
                      ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white shadow-lg shadow-green-500/30 scale-110' 
                      : 'bg-gray-200 text-gray-500'
                  }`}>
                    <Upload className="w-6 h-6" />
                    {step >= 2 && (
                      <div className="absolute -inset-2 bg-gradient-to-r from-green-600 to-emerald-600 rounded-full opacity-20 animate-pulse"></div>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Step Labels */}
              <div className="flex justify-center mt-6">
                <div className="flex items-center justify-between w-80">
                  <div className="text-center">
                    <div className={`text-sm font-semibold transition-colors duration-300 ${
                      step >= 1 ? 'text-blue-600' : 'text-gray-500'
                    }`}>
                      Pilih Target
                    </div>
                    <div className="text-xs text-gray-400 mt-1">Pegawai & Kategori</div>
                  </div>
                  <div className="text-center">
                    <div className={`text-sm font-semibold transition-colors duration-300 ${
                      step >= 2 ? 'text-green-600' : 'text-gray-500'
                    }`}>
                      Upload File
                    </div>
                    <div className="text-xs text-gray-400 mt-1">Dokumen & Detail</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

        {/* Step 1: Select Pegawai and Kategori */}
        {step === 1 && (
          <Card className="shadow-2xl border-0 bg-white/90 backdrop-blur-md rounded-2xl overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 text-white relative">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600/90 to-indigo-700/90"></div>
              <div className="relative z-10">
                <CardTitle className="flex items-center gap-4 text-2xl font-bold">
                  <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                    <User className="w-7 h-7" />
                  </div>
                  <div>
                    <div>Pilih Pegawai dan Kategori</div>
                    <div className="text-blue-100 text-sm font-normal mt-1">
                      Langkah 1 dari 2
                    </div>
                  </div>
                </CardTitle>
                <CardDescription className="text-blue-100 mt-4 text-base">
                  Tentukan pegawai target dan kategori file yang akan diupload
                </CardDescription>
              </div>
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-400 to-indigo-400"></div>
            </CardHeader>
            <CardContent className="p-10">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                <div className="space-y-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Label htmlFor="pegawai" className="text-lg font-semibold text-gray-800">
                      Pegawai Target
                    </Label>
                    <span className="text-red-500 text-sm">*</span>
                  </div>
                  <div className="relative">
                    <SearchableSelectObject
                      options={pegawaiOptions.map(pegawai => ({
                        id: pegawai.id,
                        label: pegawai.fullName
                      }))}
                      value={selectedPegawai}
                      placeholder="🔍 Cari dan pilih pegawai..."
                      searchPlaceholder="Ketik nama pegawai..."
                      emptyText="Tidak ada pegawai ditemukan"
                      onValueChange={setSelectedPegawai}
                      disabled={user?.role?.roleName === 'USER'}
                      className="h-14 text-base border-2 border-gray-200 focus:border-blue-500 rounded-xl"
                    />
                  </div>
                  {user?.role?.roleName === 'USER' && (
                    <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <User className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-blue-900">
                          Auto Selected
                        </p>
                        <p className="text-xs text-blue-700">
                          Otomatis dipilih karena Anda login sebagai user
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Label htmlFor="kategori" className="text-lg font-semibold text-gray-800">
                      Kategori File
                    </Label>
                    <span className="text-red-500 text-sm">*</span>
                  </div>
                  <div className="relative">
                    <SearchableSelectObject
                      options={kategoriOptions.map(kategori => ({
                        id: kategori.id,
                        label: kategori.nama
                      }))}
                      value={selectedKategori}
                      placeholder="📁 Cari dan pilih kategori..."
                      searchPlaceholder="Ketik nama kategori..."
                      emptyText="Tidak ada kategori ditemukan"
                      onValueChange={setSelectedKategori}
                      className="h-14 text-base border-2 border-gray-200 focus:border-blue-500 rounded-xl"
                    />
                  </div>
                  <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                    💡 <strong>Tips:</strong> Pilih kategori yang sesuai dengan jenis dokumen yang akan diupload
                  </div>
                </div>
              </div>

              <div className="flex justify-end mt-12">
                <Button 
                  onClick={handleStep1Next}
                  size="lg"
                  className="px-10 py-4 text-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-xl hover:shadow-2xl transition-all duration-300 rounded-xl"
                >
                  Lanjut ke Upload File
                  <ChevronRight className="w-6 h-6 ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Upload Files */}
        {step === 2 && (
          <Card className="shadow-2xl border-0 bg-white/90 backdrop-blur-md rounded-2xl overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-green-600 via-emerald-600 to-teal-700 text-white relative">
              <div className="absolute inset-0 bg-gradient-to-r from-green-600/90 to-teal-700/90"></div>
              <div className="relative z-10">
                <CardTitle className="flex items-center gap-4 text-2xl font-bold">
                  <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                    <Upload className="w-7 h-7" />
                  </div>
                  <div>
                    <div>Upload File Pegawai</div>
                    <div className="text-green-100 text-sm font-normal mt-1">
                      Langkah 2 dari 2
                    </div>
                  </div>
                </CardTitle>
                <CardDescription className="text-green-100 mt-4 text-base">
                  <div className="flex flex-col gap-1">
                    <span>📋 <strong>Pegawai:</strong> {pegawaiOptions.find(p => p.id === selectedPegawai)?.fullName}</span>
                    <span>📁 <strong>Kategori:</strong> {kategoriOptions.find(k => k.id === selectedKategori)?.nama}</span>
                  </div>
                </CardDescription>
              </div>
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-green-400 to-teal-400"></div>
            </CardHeader>
            <CardContent className="p-10">
              <div className="space-y-10">
                {/* File Upload Sections */}
                {fileItems.map((fileItem, index) => (
                  <div key={fileItem.id} className="bg-gradient-to-br from-gray-50 to-white border-2 border-gray-100 rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300">

                    <div className="flex items-center justify-between mb-8">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl shadow-lg">
                          <span className="text-lg font-bold">{index + 1}</span>
                        </div>
                        <div>
                          <h3 className="text-xl font-bold text-gray-800">
                            File {index + 1}
                          </h3>
                          <p className="text-sm text-gray-600">Upload dokumen dan isi detail</p>
                        </div>
                      </div>
                      {fileItems.length > 1 && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => removeFileItem(fileItem.id)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200 rounded-xl"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Hapus File
                        </Button>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                      <div className="space-y-4">
                        <div className="flex items-center gap-2">
                          <Label htmlFor={`judul-${fileItem.id}`} className="text-base font-semibold text-gray-700">
                            Judul File
                          </Label>
                          <span className="text-red-500 text-sm">*</span>
                        </div>
                        <Input
                          id={`judul-${fileItem.id}`}
                          value={fileItem.judul}
                          onChange={(e) => updateFileItem(fileItem.id, 'judul', e.target.value)}
                          placeholder="Masukkan judul file yang deskriptif..."
                          className="h-14 text-base border-2 border-gray-200 focus:border-green-500 rounded-xl"
                        />
                      </div>
                      
                      <div className="space-y-4">
                        <div className="flex items-center gap-2">
                          <Label htmlFor={`file-${fileItem.id}`} className="text-base font-semibold text-gray-700">
                            Upload File
                          </Label>
                          <span className="text-red-500 text-sm">*</span>
                        </div>
                        <div className="space-y-4">
                          <div className="relative">
                            <Input
                              id={`file-${fileItem.id}`}
                              type="file"
                              onChange={(e) => {
                                const file = e.target.files?.[0]
                                if (file) {
                                  handleFileSelect(fileItem.id, file)
                                }
                              }}
                              className="h-14 text-base border-2 border-dashed border-gray-300 focus:border-green-500 rounded-xl file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-green-50 file:text-green-700 hover:file:bg-green-100"
                            />
                          </div>
                          
                          {/* File Upload Status */}
                          {fileItem.tempFileName === 'loading' && (
                            <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 border-2 border-blue-200 rounded-xl p-6 shadow-inner">
                              <div className="flex items-center gap-4">
                                <div className="p-3 bg-white rounded-xl shadow-sm border border-blue-200">
                                  <div className="animate-spin h-6 w-6 border-2 border-blue-600 border-t-transparent rounded-full" />
                                </div>
                                <div className="flex-1">
                                  <p className="font-semibold text-gray-900 text-lg">
                                    Mengupload file...
                                  </p>
                                  <p className="text-sm text-blue-600">
                                    📤 Mohon tunggu, file sedang diproses
                                  </p>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {/* File Upload Result - Show after main grid */}
                    {fileItem.originalName && fileItem.tempFileName && fileItem.tempFileName !== 'loading' && (
                      <div className="mt-6 bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 border-2 border-green-200 rounded-xl p-6 shadow-inner">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4 flex-1 min-w-0">
                            <div className="relative p-3 bg-white rounded-xl shadow-sm border border-green-200">
                              {getFileIcon(fileItem.originalName)}
                              <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                                <Check className="w-2 h-2 text-white" />
                              </div>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-gray-900 text-lg truncate">
                                {fileItem.originalName}
                              </p>
                              <p className="text-sm text-gray-600">
                                📊 {fileItem.fileSize ? `${(fileItem.fileSize / 1024 / 1024).toFixed(2)} MB` : ''}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3 ml-4">
                            {/* Show preview button only for images and videos */}
                            {['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'mp4', 'webm', 'ogg', 'avi', 'mov'].includes(
                              fileItem.originalName.split('.').pop()?.toLowerCase() || ''
                            ) && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleFilePreview(fileItem.tempFileName!, fileItem.originalName!)}
                                className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 border-blue-200 rounded-lg h-10 px-4"
                              >
                                <Eye className="w-4 h-4 mr-2" />
                                Preview
                              </Button>
                            )}
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleFileDownload(fileItem.tempFileName!, fileItem.originalName!)}
                              className="text-green-600 hover:text-green-700 hover:bg-green-50 border-green-200 rounded-lg h-10 px-4"
                            >
                              <Download className="w-4 h-4 mr-2" />
                              Download
                            </Button>
                          </div>
                        </div>

                      </div>
                    )}
                    
                    <div className="mt-8 space-y-4">
                      <Label htmlFor={`deskripsi-${fileItem.id}`} className="text-base font-semibold text-gray-700">
                        Deskripsi File
                      </Label>
                      <Textarea
                        id={`deskripsi-${fileItem.id}`}
                        value={fileItem.deskripsi}
                        onChange={(e) => updateFileItem(fileItem.id, 'deskripsi', e.target.value)}
                        placeholder="Tambahkan deskripsi file untuk memudahkan pencarian dan identifikasi..."
                        className="h-24 resize-none text-base border-2 border-gray-200 focus:border-green-500 rounded-xl"
                        rows={3}
                      />
                    </div>
                  </div>
                ))}

                {/* Add More Files Button */}
                <div className="flex items-center justify-center py-8">
                  <Button
                    variant="outline"
                    onClick={addFileItem}
                    className="px-8 py-4 text-lg border-3 border-dashed border-gray-300 hover:border-green-400 hover:bg-green-50 rounded-2xl transition-all duration-300 hover:shadow-lg"
                    size="lg"
                  >
                    <Plus className="w-6 h-6 mr-3" />
                    Tambah File Lain
                  </Button>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-between items-center pt-8 border-t-2 border-gray-100">
                  <Button
                    onClick={() => setStep(1)}
                    variant="outline"
                    size="lg"
                    className="px-8 py-4 text-lg border-2 border-gray-300 rounded-xl hover:bg-gray-50"
                  >
                    <ArrowLeft className="w-5 h-5 mr-3" />
                    Kembali
                  </Button>
                  <Button
                    onClick={handleSubmit}
                    disabled={loading || fileItems.some(item => !item.judul.trim() || !item.tempFileName || item.tempFileName === 'loading')}
                    size="lg"
                    className="px-12 py-4 text-lg bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 shadow-xl hover:shadow-2xl disabled:opacity-50 disabled:cursor-not-allowed rounded-xl transition-all duration-300"
                  >
                    {loading ? (
                      <>
                        <div className="animate-spin h-6 w-6 border-3 border-white border-t-transparent rounded-full mr-3" />
                        Menyimpan...
                      </>
                    ) : (
                      <>
                        <FileText className="w-6 h-6 mr-3" />
                        Simpan File ({fileItems.length})
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>

    {/* File Preview Modal */}
    <FilePreviewModal
      tempFileName={previewFile?.tempFileName || null}
      originalName={previewFile?.originalName || null}
      isOpen={isPreviewOpen}
      onClose={() => setIsPreviewOpen(false)}
    />
  </>
  )
}
