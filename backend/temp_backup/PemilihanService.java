package com.shadcn.backend.service;

import com.shadcn.backend.model.Pemilihan;
import com.shadcn.backend.model.DetailPemilihan;
import com.shadcn.backend.model.Laporan;
import com.shadcn.backend.dto.PemilihanDTO;
import com.shadcn.backend.dto.CreatePemilihanRequest;
import com.shadcn.backend.dto.DetailLaporanDTO;
import com.shadcn.backend.repository.PemilihanRepository;
import com.shadcn.backend.repository.DetailPemilihanRepository;
import com.shadcn.backend.repository.LaporanRepository;
import com.shadcn.backend.repository.PegawaiRepository;
import com.shadcn.backend.service.WilayahService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@Transactional
public class PemilihanService {
    
    @Autowired
    private PemilihanRepository pemilihanRepository;
    
    @Autowired
    private DetailPemilihanRepository detailPemilihanRepository;
    
    @Autowired
    private LaporanRepository laporanRepository;
    
    @Autowired
    private PegawaiRepository pegawaiRepository;
    
    @Autowired
    private WilayahService wilayahService;
    
    public List<PemilihanDTO> getAllPemilihan() {
        List<Pemilihan> pemilihanList = pemilihanRepository.findAll();
        return pemilihanList.stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }
    
    public Optional<PemilihanDTO> getPemilihanById(Long id) {
        Optional<Pemilihan> pemilihan = pemilihanRepository.findById(id);
        return pemilihan.map(this::convertToDTO);
    }
    
    public List<PemilihanDTO> getPemilihanByStatus(String status) {
        Pemilihan.StatusPemilihan statusEnum = Pemilihan.StatusPemilihan.valueOf(status);
        List<Pemilihan> pemilihanList = pemilihanRepository.findByStatus(statusEnum);
        return pemilihanList.stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }
    
    public List<PemilihanDTO> getActivePemilihan() {
        List<Pemilihan> pemilihanList = pemilihanRepository.findActivePemilihan();
        return pemilihanList.stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }
    
    public PemilihanDTO createPemilihan(PemilihanDTO pemilihanDTO) {
        Pemilihan pemilihan = convertToEntity(pemilihanDTO);
        pemilihan = pemilihanRepository.save(pemilihan);
        
        // Create DetailPemilihan entities if they exist
        if (pemilihanDTO.getDetailLaporan() != null && !pemilihanDTO.getDetailLaporan().isEmpty()) {
            for (PemilihanDTO.DetailPemilihanDTO detailDTO : pemilihanDTO.getDetailLaporan()) {
                DetailPemilihan detail = new DetailPemilihan();
                detail.setPemilihan(pemilihan);
                
                // Find laporan by ID
                if (detailDTO.getLaporanId() != null) {
                    Laporan laporan = new Laporan();
                    laporan.setLaporanId(detailDTO.getLaporanId());
                    detail.setLaporan(laporan);
                }
                
                detail.setUrutanTampil(detailDTO.getUrutanTampil() != null ? detailDTO.getUrutanTampil() : 1);
                detail.setPosisiLayout(detailDTO.getPosisiLayout() != null ? detailDTO.getPosisiLayout() : 1);
                detail.setKeterangan(detailDTO.getKeterangan());
                
                detailPemilihanRepository.save(detail);
            }
        }
        
        return convertToDTO(pemilihan);
    }
    
    public PemilihanDTO createPemilihan(CreatePemilihanRequest request) {
        // Convert CreatePemilihanRequest to PemilihanDTO
        PemilihanDTO pemilihanDTO = convertRequestToDTO(request);
        return createPemilihan(pemilihanDTO);
    }
    
    public PemilihanDTO updatePemilihan(Long id, PemilihanDTO pemilihanDTO) {
        Optional<Pemilihan> existingPemilihan = pemilihanRepository.findById(id);
        if (existingPemilihan.isPresent()) {
            Pemilihan pemilihan = existingPemilihan.get();
            updatePemilihanFields(pemilihan, pemilihanDTO);
            pemilihan = pemilihanRepository.save(pemilihan);
            return convertToDTO(pemilihan);
        }
        return null;
    }
    
    public PemilihanDTO updatePemilihan(Long id, CreatePemilihanRequest request) {
        // Convert CreatePemilihanRequest to PemilihanDTO
        PemilihanDTO pemilihanDTO = convertRequestToDTO(request);
        
        Optional<Pemilihan> existingPemilihan = pemilihanRepository.findById(id);
        if (existingPemilihan.isPresent()) {
            Pemilihan pemilihan = existingPemilihan.get();
            updatePemilihanFields(pemilihan, pemilihanDTO);
            
            // Update detail laporan
            if (request.getDetailLaporan() != null) {
                // Delete existing detail pemilihan
                detailPemilihanRepository.deleteByPemilihanPemilihanId(pemilihan.getPemilihanId());
                
                // Create new detail pemilihan
                for (DetailLaporanDTO detailDto : request.getDetailLaporan()) {
                    DetailPemilihan detail = new DetailPemilihan();
                    detail.setPemilihan(pemilihan);
                    
                    // Find laporan by ID
                    if (detailDto.getLaporanId() != null) {
                        Laporan laporan = new Laporan();
                        laporan.setLaporanId(detailDto.getLaporanId());
                        detail.setLaporan(laporan);
                    }
                    
                    detail.setUrutanTampil(1);
                    detail.setPosisiLayout(1);
                    
                    detailPemilihanRepository.save(detail);
                }
            }
            
            pemilihan = pemilihanRepository.save(pemilihan);
            return convertToDTO(pemilihan);
        }
        return null;
    }
    
    public boolean deletePemilihan(Long id) {
        if (pemilihanRepository.existsById(id)) {
            pemilihanRepository.deleteById(id);
            return true;
        }
        return false;
    }
    
    public List<String> getActiveProvinsi() {
        // Simplified implementation - get unique provinces from active pemilihan
        List<Pemilihan> aktivePemilihan = pemilihanRepository.findByStatus(Pemilihan.StatusPemilihan.AKTIF);
        return aktivePemilihan.stream()
                .map(Pemilihan::getProvinsiNama)
                .distinct()
                .collect(Collectors.toList());
    }
    
    public List<String> getActiveKotaByProvinsi(String provinsi) {
        // Simplified implementation - get unique cities for a province from active pemilihan
        List<Pemilihan> aktivePemilihan = pemilihanRepository.findByStatus(Pemilihan.StatusPemilihan.AKTIF);
        return aktivePemilihan.stream()
                .filter(p -> provinsi.equals(p.getProvinsiNama()))
                .map(Pemilihan::getKotaNama)
                .distinct()
                .collect(Collectors.toList());
    }
    
    public List<PemilihanDTO> searchPemilihan(String keyword) {
        // Use the repository method that exists
        List<Pemilihan> pemilihanList = pemilihanRepository.findByNamaPemilihanContainingIgnoreCase(keyword, org.springframework.data.domain.Pageable.unpaged()).getContent();
        return pemilihanList.stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }
    
    public Map<String, Object> searchPemilihanWithPaging(String keyword, String tingkat, String status, 
                                                         String provinsi, String kota, String kecamatan,
                                                         String provinsiId, String kotaId, String kecamatanId, String pegawaiId,
                                                         int page, int size) {
        org.springframework.data.domain.Pageable pageable = org.springframework.data.domain.PageRequest.of(page, size);
        org.springframework.data.domain.Page<Pemilihan> pemilihanPage;
        
        // Build criteria for search with pegawai filtering
        Long pegawaiIdLong = null;
        if (pegawaiId != null && !pegawaiId.trim().isEmpty()) {
            pegawaiIdLong = Long.valueOf(pegawaiId);
        }
        
        if ((keyword != null && !keyword.trim().isEmpty()) || 
            (tingkat != null && !tingkat.trim().isEmpty()) || 
            (status != null && !status.trim().isEmpty()) ||
            (provinsi != null && !provinsi.trim().isEmpty()) ||
            (kota != null && !kota.trim().isEmpty()) ||
            (kecamatan != null && !kecamatan.trim().isEmpty()) ||
            (provinsiId != null && !provinsiId.trim().isEmpty()) ||
            (kotaId != null && !kotaId.trim().isEmpty()) ||
            (kecamatanId != null && !kecamatanId.trim().isEmpty()) ||
            (pegawaiIdLong != null)) {
            
            pemilihanPage = pemilihanRepository.findByAdvancedFiltersWithPegawai(
                keyword, tingkat, status, provinsiId, kotaId, kecamatanId, pegawaiIdLong, pageable);
        } else {
            pemilihanPage = pemilihanRepository.findAll(pageable);
        }
        
        List<PemilihanDTO> pemilihanList = pemilihanPage.getContent().stream()
                .map(this::convertToDTOWithStats)
                .collect(Collectors.toList());
        
        Map<String, Object> response = new java.util.HashMap<>();
        response.put("content", pemilihanList);
        response.put("totalElements", pemilihanPage.getTotalElements());
        response.put("totalPages", pemilihanPage.getTotalPages());
        response.put("currentPage", page);
        response.put("size", size);
        response.put("hasNext", pemilihanPage.hasNext());
        response.put("hasPrevious", pemilihanPage.hasPrevious());
        
        return response;
    }
    
    public Map<String, Object> getStatistics(String keyword, String tingkat, String status) {
        // For statistics, we'll still use the old method for backwards compatibility
        // or extend it if needed
        List<Pemilihan> allPemilihan;
        
        // Get filtered pemilihan
        if ((keyword != null && !keyword.trim().isEmpty()) || 
            (tingkat != null && !tingkat.trim().isEmpty()) || 
            (status != null && !status.trim().isEmpty())) {
            
            org.springframework.data.domain.Page<Pemilihan> page = 
                pemilihanRepository.findByFilters(keyword, tingkat, status, 
                    org.springframework.data.domain.Pageable.unpaged());
            allPemilihan = page.getContent();
        } else {
            allPemilihan = pemilihanRepository.findAll();
        }
        
        Map<String, Object> stats = new java.util.HashMap<>();
        
        // Total pemilihan
        stats.put("totalPemilihan", allPemilihan.size());
        
        // Status statistics
        long aktif = allPemilihan.stream().filter(p -> p.getStatus() == Pemilihan.StatusPemilihan.AKTIF).count();
        long draft = allPemilihan.stream().filter(p -> p.getStatus() == Pemilihan.StatusPemilihan.DRAFT).count();
        long selesai = allPemilihan.stream().filter(p -> p.getStatus() == Pemilihan.StatusPemilihan.SELESAI).count();
        
        stats.put("statusAktif", aktif);
        stats.put("statusDraft", draft);
        stats.put("statusSelesai", selesai);
        
        // Tingkat statistics
        long provinsi = allPemilihan.stream().filter(p -> p.getTingkatPemilihan() == Pemilihan.TingkatPemilihan.PROVINSI).count();
        long kota = allPemilihan.stream().filter(p -> p.getTingkatPemilihan() == Pemilihan.TingkatPemilihan.KOTA).count();
        long kecamatan = allPemilihan.stream().filter(p -> p.getTingkatPemilihan() == Pemilihan.TingkatPemilihan.KECAMATAN).count();
        long kelurahan = allPemilihan.stream().filter(p -> p.getTingkatPemilihan() == Pemilihan.TingkatPemilihan.KELURAHAN).count();
        
        stats.put("tingkatProvinsi", provinsi);
        stats.put("tingkatKota", kota);
        stats.put("tingkatKecamatan", kecamatan);
        stats.put("tingkatKelurahan", kelurahan);
        
        // Total laporan
        int totalLaporan = allPemilihan.stream()
            .mapToInt(p -> {
                List<DetailPemilihan> details = detailPemilihanRepository.findByPemilihanIdWithLaporanOrderByUrutan(p.getPemilihanId());
                return details != null ? details.size() : 0;
            })
            .sum();
        stats.put("totalLaporan", totalLaporan);
        
        return stats;
    }
    
    public List<PemilihanDTO> getPemilihanByWilayah(String provinsi, String kota, String kecamatan, String kelurahan) {
        // Use the existing findByWilayah method from repository
        List<Pemilihan> pemilihanList = pemilihanRepository.findByWilayah(provinsi, kota, kecamatan, kelurahan, org.springframework.data.domain.Pageable.unpaged()).getContent();
        
        return pemilihanList.stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }
    
    public void updateExpiredPemilihan() {
        // Simplified implementation - get all active pemilihan and check dates
        List<Pemilihan> aktivePemilihan = pemilihanRepository.findByStatus(Pemilihan.StatusPemilihan.AKTIF);
        LocalDateTime now = LocalDateTime.now();
        
        List<Pemilihan> expiredPemilihan = aktivePemilihan.stream()
                .filter(p -> p.getUpdatedAt() != null && p.getUpdatedAt().isBefore(now.minusDays(30))) // Example: expired after 30 days
                .collect(Collectors.toList());
                
        expiredPemilihan.forEach(p -> {
            p.setStatus(Pemilihan.StatusPemilihan.SELESAI);
            p.setUpdatedAt(LocalDateTime.now());
        });
        pemilihanRepository.saveAll(expiredPemilihan);
    }
    
    private void updatePemilihanFields(Pemilihan pemilihan, PemilihanDTO dto) {
        pemilihan.setNamaPemilihan(dto.getJudulPemilihan());
        pemilihan.setDeskripsiPemilihan(dto.getDeskripsi());
        pemilihan.setTahun(dto.getTahun() != null ? dto.getTahun() : java.time.LocalDate.now().getYear());
        
        // Set periode pemilihan
        pemilihan.setTanggalMulai(dto.getTanggalMulai());
        pemilihan.setTanggalSelesai(dto.getTanggalSelesai());
        
        // Set status pemilihan
        if (dto.getStatus() != null) {
            pemilihan.setStatus(Pemilihan.StatusPemilihan.valueOf(dto.getStatus()));
        }
        
        // Set wilayah - hanya simpan kode saja
        pemilihan.setProvinsiId(dto.getProvinsi());
        pemilihan.setKotaId(dto.getKota());
        pemilihan.setKecamatanId(dto.getKecamatan());
        pemilihan.setKelurahanId(dto.getKelurahan());
        
        pemilihan.setUpdatedAt(LocalDateTime.now());
    }
    
    private Pemilihan convertToEntity(PemilihanDTO dto) {
        Pemilihan pemilihan = new Pemilihan();
        pemilihan.setNamaPemilihan(dto.getJudulPemilihan());
        pemilihan.setDeskripsiPemilihan(dto.getDeskripsi());
        pemilihan.setTahun(dto.getTahun() != null ? dto.getTahun() : java.time.LocalDate.now().getYear());
        
        // Set periode pemilihan
        pemilihan.setTanggalMulai(dto.getTanggalMulai());
        pemilihan.setTanggalSelesai(dto.getTanggalSelesai());
        
        // Set tingkat pemilihan based on DTO
        if (dto.getTingkatPemilihan() != null) {
            try {
                // Convert lowercase to uppercase for enum
                String tingkatUpper = dto.getTingkatPemilihan().toUpperCase();
                // Handle "kota" -> "KOTA" mapping
                if ("KOTA".equals(tingkatUpper)) {
                    pemilihan.setTingkatPemilihan(Pemilihan.TingkatPemilihan.KOTA);
                } else {
                    pemilihan.setTingkatPemilihan(Pemilihan.TingkatPemilihan.valueOf(tingkatUpper));
                }
            } catch (IllegalArgumentException e) {
                pemilihan.setTingkatPemilihan(Pemilihan.TingkatPemilihan.PROVINSI); // default fallback
            }
        } else {
            pemilihan.setTingkatPemilihan(Pemilihan.TingkatPemilihan.PROVINSI); // default fallback
        }
        
        // Set status pemilihan
        if (dto.getStatus() != null) {
            pemilihan.setStatus(Pemilihan.StatusPemilihan.valueOf(dto.getStatus()));
        } else {
            pemilihan.setStatus(Pemilihan.StatusPemilihan.DRAFT);
        }
        
        // Set wilayah - hanya simpan kode saja
        pemilihan.setProvinsiId(dto.getProvinsi());
        pemilihan.setKotaId(dto.getKota());
        pemilihan.setKecamatanId(dto.getKecamatan());
        pemilihan.setKelurahanId(dto.getKelurahan());
        pemilihan.setRt(dto.getRt());
        pemilihan.setRw(dto.getRw());
        
        // Set lokasi
        pemilihan.setLatitude(dto.getLatitude());
        pemilihan.setLongitude(dto.getLongitude());
        pemilihan.setAlamatLokasi(dto.getAlamatLokasi());
        
        // Set user ID temporary
        pemilihan.setUserId(1L);
        
        return pemilihan;
    }
    
    private PemilihanDTO convertToDTO(Pemilihan pemilihan) {
        PemilihanDTO dto = new PemilihanDTO();
        dto.setPemilihanId(pemilihan.getPemilihanId());
        dto.setJudulPemilihan(pemilihan.getNamaPemilihan());
        dto.setDeskripsi(pemilihan.getDeskripsiPemilihan());
        dto.setTahun(pemilihan.getTahun());
        dto.setTanggalMulai(pemilihan.getTanggalMulai());
        dto.setTanggalSelesai(pemilihan.getTanggalSelesai());
        dto.setTanggalAktif(pemilihan.getTanggalMulai());
        dto.setTanggalBerakhir(pemilihan.getTanggalSelesai());
        dto.setTingkatPemilihan(pemilihan.getTingkatPemilihan().name().toLowerCase());
        dto.setStatus(pemilihan.getStatus().name());
        
        // Set kode wilayah
        dto.setProvinsi(pemilihan.getProvinsiId());
        dto.setKota(pemilihan.getKotaId());
        dto.setKecamatan(pemilihan.getKecamatanId());
        dto.setKelurahan(pemilihan.getKelurahanId());
        
        // Enrich dengan nama wilayah dari cache
        enrichWithLocationNames(dto);
        
        dto.setRt(pemilihan.getRt());
        dto.setRw(pemilihan.getRw());
        dto.setLatitude(pemilihan.getLatitude());
        dto.setLongitude(pemilihan.getLongitude());
        dto.setAlamatLokasi(pemilihan.getAlamatLokasi());
        dto.setCreatedAt(pemilihan.getCreatedAt());
        dto.setUpdatedAt(pemilihan.getUpdatedAt());
        
        // Alamat lengkap
        dto.setAlamatLengkap(buildAlamatLengkap(pemilihan));
        
        // Set wilayah berdasarkan tingkat pemilihan
        dto.setWilayahTingkat(getWilayahByTingkat(dto));
        
        // Set detail laporan and total laporan
        List<DetailPemilihan> detailPemilihanList = detailPemilihanRepository.findByPemilihanIdWithLaporanOrderByUrutan(pemilihan.getPemilihanId());
        if (detailPemilihanList != null && !detailPemilihanList.isEmpty()) {
            List<PemilihanDTO.DetailPemilihanDTO> detailDTOList = detailPemilihanList.stream()
                .map(detail -> {
                    PemilihanDTO.DetailPemilihanDTO detailDTO = new PemilihanDTO.DetailPemilihanDTO();
                    detailDTO.setDetailPemilihanId(detail.getDetailPemilihanId());
                    detailDTO.setLaporanId(detail.getLaporan().getLaporanId());
                    detailDTO.setLaporanJudul(detail.getLaporan().getNamaLaporan());
                    detailDTO.setUrutanTampil(detail.getUrutanTampil());
                    detailDTO.setPosisiLayout(detail.getPosisiLayout());
                    detailDTO.setKeterangan(detail.getKeterangan());
                    
                    // Set jenisLaporan information
                    if (detail.getLaporan().getJenisLaporan() != null) {
                        detailDTO.setJenisLaporan(detail.getLaporan().getJenisLaporan().getNama());
                    }
                    
                    return detailDTO;
                })
                .collect(Collectors.toList());
            dto.setDetailLaporan(detailDTOList);
            dto.setTotalLaporan(detailDTOList.size());
        } else {
            dto.setTotalLaporan(0);
        }
        
        return dto;
    }
    
    private String buildAlamatLengkap(Pemilihan pemilihan) {
        StringBuilder alamat = new StringBuilder();
        
        // Buat DTO sementara untuk get nama wilayah
        PemilihanDTO tempDto = new PemilihanDTO();
        tempDto.setProvinsi(pemilihan.getProvinsiId());
        tempDto.setKota(pemilihan.getKotaId());
        tempDto.setKecamatan(pemilihan.getKecamatanId());
        tempDto.setKelurahan(pemilihan.getKelurahanId());
        enrichWithLocationNames(tempDto);
        
        if (tempDto.getKelurahanNama() != null && !tempDto.getKelurahanNama().isEmpty()) {
            alamat.append(tempDto.getKelurahanNama()).append(", ");
        }
        if (tempDto.getKecamatanNama() != null && !tempDto.getKecamatanNama().isEmpty()) {
            alamat.append(tempDto.getKecamatanNama()).append(", ");
        }
        if (tempDto.getKotaNama() != null && !tempDto.getKotaNama().isEmpty()) {
            alamat.append(tempDto.getKotaNama()).append(", ");
        }
        if (tempDto.getProvinsiNama() != null && !tempDto.getProvinsiNama().isEmpty()) {
            alamat.append(tempDto.getProvinsiNama());
        }
        
        return alamat.toString().replaceAll(", $", "");
    }
    
    private PemilihanDTO convertRequestToDTO(CreatePemilihanRequest request) {
        PemilihanDTO dto = new PemilihanDTO();
        dto.setJudulPemilihan(request.getJudulPemilihan());
        dto.setDeskripsi(request.getDeskripsi());
        dto.setProvinsi(request.getProvinsi());
        dto.setKota(request.getKota());
        dto.setKecamatan(request.getKecamatan());
        dto.setKelurahan(request.getKelurahan());
        dto.setRt(request.getRt());
        dto.setRw(request.getRw());
        dto.setAlamatLokasi(request.getAlamatLokasi());
        dto.setLatitude(request.getLatitude());
        dto.setLongitude(request.getLongitude());
        dto.setStatus(request.getStatus());
        dto.setTingkatPemilihan(request.getTingkatPemilihan());
        
        // Convert date strings to LocalDateTime
        if (request.getTanggalAktif() != null && !request.getTanggalAktif().isEmpty()) {
            try {
                if (request.getTanggalAktif().contains("T")) {
                    dto.setTanggalMulai(LocalDateTime.parse(request.getTanggalAktif().substring(0, 19)));
                } else {
                    dto.setTanggalMulai(LocalDateTime.parse(request.getTanggalAktif()));
                }
            } catch (Exception e) {
                System.err.println("Error parsing tanggalAktif: " + e.getMessage() + " - value: " + request.getTanggalAktif());
            }
        }
        
        if (request.getTanggalBerakhir() != null && !request.getTanggalBerakhir().isEmpty()) {
            try {
                if (request.getTanggalBerakhir().contains("T")) {
                    dto.setTanggalSelesai(LocalDateTime.parse(request.getTanggalBerakhir().substring(0, 19)));
                } else {
                    dto.setTanggalSelesai(LocalDateTime.parse(request.getTanggalBerakhir()));
                }
            } catch (Exception e) {
                System.err.println("Error parsing tanggalBerakhir: " + e.getMessage() + " - value: " + request.getTanggalBerakhir());
            }
        }
        
        // Convert DetailLaporanDto to DetailPemilihanDTO
        if (request.getDetailLaporan() != null && !request.getDetailLaporan().isEmpty()) {
            List<PemilihanDTO.DetailPemilihanDTO> detailPemilihanList = request.getDetailLaporan().stream()
                .map(detail -> {
                    PemilihanDTO.DetailPemilihanDTO detailDTO = new PemilihanDTO.DetailPemilihanDTO();
                    detailDTO.setLaporanId(detail.getLaporanId());
                    // Set default values
                    detailDTO.setUrutanTampil(1);
                    detailDTO.setPosisiLayout(1);
                    return detailDTO;
                })
                .collect(Collectors.toList());
            dto.setDetailLaporan(detailPemilihanList);
        }
        
        return dto;
    }
    
    private void enrichWithLocationNames(PemilihanDTO dto) {
        try {
            // Get province name
            if (dto.getProvinsi() != null && !dto.getProvinsi().isEmpty()) {
                Map<String, Object> provinces = wilayahService.getProvinces();
                if (provinces != null && provinces.containsKey("data")) {
                    @SuppressWarnings("unchecked")
                    java.util.List<Map<String, Object>> provinceList = (java.util.List<Map<String, Object>>) provinces.get("data");
                    for (Map<String, Object> province : provinceList) {
                        if (dto.getProvinsi().equals(province.get("code"))) {
                            dto.setProvinsiNama((String) province.get("name"));
                            break;
                        }
                    }
                }
            }
            
            // Get regency/city name
            if (dto.getKota() != null && !dto.getKota().isEmpty() && dto.getProvinsi() != null) {
                Map<String, Object> regencies = wilayahService.getRegencies(dto.getProvinsi());
                if (regencies != null && regencies.containsKey("data")) {
                    @SuppressWarnings("unchecked")
                    java.util.List<Map<String, Object>> regencyList = (java.util.List<Map<String, Object>>) regencies.get("data");
                    for (Map<String, Object> regency : regencyList) {
                        if (dto.getKota().equals(regency.get("code"))) {
                            dto.setKotaNama((String) regency.get("name"));
                            break;
                        }
                    }
                }
            }
            
            // Get district name
            if (dto.getKecamatan() != null && !dto.getKecamatan().isEmpty() && dto.getKota() != null) {
                Map<String, Object> districts = wilayahService.getDistricts(dto.getKota());
                if (districts != null && districts.containsKey("data")) {
                    @SuppressWarnings("unchecked")
                    java.util.List<Map<String, Object>> districtList = (java.util.List<Map<String, Object>>) districts.get("data");
                    for (Map<String, Object> district : districtList) {
                        if (dto.getKecamatan().equals(district.get("code"))) {
                            dto.setKecamatanNama((String) district.get("name"));
                            break;
                        }
                    }
                }
            }
            
            // Get village name
            if (dto.getKelurahan() != null && !dto.getKelurahan().isEmpty() && dto.getKecamatan() != null) {
                Map<String, Object> villages = wilayahService.getVillages(dto.getKecamatan());
                if (villages != null && villages.containsKey("data")) {
                    @SuppressWarnings("unchecked")
                    java.util.List<Map<String, Object>> villageList = (java.util.List<Map<String, Object>>) villages.get("data");
                    for (Map<String, Object> village : villageList) {
                        if (dto.getKelurahan().equals(village.get("code"))) {
                            dto.setKelurahanNama((String) village.get("name"));
                            break;
                        }
                    }
                }
            }
            
        } catch (Exception e) {
            // Log error but don't fail the request
            System.err.println("Error enriching location names: " + e.getMessage());
        }
    }
    
    private String getWilayahByTingkat(PemilihanDTO dto) {
        String tingkat = dto.getTingkatPemilihan();
        
        if (tingkat == null) {
            return "";
        }
        
        switch (tingkat.toLowerCase()) {
            case "provinsi":
                return dto.getProvinsiNama() != null ? dto.getProvinsiNama() : "";
            case "kota":
            case "kabupaten":
                return dto.getKotaNama() != null ? dto.getKotaNama() : "";
            case "kecamatan":
                return dto.getKecamatanNama() != null ? dto.getKecamatanNama() : "";
            case "kelurahan":
            case "desa":
                return dto.getKelurahanNama() != null ? dto.getKelurahanNama() : "";
            default:
                return "";
        }
    }

    public List<PemilihanDTO> getPemilihanWithLocationData(
            String search, String nama, String provinsi, String kota, 
            String kecamatan, String tingkat, String status) {
        
        return pemilihanRepository.findAll().stream()
                .filter(pemilihan -> pemilihan.getLatitude() != null && pemilihan.getLongitude() != null)
                .filter(pemilihan -> {
                    if (search != null && !search.trim().isEmpty()) {
                        String searchLower = search.trim().toLowerCase();
                        return pemilihan.getNamaPemilihan().toLowerCase().contains(searchLower);
                    }
                    return true;
                })
                .filter(pemilihan -> {
                    if (nama != null && !nama.trim().isEmpty()) {
                        return pemilihan.getNamaPemilihan().toLowerCase().contains(nama.trim().toLowerCase());
                    }
                    return true;
                })
                .filter(pemilihan -> {
                    if (provinsi != null && !provinsi.trim().isEmpty()) {
                        return pemilihan.getProvinsiId() != null && 
                               pemilihan.getProvinsiId().equals(provinsi.trim());
                    }
                    return true;
                })
                .filter(pemilihan -> {
                    if (kota != null && !kota.trim().isEmpty()) {
                        return pemilihan.getKotaId() != null && 
                               pemilihan.getKotaId().equals(kota.trim());
                    }
                    return true;
                })
                .filter(pemilihan -> {
                    if (kecamatan != null && !kecamatan.trim().isEmpty()) {
                        return pemilihan.getKecamatanId() != null && 
                               pemilihan.getKecamatanId().equals(kecamatan.trim());
                    }
                    return true;
                })
                .filter(pemilihan -> {
                    if (tingkat != null && !tingkat.trim().isEmpty()) {
                        return pemilihan.getTingkatPemilihan() != null && 
                               pemilihan.getTingkatPemilihan().name().equalsIgnoreCase(tingkat.trim());
                    }
                    return true;
                })
                .filter(pemilihan -> {
                    if (status != null && !status.trim().isEmpty()) {
                        return pemilihan.getStatus().name().equalsIgnoreCase(status.trim());
                    }
                    return true;
                })
                .map(this::convertToDTOWithStats)
                .collect(Collectors.toList());
    }
    
    private PemilihanDTO convertToDTOWithStats(Pemilihan pemilihan) {
        PemilihanDTO dto = convertToDTO(pemilihan);
        
        // Calculate additional statistics
        // Get total pegawai using this pemilihan
        long totalPegawai = pegawaiRepository.countByPemilihanId(pemilihan.getPemilihanId());
        dto.setTotalPegawai((int) totalPegawai);
        
        // Get total jenis laporan from DetailPemilihan
        List<DetailPemilihan> detailPemilihanList = detailPemilihanRepository.findByPemilihanIdWithLaporanOrderByUrutan(pemilihan.getPemilihanId());
        if (detailPemilihanList != null && !detailPemilihanList.isEmpty()) {
            // Count unique jenis laporan
            Set<Long> uniqueJenisLaporan = detailPemilihanList.stream()
                .filter(detail -> detail.getLaporan() != null && detail.getLaporan().getJenisLaporan() != null)
                .map(detail -> detail.getLaporan().getJenisLaporan().getJenisLaporanId())
                .collect(Collectors.toSet());
            dto.setTotalJenisLaporan(uniqueJenisLaporan.size());
            
            // Count total tahapan (same as total laporan)
            dto.setTotalTahapan(detailPemilihanList.size());
        } else {
            dto.setTotalJenisLaporan(0);
            dto.setTotalTahapan(0);
        }
        
        return dto;
    }
}
