"use client";

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { 
  ArrowLeft,
  FileText,
  Edit,
  Trash2,
  Eye,
  Calendar,
  User,
  Building,
  CheckCircle,
  Clock,
  AlertCircle,
  XCircle,
  Download,
  Upload,
  MoreVertical,
  Loader2
} from 'lucide-react';
import { laporanAPI, Laporan } from '@/lib/laporan-api';
import { jenisLaporanAPI, JenisLaporan } from '@/lib/api';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

export default function LaporanDetailPage() {
  const router = useRouter();
  const params = useParams();
  const laporanId = parseInt(params.id as string);
  
  const [laporan, setLaporan] = useState<Laporan | null>(null);
  const [jenisLaporan, setJenisLaporan] = useState<JenisLaporan | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  
  useEffect(() => {
    loadLaporanData();
  }, [laporanId]);
  
  const loadLaporanData = async () => {
    try {
      setIsLoading(true);
      // Load laporan with tahapan details
      const laporanData = await laporanAPI.getWithTahapan(laporanId);
      setLaporan(laporanData);
      
      // Load jenis laporan details
      try {
        const jenisLaporanData = await jenisLaporanAPI.getWithTahapan(laporanData.jenisLaporanId);
        setJenisLaporan(jenisLaporanData);
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
  
  const handleEdit = () => {
    router.push(`/admin/laporan/${laporanId}/edit`);
  };
  
  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      await laporanAPI.delete(laporanId);
      toast({
        title: "Sukses",
        description: "Laporan berhasil dihapus",
      });
      router.push('/admin/laporan');
    } catch (error: any) {
      console.error('Error deleting laporan:', error);
      toast({
        title: "Error",
        description: error.message || "Gagal menghapus laporan",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };
  
  const handleBack = () => {
    router.push('/admin/laporan');
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
  
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'AKTIF':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'TIDAK_AKTIF':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'DRAFT':
        return <Clock className="h-4 w-4 text-gray-600" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-600" />;
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

  if (!laporan) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <FileText className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Laporan tidak ditemukan</h2>
          <p className="text-gray-600 mb-4">Laporan yang Anda cari tidak ditemukan atau sudah dihapus.</p>
          <Button onClick={handleBack} className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Kembali ke Daftar Laporan
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto py-8 px-6 max-w-6xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <Button 
                variant="ghost" 
                onClick={handleBack}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Kembali
              </Button>
              <div>
                <h1 className="text-3xl font-bold tracking-tight">{laporan.namaLaporan}</h1>
                <p className="text-muted-foreground">
                  Detail informasi laporan
                </p>
              </div>
            </div>
            
            {/* Action Buttons */}
            <div className="flex items-center gap-3">
              <Button
                onClick={handleEdit}
                className="flex items-center gap-2"
              >
                <Edit className="h-4 w-4" />
                Edit Laporan
              </Button>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={handleEdit}>
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Laporan
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <DropdownMenuItem 
                        className="text-red-600 focus:text-red-600"
                        onSelect={(e) => e.preventDefault()}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Hapus Laporan
                      </DropdownMenuItem>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Konfirmasi Penghapusan</AlertDialogTitle>
                        <AlertDialogDescription>
                          Apakah Anda yakin ingin menghapus laporan "{laporan.namaLaporan}"? 
                          Tindakan ini tidak dapat dibatalkan.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Batal</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={handleDelete}
                          disabled={isDeleting}
                          className="bg-red-600 hover:bg-red-700"
                        >
                          {isDeleting ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Menghapus...
                            </>
                          ) : (
                            <>
                              <Trash2 className="h-4 w-4 mr-2" />
                              Hapus Laporan
                            </>
                          )}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Main Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Informasi Dasar
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">{laporan.namaLaporan}</h3>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(laporan.status)}
                      <Badge className={getStatusColor(laporan.status)}>
                        {getStatusDisplay(laporan.status)}
                      </Badge>
                    </div>
                    <div className="text-sm text-gray-500">
                      ID: {laporan.laporanId}
                    </div>
                  </div>
                  <p className="text-gray-700 leading-relaxed">{laporan.deskripsi}</p>
                </div>
                
                {/* Metadata */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      <span className="text-sm text-gray-600">Dibuat pada</span>
                    </div>
                    <p className="text-sm font-medium">
                      {new Date(laporan.createdAt).toLocaleDateString('id-ID', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-gray-400" />
                      <span className="text-sm text-gray-600">Terakhir diubah</span>
                    </div>
                    <p className="text-sm font-medium">
                      {new Date(laporan.updatedAt).toLocaleDateString('id-ID', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Jenis Laporan Details */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building className="h-5 w-5" />
                  Jenis Laporan
                </CardTitle>
              </CardHeader>
              <CardContent>
                {jenisLaporan ? (
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">{jenisLaporan.nama}</h3>
                      <p className="text-gray-600 mb-4">{jenisLaporan.deskripsi}</p>
                      
                      <div className="flex items-center gap-4">
                        <Badge className={getStatusColor(jenisLaporan.status)}>
                          {getStatusDisplay(jenisLaporan.status)}
                        </Badge>
                        <span className="text-sm text-gray-600">
                          {jenisLaporan.tahapanList?.length || 0} tahapan
                        </span>
                        <span className="text-sm text-gray-600">
                          {jenisLaporan.jumlahLaporan || 0} laporan
                        </span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <AlertCircle className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                    <p className="text-gray-600">Gagal memuat detail jenis laporan</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Tahapan List */}
            {laporan.tahapanList && laporan.tahapanList.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5" />
                    Tahapan Laporan
                    <Badge variant="secondary" className="ml-2">
                      {laporan.tahapanList.length} tahapan
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {laporan.tahapanList.map((tahapan, index) => (
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
                                    <div className="flex items-center gap-1">
                                      {getStatusIcon(tahapan.status)}
                                      <Badge className={getStatusColor(tahapan.status)} variant="secondary">
                                        {getStatusDisplay(tahapan.status)}
                                      </Badge>
                                    </div>
                                    
                                    {tahapan.templateTahapan && (
                                      <div className="flex items-center gap-1">
                                        <FileText className="h-4 w-4" />
                                        <span>Template tersedia</span>
                                      </div>
                                    )}
                                    
                                    {tahapan.jenisFileIzin && tahapan.jenisFileIzin.length > 0 && (
                                      <div className="flex items-center gap-1">
                                        <Upload className="h-4 w-4" />
                                        <span>{tahapan.jenisFileIzin.length} tipe file diizinkan</span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                                
                                {tahapan.jenisFileIzin && tahapan.jenisFileIzin.length > 0 && (
                                  <div className="flex flex-wrap gap-1 ml-4">
                                    {tahapan.jenisFileIzin.slice(0, 5).map(type => (
                                      <Badge key={type} variant="outline" className="text-xs">
                                        {type.toUpperCase()}
                                      </Badge>
                                    ))}
                                    {tahapan.jenisFileIzin.length > 5 && (
                                      <Badge variant="outline" className="text-xs">
                                        +{tahapan.jenisFileIzin.length - 5}
                                      </Badge>
                                    )}
                                  </div>
                                )}
                              </div>
                              
                              {tahapan.templateTahapan && (
                                <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                      <FileText className="h-4 w-4 text-blue-600" />
                                      <span className="text-sm font-medium text-blue-900">Template Tahapan</span>
                                    </div>
                                    <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-700">
                                      <Download className="h-4 w-4 mr-1" />
                                      Unduh
                                    </Button>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Column - Sidebar */}
          <div className="space-y-6">
            {/* Quick Stats */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Ringkasan</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                  <div>
                    <p className="text-sm text-blue-700">Status</p>
                    <p className="font-semibold text-blue-900">{getStatusDisplay(laporan.status)}</p>
                  </div>
                  {getStatusIcon(laporan.status)}
                </div>
                
                <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                  <div>
                    <p className="text-sm text-green-700">Jenis Laporan</p>
                    <p className="font-semibold text-green-900">{laporan.jenisLaporanNama}</p>
                  </div>
                  <Building className="h-5 w-5 text-green-600" />
                </div>
                
                <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                  <div>
                    <p className="text-sm text-purple-700">Total Tahapan</p>
                    <p className="font-semibold text-purple-900">{laporan.tahapanList?.length || 0}</p>
                  </div>
                  <CheckCircle className="h-5 w-5 text-purple-600" />
                </div>
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Aksi</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  onClick={handleEdit}
                  className="w-full flex items-center gap-2"
                >
                  <Edit className="h-4 w-4" />
                  Edit Laporan
                </Button>
                
                <Button
                  variant="outline"
                  className="w-full flex items-center gap-2"
                  onClick={handleBack}
                >
                  <Eye className="h-4 w-4" />
                  Lihat Semua Laporan
                </Button>
                
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="destructive"
                      className="w-full flex items-center gap-2"
                    >
                      <Trash2 className="h-4 w-4" />
                      Hapus Laporan
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Konfirmasi Penghapusan</AlertDialogTitle>
                      <AlertDialogDescription>
                        Apakah Anda yakin ingin menghapus laporan "{laporan.namaLaporan}"? 
                        Tindakan ini tidak dapat dibatalkan.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Batal</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleDelete}
                        disabled={isDeleting}
                        className="bg-red-600 hover:bg-red-700"
                      >
                        {isDeleting ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Menghapus...
                          </>
                        ) : (
                          <>
                            <Trash2 className="h-4 w-4 mr-2" />
                            Hapus Laporan
                          </>
                        )}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </CardContent>
            </Card>

            {/* Metadata */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Informasi Tambahan</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                <div>
                  <p className="text-gray-600 mb-1">ID Laporan</p>
                  <p className="font-mono text-gray-900">{laporan.laporanId}</p>
                </div>
                
                <div>
                  <p className="text-gray-600 mb-1">ID Jenis Laporan</p>
                  <p className="font-mono text-gray-900">{laporan.jenisLaporanId}</p>
                </div>
                
                <div>
                  <p className="text-gray-600 mb-1">Dibuat pada</p>
                  <p className="text-gray-900">
                    {new Date(laporan.createdAt).toLocaleDateString('id-ID', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
                
                <div>
                  <p className="text-gray-600 mb-1">Terakhir diubah</p>
                  <p className="text-gray-900">
                    {new Date(laporan.updatedAt).toLocaleDateString('id-ID', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
