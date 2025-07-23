'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { useToast } from '@/hooks/use-toast';
import { pemilihanApi, type PemilihanDTO, type CreatePemilihanRequest } from '@/lib/pemilihan-api';
import { laporanAPI, type Laporan } from '@/lib/laporan-api';

// UI Components
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';

// Icons
import { 
  ArrowLeft, 
  Edit3, 
  MapPin, 
  FolderOpen, 
  Eye, 
  Save, 
  RefreshCw,
  ArrowRight,
  Search,
  X,
  ChevronLeft,
  ChevronRight,
  LayoutGrid,
  Monitor,
  FileText,
  Tablet,
  Grid3X3,
  Smartphone,
  Plus,
  List,
  Calendar as CalendarIcon,
  Clock
} from 'lucide-react';

// Components
import WilayahFormConditional from '@/components/WilayahFormConditional';
import MapLocationPicker from '@/components/MapLocationPicker';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";

// Stepper Component yang sama dengan create page
interface StepperProps {
  currentStep: number;
  steps: string[];
}

const Stepper = ({ currentStep, steps }: StepperProps) => {
  return (
    <div className="flex items-center justify-center mb-8">
      {steps.map((step, index) => (
        <div key={index} className="flex items-center">
          <div className={`
            flex items-center justify-center w-10 h-10 rounded-full font-semibold text-sm
            ${index <= currentStep 
              ? 'bg-blue-600 text-white' 
              : 'bg-gray-200 text-gray-500'
            }
          `}>
            {index + 1}
          </div>
          <div className={`ml-2 mr-4 text-sm font-medium ${
            index <= currentStep ? 'text-blue-600' : 'text-gray-500'
          }`}>
            {step}
          </div>
          {index < steps.length - 1 && (
            <div className={`w-16 h-1 rounded mx-2 ${
              index < currentStep ? 'bg-blue-600' : 'bg-gray-200'
            }`} />
          )}
        </div>
      ))}
    </div>
  );
};

// Layout options untuk tampilan laporan
const LAYOUT_OPTIONS = [
  { value: 1, label: '1 per baris', icon: Monitor },
  { value: 2, label: '2 per baris', icon: Tablet },
  { value: 3, label: '3 per baris', icon: LayoutGrid },
  { value: 4, label: '4 per baris', icon: Grid3X3 },
  { value: 5, label: '5 per baris', icon: Smartphone },
];

// Types
interface PemilihanFormData {
  judulPemilihan: string;
  deskripsi: string;
  status: string;
  tingkatPemilihan?: string;
  provinsi: string;
  kota: string;
  kecamatan: string;
  kelurahan: string;
  rt?: string;
  rw?: string;
  alamatLokasi?: string;
  latitude?: number;
  longitude?: number;
  tanggalMulai?: Date;
  tanggalSelesai?: Date;
  selectedLaporanIds: number[];
  detailLaporan: Array<{ laporanId: number }>;
}

export default function EditPemilihanPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const { toast } = useToast();

  // Define steps yang sama dengan create page
  const steps = ['Informasi Dasar', 'Lokasi & Wilayah', 'Pilih Laporan', 'Preview & Konfirmasi'];

  // State untuk available laporan
  const [availableLaporan, setAvailableLaporan] = useState<Laporan[]>([]);
  const [selectedLaporanList, setSelectedLaporanList] = useState<Laporan[]>([]);
  const [selectedLayout, setSelectedLayout] = useState(1);
  const [laporanSearchQuery, setLaporanSearchQuery] = useState('');

  // Initialize form with react-hook-form for Step 2 integration
  const form = useForm<PemilihanFormData>({
    defaultValues: {
      judulPemilihan: '',
      deskripsi: '',
      status: 'AKTIF',
      tingkatPemilihan: 'kota',
      provinsi: '',
      kota: '',
      kecamatan: '',
      kelurahan: '',
      rt: '',
      rw: '',
      alamatLokasi: '',
      latitude: undefined,
      longitude: undefined,
      tanggalMulai: undefined,
      tanggalSelesai: undefined,
      selectedLaporanIds: [],
      detailLaporan: []
    }
  });

  // Form data (will be synced with react-hook-form)
  const [formData, setFormData] = useState<PemilihanFormData>({
    judulPemilihan: '',
    deskripsi: '',
    status: 'AKTIF',
    tingkatPemilihan: '',
    provinsi: '',
    kota: '',
    kecamatan: '',
    kelurahan: '',
    rt: '',
    rw: '',
    alamatLokasi: '',
    latitude: undefined,
    longitude: undefined,
    tanggalMulai: undefined,
    tanggalSelesai: undefined,
    selectedLaporanIds: [],
    detailLaporan: []
  });

  // State untuk menyimpan nama wilayah (selain kode)
  const [wilayahNames, setWilayahNames] = useState({
    provinsiNama: '',
    kotaNama: '',
    kecamatanNama: '',
    kelurahanNama: ''
  });

  // Original data untuk perbandingan
  const [originalData, setOriginalData] = useState<PemilihanDTO | null>(null);

  // Watch untuk mengupdate nama wilayah ketika kode berubah
  useEffect(() => {
    const updateWilayahNames = async () => {
      const currentProvinsi = form.watch('provinsi');
      const currentKota = form.watch('kota');
      const currentKecamatan = form.watch('kecamatan');
      const currentKelurahan = form.watch('kelurahan');

      try {
        // Update nama provinsi
        if (currentProvinsi && currentProvinsi !== wilayahNames.provinsiNama) {
          const { cachedWilayahAPI } = await import('@/lib/wilayah-api');
          const provinces = await cachedWilayahAPI.getProvinces();
          const province = provinces.find((p: any) => p.code === currentProvinsi);
          if (province) {
            setWilayahNames(prev => ({ ...prev, provinsiNama: province.name }));
          }
        }

        // Update nama kota/kabupaten
        if (currentKota && currentProvinsi && currentKota !== wilayahNames.kotaNama) {
          const { cachedWilayahAPI } = await import('@/lib/wilayah-api');
          const regencies = await cachedWilayahAPI.getRegencies(currentProvinsi);
          const regency = regencies.find((r: any) => r.code === currentKota);
          if (regency) {
            setWilayahNames(prev => ({ ...prev, kotaNama: regency.name }));
          }
        }

        // Update nama kecamatan
        if (currentKecamatan && currentKota && currentKecamatan !== wilayahNames.kecamatanNama) {
          const { cachedWilayahAPI } = await import('@/lib/wilayah-api');
          const districts = await cachedWilayahAPI.getDistricts(currentKota);
          const district = districts.find((d: any) => d.code === currentKecamatan);
          if (district) {
            setWilayahNames(prev => ({ ...prev, kecamatanNama: district.name }));
          }
        }

        // Update nama kelurahan
        if (currentKelurahan && currentKecamatan && currentKelurahan !== wilayahNames.kelurahanNama) {
          const { cachedWilayahAPI } = await import('@/lib/wilayah-api');
          const villages = await cachedWilayahAPI.getVillages(currentKecamatan);
          const village = villages.find((v: any) => v.code === currentKelurahan);
          if (village) {
            setWilayahNames(prev => ({ ...prev, kelurahanNama: village.name }));
          }
        }
      } catch (error) {
        console.error('Error updating wilayah names:', error);
      }
    };

    updateWilayahNames();
  }, [form.watch('provinsi'), form.watch('kota'), form.watch('kecamatan'), form.watch('kelurahan')]);

  // Sinkronisasi formData dengan form dari react-hook-form
  useEffect(() => {
    const subscription = form.watch((value) => {
      setFormData(value as PemilihanFormData);
    });
    return () => subscription.unsubscribe();
  }, [form]);

  // Laporan state with proper initialization
  const [laporanList, setLaporanList] = useState<Laporan[]>([]);
  const [loading, setLoading] = useState(false);
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [layout, setLayout] = useState<1 | 2 | 3 | 4 | 5>(3);
  const [laporanError, setLaporanError] = useState<string | null>(null);

  // Filter state untuk laporan
  const [filters, setFilters] = useState({
    page: 0,
    size: 10,
    sortBy: 'updatedAt',
    sortDirection: 'desc',
    namaLaporan: '',
    jenisLaporanNama: '',
    status: 'ALL'
  });

  useEffect(() => {
    const loadPemilihanData = async () => {
      try {
        setIsLoading(true);
        const response = await pemilihanApi.getById(parseInt(id));
        const data = response.data;
        
        setOriginalData(data);

        const pemilihanFormData: PemilihanFormData = {
          judulPemilihan: data.judulPemilihan || '',
          deskripsi: data.deskripsi || '',
          status: data.status || 'AKTIF',
          tingkatPemilihan: data.tingkatPemilihan || '',
          provinsi: data.provinsi || '',
          kota: data.kota || '',
          kecamatan: data.kecamatan || '',
          kelurahan: data.kelurahan || '',
          rt: data.rt || '',
          rw: data.rw || '',
          alamatLokasi: data.alamatLokasi || '',
          latitude: data.latitude,
          longitude: data.longitude,
          tanggalMulai: data.tanggalMulai ? new Date(data.tanggalMulai) : (data.tanggalAktif ? new Date(data.tanggalAktif) : undefined),
          tanggalSelesai: data.tanggalSelesai ? new Date(data.tanggalSelesai) : (data.tanggalBerakhir ? new Date(data.tanggalBerakhir) : undefined),
          selectedLaporanIds: data.detailLaporan?.map((detail: any) => detail.laporanId) || [],
          detailLaporan: data.detailLaporan?.map((detail: any) => ({ laporanId: detail.laporanId })) || []
        };

        Object.keys(pemilihanFormData).forEach((key) => {
          form.setValue(key as keyof PemilihanFormData, pemilihanFormData[key as keyof PemilihanFormData]);
        });

        setFormData(pemilihanFormData);

        setWilayahNames({
          provinsiNama: data.provinsiNama || '',
          kotaNama: data.kotaNama || '',
          kecamatanNama: data.kecamatanNama || '',
          kelurahanNama: data.kelurahanNama || ''
        });

        if (pemilihanFormData.selectedLaporanIds.length > 0) {
          const selectedLaporan: Laporan[] = [];
          for (const laporanId of pemilihanFormData.selectedLaporanIds) {
            try {
              const response = await laporanAPI.getById(laporanId);
              if (response) {
                selectedLaporan.push(response);
              }
            } catch (error) {
              console.warn(`Failed to load laporan with ID ${laporanId}:`, error);
            }
          }
          setSelectedLaporanList(selectedLaporan);
        }

      } catch (error: any) {
        toast({
          title: "Error",
          description: error.message || "Gagal memuat data pemilihan",
          variant: "destructive",
        });
        router.push('/admin/pemilihan');
      } finally {
        setIsLoading(false);
      }
    };

    if (id) {
      loadPemilihanData();
    }
  }, [id, form, router, toast]);

  // Navigation functions
  const nextStep = () => {
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleCancel = () => {
    router.push('/admin/pemilihan');
  };

  // Load laporan data
  useEffect(() => {
    if (currentStep === 2) {
      loadLaporan();
    }
  }, [currentStep, filters]);

  const loadLaporan = async () => {
    setLoading(true);
    setLaporanError(null);
    try {
      const response = await laporanAPI.getAll({
        page: filters.page,
        size: filters.size,
        sortBy: filters.sortBy,
        sortDirection: filters.sortDirection,
        namaLaporan: filters.namaLaporan,
        jenisLaporanNama: filters.jenisLaporanNama,
        status: filters.status
      });
      
      if (response && response.content && Array.isArray(response.content)) {
        setLaporanList(response.content);
        setTotalElements(response.totalElements || 0);
        setTotalPages(response.totalPages || 0);
      } else {
        setLaporanList([]);
        setTotalElements(0);
        setTotalPages(0);
        setLaporanError('Data laporan tidak dapat dimuat dengan format yang benar');
      }
    } catch (error: any) {
      setLaporanList([]);
      setTotalElements(0);
      setTotalPages(0);
      setLaporanError(error.message || "Gagal memuat data laporan");
      toast({
        title: "Error",
        description: error.message || "Gagal memuat data laporan",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const loadSelectedLaporan = async () => {
      if (currentStep === 2 && formData.selectedLaporanIds.length > 0) {
        try {
          const selectedLaporan: Laporan[] = [];
          for (const laporanId of formData.selectedLaporanIds) {
            try {
              const response = await laporanAPI.getById(laporanId);
              if (response) {
                selectedLaporan.push(response);
              }
            } catch (error) {
              console.warn(`Failed to load laporan with ID ${laporanId}:`, error);
            }
          }
          setSelectedLaporanList(selectedLaporan);
        } catch (error) {
          console.error('Error loading selected laporan:', error);
        }
      }
    };

    loadSelectedLaporan();
  }, [currentStep, formData.selectedLaporanIds]);

  // Laporan selection functions
  const handleSelectLaporan = (laporan: Laporan) => {
    const currentSelection = Array.isArray(selectedLaporanList) ? selectedLaporanList : [];
    
    const isAlreadySelected = currentSelection.some(
      selected => selected.laporanId === laporan.laporanId
    );
    
    if (isAlreadySelected) {
      const newSelection = currentSelection.filter(
        selected => selected.laporanId !== laporan.laporanId
      );
      setSelectedLaporanList(newSelection);
      setFormData({
        ...formData,
        selectedLaporanIds: newSelection.map(l => l.laporanId),
        detailLaporan: newSelection.map(l => ({
          laporanId: l.laporanId
        }))
      });
    } else {
      const newSelection = [...currentSelection, laporan];
      setSelectedLaporanList(newSelection);
      setFormData({
        ...formData,
        selectedLaporanIds: newSelection.map(l => l.laporanId),
        detailLaporan: newSelection.map(l => ({
          laporanId: l.laporanId
        }))
      });
    }
  };

  const handleUnselectLaporan = (laporanId: number) => {
    const currentSelection = Array.isArray(selectedLaporanList) ? selectedLaporanList : [];
    
    const newSelection = currentSelection.filter(
      selected => selected.laporanId !== laporanId
    );
    setSelectedLaporanList(newSelection);
    setFormData({
      ...formData,
      selectedLaporanIds: newSelection.map(l => l.laporanId),
      detailLaporan: newSelection.map(l => ({
        laporanId: l.laporanId
      }))
    });
  };

  const handleClearAllSelection = () => {
    setSelectedLaporanList([]);
    setFormData({
      ...formData,
      selectedLaporanIds: [],
      detailLaporan: []
    });
  };

  // Filter functions
  const handleFilterChange = (field: string, value: string | number) => {
    setFilters({
      ...filters,
      [field]: value,
      page: 0 // Reset to first page when filter changes
    });
  };

  const handleSearch = () => {
    loadLaporan();
  };

  const clearFilters = () => {
    setFilters({
      page: 0,
      size: 10,
      sortBy: 'updatedAt',
      sortDirection: 'desc',
      namaLaporan: '',
      jenisLaporanNama: '',
      status: 'ALL'
    });
  };

  const handlePageChange = (newPage: number) => {
    setFilters({
      ...filters,
      page: newPage
    });
  };

  // Validation functions
  const validateStep1 = () => {
    const hasBasicInfo = formData.judulPemilihan.trim() !== '' && 
                        formData.deskripsi.trim() !== '';
    
    const hasValidDates = formData.tanggalMulai && formData.tanggalSelesai;
    
    const hasValidDateRange = formData.tanggalMulai && formData.tanggalSelesai && 
                             formData.tanggalMulai < formData.tanggalSelesai;
    
    return hasBasicInfo && hasValidDates && hasValidDateRange;
  };

  const validateStep2 = () => {
    const tingkatPemilihan = form.watch('tingkatPemilihan');
    const provinsi = form.watch('provinsi');
    const kota = form.watch('kota');
    const kecamatan = form.watch('kecamatan');
    const kelurahan = form.watch('kelurahan');

    if (!tingkatPemilihan || !provinsi) {
      return false;
    }
    
    // Validation based on tingkat pemilihan
    switch (tingkatPemilihan) {
      case 'provinsi':
        return provinsi.trim() !== '';
      case 'kota':
        return provinsi.trim() !== '' && kota.trim() !== '';
      case 'kecamatan':
        return provinsi.trim() !== '' && kota.trim() !== '' && kecamatan.trim() !== '';
      case 'kelurahan':
        return provinsi.trim() !== '' && kota.trim() !== '' && 
               kecamatan.trim() !== '' && kelurahan.trim() !== '';
      default:
        return false;
    }
  };

  const validateStep3 = () => {
    const currentSelection = Array.isArray(selectedLaporanList) ? selectedLaporanList : [];
    return currentSelection.length > 0;
  };

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);
      
      const currentFormData = form.getValues();
      
      const detailLaporanData = Array.isArray(selectedLaporanList) && selectedLaporanList.length > 0 
        ? selectedLaporanList.map(l => ({
            laporanId: l.laporanId
          }))
        : formData.detailLaporan || [];
      
      const requestData: CreatePemilihanRequest = {
        judulPemilihan: formData.judulPemilihan || currentFormData.judulPemilihan,
        deskripsi: formData.deskripsi || currentFormData.deskripsi,
        status: formData.status || currentFormData.status,
        tingkatPemilihan: currentFormData.tingkatPemilihan,
        provinsi: currentFormData.provinsi || formData.provinsi,
        kota: currentFormData.kota || formData.kota,
        kecamatan: currentFormData.kecamatan || formData.kecamatan || undefined,
        kelurahan: currentFormData.kelurahan || formData.kelurahan || undefined,
        rt: currentFormData.rt || formData.rt || undefined,
        rw: currentFormData.rw || formData.rw || undefined,
        alamatLokasi: currentFormData.alamatLokasi || formData.alamatLokasi || undefined,
        latitude: currentFormData.latitude || formData.latitude || undefined,
        longitude: currentFormData.longitude || formData.longitude || undefined,
        tanggalAktif: formData.tanggalMulai ? formData.tanggalMulai.toISOString() : (currentFormData.tanggalMulai ? currentFormData.tanggalMulai.toISOString() : undefined),
        tanggalBerakhir: formData.tanggalSelesai ? formData.tanggalSelesai.toISOString() : (currentFormData.tanggalSelesai ? currentFormData.tanggalSelesai.toISOString() : undefined),
        detailLaporan: detailLaporanData
      };

      await pemilihanApi.update(parseInt(id), requestData);
      
      toast({
        title: "Sukses",
        description: `Pemilihan berhasil diupdate dengan ${Array.isArray(selectedLaporanList) ? selectedLaporanList.length : 0} laporan`,
      });
      
      router.push('/admin/pemilihan');
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Gagal mengupdate pemilihan",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Status styling
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'AKTIF': return 'bg-green-500 hover:bg-green-600';
      case 'TIDAK_AKTIF': return 'bg-red-500 hover:bg-red-600';
      case 'DRAFT': return 'bg-yellow-500 hover:bg-yellow-600';
      default: return 'bg-gray-500 hover:bg-gray-600';
    }
  };

  const getStatusDisplay = (status: string) => {
    switch (status) {
      case 'AKTIF': return 'Aktif';
      case 'TIDAK_AKTIF': return 'Tidak Aktif';
      case 'DRAFT': return 'Draft';
      default: return status;
    }
  };

  const truncateText = (text: string | undefined | null, maxLength: number = 25) => {
    if (!text || typeof text !== 'string') {
      return '';
    }
    return text.length > maxLength ? text.substring(0, maxLength) + "..." : text;
  };

  const formatJenisLaporan = (jenisLaporanNama: string | undefined | null) => {
    if (!jenisLaporanNama || typeof jenisLaporanNama !== 'string') {
      return 'Tanpa jenis';
    }
    
    return jenisLaporanNama.length > 30 ? jenisLaporanNama.substring(0, 30) + '...' : jenisLaporanNama;
  };

  useEffect(() => {
    const subscription = form.watch((value) => {
      setFormData((prev) => ({
        ...prev,
        judulPemilihan: value.judulPemilihan || '',
        deskripsi: value.deskripsi || '',
        status: value.status || 'AKTIF',
        tingkatPemilihan: value.tingkatPemilihan || '',
        provinsi: value.provinsi || '',
        kota: value.kota || '',
        kecamatan: value.kecamatan || '',
        kelurahan: value.kelurahan || '',
        rt: value.rt || '',
        rw: value.rw || '',
        alamatLokasi: value.alamatLokasi || '',
        latitude: value.latitude,
        longitude: value.longitude,
        tanggalMulai: value.tanggalMulai,
        tanggalSelesai: value.tanggalSelesai,
      }));
    });
    return () => subscription.unsubscribe();
  }, [form]);

  const handleLocationChange = (lat: number | null, lng: number | null) => {
    form.setValue('latitude', lat || undefined);
    form.setValue('longitude', lng || undefined);
    setFormData(prev => ({
      ...prev,
      latitude: lat || undefined,
      longitude: lng || undefined
    }));
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
                Informasi Dasar Pemilihan
              </CardTitle>
              <p className="text-gray-600 text-sm mt-2">
                Edit informasi dasar tentang pemilihan
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="judulPemilihan">Nama Pemilihan *</Label>
                <Input
                  id="judulPemilihan"
                  value={formData.judulPemilihan}
                  onChange={(e) => {
                    const value = e.target.value;
                    setFormData({ ...formData, judulPemilihan: value });
                    form.setValue('judulPemilihan', value);
                  }}
                  placeholder="Masukkan nama pemilihan"
                  className="h-12"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="deskripsi">Deskripsi Pemilihan *</Label>
                <Textarea
                  id="deskripsi"
                  value={formData.deskripsi}
                  onChange={(e) => {
                    const value = e.target.value;
                    setFormData({ ...formData, deskripsi: value });
                    form.setValue('deskripsi', value);
                  }}
                  placeholder="Masukkan deskripsi pemilihan"
                  rows={5}
                  className="resize-none"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="status">Status *</Label>
                <Select 
                  value={formData.status} 
                  onValueChange={(value) => {
                    setFormData({ ...formData, status: value });
                    form.setValue('status', value);
                  }}
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
              
              <Form {...form}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Tanggal Mulai */}
                  <FormField
                    control={form.control}
                    name="tanggalMulai"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Tanggal Mulai *</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant="outline"
                                className={cn(
                                  "w-full pl-3 text-left font-normal",
                                  !field.value && "text-muted-foreground"
                                )}
                              >
                                {field.value ? (
                                  format(field.value, "dd MMMM yyyy", { locale: idLocale })
                                ) : (
                                  <span>Pilih tanggal mulai</span>
                                )}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={field.value}
                              onSelect={(date) => {
                                field.onChange(date);
                                setFormData(prev => ({ ...prev, tanggalMulai: date }));
                              }}
                              disabled={(date) =>
                                date < new Date(new Date().setHours(0, 0, 0, 0))
                              }
                              initialFocus
                              captionLayout="dropdown-buttons"
                              fromYear={new Date().getFullYear()}
                              toYear={new Date().getFullYear() + 10}
                              classNames={{
                                months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
                                month: "space-y-4",
                                caption: "flex justify-center pt-1 relative items-center",
                                caption_label: "text-sm font-medium",
                                caption_dropdowns: "flex justify-center gap-1",
                                vhidden: "hidden",
                                nav: "space-x-1 flex items-center",
                                nav_button: cn(
                                  "inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-7 w-7"
                                ),
                                nav_button_previous: "absolute left-1",
                                nav_button_next: "absolute right-1",
                                table: "w-full border-collapse space-y-1",
                                head_row: "flex",
                                head_cell: "text-muted-foreground rounded-md w-9 font-normal text-[0.8rem]",
                                row: "flex w-full mt-2",
                                cell: "h-9 w-9 text-center text-sm p-0 relative [&:has([aria-selected].day-range-end)]:rounded-r-md [&:has([aria-selected].day-outside)]:bg-accent/50 [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
                                day: cn(
                                  "h-9 w-9 p-0 font-normal aria-selected:opacity-100 hover:bg-accent hover:text-accent-foreground rounded-md"
                                ),
                                day_range_end: "day-range-end",
                                day_selected: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
                                day_today: "bg-accent text-accent-foreground",
                                day_outside: "day-outside text-muted-foreground opacity-50 aria-selected:bg-accent/50 aria-selected:text-muted-foreground aria-selected:opacity-30",
                                day_disabled: "text-muted-foreground opacity-50",
                                day_range_middle: "aria-selected:bg-accent aria-selected:text-accent-foreground",
                                day_hidden: "invisible",
                                dropdown: "absolute inset-0 w-full appearance-none opacity-0 z-10 cursor-pointer",
                                dropdown_month: "relative inline-flex h-8 items-center justify-between rounded-md border border-input bg-background px-3 py-1 text-sm text-foreground ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 min-w-[120px] [&>select]:text-foreground [&>select]:bg-background",
                                dropdown_year: "relative inline-flex h-8 items-center justify-between rounded-md border border-input bg-background px-3 py-1 text-sm text-foreground ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 min-w-[80px] [&>select]:text-foreground [&>select]:bg-background"
                              }}
                            />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Tanggal Selesai */}
                  <FormField
                    control={form.control}
                    name="tanggalSelesai"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Tanggal Selesai *</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant="outline"
                                className={cn(
                                  "w-full pl-3 text-left font-normal",
                                  !field.value && "text-muted-foreground"
                                )}
                              >
                                {field.value ? (
                                  format(field.value, "dd MMMM yyyy", { locale: idLocale })
                                ) : (
                                  <span>Pilih tanggal selesai</span>
                                )}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={field.value}
                              onSelect={(date) => {
                                field.onChange(date);
                                setFormData(prev => ({ ...prev, tanggalSelesai: date }));
                              }}
                              disabled={(date) =>
                                date < (formData.tanggalMulai || new Date(new Date().setHours(0, 0, 0, 0)))
                              }
                              initialFocus
                              captionLayout="dropdown-buttons"
                              fromYear={new Date().getFullYear()}
                              toYear={new Date().getFullYear() + 10}
                              classNames={{
                                months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
                                month: "space-y-4",
                                caption: "flex justify-center pt-1 relative items-center",
                                caption_label: "text-sm font-medium",
                                caption_dropdowns: "flex justify-center gap-1",
                                vhidden: "hidden",
                                nav: "space-x-1 flex items-center",
                                nav_button: cn(
                                  "inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-7 w-7"
                                ),
                                nav_button_previous: "absolute left-1",
                                nav_button_next: "absolute right-1",
                                table: "w-full border-collapse space-y-1",
                                head_row: "flex",
                                head_cell: "text-muted-foreground rounded-md w-9 font-normal text-[0.8rem]",
                                row: "flex w-full mt-2",
                                cell: "h-9 w-9 text-center text-sm p-0 relative [&:has([aria-selected].day-range-end)]:rounded-r-md [&:has([aria-selected].day-outside)]:bg-accent/50 [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
                                day: cn(
                                  "h-9 w-9 p-0 font-normal aria-selected:opacity-100 hover:bg-accent hover:text-accent-foreground rounded-md"
                                ),
                                day_range_end: "day-range-end",
                                day_selected: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
                                day_today: "bg-accent text-accent-foreground",
                                day_outside: "day-outside text-muted-foreground opacity-50 aria-selected:bg-accent/50 aria-selected:text-muted-foreground aria-selected:opacity-30",
                                day_disabled: "text-muted-foreground opacity-50",
                                day_range_middle: "aria-selected:bg-accent aria-selected:text-accent-foreground",
                                day_hidden: "invisible",
                                dropdown: "absolute inset-0 w-full appearance-none opacity-0 z-10 cursor-pointer",
                                dropdown_month: "relative inline-flex h-8 items-center justify-between rounded-md border border-input bg-background px-3 py-1 text-sm text-foreground ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 min-w-[120px] [&>select]:text-foreground [&>select]:bg-background",
                                dropdown_year: "relative inline-flex h-8 items-center justify-between rounded-md border border-input bg-background px-3 py-1 text-sm text-foreground ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 min-w-[80px] [&>select]:text-foreground [&>select]:bg-background"
                              }}
                            />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Validation Message */}
                {formData.tanggalMulai && formData.tanggalSelesai && formData.tanggalMulai >= formData.tanggalSelesai && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-center gap-2">
                    <X className="h-4 w-4 text-red-600" />
                    <p className="text-sm text-red-700">Tanggal selesai harus lebih besar dari tanggal mulai</p>
                  </div>
                )}

                {/* Period Summary */}
                {formData.tanggalMulai && formData.tanggalSelesai && formData.tanggalMulai < formData.tanggalSelesai && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <CalendarIcon className="h-4 w-4 text-blue-600" />
                      <h4 className="text-sm font-semibold text-blue-900">Ringkasan Periode</h4>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                      <div>
                        <p className="text-gray-600">Mulai:</p>
                        <p className="font-medium text-gray-900">{formData.tanggalMulai.toLocaleDateString('id-ID', { 
                          weekday: 'long', 
                          year: 'numeric', 
                          month: 'long', 
                          day: 'numeric'
                        })}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Selesai:</p>
                        <p className="font-medium text-gray-900">{formData.tanggalSelesai.toLocaleDateString('id-ID', { 
                          weekday: 'long', 
                          year: 'numeric', 
                          month: 'long', 
                          day: 'numeric'
                        })}</p>
                      </div>
                    </div>
                    <div className="mt-2 pt-2 border-t border-blue-200">
                      <p className="text-xs text-blue-700">
                        Durasi: {Math.ceil((formData.tanggalSelesai.getTime() - formData.tanggalMulai.getTime()) / (1000 * 60 * 60 * 24))} hari
                      </p>
                    </div>
                  </div>
                )}
              </Form>
            </CardContent>
          </Card>
        );

      case 1:
        return (
          <Form {...form}>
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-5 w-5" />
                    Lokasi & Wilayah Pemilihan
                  </CardTitle>
                  <p className="text-gray-600 text-sm mt-2">
                    Edit tingkat pemilihan dan wilayah untuk akurasi terbaik.
                  </p>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Tingkat Pemilihan Selection */}
                  <div className="space-y-2">
                    <Label className="text-base font-medium">Tingkat Pemilihan *</Label>
                    <p className="text-sm text-gray-600 mb-3">Pilih tingkat pemilihan untuk menentukan wilayah yang diperlukan</p>
                    <div className="grid grid-cols-1 gap-3">
                      {[
                        // { value: 'provinsi', label: 'Provinsi', icon: '🏛️' },
                        { value: 'kota', label: 'Kota/Kabupaten', icon: '🏢' },
                        // { value: 'kecamatan', label: 'Kecamatan', icon: '🏪' },
                        // { value: 'kelurahan', label: 'Kelurahan/Desa', icon: '🏠' }
                      ].map((tingkat) => (
                        <button
                          key={tingkat.value}
                          type="button"
                          onClick={() => {
                            form.setValue('tingkatPemilihan', tingkat.value);
                            setFormData(prev => ({ ...prev, tingkatPemilihan: tingkat.value }));
                          }}
                          className={`
                            p-4 rounded-lg border-2 text-center transition-all
                            ${form.watch('tingkatPemilihan') === tingkat.value 
                              ? 'border-blue-500 bg-blue-50' 
                              : 'border-gray-200 hover:border-gray-300'
                            }
                          `}
                        >
                          <div className="text-2xl mb-2">{tingkat.icon}</div>
                          <div className={`text-sm font-medium ${
                            form.watch('tingkatPemilihan') === tingkat.value ? 'text-blue-600' : 'text-gray-600'
                          }`}>
                            {tingkat.label}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Wilayah Form Integration */}
                  {form.watch('tingkatPemilihan') && (
                    <div className="bg-gray-50 p-6 rounded-lg space-y-6">
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">
                          Pilih Wilayah untuk Tingkat {
                            form.watch('tingkatPemilihan') === 'provinsi' ? 'Provinsi' :
                            form.watch('tingkatPemilihan') === 'kota' ? 'Kota/Kabupaten' :
                            form.watch('tingkatPemilihan') === 'kecamatan' ? 'Kecamatan' :
                            'Kelurahan/Desa'
                          }
                        </h4>
                        <p className="text-sm text-gray-600 mb-4">
                          Edit wilayah sesuai dengan tingkat pemilihan yang telah ditentukan
                        </p>
                      </div>

                      {/* Use WilayahFormConditional for conditional field display */}
                      <WilayahFormConditional 
                        control={form.control}
                        setValue={form.setValue}
                        watch={form.watch}
                        tingkatPemilihan={form.watch('tingkatPemilihan')}
                        onDataLoad={() => {
                          console.log('WilayahFormConditional data loaded in PemilihanEditPage');
                        }}
                      />
                    </div>
                  )}

                  {/* Map Location Picker */}
                  {form.watch('tingkatPemilihan') && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium text-gray-900 mb-2">Lokasi pada Peta (Opsional)</h4>
                          <p className="text-sm text-gray-600 mb-4">
                            Pilih titik lokasi pada peta untuk koordinat yang akurat
                          </p>
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setShowLocationPicker(!showLocationPicker)}
                          className="flex items-center gap-2"
                        >
                          {showLocationPicker ? (
                            <>
                              <Eye className="h-4 w-4" />
                              Sembunyikan Lokasi
                            </>
                          ) : (
                            <>
                              <MapPin className="h-4 w-4" />
                              Tampilkan Lokasi
                            </>
                          )}
                        </Button>
                      </div>
                      
                      {showLocationPicker && (
                        <div className="w-full border border-gray-200 rounded-lg overflow-hidden shadow-sm">
                          <MapLocationPicker
                            latitude={form.watch('latitude')}
                            longitude={form.watch('longitude')}
                            onLocationChange={handleLocationChange}
                            height="700px"
                            className="w-full"
                          />
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </Form>
        );

      case 2:
        return (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FolderOpen className="h-5 w-5" />
                  Pilih Laporan untuk Pemilihan
                </CardTitle>
                <p className="text-gray-600 text-sm mt-2">
                  Edit laporan yang akan digunakan dalam pemilihan ini. 
                  Anda dapat memilih beberapa laporan sekaligus.
                </p>
              </CardHeader>
              <CardContent>
                {/* Layout Selection */}
                <Card className="mb-6">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <LayoutGrid className="h-5 w-5" />
                      Layout Tampilan Laporan
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                      Pilih berapa laporan yang ditampilkan per baris untuk pengalaman viewing yang optimal
                    </p>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                      {LAYOUT_OPTIONS.map((option) => {
                        const IconComponent = option.icon;
                        return (
                          <button
                            key={option.value}
                            onClick={() => setLayout(option.value as any)}
                            className={`
                              p-4 rounded-lg border-2 text-center transition-all hover:shadow-md
                              ${layout === option.value 
                                ? 'border-blue-500 bg-blue-50 shadow-md' 
                                : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                              }
                            `}
                          >
                            <IconComponent className={`h-8 w-8 mx-auto mb-3 ${
                              layout === option.value ? 'text-blue-600' : 'text-gray-400'
                            }`} />
                            <div className={`text-sm font-medium mb-1 ${
                              layout === option.value ? 'text-blue-600' : 'text-gray-600'
                            }`}>
                              {option.label}
                            </div>
                            <div className={`text-xs ${
                              layout === option.value ? 'text-blue-500' : 'text-gray-500'
                            }`}>
                              {layout === option.value ? '✓ Terpilih' : 'Klik untuk pilih'}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>

                {/* Search and Filter Controls */}
                <Card className="mb-6">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Search className="h-5 w-5" />
                      Pencarian & Filter Laporan
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                      Gunakan filter untuk menemukan laporan yang sesuai dengan kebutuhan pemilihan Anda
                    </p>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Main Search Bar */}
                    <div className="space-y-2">
                      <Label htmlFor="search-laporan" className="text-base font-medium">Pencarian Laporan</Label>
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                          id="search-laporan"
                          value={filters.namaLaporan}
                          onChange={(e) => handleFilterChange('namaLaporan', e.target.value)}
                          placeholder="Cari berdasarkan nama laporan..."
                          className="pl-10 h-12 text-base"
                        />
                      </div>
                    </div>

                    {/* Filter Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="jenis-laporan" className="text-sm font-medium">Jenis Laporan</Label>
                        <Input
                          id="jenis-laporan"
                          value={filters.jenisLaporanNama}
                          onChange={(e) => handleFilterChange('jenisLaporanNama', e.target.value)}
                          placeholder="Cari jenis laporan..."
                          className="h-11"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="status" className="text-sm font-medium">Status Laporan</Label>
                        <Select 
                          value={filters.status} 
                          onValueChange={(value) => handleFilterChange('status', value)}
                        >
                          <SelectTrigger className="h-11">
                            <SelectValue placeholder="Pilih status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="ALL">📋 Semua Status</SelectItem>
                            <SelectItem value="DRAFT">📝 Draft</SelectItem>
                            <SelectItem value="DALAM_PROSES">⏳ Dalam Proses</SelectItem>
                            <SelectItem value="SELESAI">✅ Selesai</SelectItem>
                            <SelectItem value="DITOLAK">❌ Ditolak</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="page-size" className="text-sm font-medium">Tampilkan per Halaman</Label>
                        <Select 
                          value={filters.size.toString()} 
                          onValueChange={(value) => handleFilterChange('size', parseInt(value))}
                        >
                          <SelectTrigger className="h-11">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="5">5 laporan</SelectItem>
                            <SelectItem value="10">10 laporan</SelectItem>
                            <SelectItem value="25">25 laporan</SelectItem>
                            <SelectItem value="50">50 laporan</SelectItem>
                            <SelectItem value="100">100 laporan</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center justify-between pt-4 border-t">
                      <div className="flex items-center gap-4">
                        <Button 
                          onClick={handleSearch} 
                          className="flex items-center gap-2"
                        >
                          <Search className="h-4 w-4" />
                          Cari
                        </Button>
                        <Button 
                          variant="outline" 
                          onClick={clearFilters} 
                          className="flex items-center gap-2"
                        >
                          <RefreshCw className="h-4 w-4" />
                          Reset Filter
                        </Button>
                      </div>
                      
                      {/* Statistics */}
                      <div className="flex items-center gap-3">
                        <Badge variant="outline" className="text-sm px-3 py-1">
                          Total: {totalElements} laporan
                        </Badge>
                        <Badge variant="outline" className="text-sm px-3 py-1">
                          Dipilih: {Array.isArray(selectedLaporanList) ? selectedLaporanList.length : 0}
                        </Badge>
                      </div>
                    </div>

                    {/* Advanced Sorting */}
                    <div className="border-t pt-4">
                      <div className="flex flex-wrap items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-2">
                            <Label className="text-sm font-medium whitespace-nowrap">Urutkan berdasarkan:</Label>
                            <Select 
                              value={filters.sortBy} 
                              onValueChange={(value) => handleFilterChange('sortBy', value)}
                            >
                              <SelectTrigger className="w-40 h-9">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="updatedAt">📅 Tanggal Diupdate</SelectItem>
                                <SelectItem value="createdAt">📅 Tanggal Dibuat</SelectItem>
                                <SelectItem value="nama">🔤 Nama Laporan</SelectItem>
                                <SelectItem value="jenisLaporanNama">📂 Jenis Laporan</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <Label className="text-sm font-medium whitespace-nowrap">Arah:</Label>
                            <Select 
                              value={filters.sortDirection} 
                              onValueChange={(value) => handleFilterChange('sortDirection', value)}
                            >
                              <SelectTrigger className="w-32 h-9">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="desc">⬇️ Terbaru</SelectItem>
                                <SelectItem value="asc">⬆️ Terlama</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        
                        {/* Statistics */}
                        <div className="flex items-center gap-3">
                          <Badge variant="outline" className="text-sm px-3 py-1">
                            📊 Total: {totalElements} laporan
                          </Badge>
                          <Badge variant="outline" className="text-sm px-3 py-1">
                            ✅ Dipilih: {Array.isArray(selectedLaporanList) ? selectedLaporanList.length : 0}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Laporan Grid */}
                {loading ? (
                  <div className="flex justify-center items-center py-12">
                    <RefreshCw className="h-8 w-8 animate-spin" />
                    <span className="ml-2">Memuat data...</span>
                  </div>
                ) : laporanError ? (
                  <div className="text-center py-12">
                    <FileText className="h-12 w-12 mx-auto text-red-400 mb-4" />
                    <p className="text-red-500 text-lg">Error memuat data laporan</p>
                    <p className="text-red-400 text-sm mb-4">{laporanError}</p>
                    <Button onClick={loadLaporan} variant="outline" className="mt-2">
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Coba Lagi
                    </Button>
                  </div>
                ) : !Array.isArray(laporanList) || laporanList.length === 0 ? (
                  <div className="text-center py-12">
                    <FileText className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                    <p className="text-gray-500 text-lg">Tidak ada laporan aktif</p>
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
                      {laporanList.map((laporan) => {
                        const currentSelection = Array.isArray(selectedLaporanList) ? selectedLaporanList : [];
                        const isSelected = currentSelection.some(
                          selected => selected.laporanId === laporan.laporanId
                        );
                        
                        return (
                          <Card 
                            key={laporan.laporanId}
                            className={`cursor-pointer transition-all hover:shadow-md ${
                              isSelected 
                                ? 'border-blue-500 bg-blue-50 shadow-md' 
                                : 'border-gray-200 hover:border-gray-300'
                            }`}
                            onClick={() => handleSelectLaporan(laporan)}
                          >
                            <CardContent className="p-4">
                              <div className="space-y-3">
                                <div className="flex items-start justify-between">
                                  <h3 className="font-semibold text-sm line-clamp-2">
                                    {truncateText(laporan.namaLaporan || 'Tidak ada nama', 30)}
                                  </h3>
                                  {isSelected && (
                                    <div className="flex-shrink-0 w-5 h-5 bg-blue-600 text-white rounded-full flex items-center justify-center">
                                      ✓
                                    </div>
                                  )}
                                </div>
                                
                                <p className="text-xs text-gray-600 line-clamp-2">{laporan.deskripsi || 'Tidak ada deskripsi'}</p>
                                
                                <div className="flex items-center justify-between">
                                  <Badge className={getStatusColor(laporan.status || 'DRAFT')} variant="secondary">
                                    {getStatusDisplay(laporan.status || 'DRAFT')}
                                  </Badge>
                                  <span className="text-xs text-gray-500">
                                    {formatJenisLaporan(laporan.jenisLaporanNama)}
                                  </span>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                    
                    {/* Pagination */}
                    <div className="flex justify-between items-center mt-6">
                      <p className="text-sm text-gray-600">
                        Menampilkan {filters.page * filters.size + 1} - {Math.min((filters.page + 1) * filters.size, totalElements)} dari {totalElements} laporan
                      </p>
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

            {/* Selected Laporan */}
            {Array.isArray(selectedLaporanList) && selectedLaporanList.length > 0 && (
              <Card className="border-green-500 bg-green-50">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg text-green-800">
                      Laporan Terpilih ({selectedLaporanList.length})
                    </CardTitle>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={handleClearAllSelection}
                      className="text-red-600 border-red-600 hover:bg-red-50"
                    >
                      <X className="h-4 w-4 mr-2" />
                      Hapus Semua
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {selectedLaporanList.map((laporan) => (
                      <div key={laporan.laporanId} className="flex items-center justify-between p-3 bg-white rounded-lg border border-green-200">
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-sm text-gray-900 truncate">
                            {laporan.namaLaporan || 'Tidak ada nama'}
                          </h4>
                          <p className="text-xs text-gray-500 truncate">
                            {laporan.deskripsi || 'Tidak ada deskripsi'}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleUnselectLaporan(laporan.laporanId)}
                          className="ml-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="h-5 w-5" />
                  Preview & Konfirmasi Pemilihan
                </CardTitle>
                <p className="text-gray-600 text-sm mt-2">
                  Tinjau informasi pemilihan sebelum menyimpan perubahan
                </p>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-4">
                  <Card className="border-l-4 border-l-blue-500">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-600">Nama Pemilihan</p>
                          <p className="font-semibold text-gray-900">{formData.judulPemilihan || 'Belum diisi'}</p>
                        </div>
                        <Edit3 className="h-8 w-8 text-blue-500" />
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card className="border-l-4 border-l-green-500">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-600">Total Laporan</p>
                          <p className="font-semibold text-gray-900">{Array.isArray(selectedLaporanList) ? selectedLaporanList.length : 0}</p>
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
                          <p className="font-semibold text-gray-900 capitalize">{form.watch('tingkatPemilihan') || 'Belum dipilih'}</p>
                        </div>
                        <MapPin className="h-8 w-8 text-purple-500" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-l-4 border-l-orange-500">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-600">Layout Tampilan</p>
                          <p className="font-semibold text-gray-900">{layout} per baris</p>
                        </div>
                        <Monitor className="h-8 w-8 text-orange-500" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-l-4 border-l-cyan-500">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-600">Tanggal Mulai</p>
                          <p className="font-semibold text-gray-900 text-xs">
                            {formData.tanggalMulai ? formData.tanggalMulai.toLocaleDateString('id-ID') : 'Belum diisi'}
                          </p>
                        </div>
                        <CalendarIcon className="h-8 w-8 text-cyan-500" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-l-4 border-l-teal-500">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-600">Tanggal Selesai</p>
                          <p className="font-semibold text-gray-900 text-xs">
                            {formData.tanggalSelesai ? formData.tanggalSelesai.toLocaleDateString('id-ID') : 'Belum diisi'}
                          </p>
                        </div>
                        <CalendarIcon className="h-8 w-8 text-teal-500" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-l-4 border-l-red-500">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-600">Status</p>
                          <Badge className={getStatusColor(formData.status)}>
                            {getStatusDisplay(formData.status)}
                          </Badge>
                        </div>
                        <RefreshCw className="h-8 w-8 text-red-500" />
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Informasi Dasar */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Informasi Dasar</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-gray-600 mb-1">Nama Pemilihan</p>
                          <p className="font-medium">{formData.judulPemilihan}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600 mb-1">Status</p>
                          <Badge className={getStatusColor(formData.status)}>
                            {getStatusDisplay(formData.status)}
                          </Badge>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-gray-600 mb-1">Tanggal Mulai</p>
                          <p className="font-medium">
                            {formData.tanggalMulai ? formData.tanggalMulai.toLocaleDateString('id-ID') : 'Belum diisi'}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600 mb-1">Tanggal Selesai</p>
                          <p className="font-medium">
                            {formData.tanggalSelesai ? formData.tanggalSelesai.toLocaleDateString('id-ID') : 'Belum diisi'}
                          </p>
                        </div>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600 mb-1">Deskripsi</p>
                        <p className="font-medium">{formData.deskripsi}</p>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Informasi Lokasi */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Lokasi & Wilayah</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-gray-600 mb-1">Tingkat Pemilihan</p>
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                            <p className="font-medium capitalize">
                              {form.watch('tingkatPemilihan') === 'provinsi' ? 'Provinsi' :
                               form.watch('tingkatPemilihan') === 'kota' ? 'Kota/Kabupaten' :
                               form.watch('tingkatPemilihan') === 'kecamatan' ? 'Kecamatan' :
                               form.watch('tingkatPemilihan') === 'kelurahan' ? 'Kelurahan/Desa' :
                               'Belum dipilih'}
                            </p>
                          </div>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600 mb-1">Koordinat Lokasi</p>
                          <p className="font-medium text-sm">
                            {form.watch('latitude') && form.watch('longitude') 
                              ? `${form.watch('latitude')?.toFixed(6)}, ${form.watch('longitude')?.toFixed(6)}`
                              : 'Tidak diset'
                            }
                          </p>
                        </div>
                      </div>
                      <div className="space-y-4">
                        {/* Tingkat Provinsi - selalu tampil jika ada */}
                        {form.watch('tingkatPemilihan') && (wilayahNames.provinsiNama || formData.provinsi) && (
                          <div>
                            <p className="text-sm text-gray-600 mb-1">Provinsi</p>
                            <p className="font-medium">{wilayahNames.provinsiNama || formData.provinsi}</p>
                          </div>
                        )}

                        {/* Tingkat Kota - tampil jika tingkat kota, kecamatan, atau kelurahan */}
                        {(form.watch('tingkatPemilihan') === 'kota' || form.watch('tingkatPemilihan') === 'kecamatan' || form.watch('tingkatPemilihan') === 'kelurahan') && (wilayahNames.kotaNama || formData.kota) && (
                          <div>
                            <p className="text-sm text-gray-600 mb-1">Kota/Kabupaten</p>
                            <p className="font-medium">{wilayahNames.kotaNama || formData.kota}</p>
                          </div>
                        )}

                        {/* Tingkat Kecamatan - tampil jika tingkat kecamatan atau kelurahan */}
                        {(form.watch('tingkatPemilihan') === 'kecamatan' || form.watch('tingkatPemilihan') === 'kelurahan') && (wilayahNames.kecamatanNama || formData.kecamatan) && (
                          <div>
                            <p className="text-sm text-gray-600 mb-1">Kecamatan</p>
                            <p className="font-medium">{wilayahNames.kecamatanNama || formData.kecamatan}</p>
                          </div>
                        )}

                        {/* Tingkat Kelurahan - tampil jika tingkat kelurahan */}
                        {form.watch('tingkatPemilihan') === 'kelurahan' && (wilayahNames.kelurahanNama || formData.kelurahan) && (
                          <div>
                            <p className="text-sm text-gray-600 mb-1">Kelurahan/Desa</p>
                            <p className="font-medium">{wilayahNames.kelurahanNama || formData.kelurahan}</p>
                          </div>
                        )}

                        {!form.watch('tingkatPemilihan') && (
                          <div className="text-gray-500 text-center py-4">
                            <MapPin className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                            <p>Silakan pilih tingkat pemilihan dan wilayah terlebih dahulu</p>
                          </div>
                        )}
                      </div>
                      {(formData.rt || formData.rw || formData.alamatLokasi) && (
                        <div className="pt-2 border-t">
                          <p className="text-sm text-gray-600 mb-2">Informasi Tambahan</p>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {formData.rt && (
                              <div>
                                <p className="text-xs text-gray-500">RT</p>
                                <p className="font-medium">{formData.rt}</p>
                              </div>
                            )}
                            {formData.rw && (
                              <div>
                                <p className="text-xs text-gray-500">RW</p>
                                <p className="font-medium">{formData.rw}</p>
                              </div>
                            )}
                            {formData.alamatLokasi && (
                              <div className="md:col-span-2">
                                <p className="text-xs text-gray-500">Alamat Detail</p>
                                <p className="font-medium">{formData.alamatLokasi}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>

                {/* Laporan Terpilih */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Laporan Terpilih ({Array.isArray(selectedLaporanList) ? selectedLaporanList.length : 0})</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {!Array.isArray(selectedLaporanList) || selectedLaporanList.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        <FolderOpen className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                        <p>Belum ada laporan yang dipilih</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {selectedLaporanList.map((laporan, index) => (
                          <div key={laporan.laporanId}>
                            <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg">
                              <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-sm">
                                {index + 1}
                              </div>
                              <div className="flex-1">
                                <h4 className="font-semibold text-gray-900 mb-1">
                                  {laporan.namaLaporan || 'Tidak ada nama'}
                                </h4>
                                <p className="text-sm text-gray-600 mb-2">
                                  {laporan.deskripsi || 'Tidak ada deskripsi'}
                                </p>
                                <div className="flex items-center gap-2">
                                  <Badge className={getStatusColor(laporan.status || 'DRAFT')} variant="secondary">
                                    {getStatusDisplay(laporan.status || 'DRAFT')}
                                  </Badge>
                                  <span className="text-xs text-gray-500">
                                    {formatJenisLaporan(laporan.jenisLaporanNama)}
                                  </span>
                                </div>
                              </div>
                            </div>
                            {index < selectedLaporanList.length - 1 && (
                              <hr className="border-gray-200" />
                            )}
                          </div>
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
        return (
          <div className="text-center py-12">
            <p className="text-gray-500">Step content akan ditambahkan...</p>
            <p className="text-sm text-gray-400 mt-2">
              Step {currentStep + 1} of {steps.length} - {steps[currentStep]}
            </p>
          </div>
        );
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex items-center gap-3">
          <RefreshCw className="h-8 w-8 animate-spin text-blue-600" />
          <span className="text-lg text-gray-600">Memuat data pemilihan...</span>
        </div>
      </div>
    );
  }

  // Continue with rest of component...
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
              <h1 className="text-3xl font-bold tracking-tight">Edit Pemilihan</h1>
              <p className="text-muted-foreground">
                Edit pemilihan "{originalData?.judulPemilihan || 'Loading...'}"
              </p>
            </div>
          </div>
        </div>

        {/* Stepper */}
        <Stepper currentStep={currentStep} steps={steps} />

        {/* Step Content */}
        <div className="w-full mx-auto">
          {renderStepContent()}
        </div>

        {/* Navigation Buttons */}
        <Card className="w-full mx-auto mt-8">
          <CardContent className="p-6">
            <div className="flex justify-between items-center">
              <Button
                variant="outline"
                onClick={prevStep}
                disabled={currentStep === 0}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Sebelumnya
              </Button>

              <div className="text-sm text-gray-500">
                Langkah {currentStep + 1} dari {steps.length}
              </div>

              {currentStep === steps.length - 1 ? (
                <Button
                  onClick={handleSubmit}
                  disabled={isSubmitting || !validateStep3()}
                  className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
                >
                  {isSubmitting && <RefreshCw className="h-4 w-4 animate-spin" />}
                  <Save className="h-4 w-4" />
                  Update Pemilihan
                </Button>
              ) : (
                <Button
                  onClick={nextStep}
                  disabled={
                    (currentStep === 0 && !validateStep1()) ||
                    (currentStep === 1 && !validateStep2()) ||
                    (currentStep === 2 && !validateStep3())
                  }
                  className="flex items-center gap-2"
                >
                  Selanjutnya
                  <ArrowRight className="h-4 w-4" />
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
