"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { ArrowLeft, Edit, MapPin, Vote, User, Shield, Calendar, Phone, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { getApiUrl } from "@/lib/config";
import ProtectedRoute from "@/components/ProtectedRoute";

interface Pegawai {
  id: number;
  username: string;
  email: string;
  fullName: string;
  phoneNumber: string;
  nip?: string;
  pendidikan?: string;
  role: string;
  jabatan: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  alamat?: string;
  provinsi?: string;
  provinsiNama?: string;
  kota?: string;
  kotaNama?: string;
  kecamatan?: string;
  kecamatanNama?: string;
  kelurahan?: string;
  kelurahanNama?: string;
  kodePos?: string;
  latitude?: number;
  longitude?: number;
  totalTps?: number;
  totalPemilihan?: number;
  pemilihanList?: Array<{
    id: number;
    judulPemilihan: string;
    deskripsi: string;
    status: string;
    tingkatPemilihan: string;
    totalLaporan: number;
    totalJenisLaporan: number;
    createdAt: string;
  }>;
}

export default function PegawaiDetailPage() {
  const router = useRouter();
  const params = useParams();
  const pegawaiId = parseInt(params.id as string);
  const [pegawai, setPegawai] = useState<Pegawai | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { token } = useAuth();

  // Helper function to get authorization headers
  const getAuthHeaders = () => ({
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` })
  });

  useEffect(() => {
    loadPegawaiDetail();
  }, [pegawaiId]);

  const loadPegawaiDetail = async () => {
    try {
      setLoading(true);
      const response = await fetch(getApiUrl(`/api/pegawai/${pegawaiId}`), {
        headers: getAuthHeaders()
      });

      if (response.ok) {
        const data = await response.json();
        setPegawai(data);
      } else {
        const errorText = await response.text();
        toast({
          title: "Error",
          description: errorText || "Gagal memuat detail pegawai",
          variant: "destructive",
        });
        router.push('/admin/pegawai');
      }
    } catch (error: any) {
      console.error('Error loading pegawai detail:', error);
      toast({
        title: "Error",
        description: error.message || "Gagal memuat detail pegawai",
        variant: "destructive",
      });
      router.push('/admin/pegawai');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'AKTIF':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'TIDAK_AKTIF':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'SUSPEND':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <ProtectedRoute requireAuth={true} allowedRoles={["ADMIN", "MODERATOR"]}>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="h-8 w-8 animate-spin mx-auto mb-4 rounded-full border-4 border-blue-600 border-t-transparent"></div>
            <p className="text-gray-600">Memuat detail pegawai...</p>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  if (!pegawai) {
    return (
      <ProtectedRoute requireAuth={true} allowedRoles={["ADMIN", "MODERATOR"]}>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <User className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <p className="text-gray-600">Pegawai tidak ditemukan</p>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute requireAuth={true} allowedRoles={["ADMIN", "MODERATOR"]}>
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto py-8 px-6 max-w-6xl">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-4 mb-4">
              <Button 
                variant="ghost" 
                onClick={() => router.push('/admin/pegawai')}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Kembali ke Daftar Pegawai
              </Button>
              <div className="flex-1">
                <h1 className="text-3xl font-bold tracking-tight">Detail Pegawai</h1>
                <p className="text-muted-foreground">
                  Informasi lengkap pegawai dan TPS yang ditugaskan
                </p>
              </div>
              <Button 
                onClick={() => router.push(`/admin/pegawai/${pegawaiId}/edit`)}
                className="flex items-center gap-2"
              >
                <Edit className="h-4 w-4" />
                Edit Pegawai
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column - Basic Info */}
            <div className="lg:col-span-2 space-y-6">
              {/* Personal Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Informasi Pribadi
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Nama Lengkap</p>
                      <p className="font-semibold text-lg">{pegawai.fullName}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Username</p>
                      <p className="font-medium">@{pegawai.username}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Email</p>
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-gray-400" />
                        <p className="font-medium">{pegawai.email}</p>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 mb-1">No HP/WA</p>
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-gray-400" />
                        <p className="font-medium">{pegawai.phoneNumber}</p>
                      </div>
                    </div>
                    {pegawai.nip && (
                      <div>
                        <p className="text-sm text-gray-600 mb-1">NIP</p>
                        <p className="font-medium text-blue-600">{pegawai.nip}</p>
                      </div>
                    )}
                    {pegawai.pendidikan && (
                      <div>
                        <p className="text-sm text-gray-600 mb-1">Pendidikan</p>
                        <p className="font-medium text-green-600">{pegawai.pendidikan}</p>
                      </div>
                    )}
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Jabatan</p>
                      <Badge className="bg-blue-100 text-blue-800 border-blue-300">
                        <Shield className="h-3 w-3 mr-1" />
                        {pegawai.jabatan}
                      </Badge>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Status</p>
                      <Badge className={getStatusColor(pegawai.status)}>
                        {pegawai.status}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Location Information */}
              {(pegawai.alamat || pegawai.provinsiNama || pegawai.latitude) && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <MapPin className="h-5 w-5" />
                      Informasi Lokasi
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {pegawai.alamat && (
                      <div>
                        <p className="text-sm text-gray-600 mb-1">Alamat Lengkap</p>
                        <p className="font-medium">{pegawai.alamat}</p>
                      </div>
                    )}
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {pegawai.provinsiNama && (
                        <div>
                          <p className="text-sm text-gray-600 mb-1">Provinsi</p>
                          <p className="font-medium">{pegawai.provinsiNama}</p>
                        </div>
                      )}
                      {pegawai.kotaNama && (
                        <div>
                          <p className="text-sm text-gray-600 mb-1">Kota/Kabupaten</p>
                          <p className="font-medium">{pegawai.kotaNama}</p>
                        </div>
                      )}
                      {pegawai.kecamatanNama && (
                        <div>
                          <p className="text-sm text-gray-600 mb-1">Kecamatan</p>
                          <p className="font-medium">{pegawai.kecamatanNama}</p>
                        </div>
                      )}
                      {pegawai.kelurahanNama && (
                        <div>
                          <p className="text-sm text-gray-600 mb-1">Kelurahan/Desa</p>
                          <p className="font-medium">{pegawai.kelurahanNama}</p>
                        </div>
                      )}
                      {pegawai.kodePos && (
                        <div>
                          <p className="text-sm text-gray-600 mb-1">Kode Pos</p>
                          <p className="font-medium">{pegawai.kodePos}</p>
                        </div>
                      )}
                    </div>

                    {pegawai.latitude && pegawai.longitude && (
                      <div>
                        <p className="text-sm text-gray-600 mb-1">Koordinat</p>
                        <p className="font-medium text-sm">
                          {pegawai.latitude.toFixed(6)}, {pegawai.longitude.toFixed(6)}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Pemilihan List */}
              {pegawai.pemilihanList && pegawai.pemilihanList.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Vote className="h-5 w-5" />
                      Pemilihan yang Ditugaskan ({pegawai.pemilihanList.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {pegawai.pemilihanList.map((pemilihan, index) => (
                        <div key={pemilihan.id} className="p-4 bg-gray-50 rounded-lg border">
                          <div className="flex items-start justify-between">
                            <div className="flex items-start gap-3">
                              <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">
                                {index + 1}
                              </span>
                              <div>
                                <h4 className="font-semibold">{pemilihan.judulPemilihan}</h4>
                                <p className="text-sm text-gray-600 mt-1">{pemilihan.deskripsi}</p>
                                <div className="flex items-center gap-4 mt-2">
                                  <Badge variant="outline" className="text-xs">
                                    {pemilihan.tingkatPemilihan}
                                  </Badge>
                                  <span className="text-xs text-gray-500">
                                    {pemilihan.totalLaporan} laporan
                                  </span>
                                  <span className="text-xs text-gray-500">
                                    {pemilihan.totalJenisLaporan} jenis
                                  </span>
                                </div>
                              </div>
                            </div>
                            <div className="text-right">
                              <Badge className={getStatusColor(pemilihan.status)} variant="secondary">
                                {pemilihan.status}
                              </Badge>
                              <p className="text-xs text-gray-500 mt-1">
                                {formatDate(pemilihan.createdAt)}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Right Column - Quick Stats & Actions */}
            <div className="space-y-6">
              {/* Quick Stats */}
              <Card>
                <CardHeader>
                  <CardTitle>Statistik TPS</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <Vote className="h-8 w-8 mx-auto mb-2 text-blue-600" />
                    <p className="text-2xl font-bold text-blue-600">{pegawai.totalTps || 0}</p>
                    <p className="text-sm text-gray-600">Total TPS</p>
                  </div>
                  
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <Shield className="h-8 w-8 mx-auto mb-2 text-green-600" />
                    <p className="text-2xl font-bold text-green-600">{pegawai.totalPemilihan || 0}</p>
                    <p className="text-sm text-gray-600">Total Pemilihan</p>
                  </div>
                </CardContent>
              </Card>

              {/* Account Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Informasi Akun
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Dibuat</p>
                    <p className="font-medium text-sm">{formatDate(pegawai.createdAt)}</p>
                  </div>
                  
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Terakhir Diupdate</p>
                    <p className="font-medium text-sm">{formatDate(pegawai.updatedAt)}</p>
                  </div>
                  
                  <Separator />
                  
                  <div>
                    <p className="text-sm text-gray-600 mb-1">ID Pegawai</p>
                    <p className="font-mono text-sm">{pegawai.id}</p>
                  </div>
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <Card>
                <CardHeader>
                  <CardTitle>Aksi Cepat</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button 
                    onClick={() => router.push(`/admin/pegawai/${pegawaiId}/edit`)}
                    className="w-full flex items-center gap-2"
                  >
                    <Edit className="h-4 w-4" />
                    Edit Pegawai
                  </Button>
                  
                  <Button 
                    variant="outline"
                    onClick={() => router.push('/admin/pegawai')}
                    className="w-full flex items-center gap-2"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Kembali ke Daftar
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
