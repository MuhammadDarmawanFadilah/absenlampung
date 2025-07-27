'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { format } from "date-fns"
import { id } from "date-fns/locale"
import { usePusherNotifications } from "@/hooks/usePusherNotifications"
import { toast } from "sonner"
import { 
  CalendarIcon, 
  Search, 
  RotateCcw, 
  FileText, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Eye,
  Check,
  X,
  Download,
  Filter,
  ChevronDown,
  ChevronUp
} from "lucide-react"
import { AdminPageHeader } from "@/components/AdminPageHeader"
import { ServerPagination } from "@/components/ServerPagination"
import { useAuth } from "@/contexts/AuthContext"
import { getApiUrl } from "@/lib/config"

interface CutiData {
  id: number
  pegawaiId: number
  namaPegawai: string
  tanggalCuti: string
  jenisCuti: string
  alasanCuti: string
  lampiranCuti?: string
  statusApproval: string
  catatanApproval?: string
  approvedByName?: string
  createdAt: string
}

interface PegawaiOption {
  id: number
  namaLengkap: string
}

export default function MasterDataCutiPage() {
  const { user } = useAuth()
  const [cutiData, setCutiData] = useState<CutiData[]>([])
  const [pegawaiList, setPegawaiList] = useState<PegawaiOption[]>([])
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(0)
  const [totalElements, setTotalElements] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [pageSize, setPageSize] = useState(10)

  // Filter states
  const [showFilters, setShowFilters] = useState(false)
  const [selectedPegawai, setSelectedPegawai] = useState<string>('semua')
  const [selectedStatus, setSelectedStatus] = useState<string>('semua')
  const [selectedJenis, setSelectedJenis] = useState<string>('semua')
  const [startDate, setStartDate] = useState<Date | undefined>()
  const [endDate, setEndDate] = useState<Date | undefined>()
  const [showStartDatePicker, setShowStartDatePicker] = useState(false)
  const [showEndDatePicker, setShowEndDatePicker] = useState(false)

  // Approval states
  const [selectedCuti, setSelectedCuti] = useState<CutiData | null>(null)
  const [showApprovalDialog, setShowApprovalDialog] = useState(false)
  const [approvalStatus, setApprovalStatus] = useState<string>('')
  const [catatanApproval, setCatatanApproval] = useState<string>('')
  const [isApproving, setIsApproving] = useState(false)

  // Initialize Pusher notifications for admin
  usePusherNotifications({
    onCutiRequest: () => {
      toast.success("Pengajuan cuti baru masuk!", {
        description: "Ada pengajuan cuti yang perlu direview",
        action: {
          label: "Refresh",
          onClick: () => loadCutiData()
        }
      });
    }
  });

  useEffect(() => {
    loadCutiData()
    loadPegawaiList()
  }, [currentPage, pageSize])

  const loadCutiData = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        size: pageSize.toString()
      })

      if (selectedPegawai !== 'semua') {
        params.append('pegawaiId', selectedPegawai)
      }
      if (selectedStatus !== 'semua') {
        params.append('status', selectedStatus.toUpperCase())
      }
      if (selectedJenis !== 'semua') {
        params.append('jenisCuti', selectedJenis)
      }
      if (startDate) {
        params.append('startDate', format(startDate, 'yyyy-MM-dd'))
      }
      if (endDate) {
        params.append('endDate', format(endDate, 'yyyy-MM-dd'))
      }

      const response = await fetch(getApiUrl(`api/cuti?${params}`))
      if (response.ok) {
        const data = await response.json()
        setCutiData(data.content || [])
        setTotalElements(data.totalElements || 0)
        setTotalPages(data.totalPages || 0)
      }
    } catch (error) {
      console.error('Error loading cuti data:', error)
      toast.error('Gagal memuat data cuti')
    } finally {
      setLoading(false)
    }
  }

  const loadPegawaiList = async () => {
    try {
      const response = await fetch(getApiUrl('api/pegawai'))
      if (response.ok) {
        const data = await response.json()
        setPegawaiList(data)
      }
    } catch (error) {
      console.error('Error loading pegawai list:', error)
    }
  }

  const handleSearch = () => {
    setCurrentPage(0)
    loadCutiData()
  }

  const handleClearFilters = () => {
    setSelectedPegawai('semua')
    setSelectedStatus('semua')
    setSelectedJenis('semua')
    setStartDate(undefined)
    setEndDate(undefined)
    setCurrentPage(0)
    loadCutiData()
  }

  const handleApproval = async () => {
    if (!selectedCuti || !approvalStatus) {
      toast.error('Mohon pilih status approval')
      return
    }

    setIsApproving(true)
    try {
      const response = await fetch(getApiUrl(`api/cuti/${selectedCuti.id}/approve?adminId=${user?.id}`), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          statusApproval: approvalStatus,
          catatanApproval: catatanApproval
        })
      })

      if (response.ok) {
        toast.success('Status cuti berhasil diupdate!')
        setShowApprovalDialog(false)
        setSelectedCuti(null)
        setApprovalStatus('')
        setCatatanApproval('')
        loadCutiData()
      } else {
        const errorData = await response.text()
        toast.error(errorData || 'Gagal mengupdate status cuti')
      }
    } catch (error) {
      console.error('Error updating cuti status:', error)
      toast.error('Terjadi kesalahan saat mengupdate status')
    } finally {
      setIsApproving(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300">
          <Clock className="w-3 h-3 mr-1" />
          Pending
        </Badge>
      case 'DIAJUKAN':
        return <Badge variant="default" className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
          <FileText className="w-3 h-3 mr-1" />
          Diajukan
        </Badge>
      case 'DISETUJUI':
        return <Badge variant="default" className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
          <CheckCircle className="w-3 h-3 mr-1" />
          Disetujui
        </Badge>
      case 'DITOLAK':
        return <Badge variant="destructive" className="bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300">
          <XCircle className="w-3 h-3 mr-1" />
          Ditolak
        </Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const openApprovalDialog = (cuti: CutiData) => {
    setSelectedCuti(cuti)
    setApprovalStatus('')
    setCatatanApproval('')
    setShowApprovalDialog(true)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-blue-900 dark:to-indigo-900 p-2 md:p-6">
      <div className="container mx-auto space-y-4 md:space-y-8">
        <AdminPageHeader 
          title="Master Data Cuti" 
          description="Kelola dan approval pengajuan cuti pegawai"
          icon={CalendarIcon}
        />

        {/* Filters */}
        <Card className="mb-4 md:mb-6 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm border border-gray-200 dark:border-gray-700 shadow-lg">
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle className="text-lg text-gray-900 dark:text-gray-100">
                <Filter className="w-5 h-5 mr-2 inline" />
                Filter Data Cuti
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
                className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
              >
                {showFilters ? (
                  <>
                    <ChevronUp className="w-4 h-4 mr-1" />
                    Sembunyikan
                  </>
                ) : (
                  <>
                    <ChevronDown className="w-4 h-4 mr-1" />
                    Tampilkan Filter
                  </>
                )}
              </Button>
            </div>
          </CardHeader>
          {!showFilters && (
            <CardContent className="pt-0 p-3 md:p-6">
              <div className="text-xs md:text-sm text-gray-600 dark:text-gray-400 space-y-1 md:space-y-0">
                <div>
                  <span className="font-medium">Periode:</span> {
                    startDate && endDate 
                      ? `${format(startDate, "dd MMM yyyy", { locale: id })} - ${format(endDate, "dd MMM yyyy", { locale: id })}`
                      : 'Semua periode'
                  }
                </div>
                {selectedPegawai !== 'semua' && (
                  <div className="md:ml-4">
                    <span className="font-medium">Pegawai:</span> {pegawaiList.find(p => p.id.toString() === selectedPegawai)?.namaLengkap || 'Unknown'}
                  </div>
                )}
                {selectedJenis !== 'semua' && (
                  <div className="md:ml-4">
                    <span className="font-medium">Jenis:</span> {selectedJenis.charAt(0).toUpperCase() + selectedJenis.slice(1)}
                  </div>
                )}
                {selectedStatus !== 'semua' && (
                  <div className="md:ml-4">
                    <span className="font-medium">Status:</span> {selectedStatus.charAt(0).toUpperCase() + selectedStatus.slice(1)}
                  </div>
                )}
              </div>
            </CardContent>
          )}
          {showFilters && (
            <CardContent className="p-3 md:p-6">
              <div className="space-y-3 md:space-y-4">
                {/* Row 1: Periode */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                  <div>
                    <Label className="text-xs md:text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                      Dari Tanggal
                    </Label>
                    <Popover open={showStartDatePicker} onOpenChange={setShowStartDatePicker}>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="w-full justify-start text-left font-normal">
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {startDate ? format(startDate, "dd MMM yyyy", { locale: id }) : "Pilih tanggal"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={startDate}
                          onSelect={(date) => {
                            setStartDate(date)
                            setShowStartDatePicker(false)
                          }}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  <div>
                    <Label className="text-xs md:text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                      Sampai Tanggal
                    </Label>
                    <Popover open={showEndDatePicker} onOpenChange={setShowEndDatePicker}>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="w-full justify-start text-left font-normal">
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {endDate ? format(endDate, "dd MMM yyyy", { locale: id }) : "Pilih tanggal"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={endDate}
                          onSelect={(date) => {
                            setEndDate(date)
                            setShowEndDatePicker(false)
                          }}
                          disabled={(date) => startDate ? date < startDate : false}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>

                {/* Row 2: Pegawai dan Status */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                  <div>
                    <Label className="text-xs md:text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                      Pegawai
                    </Label>
                    <Select value={selectedPegawai} onValueChange={setSelectedPegawai}>
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih pegawai" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="semua">Semua Pegawai</SelectItem>
                        {pegawaiList.map((pegawai) => (
                          <SelectItem key={pegawai.id} value={pegawai.id.toString()}>
                            {pegawai.namaLengkap}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="text-xs md:text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                      Status
                    </Label>
                    <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="semua">Semua Status</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="diajukan">Diajukan</SelectItem>
                        <SelectItem value="disetujui">Disetujui</SelectItem>
                        <SelectItem value="ditolak">Ditolak</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Row 3: Jenis dan Actions */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4 items-end">
                  <div>
                    <Label className="text-xs md:text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                      Jenis Cuti
                    </Label>
                    <Select value={selectedJenis} onValueChange={setSelectedJenis}>
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih jenis" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="semua">Semua Jenis</SelectItem>
                        <SelectItem value="tahunan">Cuti Tahunan</SelectItem>
                        <SelectItem value="sakit">Cuti Sakit</SelectItem>
                        <SelectItem value="melahirkan">Cuti Melahirkan</SelectItem>
                        <SelectItem value="menikah">Cuti Menikah</SelectItem>
                        <SelectItem value="lainnya">Lainnya</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex flex-col md:flex-row gap-2">
                    <Button onClick={handleSearch} className="bg-blue-600 hover:bg-blue-700 text-white flex-1">
                      <Search className="w-4 h-4 mr-2" />
                      Terapkan Filter
                    </Button>

                    <Button variant="outline" onClick={handleClearFilters} className="border-gray-300 dark:border-gray-600 w-full md:w-auto">
                      <RotateCcw className="w-4 h-4 mr-2" />
                      Reset
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          )}
        </Card>

        {/* Table */}
        <Card className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm border border-gray-200 dark:border-gray-700 shadow-lg">
          <CardHeader>
            <CardTitle className="text-lg text-gray-900 dark:text-gray-100">
              Data Pengajuan Cuti ({totalElements} data)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : cutiData.length > 0 ? (
              <>
                {/* Desktop Table */}
                <div className="hidden md:block overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Pegawai</TableHead>
                        <TableHead>Tanggal Cuti</TableHead>
                        <TableHead>Jenis</TableHead>
                        <TableHead>Alasan</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Diajukan</TableHead>
                        <TableHead>Aksi</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {cutiData.map((cuti) => (
                        <TableRow key={cuti.id}>
                          <TableCell className="font-medium">{cuti.namaPegawai}</TableCell>
                          <TableCell>
                            {format(new Date(cuti.tanggalCuti), "dd MMM yyyy", { locale: id })}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {cuti.jenisCuti}
                            </Badge>
                          </TableCell>
                          <TableCell className="max-w-xs truncate" title={cuti.alasanCuti}>
                            {cuti.alasanCuti}
                          </TableCell>
                          <TableCell>
                            {getStatusBadge(cuti.statusApproval)}
                          </TableCell>
                          <TableCell>
                            {format(new Date(cuti.createdAt), "dd MMM yyyy HH:mm", { locale: id })}
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => openApprovalDialog(cuti)}
                                disabled={cuti.statusApproval === 'DISETUJUI' || cuti.statusApproval === 'DITOLAK'}
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                              {cuti.lampiranCuti && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    // Download attachment logic here
                                    window.open(`http://localhost:3001/uploads/cuti/${cuti.lampiranCuti}`, '_blank')
                                  }}
                                >
                                  <Download className="w-4 h-4" />
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Mobile Cards */}
                <div className="md:hidden space-y-4">
                  {cutiData.map((cuti) => (
                    <Card key={cuti.id} className="border">
                      <CardContent className="p-4">
                        <div className="space-y-3">
                          <div className="flex justify-between items-start">
                            <div>
                              <h3 className="font-medium text-sm">{cuti.namaPegawai}</h3>
                              <p className="text-xs text-gray-600 dark:text-gray-400">
                                {format(new Date(cuti.tanggalCuti), "dd MMM yyyy", { locale: id })}
                              </p>
                            </div>
                            {getStatusBadge(cuti.statusApproval)}
                          </div>
                          
                          <div>
                            <Badge variant="outline" className="mb-2">
                              {cuti.jenisCuti}
                            </Badge>
                            <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-2">
                              {cuti.alasanCuti}
                            </p>
                          </div>

                          <div className="flex justify-between items-center pt-2 border-t">
                            <p className="text-xs text-gray-500">
                              {format(new Date(cuti.createdAt), "dd MMM HH:mm", { locale: id })}
                            </p>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => openApprovalDialog(cuti)}
                                disabled={cuti.statusApproval === 'DISETUJUI' || cuti.statusApproval === 'DITOLAK'}
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                              {cuti.lampiranCuti && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    window.open(`http://localhost:3001/uploads/cuti/${cuti.lampiranCuti}`, '_blank')
                                  }}
                                >
                                  <Download className="w-4 h-4" />
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {/* Pagination */}
                <div className="mt-6">
                  <ServerPagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={setCurrentPage}
                    totalElements={totalElements}
                    pageSize={pageSize}
                    onPageSizeChange={setPageSize}
                  />
                </div>
              </>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500 dark:text-gray-400">Tidak ada data cuti</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Approval Dialog */}
        <Dialog open={showApprovalDialog} onOpenChange={setShowApprovalDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Approval Pengajuan Cuti</DialogTitle>
              <DialogDescription>
                Berikan keputusan untuk pengajuan cuti ini
              </DialogDescription>
            </DialogHeader>
            
            {selectedCuti && (
              <div className="space-y-4">
                <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <h4 className="font-medium">{selectedCuti.namaPegawai}</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {format(new Date(selectedCuti.tanggalCuti), "dd MMMM yyyy", { locale: id })}
                  </p>
                  <p className="text-sm mt-1">
                    <strong>Jenis:</strong> {selectedCuti.jenisCuti}
                  </p>
                  <p className="text-sm mt-1">
                    <strong>Alasan:</strong> {selectedCuti.alasanCuti}
                  </p>
                </div>

                <div>
                  <Label className="text-sm font-medium">Status Approval</Label>
                  <Select value={approvalStatus} onValueChange={setApprovalStatus}>
                    <SelectTrigger className="mt-2">
                      <SelectValue placeholder="Pilih status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="DIAJUKAN">Diajukan</SelectItem>
                      <SelectItem value="DISETUJUI">Disetujui</SelectItem>
                      <SelectItem value="DITOLAK">Ditolak</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-sm font-medium">Catatan (Opsional)</Label>
                  <Textarea
                    value={catatanApproval}
                    onChange={(e) => setCatatanApproval(e.target.value)}
                    placeholder="Berikan catatan untuk keputusan ini..."
                    className="mt-2"
                    rows={3}
                  />
                </div>

                <div className="flex gap-2 pt-4">
                  <Button
                    onClick={handleApproval}
                    disabled={!approvalStatus || isApproving}
                    className="flex-1"
                  >
                    {isApproving ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Menyimpan...
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4 mr-2" />
                        Simpan
                      </>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setShowApprovalDialog(false)}
                    disabled={isApproving}
                  >
                    <X className="w-4 h-4 mr-2" />
                    Batal
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
