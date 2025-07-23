"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Edit, Trash2, MapPin, FolderOpen, Users, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast-simple";
import { pemilihanApi, PemilihanDTO } from "@/lib/pemilihan-api";

export default function PemilihanDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [pemilihan, setPemilihan] = useState<PemilihanDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [wilayahNames, setWilayahNames] = useState({
    provinsiNama: '',
    kotaNama: '',
    kecamatanNama: '',
    kelurahanNama: ''
  });
  const { toast } = useToast();

  const id = params?.id as string;

  useEffect(() => {
    if (id) {
      loadPemilihan();
    }
  }, [id]);

  const loadPemilihan = async () => {
    setLoading(true);
    try {
      const response = await pemilihanApi.getById(parseInt(id));
      setPemilihan(response.data);
      
      // Load wilayah names if we have the data
      if (response.data) {
        await loadWilayahNames(response.data);
      }
    } catch (error: any) {
      console.error("Error loading pemilihan:", error);
      toast({
        title: "Error",
        description: error.message || "Gagal memuat data pemilihan",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadWilayahNames = async (pemilihanData: PemilihanDTO) => {
    try {
      const { cachedWilayahAPI } = await import('@/lib/wilayah-api');
      
      // Load provinsi name
      if (pemilihanData.provinsi) {
        const provinces = await cachedWilayahAPI.getProvinces();
        const province = provinces.find((p: any) => p.code === pemilihanData.provinsi);
        if (province) {
          setWilayahNames(prev => ({ ...prev, provinsiNama: province.name }));
        }
      }
      
      // Load kota name
      if (pemilihanData.kota && pemilihanData.provinsi) {
        const regencies = await cachedWilayahAPI.getRegencies(pemilihanData.provinsi);
        const regency = regencies.find((r: any) => r.code === pemilihanData.kota);
        if (regency) {
          setWilayahNames(prev => ({ ...prev, kotaNama: regency.name }));
        }
      }
      
      // Load kecamatan name
      if (pemilihanData.kecamatan && pemilihanData.kota) {
        const districts = await cachedWilayahAPI.getDistricts(pemilihanData.kota);
        const district = districts.find((d: any) => d.code === pemilihanData.kecamatan);
        if (district) {
          setWilayahNames(prev => ({ ...prev, kecamatanNama: district.name }));
        }
      }
      
      // Load kelurahan name
      if (pemilihanData.kelurahan && pemilihanData.kecamatan) {
        const villages = await cachedWilayahAPI.getVillages(pemilihanData.kecamatan);
        const village = villages.find((v: any) => v.code === pemilihanData.kelurahan);
        if (village) {
          setWilayahNames(prev => ({ ...prev, kelurahanNama: village.name }));
        }
      }
    } catch (error) {
      console.error('Error loading wilayah names:', error);
    }
  };

  const handleDelete = async () => {
    if (!pemilihan || !confirm("Apakah Anda yakin ingin menghapus pemilihan ini?")) return;

    try {
      await pemilihanApi.delete(pemilihan.pemilihanId!);
      toast({
        title: "Sukses",
        description: "Pemilihan berhasil dihapus",
      });
      router.push('/admin/pemilihan');
    } catch (error: any) {
      console.error("Error deleting pemilihan:", error);
      toast({
        title: "Error",
        description: "Gagal menghapus pemilihan",
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "AKTIF":
        return <Badge className="bg-green-500 hover:bg-green-600">Aktif</Badge>;
      case "TIDAK_AKTIF":
        return <Badge className="bg-red-500 hover:bg-red-600">Tidak Aktif</Badge>;
      case "DRAFT":
        return <Badge className="bg-yellow-500 hover:bg-yellow-600">Draft</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2">Memuat data...</span>
        </div>
      </div>
    );
  }

  if (!pemilihan) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Pemilihan tidak ditemukan</h2>
          <p className="text-gray-600 mb-4">Data pemilihan yang Anda cari tidak dapat ditemukan.</p>
          <Button onClick={() => router.push('/admin/pemilihan')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Kembali ke Daftar Pemilihan
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => router.push('/admin/pemilihan')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Kembali
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Detail Pemilihan
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Informasi lengkap pemilihan alumni
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={() => router.push(`/admin/pemilihan/${id}/edit`)}
          >
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </Button>
          <Button variant="destructive" onClick={handleDelete}>
            <Trash2 className="h-4 w-4 mr-2" />
            Hapus
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Status</p>
                <div className="mt-1">
                  {getStatusBadge(pemilihan.status)}
                </div>
              </div>
              <Users className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-l-4 border-l-green-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Laporan</p>
                <p className="text-2xl font-bold text-gray-900">{pemilihan.totalLaporan || 0}</p>
              </div>
              <FolderOpen className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-l-4 border-l-purple-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Tingkat Pemilihan</p>
                <p className="text-2xl font-bold text-gray-900">{pemilihan.tingkatPemilihan || '-'}</p>
              </div>
              <MapPin className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-l-4 border-l-orange-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Laporan</p>
                <p className="text-2xl font-bold text-gray-900">{pemilihan.totalLaporan || 0}</p>
              </div>
              <Calendar className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Informasi Dasar */}
        <Card>
          <CardHeader>
            <CardTitle>Informasi Dasar</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-600">Nama Pemilihan</label>
              <p className="text-gray-900 font-semibold">{pemilihan.judulPemilihan}</p>
            </div>
            
            <Separator />
            
            <div>
              <label className="text-sm font-medium text-gray-600">Deskripsi</label>
              <p className="text-gray-900">{pemilihan.deskripsi || "Tidak ada deskripsi"}</p>
            </div>
            
            <Separator />
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-600">Status</label>
                <div className="mt-1">
                  {getStatusBadge(pemilihan.status)}
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Tingkat Pemilihan</label>
                <p className="text-gray-900 capitalize">{pemilihan.tingkatPemilihan || '-'}</p>
              </div>
            </div>
            
            <Separator />
            
            <div>
              <label className="text-sm font-medium text-gray-600">Total Laporan</label>
              <p className="text-gray-900">{pemilihan.totalLaporan || 0} laporan</p>
            </div>
          </CardContent>
        </Card>

        {/* Informasi Wilayah */}
        <Card>
          <CardHeader>
            <CardTitle>Informasi Wilayah</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-600">Provinsi</label>
              <p className="text-gray-900 font-semibold">{wilayahNames.provinsiNama || pemilihan.provinsi || '-'}</p>
            </div>
            
            <Separator />
            
            <div>
              <label className="text-sm font-medium text-gray-600">Kota/Kabupaten</label>
              <p className="text-gray-900">{wilayahNames.kotaNama || pemilihan.kota || '-'}</p>
            </div>
            
            {(pemilihan.kecamatan || wilayahNames.kecamatanNama) && (
              <>
                <Separator />
                <div>
                  <label className="text-sm font-medium text-gray-600">Kecamatan</label>
                  <p className="text-gray-900">{wilayahNames.kecamatanNama || pemilihan.kecamatan}</p>
                </div>
              </>
            )}
            
            {(pemilihan.kelurahan || wilayahNames.kelurahanNama) && (
              <>
                <Separator />
                <div>
                  <label className="text-sm font-medium text-gray-600">Kelurahan/Desa</label>
                  <p className="text-gray-900">{wilayahNames.kelurahanNama || pemilihan.kelurahan}</p>
                </div>
              </>
            )}
            
            {pemilihan.alamatLengkap && (
              <>
                <Separator />
                <div>
                  <label className="text-sm font-medium text-gray-600">Alamat Lengkap</label>
                  <p className="text-gray-900">{pemilihan.alamatLengkap}</p>
                </div>
              </>
            )}
            
            {(pemilihan.latitude && pemilihan.longitude) && (
              <>
                <Separator />
                <div>
                  <label className="text-sm font-medium text-gray-600">Koordinat</label>
                  <p className="text-gray-900">{pemilihan.latitude.toFixed(6)}, {pemilihan.longitude.toFixed(6)}</p>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Informasi Tanggal */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Informasi Tanggal</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {pemilihan.tanggalPembuatan && (
              <div>
                <label className="text-sm font-medium text-gray-600">Tanggal Pembuatan</label>
                <p className="text-gray-900">{formatDate(pemilihan.tanggalPembuatan)}</p>
              </div>
            )}
            
            {(pemilihan.tanggalAktif || pemilihan.tanggalMulai) && (
              <div>
                <label className="text-sm font-medium text-gray-600">Tanggal Mulai</label>
                <p className="text-gray-900">{formatDate(pemilihan.tanggalAktif || pemilihan.tanggalMulai!)}</p>
              </div>
            )}
            
            {(pemilihan.tanggalBerakhir || pemilihan.tanggalSelesai) && (
              <div>
                <label className="text-sm font-medium text-gray-600">Tanggal Selesai</label>
                <p className="text-gray-900">{formatDate(pemilihan.tanggalBerakhir || pemilihan.tanggalSelesai!)}</p>
              </div>
            )}
            
            {pemilihan.createdAt && (
              <div>
                <label className="text-sm font-medium text-gray-600">Dibuat Pada</label>
                <p className="text-gray-900">{formatDate(pemilihan.createdAt)}</p>
              </div>
            )}

            {pemilihan.updatedAt && (
              <div>
                <label className="text-sm font-medium text-gray-600">Diperbarui Pada</label>
                <p className="text-gray-900">{formatDate(pemilihan.updatedAt)}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
