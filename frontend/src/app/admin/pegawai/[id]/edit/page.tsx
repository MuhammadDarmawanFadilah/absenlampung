"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { 
  ArrowLeft, ArrowRight, Save, RefreshCw, User, MapPin, 
  Vote, Eye, FileText, Monitor, Tablet, LayoutGrid, 
  Grid3X3, Smartphone, Search, ChevronLeft, ChevronRight,
  Plus, X, CheckCircle2, Circle, Shield, CheckCircle,
  Camera, Upload, UserCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { getApiUrl } from "@/lib/config";
import { getWilayahName } from "@/lib/wilayah-api";
import WilayahForm from "@/components/WilayahForm";
import MapLocationPicker from "@/components/MapLocationPicker";
import PhotoUpload from "@/components/PhotoUpload";
import { EducationSearchDropdown } from "@/components/EducationSearchDropdown";
import { JabatanSearchDropdown } from "@/components/JabatanSearchDropdown";

// Layout options untuk tampilan pemilihan
const LAYOUT_OPTIONS = [
  { value: 1, label: '1 per baris', icon: Monitor },
  { value: 2, label: '2 per baris', icon: Tablet },
  { value: 3, label: '3 per baris', icon: LayoutGrid },
  { value: 4, label: '4 per baris', icon: Grid3X3 },
  { value: 5, label: '5 per baris', icon: Smartphone },
];

// Stepper configuration
const STEPS = [
  {
    id: 'personal',
    title: 'Data Pribadi',
    description: 'Informasi akun dan pribadi',
    icon: User,
    fields: ['username', 'password', 'fullName', 'email', 'phoneNumber', 'nip', 'pendidikan', 'role', 'jabatan', 'status']
  },
  {
    id: 'location',
    title: 'Lokasi & Alamat',
    description: 'Informasi tempat tinggal',
    icon: MapPin,
    fields: ['alamat', 'provinsi', 'kota', 'kecamatan', 'kelurahan', 'kodePos', 'latitude', 'longitude']
  },
  {
    id: 'pemilihan',
    title: 'Pemilihan TPS',
    description: 'Pilih pemilihan yang ditugaskan',
    icon: Vote,
    fields: ['selectedPemilihanIds']
  },
  {
    id: 'review',
    title: 'Review & Konfirmasi',
    description: 'Tinjau data sebelum menyimpan',
    icon: CheckCircle2,
    fields: ['totalTps']
  }
];

// Form data interface
interface PegawaiFormData {
  username: string;
  password: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  nip: string;
  pendidikan: string;
  role: string;
  jabatan: string;
  status: 'AKTIF' | 'TIDAK_AKTIF' | 'SUSPEND';
  alamat?: string;
  provinsi?: string;
  kota?: string;
  kecamatan?: string;
  kelurahan?: string;
  kodePos?: string;
  latitude?: number;
  longitude?: number;
  selectedPemilihanIds: number[];
  totalTps?: number;
  photo?: File | null;
  photoUrl?: string;
}

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
  namaJabatan?: string;
  status: string;
  alamat?: string;
  provinsi?: string;
  kota?: string;
  kecamatan?: string;
  kelurahan?: string;
  kodePos?: string;
  latitude?: number;
  longitude?: number;
  totalTps?: number;
  totalPemilihan?: number;
  pemilihanList?: Array<{
    id: number;
    pemilihanId?: number;
    judulPemilihan: string;
    deskripsi?: string;
    status?: string;
    tingkatPemilihan?: string;
    totalLaporan: number;
    totalJenisLaporan: number;
    createdAt?: string;
  }>;
}

interface Pemilihan {
  id: number;
  pemilihanId?: number;
  judulPemilihan: string;
  deskripsi: string;
  status: string;
  tingkatPemilihan: string;
  totalLaporan: number;
  totalJenisLaporan: number;
  provinsiNama?: string;
  kotaNama?: string;
  kecamatanNama?: string;
  kelurahanNama?: string;
  createdAt: string;
}

interface Role {
  roleId: number;
  roleName: string;
  description?: string;
}

// Stepper Component
function StepperComponent({ currentStep, totalSteps }: { currentStep: number; totalSteps: number }) {
  const steps = STEPS;

  return (
    <div className="w-full py-6">
      <div className="flex items-center justify-between mb-4">
        {steps.map((step, index) => (
          <div key={index} className="flex items-center">
            <div className={`
              flex items-center justify-center w-10 h-10 rounded-full border-2 font-semibold text-sm
              ${index <= currentStep 
                ? 'bg-blue-600 text-white border-blue-600' 
                : 'bg-gray-200 text-gray-500 border-gray-200'
              }
            `}>
              {index < currentStep ? (
                <CheckCircle className="h-5 w-5" />
              ) : (
                <step.icon className="h-5 w-5" />
              )}
            </div>
            <div className={`ml-3 text-left ${index <= currentStep ? 'text-blue-600' : 'text-gray-500'}`}>
              <div className="text-sm font-medium">{step.title}</div>
              <div className="text-xs">{step.description}</div>
            </div>
            {index < steps.length - 1 && (
              <div className={`flex-1 h-0.5 mx-4 ${
                index < currentStep ? 'bg-blue-600' : 'bg-gray-200'
              }`} />
            )}
          </div>
        ))}
      </div>
      <div className="mt-6">
        <Progress value={((currentStep + 1) / totalSteps) * 100} className="h-3" />
        <div className="flex justify-between mt-2 text-sm text-gray-600">
          <span>Langkah {currentStep + 1} dari {totalSteps}</span>
          <span>{Math.round(((currentStep + 1) / totalSteps) * 100)}%</span>
        </div>
      </div>
    </div>
  );
}

export default function EditPegawaiPage() {
  const router = useRouter();
  const params = useParams();
  const pegawaiId = parseInt(params.id as string);
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [validating, setValidating] = useState(false);
  const { token } = useAuth();

  // Original pegawai data
  const [originalPegawai, setOriginalPegawai] = useState<Pegawai | null>(null);

  // Initialize form with react-hook-form for location step
  const locationForm = useForm({
    defaultValues: {
      alamat: '',
      provinsi: '',
      kota: '',
      kecamatan: '',
      kelurahan: '',
      kodePos: '',
      latitude: '',
      longitude: ''
    }
  });

  // Form data state
  const [formData, setFormData] = useState<PegawaiFormData>({
    username: '',
    password: '',
    fullName: '',
    email: '',
    phoneNumber: '',
    nip: '',
    pendidikan: '',
    role: '',
    jabatan: '',
    status: 'AKTIF',
    alamat: '',
    provinsi: '',
    kota: '',
    kecamatan: '',
    kelurahan: '',
    kodePos: '',
    latitude: undefined,
    longitude: undefined,
    selectedPemilihanIds: [],
    totalTps: 0,
    photo: null,
    photoUrl: ''
  });

  // Pemilihan state
  const [pemilihanList, setPemilihanList] = useState<Pemilihan[]>([]);
  const [selectedPemilihanList, setSelectedPemilihanList] = useState<Pemilihan[]>([]);
  const [loading, setLoading] = useState(false);
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  
  // Roles state
  const [availableRoles, setAvailableRoles] = useState<Role[]>([]);
  const [rolesLoading, setRolesLoading] = useState(false);
  
  // Location names state for review step
  const [locationNames, setLocationNames] = useState({
    provinsiName: '',
    kotaName: '',
    kecamatanName: '',
    kelurahanName: ''
  });
  
  // Filter state untuk pemilihan - with separate search input
  const [filters, setFilters] = useState({
    page: 0,
    size: 10,
    sortBy: 'createdAt',
    sortDirection: 'desc' as 'asc' | 'desc',
    judulPemilihan: '',
    status: 'AKTIF' as 'AKTIF' | 'TIDAK_AKTIF' | 'DRAFT' | 'ALL'
  });
  
  // Separate search input state (not applied until search button is clicked)
  const [searchInput, setSearchInput] = useState('');
  
  // Layout state
  const [layout, setLayout] = useState<1 | 2 | 3 | 4 | 5>(3);

  // Helper function to get authorization headers
  const getAuthHeaders = () => ({
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` })
  });

  // Load pegawai data on mount
  useEffect(() => {
    loadPegawaiData();
    loadRoles();
  }, [pegawaiId]);

  // Load pemilihan data when step changes to 2
  useEffect(() => {
    if (currentStep === 2) {
      loadPemilihan();
    }
  }, [currentStep, filters]);

  // Sync location form changes with main form data
  useEffect(() => {
    const subscription = locationForm.watch((value) => {
      setFormData(prev => ({
        ...prev,
        provinsi: value.provinsi || '',
        kota: value.kota || '',
        kecamatan: value.kecamatan || '',
        kelurahan: value.kelurahan || '',
        kodePos: value.kodePos || '',
        latitude: value.latitude ? parseFloat(value.latitude as string) || undefined : undefined,
        longitude: value.longitude ? parseFloat(value.longitude as string) || undefined : undefined
      }));
    });
    return () => subscription.unsubscribe();
  }, [locationForm]);

  // Load roles function
  const loadRoles = async () => {
    try {
      setRolesLoading(true);
      const response = await fetch(getApiUrl('roles/all'), {
        headers: getAuthHeaders()
      });
      
      if (response.ok) {
        const rolesData = await response.json();
        setAvailableRoles(rolesData);
      } else {
        console.error('Failed to load roles:', response.statusText);
        toast.error("Error", {
          description: "Gagal memuat data roles",
        });
      }
    } catch (error) {
      console.error('Error loading roles:', error);
      toast.error("Error", {
        description: "Terjadi kesalahan saat memuat roles",
      });
    } finally {
      setRolesLoading(false);
    }
  };

  // Function to fetch location names
  const fetchLocationNames = async () => {
    try {
      const names = await Promise.all([
        formData.provinsi ? getWilayahName(formData.provinsi) : Promise.resolve(''),
        formData.kota ? getWilayahName(formData.kota) : Promise.resolve(''),
        formData.kecamatan ? getWilayahName(formData.kecamatan) : Promise.resolve(''),
        formData.kelurahan ? getWilayahName(formData.kelurahan) : Promise.resolve('')
      ]);
      
      setLocationNames({
        provinsiName: names[0],
        kotaName: names[1],
        kecamatanName: names[2],
        kelurahanName: names[3]
      });
    } catch (error) {
      console.error('Error fetching location names:', error);
      // Fallback to codes if API fails
      setLocationNames({
        provinsiName: formData.provinsi || '',
        kotaName: formData.kota || '',
        kecamatanName: formData.kecamatan || '',
        kelurahanName: formData.kelurahan || ''
      });
    }
  };

  const loadPegawaiData = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(getApiUrl(`/api/pegawai/${pegawaiId}`), {
        headers: getAuthHeaders()
      });

      if (response.ok) {
        const pegawai = await response.json();
        setOriginalPegawai(pegawai);
        
        // Extract selected pemilihan IDs
        const selectedIds = pegawai.pemilihanList ? pegawai.pemilihanList.map((p: any) => p.id) : [];
        
        // Set form data from existing pegawai
        setFormData({
          username: pegawai.username,
          password: '', // Don't populate password for security
          fullName: pegawai.fullName,
          email: pegawai.email,
          phoneNumber: pegawai.phoneNumber,
          nip: pegawai.nip || '',
          pendidikan: pegawai.pendidikan || '',
          role: pegawai.role || pegawai.jabatan || '', // Use role field or fallback to jabatan for backward compatibility
          jabatan: pegawai.namaJabatan || pegawai.jabatan || '', // Use actual jabatan name
          status: pegawai.status,
          alamat: pegawai.alamat || '',
          provinsi: pegawai.provinsi || '',
          kota: pegawai.kota || '',
          kecamatan: pegawai.kecamatan || '',
          kelurahan: pegawai.kelurahan || '',
          kodePos: pegawai.kodePos || '',
          latitude: pegawai.latitude,
          longitude: pegawai.longitude,
          selectedPemilihanIds: selectedIds,
          totalTps: pegawai.totalTps || 0,
          photo: null,
          photoUrl: pegawai.photoUrl || ''
        });

        // Set location form values
        locationForm.reset({
          alamat: pegawai.alamat || '',
          provinsi: pegawai.provinsi || '',
          kota: pegawai.kota || '',
          kecamatan: pegawai.kecamatan || '',
          kelurahan: pegawai.kelurahan || '',
          kodePos: pegawai.kodePos || '',
          latitude: pegawai.latitude ? pegawai.latitude.toString() : '',
          longitude: pegawai.longitude ? pegawai.longitude.toString() : ''
        });

        // Set selected pemilihan list
        if (pegawai.pemilihanList) {
          setSelectedPemilihanList(pegawai.pemilihanList.map((p: any) => ({
            id: p.id,
            pemilihanId: p.pemilihanId || p.id,
            judulPemilihan: p.judulPemilihan,
            deskripsi: p.deskripsi || '',
            status: p.status || 'AKTIF',
            tingkatPemilihan: p.tingkatPemilihan || '',
            totalLaporan: p.totalLaporan || 0,
            totalJenisLaporan: p.totalJenisLaporan || 0,
            createdAt: p.createdAt || new Date().toISOString()
          })));
        }
      } else {
        const errorText = await response.text();
        toast.error("Error", {
          description: errorText || "Gagal memuat data pegawai",
        });
        router.push('/admin/pegawai');
      }
    } catch (error: any) {
      console.error('Error loading pegawai:', error);
      toast.error("Error", {
        description: error.message || "Gagal memuat data pegawai",
      });
      router.push('/admin/pegawai');
    } finally {
      setIsLoading(false);
    }
  };

  const loadPemilihan = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.append('page', filters.page.toString());
      params.append('size', filters.size.toString());
      params.append('sortBy', filters.sortBy);
      params.append('sortDirection', filters.sortDirection);
      if (filters.judulPemilihan) params.append('keyword', filters.judulPemilihan);
      if (filters.status !== 'ALL') params.append('status', filters.status);
      
      const response = await fetch(getApiUrl(`/api/pemilihan/search-paged?${params.toString()}`), {
        headers: getAuthHeaders()
      });
      
      if (response.ok) {
        const data = await response.json();
        setPemilihanList(data.content || []);
        setTotalElements(data.totalElements || 0);
        setTotalPages(data.totalPages || 0);
      } else {
        const errorText = await response.text();
        toast.error("Error", {
          description: errorText || "Gagal memuat data pemilihan",
        });
      }
    } catch (error: any) {
      console.error('Error loading pemilihan:', error);
      toast.error("Error", {
        description: error.message || "Gagal memuat data pemilihan",
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
    console.log('Search button clicked, searchInput:', searchInput);
    // Apply the search input to the actual filter
    setFilters(prevFilters => ({
      ...prevFilters,
      judulPemilihan: searchInput,
      page: 0 // Reset to first page
    }));
  };

  const clearFilters = () => {
    setSearchInput('');
    setFilters({
      page: 0,
      size: filters.size,
      sortBy: 'createdAt',
      sortDirection: 'desc' as 'asc' | 'desc',
      judulPemilihan: '',
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
  const nextStep = async () => {
    if (currentStep < STEPS.length - 1) {
      // Validate current step before proceeding
      let canProceed = true;
      
      if (currentStep === 0) {
        setValidating(true);
        try {
          canProceed = await validateStep1();
        } finally {
          setValidating(false);
        }
      } else if (currentStep === 1) {
        canProceed = validateStep2();
      } else if (currentStep === 2) {
        canProceed = validateStep3();
      }
      
      if (canProceed) {
        // If moving to review step (step 3), fetch location names
        if (currentStep === 2) {
          await fetchLocationNames();
        }
        setCurrentStep(currentStep + 1);
      }
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleCancel = () => {
    router.push('/admin/pegawai');
  };

  // Pemilihan selection - Multiple selection logic (like laporan selection)
  const handleSelectPemilihan = useCallback((pemilihan: Pemilihan) => {
    // Ensure selectedPemilihanList is always an array
    const currentSelection = Array.isArray(selectedPemilihanList) ? selectedPemilihanList : [];
    
    // Use pemilihanId as the key since that's what the API returns
    const pemilihanKey = pemilihan.pemilihanId || pemilihan.id;
    if (!pemilihanKey) return; // Skip if no valid ID
    
    // Check if this item is currently selected
    const isAlreadySelected = currentSelection.some(
      selected => (selected.pemilihanId || selected.id) === pemilihanKey
    );
    
    if (isAlreadySelected) {
      // Remove from selection
      const newSelection = currentSelection.filter(
        selected => (selected.pemilihanId || selected.id) !== pemilihanKey
      );
      setSelectedPemilihanList(newSelection);
      setFormData(prev => ({
        ...prev,
        selectedPemilihanIds: newSelection.map(p => p.pemilihanId || p.id).filter(id => id !== undefined) as number[]
      }));
    } else {
      // Add to selection
      const newSelection = [...currentSelection, pemilihan];
      setSelectedPemilihanList(newSelection);
      setFormData(prev => ({
        ...prev,
        selectedPemilihanIds: newSelection.map(p => p.pemilihanId || p.id).filter(id => id !== undefined) as number[]
      }));
    }
  }, [selectedPemilihanList]);

  const handleUnselectPemilihan = (pemilihanId: number | undefined) => {
    if (!pemilihanId) return;
    
    const newSelection = selectedPemilihanList.filter(
      selected => (selected.pemilihanId || selected.id) !== pemilihanId
    );
    setSelectedPemilihanList(newSelection);
    setFormData({
      ...formData,
      selectedPemilihanIds: newSelection.map(p => p.pemilihanId || p.id).filter(id => id !== undefined) as number[]
    });
  };

  const handleClearAllSelection = () => {
    // Reset to original pemilihan if available
    if (originalPegawai && originalPegawai.pemilihanList) {
      const originalSelection = originalPegawai.pemilihanList.map((p: any) => ({
        id: p.id,
        pemilihanId: p.pemilihanId || p.id,
        judulPemilihan: p.judulPemilihan,
        deskripsi: p.deskripsi || '',
        status: p.status || 'AKTIF',
        tingkatPemilihan: p.tingkatPemilihan || '',
        totalLaporan: p.totalLaporan || 0,
        totalJenisLaporan: p.totalJenisLaporan || 0,
        createdAt: p.createdAt || new Date().toISOString()
      }));
      setSelectedPemilihanList(originalSelection);
      setFormData({
        ...formData,
        selectedPemilihanIds: originalSelection.map(p => p.pemilihanId || p.id).filter(id => id !== undefined) as number[]
      });
    } else {
      setSelectedPemilihanList([]);
      setFormData({
        ...formData,
        selectedPemilihanIds: []
      });
    }
  };

  // Validation functions
  const validateStep1 = async () => {
    setValidating(true);
    
    // Check mandatory fields
    const mandatoryErrors = [];
    
    if (!formData.username.trim()) mandatoryErrors.push("Username harus diisi");
    // Note: Password not required for edit (optional update)
    if (!formData.fullName.trim()) mandatoryErrors.push("Nama lengkap harus diisi");
    if (!formData.email.trim()) mandatoryErrors.push("Email harus diisi");
    if (!formData.phoneNumber.trim()) mandatoryErrors.push("Nomor telepon harus diisi");
    if (!formData.nip.trim()) mandatoryErrors.push("NIK harus diisi");
    if (!formData.pendidikan.trim()) mandatoryErrors.push("Pendidikan harus diisi");
    if (!formData.role.trim()) mandatoryErrors.push("Role harus diisi");
    if (!formData.jabatan.trim()) mandatoryErrors.push("Jabatan harus diisi");
    if (!formData.status.trim()) mandatoryErrors.push("Status harus diisi");
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (formData.email.trim() && !emailRegex.test(formData.email)) {
      mandatoryErrors.push("Format email tidak valid");
    }
    
    // Validate phone number format (basic)
    const phoneRegex = /^[0-9+\-\s()]+$/;
    if (formData.phoneNumber.trim() && !phoneRegex.test(formData.phoneNumber)) {
      mandatoryErrors.push("Format nomor telepon tidak valid");
    }
    
    if (mandatoryErrors.length > 0) {
      setValidating(false);
      toast.error("Validasi Gagal", {
        description: mandatoryErrors.join(", "),
      });
      return false;
    }
    
    // Check for duplicates (excluding current pegawai)
    try {
      const checkData = {
        username: formData.username.trim(),
        email: formData.email.trim(),
        phoneNumber: formData.phoneNumber.trim(),
        nip: formData.nip.trim(),
        excludeId: pegawaiId // Exclude current pegawai from duplicate check
      };
      
      const response = await fetch(getApiUrl('/api/pegawai/check-duplicate'), {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(checkData)
      });
      
      if (response.ok) {
        const result = await response.json();
        const duplicateErrors = [];
        
        if (result.usernameExists) {
          duplicateErrors.push("Username sudah terdaftar");
        }
        if (result.emailExists) {
          duplicateErrors.push("Email sudah terdaftar");
        }
        if (result.phoneExists) {
          duplicateErrors.push("Nomor telepon sudah terdaftar");
        }
        if (result.nipExists) {
          duplicateErrors.push("NIK sudah terdaftar");
        }
        
        if (duplicateErrors.length > 0) {
          setValidating(false);
          toast.error("Data Sudah Terdaftar", {
            description: duplicateErrors.join(", "),
          });
          return false;
        }
        
        setValidating(false);
        return true;
      } else {
        const errorText = await response.text();
        setValidating(false);
        toast.error("Error", {
          description: errorText || "Gagal memvalidasi data",
        });
        return false;
      }
    } catch (error: any) {
      console.error('Error validating step 1:', error);
      setValidating(false);
      toast.error("Error", {
        description: error.message || "Terjadi kesalahan saat validasi",
      });
      return false;
    }
  };

  const validateStep2 = () => {
    return true; // Location is optional
  };

  const validateStep3 = () => {
    return selectedPemilihanList.length > 0;
  };

  // Submit function
  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);
      
      // Create request data without password field
      const { password, ...formDataWithoutPassword } = formData;
      
      const requestData = {
        ...formDataWithoutPassword,
        totalTps: formData.totalTps || selectedPemilihanList.length,
        // Only include password if it was changed (not empty)
        ...(password && password.trim() ? { password: password.trim() } : {})
      };

      const response = await fetch(getApiUrl(`/api/pegawai/${pegawaiId}`), {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(requestData)
      });

      if (response.ok) {
        toast.success("Sukses", {
          description: "Pegawai berhasil diperbarui",
        });
        router.push('/admin/pegawai');
      } else {
        const errorText = await response.text();
        toast.error("Error", {
          description: errorText || "Gagal memperbarui pegawai",
        });
      }
    } catch (error: any) {
      console.error('Error updating pegawai:', error);
      toast.error("Error", {
        description: error.message || "Gagal memperbarui pegawai",
      });
    } finally {
      setIsSubmitting(false);
    }
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
          <div className="h-8 w-8 animate-spin mx-auto mb-4 rounded-full border-4 border-blue-600 border-t-transparent"></div>
          <p className="text-gray-600">Memuat data pegawai...</p>
        </div>
      </div>
    );
  }

  // Render step content - Similar to create page but with edit-specific modifications
  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Edit Data Pribadi Pegawai
              </CardTitle>
              <p className="text-sm text-gray-600">
                Perbarui informasi akun dan data pribadi pegawai
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Photo Upload - Centered */}
              <div className="flex justify-center mb-8">
                <PhotoUpload
                  value={formData.photoUrl || ''}
                  onChange={(url) => setFormData({ ...formData, photoUrl: url })}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="nip">NIK *</Label>
                <Input
                  id="nip"
                  value={formData.nip}
                  onChange={(e) => {
                    const nikValue = e.target.value;
                    setFormData({ 
                      ...formData, 
                      nip: nikValue,
                      // Auto-fill username with NIK value if username is empty or same as previous NIK
                      username: !formData.username || formData.username === formData.nip ? nikValue : formData.username
                    });
                  }}
                  placeholder="Masukkan NIK"
                  className="h-12"
                />
                <p className="text-sm text-gray-500">
                  NIK akan otomatis mengisi username, namun username bisa diubah manual
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="fullName">Nama Lengkap *</Label>
                <Input
                  id="fullName"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  placeholder="Masukkan nama lengkap"
                  className="h-12"
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="username">Username *</Label>
                  <Input
                    id="username"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    placeholder="Masukkan username"
                    className="h-12"
                  />
                  <p className="text-sm text-gray-500">
                    Username otomatis terisi dari NIK, dapat diubah manual
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="password">Password (kosongkan jika tidak diubah)</Label>
                  <Input
                    id="password"
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="Kosongkan jika tidak diubah"
                    className="h-12"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="Masukkan email"
                    className="h-12"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="phoneNumber">No HP/WA *</Label>
                  <Input
                    id="phoneNumber"
                    value={formData.phoneNumber}
                    onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                    placeholder="Masukkan nomor HP/WA"
                    className="h-12"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="pendidikan">Pendidikan *</Label>
                  <EducationSearchDropdown
                    value={formData.pendidikan}
                    onValueChange={(value) => setFormData({ ...formData, pendidikan: value })}
                    placeholder="Pilih pendidikan terakhir"
                  />
                  <p className="text-sm text-gray-500">
                    Pilih jenjang pendidikan terakhir yang ditempuh
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="role">Role *</Label>
                  <Select 
                    value={formData.role} 
                    onValueChange={(value) => setFormData({ ...formData, role: value })}
                    disabled={rolesLoading}
                  >
                    <SelectTrigger className="h-12">
                      <SelectValue placeholder={rolesLoading ? "Memuat roles..." : "Pilih role"} />
                    </SelectTrigger>
                    <SelectContent>
                      {availableRoles.map((role) => (
                        <SelectItem key={role.roleId} value={role.roleName}>
                          <div className="flex items-center gap-2">
                            <Shield className={`h-4 w-4 ${
                              role.roleName === 'ADMIN' ? 'text-red-600' : 
                              role.roleName === 'USER' ? 'text-blue-600' : 
                              'text-gray-600'
                            }`} />
                            <div>
                              <div className="font-medium">{role.roleName}</div>
                              {role.description && (
                                <div className="text-xs text-gray-500 max-w-xs">{role.description}</div>
                              )}
                            </div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {rolesLoading && (
                    <p className="text-sm text-gray-500">Memuat data roles...</p>
                  )}
                  <p className="text-sm text-gray-500">
                    Role menentukan hak akses pengguna dalam sistem
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="jabatan">Jabatan *</Label>
                <JabatanSearchDropdown
                  value={formData.jabatan}
                  onValueChange={(value) => setFormData({ ...formData, jabatan: value })}
                  placeholder="Pilih jabatan"
                />
                <p className="text-sm text-gray-500">
                  Pilih jabatan sesuai dengan posisi di organisasi
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Status *</Label>
                <Select 
                  value={formData.status} 
                  onValueChange={(value: 'AKTIF' | 'TIDAK_AKTIF' | 'SUSPEND') => 
                    setFormData({ ...formData, status: value })
                  }
                >
                  <SelectTrigger className="h-12">
                    <SelectValue placeholder="Pilih status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="AKTIF">Aktif</SelectItem>
                    <SelectItem value="TIDAK_AKTIF">Tidak Aktif</SelectItem>
                    <SelectItem value="SUSPEND">Suspend</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        );

      case 1:
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Edit Lokasi & Alamat
              </CardTitle>
              <p className="text-sm text-gray-600">
                Perbarui informasi lokasi dan alamat pegawai (opsional)
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Alamat Lengkap */}
              <div className="space-y-2">
                <Label htmlFor="alamat">Alamat Lengkap</Label>
                <Textarea
                  id="alamat"
                  value={formData.alamat}
                  onChange={(e) => setFormData({ ...formData, alamat: e.target.value })}
                  placeholder="Masukkan alamat lengkap (nama jalan, nomor rumah, RT/RW, dll.)"
                  rows={4}
                  className="resize-none"
                />
                <p className="text-sm text-gray-500">
                  Contoh: Jl. Merdeka No. 123, RT 001 RW 005, Perumahan Indah Blok A
                </p>
              </div>

              {/* Wilayah Form - Clean Integration like BiografiFormStepper */}
              <div className="space-y-6">
                <Form {...locationForm}>
                  <WilayahForm 
                    control={locationForm.control}
                    setValue={locationForm.setValue}
                    watch={locationForm.watch}
                    onDataLoad={() => {
                      console.log('WilayahForm data loaded in PegawaiForm');
                      // Sync with main form data
                      const values = locationForm.getValues();
                      setFormData({
                        ...formData,
                        provinsi: values.provinsi,
                        kota: values.kota,
                        kecamatan: values.kecamatan,
                        kelurahan: values.kelurahan,
                        kodePos: values.kodePos
                      });
                    }}
                  />
                </Form>
              </div>

              {/* Map Location Picker - Clean Integration like BiografiFormStepper */}
              <MapLocationPicker
                latitude={formData.latitude}
                longitude={formData.longitude}
                onLocationChange={(lat, lng) => {
                  setFormData({
                    ...formData,
                    latitude: lat ?? undefined,
                    longitude: lng ?? undefined
                  });
                }}
              />
            </CardContent>
          </Card>
        );

      // Steps 2 and 3 are similar to create page but with edit-specific changes
      case 2:
        return (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Vote className="h-5 w-5" />
                  Edit Pemilihan TPS
                </CardTitle>
                <p className="text-sm text-gray-600">
                  Perbarui pemilihan yang ditugaskan kepada pegawai ini
                </p>
              </CardHeader>
              <CardContent>
                {/* Layout and Filter Controls */}
                <div className="space-y-6 mb-8">
                  {/* Improved Layout Selection - More Professional */}
                  <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
                    <div className="flex items-center gap-2 mb-4">
                      <LayoutGrid className="h-5 w-5 text-blue-600" />
                      <h3 className="text-lg font-semibold text-gray-900">Layout Tampilan</h3>
                    </div>
                    <p className="text-sm text-gray-600 mb-4">
                      Pilih jumlah kolom untuk menampilkan pemilihan per baris
                    </p>
                    <div className="grid grid-cols-5 gap-3">
                      {LAYOUT_OPTIONS.map((option) => {
                        const IconComponent = option.icon;
                        const isActive = layout === option.value;
                        return (
                          <button
                            key={option.value}
                            onClick={() => setLayout(option.value as any)}
                            className={`
                              group relative p-3 rounded-lg border-2 text-center transition-all duration-200 hover:shadow-md
                              ${isActive
                                ? 'border-blue-500 bg-blue-50 shadow-md' 
                                : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                              }
                            `}
                          >
                            <IconComponent className={`h-5 w-5 mx-auto mb-2 transition-colors ${
                              isActive ? 'text-blue-600' : 'text-gray-400 group-hover:text-gray-600'
                            }`} />
                            <div className={`text-xs font-medium transition-colors ${
                              isActive ? 'text-blue-600' : 'text-gray-600 group-hover:text-gray-800'
                            }`}>
                              {option.label}
                            </div>
                            {isActive && (
                              <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full border-2 border-white" />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  
                  {/* Filters - Professional Design */}
                  <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
                    <div className="px-6 py-4 border-b border-gray-200">
                      <div className="flex items-center gap-2">
                        <Search className="h-5 w-5 text-gray-600" />
                        <h3 className="text-lg font-semibold text-gray-900">Filter & Pencarian</h3>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">
                        Cari dan filter pemilihan untuk memudahkan seleksi
                      </p>
                    </div>
                    
                    <div className="p-6 space-y-4">
                      {/* Search Input */}
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-gray-700">Cari Pemilihan</Label>
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                          <Input
                            placeholder="Masukkan nama pemilihan..."
                            value={searchInput}
                            onChange={(e) => setSearchInput(e.target.value)}
                            className="pl-10 h-11"
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                handleSearch();
                              }
                            }}
                          />
                        </div>
                      </div>
                      
                      {/* Filter Options */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label className="text-sm font-medium text-gray-700">Status</Label>
                          <Select value={filters.status} onValueChange={(value) => handleFilterChange('status', value)}>
                            <SelectTrigger className="h-11">
                              <SelectValue placeholder="Pilih status" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="ALL">
                                <div className="flex items-center gap-2">
                                  <Circle className="h-4 w-4 text-gray-400" />
                                  Semua Status
                                </div>
                              </SelectItem>
                              <SelectItem value="AKTIF">
                                <div className="flex items-center gap-2">
                                  <CheckCircle className="h-4 w-4 text-green-500" />
                                  Aktif
                                </div>
                              </SelectItem>
                              <SelectItem value="TIDAK_AKTIF">
                                <div className="flex items-center gap-2">
                                  <X className="h-4 w-4 text-red-500" />
                                  Tidak Aktif
                                </div>
                              </SelectItem>
                              <SelectItem value="DRAFT">
                                <div className="flex items-center gap-2">
                                  <FileText className="h-4 w-4 text-gray-500" />
                                  Draft
                                </div>
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div className="space-y-2">
                          <Label className="text-sm font-medium text-gray-700">Per Halaman</Label>
                          <Select value={filters.size.toString()} onValueChange={(value) => handleFilterChange('size', parseInt(value))}>
                            <SelectTrigger className="h-11">
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
                        
                        <div className="space-y-2">
                          <Label className="text-sm font-medium text-gray-700">Layout</Label>
                          <Select value={layout.toString()} onValueChange={(value) => setLayout(parseInt(value) as 1 | 2 | 3 | 4 | 5)}>
                            <SelectTrigger className="h-11">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="1">1 per baris</SelectItem>
                              <SelectItem value="2">2 per baris</SelectItem>
                              <SelectItem value="3">3 per baris</SelectItem>
                              <SelectItem value="4">4 per baris</SelectItem>
                              <SelectItem value="5">5 per baris</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      
                      {/* Action Buttons */}
                      <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                        <div className="flex items-center gap-2">
                          <Button onClick={handleSearch} className="flex items-center gap-2 h-11">
                            <Search className="h-4 w-4" />
                            Cari & Filter
                          </Button>
                          <Button variant="outline" onClick={clearFilters} className="h-11 px-4">
                            <RefreshCw className="h-4 w-4" />
                            Reset
                          </Button>
                        </div>
                        <div className="text-sm text-gray-600">
                          {selectedPemilihanList.length} dipilih dari {totalElements} pemilihan
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Search Results Info */}
                {(filters.judulPemilihan || filters.status !== 'ALL') && (
                  <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Search className="h-5 w-5 text-blue-600" />
                        <span className="text-sm font-medium text-blue-900">
                          Hasil Pencarian: {totalElements} pemilihan ditemukan
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        {filters.judulPemilihan && (
                          <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                            Judul: "{filters.judulPemilihan}"
                          </Badge>
                        )}
                        {filters.status !== 'ALL' && (
                          <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                            Status: {filters.status}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Pemilihan Grid */}
                {loading ? (
                  <div className="flex justify-center items-center py-16">
                    <div className="text-center">
                      <RefreshCw className="h-12 w-12 animate-spin mx-auto text-blue-600 mb-4" />
                      <p className="text-lg font-medium text-gray-900">Memuat data pemilihan...</p>
                      <p className="text-sm text-gray-500">Harap tunggu sebentar</p>
                    </div>
                  </div>
                ) : pemilihanList.length === 0 ? (
                  <div className="text-center py-16">
                    <Vote className="h-16 w-16 mx-auto text-gray-400 mb-4" />
                    <p className="text-xl font-medium text-gray-900 mb-2">Tidak ada pemilihan ditemukan</p>
                    <p className="text-gray-500 mb-4">
                      {filters.judulPemilihan || filters.status !== 'ALL' 
                        ? 'Coba ubah kriteria pencarian atau filter'
                        : 'Belum ada pemilihan yang tersedia'
                      }
                    </p>
                    {(filters.judulPemilihan || filters.status !== 'ALL') && (
                      <Button variant="outline" onClick={clearFilters} className="mx-auto">
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Reset Filter
                      </Button>
                    )}
                  </div>
                ) : (
                  <>
                    <div className={`grid gap-6 ${
                      layout === 1 ? 'grid-cols-1' :
                      layout === 2 ? 'grid-cols-1 lg:grid-cols-2' :
                      layout === 3 ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' :
                      layout === 4 ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' :
                      'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5'
                    }`}>
                      {pemilihanList.map((pemilihan) => {
                        // Check if this specific pemilihan is selected
                        const pemilihanKey = pemilihan.pemilihanId || pemilihan.id;
                        const isSelected = selectedPemilihanList.some(
                          selected => (selected.pemilihanId || selected.id) === pemilihanKey
                        );
                        const isOriginal = originalPegawai?.pemilihanList?.some((p: any) => (p.pemilihanId || p.id) === pemilihanKey);
                        
                        return (
                          <Card 
                            key={pemilihanKey} // Use the unique ID as key
                            className={`group relative cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-[1.02] ${
                              isSelected
                                ? 'border-2 border-blue-500 bg-blue-50 shadow-lg ring-2 ring-blue-100' 
                                : isOriginal
                                ? 'border-2 border-green-500 bg-green-50 shadow-lg ring-2 ring-green-100'
                                : 'border border-gray-200 hover:border-blue-300 hover:shadow-md'
                            }`}
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              handleSelectPemilihan(pemilihan);
                            }}
                          >
                            <CardContent className="p-6">
                              <div className="space-y-4">
                                <div className="flex items-start justify-between">
                                  <div className="flex-1 min-w-0">
                                    <h3 className="font-semibold text-lg leading-tight mb-2 text-gray-900">
                                      {pemilihan.judulPemilihan}
                                    </h3>
                                    <p className="text-sm text-gray-600 line-clamp-2">
                                      {pemilihan.deskripsi}
                                    </p>
                                  </div>
                                  <div className="flex-shrink-0 ml-4">
                                    <div className="flex items-center gap-2">
                                      {isSelected ? (
                                        <div className="flex items-center justify-center w-8 h-8 bg-blue-500 rounded-full">
                                          <CheckCircle className="h-5 w-5 text-white" />
                                        </div>
                                      ) : (
                                        <div className="flex items-center justify-center w-8 h-8 border-2 border-gray-300 rounded-full group-hover:border-blue-400 transition-colors">
                                          <Circle className="h-4 w-4 text-gray-300 group-hover:text-blue-400" />
                                        </div>
                                      )}
                                      {isOriginal && !isSelected && (
                                        <Badge className="bg-green-100 text-green-800 text-xs ml-2" variant="secondary">
                                          Original
                                        </Badge>
                                      )}
                                    </div>
                                  </div>
                                </div>
                                
                                <div className="space-y-3">
                                  <div className="flex items-center justify-between">
                                    <Badge className={`${getStatusColor(pemilihan.status)} font-medium`} variant="secondary">
                                      {getStatusDisplay(pemilihan.status)}
                                    </Badge>
                                    <Badge variant="outline" className="text-xs">
                                      {pemilihan.tingkatPemilihan}
                                    </Badge>
                                  </div>
                                  
                                  <div className="flex items-center justify-between text-sm">
                                    <div className="flex items-center gap-2">
                                      <FileText className="h-4 w-4 text-gray-400" />
                                      <span className="font-medium text-gray-900">
                                        {pemilihan.totalLaporan} Laporan
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <Vote className="h-4 w-4 text-gray-400" />
                                      <span className="font-medium text-gray-900">
                                        {pemilihan.totalJenisLaporan} Jenis
                                      </span>
                                    </div>
                                  </div>
                                  
                                  {(pemilihan.provinsiNama || pemilihan.kotaNama) && (
                                    <div className="flex items-center gap-2 text-xs text-gray-500">
                                      <MapPin className="h-3 w-3" />
                                      <span>{pemilihan.provinsiNama} {pemilihan.kotaNama && `- ${pemilihan.kotaNama}`}</span>
                                    </div>
                                  )}
                                </div>
                                
                                {/* Selection Indicator */}
                                {isSelected && (
                                  <div className="absolute top-3 right-3 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                                    <CheckCircle2 className="h-4 w-4 text-white" />
                                  </div>
                                )}
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>

                    {/* Enhanced Pagination */}
                    <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4 p-4 bg-gray-50 border border-gray-200 rounded-lg">
                      <div className="text-sm text-gray-600">
                        Menampilkan <span className="font-medium">{filters.page * filters.size + 1}</span> - <span className="font-medium">{Math.min((filters.page + 1) * filters.size, totalElements)}</span> dari <span className="font-medium">{totalElements}</span> pemilihan
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handlePageChange(filters.page - 1)}
                          disabled={filters.page === 0}
                          className="flex items-center gap-2"
                        >
                          <ChevronLeft className="h-4 w-4" />
                          Sebelumnya
                        </Button>
                        <div className="flex items-center gap-1">
                          {[...Array(Math.min(5, totalPages))].map((_, i) => {
                            const page = Math.max(0, Math.min(totalPages - 5, filters.page - 2)) + i;
                            return (
                              <Button
                                key={page}
                                variant={filters.page === page ? "default" : "outline"}
                                size="sm"
                                onClick={() => handlePageChange(page)}
                                className="w-8 h-8 p-0"
                              >
                                {page + 1}
                              </Button>
                            );
                          })}
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handlePageChange(filters.page + 1)}
                          disabled={filters.page >= totalPages - 1}
                          className="flex items-center gap-2"
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

            {/* Selected Pemilihan Summary */}
            {selectedPemilihanList.length > 0 && (
              <Card className="border-2 border-green-500 bg-green-50">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <CheckCircle className="h-6 w-6 text-green-600" />
                      Pemilihan Terpilih ({selectedPemilihanList.length})
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleClearAllSelection}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <X className="h-4 w-4 mr-2" />
                      Reset ke Original
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className={`grid gap-4 ${
                    layout === 1 ? 'grid-cols-1' :
                    layout === 2 ? 'grid-cols-1 lg:grid-cols-2' :
                    layout === 3 ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' :
                    layout === 4 ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' :
                    'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5'
                  }`}>
                    {selectedPemilihanList.map((pemilihan, index) => {
                      const isOriginal = originalPegawai?.pemilihanList?.some((p: any) => (p.pemilihanId || p.id) === (pemilihan.pemilihanId || pemilihan.id));
                      return (
                        <Card key={pemilihan.pemilihanId || pemilihan.id} className="border-2 border-green-300 bg-white">
                          <CardContent className="p-4">
                            <div className="space-y-3">
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <h3 className="font-semibold text-sm leading-tight mb-2">
                                    {pemilihan.judulPemilihan}
                                  </h3>
                                  <p className="text-xs text-gray-600 line-clamp-2">
                                    {pemilihan.deskripsi}
                                  </p>
                                </div>
                                <div className="flex items-center gap-2 ml-2">
                                  <span className="flex-shrink-0 w-6 h-6 bg-green-600 text-white rounded-full flex items-center justify-center text-xs font-bold">
                                    {index + 1}
                                  </span>
                                  {isOriginal && (
                                    <Badge className="bg-green-100 text-green-800 text-xs" variant="secondary">
                                      Original
                                    </Badge>
                                  )}
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleUnselectPemilihan(pemilihan.pemilihanId || pemilihan.id)}
                                    className="text-red-600 hover:text-red-700 hover:bg-red-50 h-6 w-6 p-0"
                                  >
                                    <X className="h-3 w-3" />
                                  </Button>
                                </div>
                              </div>
                              
                              <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                  <Badge className={`${getStatusColor(pemilihan.status)} text-xs`} variant="secondary">
                                    {getStatusDisplay(pemilihan.status)}
                                  </Badge>
                                  <Badge variant="outline" className="text-xs">
                                    {pemilihan.tingkatPemilihan}
                                  </Badge>
                                </div>
                                
                                <div className="flex items-center justify-between text-xs">
                                  <div className="flex items-center gap-1">
                                    <FileText className="h-3 w-3 text-gray-400" />
                                    <span>{pemilihan.totalLaporan} laporan</span>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <Vote className="h-3 w-3 text-gray-400" />
                                    <span>{pemilihan.totalJenisLaporan} jenis</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                  
                  <div className="mt-6 p-4 bg-green-100 border border-green-200 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      <h4 className="font-semibold text-green-900">Ringkasan Pemilihan</h4>
                    </div>
                    <div className="text-sm text-green-800">
                      <p><strong>Total Pemilihan:</strong> {selectedPemilihanList.length}</p>
                      <p><strong>Total Laporan:</strong> {selectedPemilihanList.reduce((total, p) => total + p.totalLaporan, 0)}</p>
                      <p><strong>Total Jenis Laporan:</strong> {selectedPemilihanList.reduce((total, p) => total + (p.totalJenisLaporan || 0), 0)}</p>
                    </div>
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
                  Review & Konfirmasi Perubahan
                </CardTitle>
                <p className="text-gray-600 text-sm mt-2">
                  Tinjau perubahan data pegawai sebelum menyimpan
                </p>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Change Summary */}
                {originalPegawai && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card className="border-l-4 border-l-red-500">
                      <CardHeader className="pb-3">
                        <h3 className="font-semibold text-lg">Data Lama</h3>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div>
                          <p className="text-sm text-gray-600">Nama Lengkap</p>
                          <p className="font-medium">{originalPegawai.fullName}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Email</p>
                          <p className="font-medium">{originalPegawai.email}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">NIK</p>
                          <p className="font-medium">{originalPegawai.nip || 'Tidak ada'}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Pendidikan</p>
                          <p className="font-medium">{originalPegawai.pendidikan || 'Tidak ada'}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Role</p>
                          <p className="font-medium">{originalPegawai.role || originalPegawai.jabatan || 'Tidak ada'}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Jabatan</p>
                          <p className="font-medium">{originalPegawai.namaJabatan || originalPegawai.jabatan || 'Tidak ada'}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Status</p>
                          <Badge className={getStatusColor(originalPegawai.status)}>
                            {getStatusDisplay(originalPegawai.status)}
                          </Badge>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Alamat</p>
                          <p className="font-medium">{originalPegawai.alamat || 'Tidak ada'}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Lokasi</p>
                          <p className="font-medium">
                            {[
                              locationNames.kelurahanName || originalPegawai.kelurahan,
                              locationNames.kecamatanName || originalPegawai.kecamatan,
                              locationNames.kotaName || originalPegawai.kota,
                              locationNames.provinsiName || originalPegawai.provinsi
                            ].filter(Boolean).join(', ') || 'Tidak ada'}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Total TPS</p>
                          <p className="font-medium">{originalPegawai.totalTps || 0}</p>
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card className="border-l-4 border-l-green-500">
                      <CardHeader className="pb-3">
                        <h3 className="font-semibold text-lg">Data Baru</h3>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div>
                          <p className="text-sm text-gray-600">Nama Lengkap</p>
                          <p className="font-medium">{formData.fullName}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Email</p>
                          <p className="font-medium">{formData.email}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">NIK</p>
                          <p className="font-medium">{formData.nip}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Pendidikan</p>
                          <p className="font-medium">{formData.pendidikan}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Jabatan</p>
                          <p className="font-medium">{formData.jabatan}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Status</p>
                          <Badge className={getStatusColor(formData.status)}>
                            {getStatusDisplay(formData.status)}
                          </Badge>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Alamat</p>
                          <p className="font-medium">{formData.alamat || 'Tidak ada'}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Lokasi</p>
                          <p className="font-medium">
                            {[
                              locationNames.kelurahanName || formData.kelurahan,
                              locationNames.kecamatanName || formData.kecamatan,
                              locationNames.kotaName || formData.kota,
                              locationNames.provinsiName || formData.provinsi
                            ].filter(Boolean).join(', ') || 'Tidak ada'}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Total TPS</p>
                          <p className="font-medium">{formData.totalTps || selectedPemilihanList.length}</p>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}

                {/* TPS Input */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Vote className="h-5 w-5" />
                      Total TPS
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <Label htmlFor="totalTps">Total TPS Yang Ditugaskan</Label>
                      <Input
                        id="totalTps"
                        type="number"
                        value={formData.totalTps || selectedPemilihanList.length}
                        onChange={(e) => setFormData({ ...formData, totalTps: parseInt(e.target.value) || 0 })}
                        placeholder="Masukkan total TPS"
                        className="h-12"
                        min="0"
                      />
                      <p className="text-sm text-gray-600">
                        Default: {selectedPemilihanList.length} TPS (berdasarkan jumlah pemilihan yang dipilih)
                      </p>
                    </div>
                  </CardContent>
                </Card>

                {/* Pemilihan Details */}
                {selectedPemilihanList.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Detail Pemilihan Terpilih ({selectedPemilihanList.length})</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {selectedPemilihanList.map((pemilihan, index) => {
                          const isOriginal = originalPegawai?.pemilihanList?.some((p: any) => p.id === pemilihan.id);
                          return (
                            <div key={pemilihan.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                              <div className="flex items-center gap-3">
                                <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">
                                  {index + 1}
                                </span>
                                <div>
                                  <h4 className="font-medium">{pemilihan.judulPemilihan}</h4>
                                  <p className="text-sm text-gray-600">{pemilihan.deskripsi}</p>
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="flex items-center gap-2">
                                  <Badge className={getStatusColor(pemilihan.status)} variant="secondary">
                                    {getStatusDisplay(pemilihan.status)}
                                  </Badge>
                                  {isOriginal && (
                                    <Badge className="bg-green-100 text-green-800 text-xs" variant="secondary">
                                      Original
                                    </Badge>
                                  )}
                                </div>
                                <p className="text-xs text-gray-500 mt-1">
                                  {pemilihan.totalLaporan} laporan, {pemilihan.totalJenisLaporan} jenis
                                </p>
                              </div>
                            </div>
                          );
                        })}
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
              <h1 className="text-3xl font-bold tracking-tight">Edit Pegawai</h1>
              <p className="text-muted-foreground">
                Perbarui data pegawai dengan wizard yang mudah
              </p>
            </div>
          </div>
        </div>

        {/* Stepper */}
        <Card className="mb-8">
          <CardContent className="py-6">
            <StepperComponent currentStep={currentStep} totalSteps={4} />
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
                
                {currentStep < 3 ? (
                  <Button
                    onClick={nextStep}
                    disabled={validating}
                    className="flex items-center gap-2"
                  >
                    {validating ? (
                      <>
                        <RefreshCw className="h-4 w-4 animate-spin" />
                        Validasi...
                      </>
                    ) : (
                      <>
                        Selanjutnya
                        <ArrowRight className="h-4 w-4" />
                      </>
                    )}
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
    </div>
  );
}
