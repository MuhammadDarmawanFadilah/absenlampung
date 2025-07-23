"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Upload, Save, X, Check, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast-simple";
import { useAuth } from "@/contexts/AuthContext";
import { getApiUrl } from "@/lib/config";

interface SubmissionDetail {
  id: number;
  judul: string;
  konten: string;
  lokasi: string;
  tanggalLaporan: string;
  status: string;
  tanggalBuat: string;
  tahapanLaporanId: number;
  jenisLaporanId: number;
  laporanId: number;
  pemilihanId: number;
  userId: number;
  userName: string;
  files: string[];
}

interface EditFormData {
  judul: string;
  konten: string;
  lokasi: string;
  tanggalLaporan: string;
  uploadedFiles: string[];
}

export default function EditLaporanSayaPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const { toast } = useToast();
  const [submission, setSubmission] = useState<SubmissionDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);

  const submissionId = params?.id as string;

  const [formData, setFormData] = useState<EditFormData>({
    judul: "",
    konten: "",
    lokasi: "",
    tanggalLaporan: "",
    uploadedFiles: []
  });

  const steps = [
    { id: 1, title: "Edit Data", description: "Edit informasi laporan" },
    { id: 2, title: "Preview", description: "Review perubahan" }
  ];

  useEffect(() => {
    if (submissionId && user?.id) {
      loadSubmissionDetail();
    }
  }, [submissionId, user]);

  const loadSubmissionDetail = async () => {
    setLoading(true);
    try {
      const response = await fetch(getApiUrl(`detail-laporan/${submissionId}/user/${user?.id}`), {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setSubmission(data);
        
        // Set form data from loaded submission
        setFormData({
          judul: data.judul,
          konten: data.konten,
          lokasi: data.lokasi,
          tanggalLaporan: data.tanggalLaporan,
          uploadedFiles: data.files || []
        });
      } else {
        toast({
          title: "Error",
          description: "Gagal memuat detail laporan",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error loading submission detail:', error);
      toast({
        title: "Error",
        description: "Gagal memuat detail laporan",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof EditFormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleFileUpload = async (files: FileList | File[]) => {
    const fileArray = Array.from(files);
    
    if (fileArray.length === 0) return;
    
    setUploading(true);
    
    for (const file of fileArray) {
      try {
        // Validate file size (max 10MB per file)
        const maxSize = 10 * 1024 * 1024; // 10MB
        if (file.size > maxSize) {
          toast({
            title: "Error",
            description: `File ${file.name} terlalu besar. Maksimal 10MB per file.`,
            variant: "destructive",
          });
          continue;
        }
        
        const uploadFormData = new FormData();
        uploadFormData.append('file', file);

        const response = await fetch(getApiUrl('temp-files/upload'), {
          method: 'POST',
          body: uploadFormData,
        });

        if (!response.ok) {
          throw new Error('Gagal mengupload file');
        }

        const result = await response.json();
        
        if (result.success && result.data && result.data.fileName) {
          const serverFileName = result.data.fileName;

          setFormData(prev => ({
            ...prev,
            uploadedFiles: [...prev.uploadedFiles, serverFileName]
          }));

          toast({
            title: "Upload berhasil",
            description: `File ${file.name} berhasil diupload`,
          });
        } else {
          throw new Error('Response tidak valid dari server');
        }

      } catch (error: any) {
        console.error('Upload error for file:', file.name, error);
        toast({
          title: "Upload gagal",
          description: `Gagal mengupload file ${file.name}: ${error.message}`,
          variant: "destructive",
        });
      }
    }
    
    setUploading(false);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileUpload(files);
    }
    e.target.value = '';
  };

  const removeFile = async (index: number) => {
    const fileName = formData.uploadedFiles[index];
    
    // Only delete temp files from server
    const isTempFile = /^\d{8}_\d{6}_/.test(fileName);
    if (isTempFile) {
      try {
        const response = await fetch(getApiUrl(`temp-files/${fileName}`), {
          method: 'DELETE',
        });

        if (response.ok) {
          toast({
            title: "File dihapus",
            description: "File berhasil dihapus dari server",
          });
        }
      } catch (error) {
        console.error('Error deleting file from server:', error);
      }
    }

    // Remove from local state
    setFormData(prev => ({
      ...prev,
      uploadedFiles: prev.uploadedFiles.filter((_, i) => i !== index)
    }));
  };

  const getDisplayName = (fileName: string) => {
    if (typeof fileName === 'string') {
      const isTempFile = /^\d{8}_\d{6}_/.test(fileName);
      
      if (isTempFile) {
        const parts = fileName.split('_');
        if (parts.length >= 3) {
          return parts.slice(2).join('_');
        }
      } else {
        const cleanFileName = fileName.replace('documents/', '');
        const parts = cleanFileName.split('_');
        if (parts.length >= 3) {
          return parts.slice(2).join('_');
        }
        return cleanFileName;
      }
      return fileName;
    }
    return fileName;
  };

  const handleNext = () => {
    if (!formData.judul.trim() || !formData.konten.trim()) {
      toast({
        title: "Error",
        description: "Mohon isi judul dan konten laporan",
        variant: "destructive",
      });
      return;
    }
    setCurrentStep(2);
  };

  const handlePrevious = () => {
    setCurrentStep(1);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Validate required fields
      if (!formData.judul.trim()) {
        throw new Error('Judul laporan wajib diisi');
      }
      
      if (!formData.konten.trim()) {
        throw new Error('Konten laporan wajib diisi');
      }

      // Prepare update data (similar to create but for update)
      const updateData = {
        id: parseInt(submissionId),
        judul: formData.judul,
        konten: formData.konten,
        lokasi: formData.lokasi,
        tanggalLaporan: formData.tanggalLaporan,
        tempFiles: formData.uploadedFiles.filter(f => /^\d{8}_\d{6}_/.test(f)), // Only new temp files
        permanentFiles: formData.uploadedFiles.filter(f => !/^\d{8}_\d{6}_/.test(f)), // Existing permanent files
        tahapanLaporanId: submission?.tahapanLaporanId,
        jenisLaporanId: submission?.jenisLaporanId,
        laporanId: submission?.laporanId,
        pemilihanId: submission?.pemilihanId,
        userId: user?.id
      };

      console.log('Updating laporan data:', updateData);
      
      // For now, we'll use the same endpoint as create since update endpoint may not exist yet
      // In a real application, you would have a PUT endpoint for updates
      const response = await fetch(getApiUrl(`detail-laporan/${submissionId}/user/${user?.id}`), {
        method: 'PUT', // or PATCH
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: JSON.stringify(updateData),
      });

      if (!response.ok) {
        // If PUT/PATCH not implemented, try DELETE + CREATE approach
        if (response.status === 405 || response.status === 404) {
          toast({
            title: "Info",
            description: "Fitur edit belum tersedia. Silakan hapus dan buat ulang laporan.",
            variant: "destructive",
          });
          return;
        }
        
        const errorData = await response.json();
        throw new Error(errorData.message || 'Gagal menyimpan perubahan');
      }

      const result = await response.json();
      console.log('Update result:', result);
      
      toast({
        title: "Berhasil",
        description: "Laporan berhasil diperbarui",
      });
      
      // Navigate back to detail page
      router.push(`/laporan-saya/${submissionId}`);
      
    } catch (error: any) {
      console.error("Error updating laporan:", error);
      toast({
        title: "Error",
        description: error.message || "Gagal memperbarui laporan",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <span className="text-gray-600">Memuat data...</span>
        </div>
      </div>
    );
  }

  if (!submission) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Laporan tidak ditemukan</h2>
          <p className="text-gray-600 mb-4">Laporan yang Anda cari tidak dapat ditemukan.</p>
          <Button onClick={() => router.push('/laporan-saya')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Kembali ke Laporan Saya
          </Button>
        </div>
      </div>
    );
  }

  if (submission.status === 'APPROVED') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Laporan tidak dapat diedit</h2>
          <p className="text-gray-600 mb-4">Laporan yang sudah disetujui tidak dapat diedit.</p>
          <Button onClick={() => router.push(`/laporan-saya/${submissionId}`)}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Kembali ke Detail
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="mb-6">
          <Button 
            variant="outline" 
            onClick={() => router.push(`/laporan-saya/${submissionId}`)}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Kembali ke Detail
          </Button>
          
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Edit Laporan</h1>
          <p className="text-gray-600">Edit laporan: {submission.judul}</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-center">Edit Laporan</CardTitle>
          </CardHeader>
          <CardContent>
            {/* Stepper */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-8">
                {steps.map((step, index) => (
                  <div key={step.id} className="flex items-center">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium ${
                      currentStep >= step.id 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-gray-200 text-gray-600'
                    }`}>
                      {currentStep > step.id ? <Check className="w-5 h-5" /> : step.id}
                    </div>
                    <div className="ml-3">
                      <p className={`text-sm font-medium ${
                        currentStep >= step.id ? 'text-blue-600' : 'text-gray-500'
                      }`}>
                        {step.title}
                      </p>
                      <p className="text-xs text-gray-500">{step.description}</p>
                    </div>
                    {index < steps.length - 1 && (
                      <ChevronRight className="w-5 h-5 text-gray-400 mx-4" />
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Step Content */}
            <div className="mb-6">
              {currentStep === 1 && (
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="judul">Judul Laporan *</Label>
                    <Input
                      id="judul"
                      value={formData.judul}
                      onChange={(e) => handleInputChange('judul', e.target.value)}
                      placeholder="Masukkan judul laporan"
                      className="mt-2"
                    />
                  </div>

                  <div>
                    <Label htmlFor="konten">Konten Laporan *</Label>
                    <Textarea
                      id="konten"
                      value={formData.konten}
                      onChange={(e) => handleInputChange('konten', e.target.value)}
                      placeholder="Jelaskan detail laporan pengawasan..."
                      rows={6}
                      className="mt-2"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="tanggal">Tanggal Laporan</Label>
                      <Input
                        id="tanggal"
                        type="date"
                        value={formData.tanggalLaporan}
                        onChange={(e) => handleInputChange('tanggalLaporan', e.target.value)}
                        className="mt-2"
                      />
                    </div>

                    <div>
                      <Label htmlFor="lokasi">Lokasi</Label>
                      <Input
                        id="lokasi"
                        value={formData.lokasi}
                        onChange={(e) => handleInputChange('lokasi', e.target.value)}
                        placeholder="Masukkan lokasi"
                        className="mt-2"
                      />
                    </div>
                  </div>

                  {/* File Upload */}
                  <div>
                    <Label>Lampiran</Label>
                    <div className="mt-2">
                      {!uploading ? (
                        <div 
                          className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center transition-all cursor-pointer hover:border-gray-400"
                          onClick={() => document.getElementById('file-input')?.click()}
                        >
                          <input
                            id="file-input"
                            type="file"
                            className="hidden"
                            multiple
                            accept=".jpg,.jpeg,.png,.gif,.pdf,.doc,.docx,.txt,.csv,.md,.zip,.rar"
                            onChange={handleFileInputChange}
                          />
                          <Upload className="h-8 w-8 mx-auto mb-4 text-gray-400" />
                          <p className="text-sm text-gray-600">
                            <span className="font-semibold">Klik untuk upload</span> file tambahan
                          </p>
                          <p className="text-xs text-gray-500 mt-2">
                            Maksimal 10MB per file. Format: JPG, PNG, PDF, DOC, DOCX, TXT, CSV, MD, ZIP, RAR
                          </p>
                        </div>
                      ) : (
                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center bg-gray-50">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
                          <p className="text-sm text-blue-600">
                            <span className="font-semibold">Mengupload file...</span>
                          </p>
                        </div>
                      )}

                      {/* Uploaded Files List */}
                      {formData.uploadedFiles.length > 0 && (
                        <div className="mt-4 space-y-2">
                          <Label className="text-sm font-medium">File yang diupload:</Label>
                          {formData.uploadedFiles.map((fileName, index) => (
                            <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border">
                              <div className="flex items-center gap-3">
                                <div>
                                  <p className="text-sm font-medium text-gray-900">{getDisplayName(fileName)}</p>
                                  <p className="text-xs text-gray-500">
                                    {/^\d{8}_\d{6}_/.test(fileName) ? 'File baru' : 'File tersimpan'}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => removeFile(index)}
                                  className="h-8 w-8 p-0 text-red-600 hover:text-red-800"
                                  title="Hapus file"
                                  disabled={uploading}
                                >
                                  <X className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {currentStep === 2 && (
                <div className="space-y-4">
                  <div>
                    <Label>Judul Laporan</Label>
                    <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded border">{formData.judul}</p>
                  </div>

                  <div>
                    <Label>Konten Laporan</Label>
                    <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded border max-h-32 overflow-y-auto whitespace-pre-wrap">
                      {formData.konten}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Tanggal Laporan</Label>
                      <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded border">{formData.tanggalLaporan}</p>
                    </div>
                    <div>
                      <Label>Lokasi</Label>
                      <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded border">{formData.lokasi}</p>
                    </div>
                  </div>

                  {formData.uploadedFiles.length > 0 && (
                    <div>
                      <Label>Lampiran ({formData.uploadedFiles.length} file)</Label>
                      <div className="space-y-1 bg-gray-50 p-3 rounded border">
                        {formData.uploadedFiles.map((file, index) => (
                          <Badge key={index} variant="outline" className="text-xs mr-1">
                            {getDisplayName(file)}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex justify-between">
              <Button
                variant="outline"
                onClick={currentStep === 1 ? () => router.push(`/laporan-saya/${submissionId}`) : handlePrevious}
                disabled={saving}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                {currentStep === 1 ? 'Batal' : 'Sebelumnya'}
              </Button>

              <div className="space-x-2">
                {currentStep < steps.length ? (
                  <Button onClick={handleNext} disabled={uploading}>
                    Selanjutnya
                    <ChevronRight className="w-4 h-4 ml-2" />
                  </Button>
                ) : (
                  <Button onClick={handleSave} disabled={saving || uploading} className="bg-green-600 hover:bg-green-700">
                    {saving ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Menyimpan...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4 mr-2" />
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
