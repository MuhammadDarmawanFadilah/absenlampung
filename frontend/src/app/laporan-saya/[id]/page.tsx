"use client";

import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Download, Edit, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast-simple";
import { getApiUrl } from "@/lib/config";

interface SubmissionLaporan {
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

export default function DetailLaporanSayaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const { user } = useAuth();
  const { toast } = useToast();
  const [submission, setSubmission] = useState<SubmissionLaporan | null>(null);
  const [loading, setLoading] = useState(true);
  const [paramId, setParamId] = useState<string>('');

  useEffect(() => {
    // Handle async params
    const initializeParams = async () => {
      const resolvedParams = await params;
      setParamId(resolvedParams.id);
    };
    
    initializeParams();
  }, [params]);

  useEffect(() => {
    if (user?.id && paramId) {
      loadSubmission();
    }
  }, [user, paramId]);

  const loadSubmission = async () => {
    setLoading(true);
    try {
      const response = await fetch(getApiUrl(`detail-laporan/${paramId}/user/${user?.id}`), {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setSubmission(data);
      } else {
        toast({
          title: "Error",
          description: "Laporan tidak ditemukan",
          variant: "destructive",
        });
        router.push('/laporan-saya');
      }
    } catch (error) {
      console.error('Error loading submission:', error);
      toast({
        title: "Error",
        description: "Gagal memuat data laporan",
        variant: "destructive",
      });
      router.push('/laporan-saya');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Apakah Anda yakin ingin menghapus laporan ini?")) {
      return;
    }

    try {
      const response = await fetch(getApiUrl(`detail-laporan/${paramId}/user/${user?.id}`), {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      });

      if (response.ok) {
        toast({
          title: "Berhasil",
          description: "Laporan berhasil dihapus",
        });
        router.push('/laporan-saya');
      } else {
        toast({
          title: "Error",
          description: "Gagal menghapus laporan",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error deleting submission:', error);
      toast({
        title: "Error",
        description: "Gagal menghapus laporan",
        variant: "destructive",
      });
    }
  };

  const handleDownloadFile = async (fileName: string) => {
    try {
      const response = await fetch(getApiUrl(`files/download/documents/${fileName}`), {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        toast({
          title: "Berhasil",
          description: `File ${fileName} berhasil diunduh`,
        });
      } else {
        toast({
          title: "Error",
          description: "Gagal mengunduh file",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error downloading file:', error);
      toast({
        title: "Error",
        description: "Gagal mengunduh file",
        variant: "destructive",
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'DRAFT': return 'bg-gray-100 text-gray-800';
      case 'SUBMITTED': return 'bg-blue-100 text-blue-800';
      case 'REVIEWED': return 'bg-yellow-100 text-yellow-800';
      case 'APPROVED': return 'bg-green-100 text-green-800';
      case 'REJECTED': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'DRAFT': return 'Draft';
      case 'SUBMITTED': return 'Terkirim';
      case 'REVIEWED': return 'Direview';
      case 'APPROVED': return 'Disetujui';
      case 'REJECTED': return 'Ditolak';
      default: return status;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!submission) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Laporan tidak ditemukan</h2>
          <Button onClick={() => router.push('/laporan-saya')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Kembali ke Daftar Laporan
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              onClick={() => router.push('/laporan-saya')}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Kembali
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{submission.judul}</h1>
              <Badge className={getStatusColor(submission.status)}>
                {getStatusLabel(submission.status)}
              </Badge>
            </div>
          </div>
          
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => router.push(`/laporan-saya/${submission.id}/edit`)}
              disabled={submission.status === 'APPROVED'}
            >
              <Edit className="w-4 h-4 mr-2" />
              Edit
            </Button>
            <Button
              variant="outline"
              onClick={handleDelete}
              disabled={submission.status === 'APPROVED'}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Hapus
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="space-y-6">
          {/* Basic Info */}
          <Card>
            <CardHeader>
              <CardTitle>Informasi Laporan</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">Tanggal Laporan</label>
                  <p className="text-gray-900">{submission.tanggalLaporan}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Lokasi</label>
                  <p className="text-gray-900">{submission.lokasi}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Tanggal Dibuat</label>
                  <p className="text-gray-900">
                    {new Date(submission.tanggalBuat).toLocaleDateString('id-ID', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Status</label>
                  <p className="text-gray-900">{getStatusLabel(submission.status)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Content */}
          <Card>
            <CardHeader>
              <CardTitle>Deskripsi Laporan</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="prose max-w-none">
                <div className="whitespace-pre-wrap text-gray-900">
                  {submission.konten}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Files */}
          {submission.files && submission.files.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Lampiran ({submission.files.length} file)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {submission.files.map((file, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-gray-100 rounded flex items-center justify-center">
                          <span className="text-xs font-medium text-gray-600">
                            {file.split('.').pop()?.toUpperCase()}
                          </span>
                        </div>
                        <span className="text-gray-900">{file}</span>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDownloadFile(file)}
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Download
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
