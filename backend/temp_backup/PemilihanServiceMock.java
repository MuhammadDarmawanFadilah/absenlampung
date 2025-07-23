package com.shadcn.backend.service;

import com.shadcn.backend.dto.PemilihanDTO;
import com.shadcn.backend.dto.CreatePemilihanRequest;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class PemilihanServiceMock {
    
    private Map<Long, PemilihanDTO> pemilihanData = new HashMap<>();
    private Long nextId = 1L;
    
    public PemilihanServiceMock() {
        // Initialize with some mock data
        initializeMockData();
    }
    
    public List<PemilihanDTO> getAllPemilihan() {
        return new ArrayList<>(pemilihanData.values());
    }
    
    public Optional<PemilihanDTO> getPemilihanById(Long id) {
        return Optional.ofNullable(pemilihanData.get(id));
    }
    
    public List<PemilihanDTO> getPemilihanByStatus(String status) {
        return pemilihanData.values().stream()
                .filter(p -> status.equals(p.getStatus()))
                .collect(Collectors.toList());
    }
    
    public List<PemilihanDTO> getActivePemilihan() {
        return pemilihanData.values().stream()
                .filter(p -> "AKTIF".equals(p.getStatus()))
                .collect(Collectors.toList());
    }
    
    public PemilihanDTO createPemilihan(PemilihanDTO pemilihanDTO) {
        pemilihanDTO.setPemilihanId(nextId++);
        pemilihanDTO.setCreatedAt(LocalDateTime.now());
        pemilihanDTO.setUpdatedAt(LocalDateTime.now());
        if (pemilihanDTO.getStatus() == null) {
            pemilihanDTO.setStatus("DRAFT");
        }
        pemilihanData.put(pemilihanDTO.getPemilihanId(), pemilihanDTO);
        return pemilihanDTO;
    }
    
    public PemilihanDTO createPemilihan(CreatePemilihanRequest request) {
        PemilihanDTO pemilihanDTO = convertRequestToDTO(request);
        return createPemilihan(pemilihanDTO);
    }
    
    public PemilihanDTO updatePemilihan(Long id, PemilihanDTO pemilihanDTO) {
        if (pemilihanData.containsKey(id)) {
            pemilihanDTO.setPemilihanId(id);
            pemilihanDTO.setUpdatedAt(LocalDateTime.now());
            // Keep original creation time
            PemilihanDTO existing = pemilihanData.get(id);
            pemilihanDTO.setCreatedAt(existing.getCreatedAt());
            pemilihanData.put(id, pemilihanDTO);
            return pemilihanDTO;
        }
        return null;
    }
    
    public boolean deletePemilihan(Long id) {
        return pemilihanData.remove(id) != null;
    }
    
    public List<String> getActiveProvinsi() {
        return pemilihanData.values().stream()
                .map(PemilihanDTO::getProvinsi)
                .filter(Objects::nonNull)
                .distinct()
                .collect(Collectors.toList());
    }
    
    public List<String> getActiveKotaByProvinsi(String provinsi) {
        return pemilihanData.values().stream()
                .filter(p -> provinsi.equals(p.getProvinsi()))
                .map(PemilihanDTO::getKota)
                .filter(Objects::nonNull)
                .distinct()
                .collect(Collectors.toList());
    }
    
    public List<PemilihanDTO> searchPemilihan(String keyword) {
        return pemilihanData.values().stream()
                .filter(p -> p.getJudulPemilihan().toLowerCase().contains(keyword.toLowerCase()) ||
                           (p.getDeskripsi() != null && p.getDeskripsi().toLowerCase().contains(keyword.toLowerCase())))
                .collect(Collectors.toList());
    }
    
    public List<PemilihanDTO> getPemilihanByWilayah(String provinsi, String kota, String kecamatan, String kelurahan) {
        return pemilihanData.values().stream()
                .filter(p -> {
                    boolean match = provinsi.equals(p.getProvinsi());
                    if (kota != null && !kota.isEmpty()) {
                        match = match && kota.equals(p.getKota());
                    }
                    if (kecamatan != null && !kecamatan.isEmpty()) {
                        match = match && kecamatan.equals(p.getKecamatan());
                    }
                    if (kelurahan != null && !kelurahan.isEmpty()) {
                        match = match && kelurahan.equals(p.getKelurahan());
                    }
                    return match;
                })
                .collect(Collectors.toList());
    }
    
    public void updateExpiredPemilihan() {
        // Mock implementation - in real app would check dates
        pemilihanData.values().forEach(p -> {
            if ("AKTIF".equals(p.getStatus())) {
                // Check if should be expired based on some criteria
                // For now, just mock behavior
            }
        });
    }
    
    private void initializeMockData() {
        // Create some sample data
        PemilihanDTO sample1 = new PemilihanDTO();
        sample1.setPemilihanId(1L);
        sample1.setJudulPemilihan("Pemilihan Kepala Desa Sukamaju 2024");
        sample1.setDeskripsi("Pemilihan kepala desa periode 2024-2030");
        sample1.setTahun(2024);
        sample1.setStatus("AKTIF");
        sample1.setProvinsi("Jawa Barat");
        sample1.setKota("Bandung");
        sample1.setKecamatan("Cicendo");
        sample1.setKelurahan("Sukamaju");
        sample1.setCreatedAt(LocalDateTime.now().minusDays(7));
        sample1.setUpdatedAt(LocalDateTime.now().minusDays(7));
        sample1.setAlamatLengkap("Sukamaju, Cicendo, Bandung, Jawa Barat");
        sample1.setTotalLaporan(3);
        
        PemilihanDTO sample2 = new PemilihanDTO();
        sample2.setPemilihanId(2L);
        sample2.setJudulPemilihan("Pemilihan RT 01 Kelurahan Babakan");
        sample2.setDeskripsi("Pemilihan ketua RT 01");
        sample2.setTahun(2024);
        sample2.setStatus("DRAFT");
        sample2.setProvinsi("Jawa Barat");
        sample2.setKota("Bandung");
        sample2.setKecamatan("Babakan Ciparay");
        sample2.setKelurahan("Babakan");
        sample2.setCreatedAt(LocalDateTime.now().minusDays(2));
        sample2.setUpdatedAt(LocalDateTime.now().minusDays(2));
        sample2.setAlamatLengkap("Babakan, Babakan Ciparay, Bandung, Jawa Barat");
        sample2.setTotalLaporan(2);
        
        pemilihanData.put(1L, sample1);
        pemilihanData.put(2L, sample2);
        nextId = 3L;
    }
    
    private PemilihanDTO convertRequestToDTO(CreatePemilihanRequest request) {
        PemilihanDTO dto = new PemilihanDTO();
        dto.setJudulPemilihan(request.getJudulPemilihan());
        dto.setDeskripsi(request.getDeskripsi());
        dto.setProvinsi(request.getProvinsi());
        dto.setKota(request.getKota());
        dto.setKecamatan(request.getKecamatan());
        dto.setKelurahan(request.getKelurahan());
        dto.setStatus(request.getStatus());
        
        // Set current year if not provided
        if (dto.getTahun() == null) {
            dto.setTahun(LocalDateTime.now().getYear());
        }
        
        // Set detail pemilihan - convert DetailLaporanDTO to DetailPemilihanDTO
        if (request.getDetailLaporan() != null) {
            List<PemilihanDTO.DetailPemilihanDTO> detailPemilihanList = request.getDetailLaporan().stream()
                .map(detail -> {
                    PemilihanDTO.DetailPemilihanDTO detailDTO = new PemilihanDTO.DetailPemilihanDTO();
                    detailDTO.setLaporanId(detail.getLaporanId());
                    // Set default values since DetailLaporanDTO doesn't have all fields
                    detailDTO.setNamaCandidat("Default Candidate");
                    detailDTO.setPartai("Default Party");
                    detailDTO.setUrutanTampil(1);
                    detailDTO.setPosisiLayout(1);
                    detailDTO.setStatus("ACTIVE");
                    detailDTO.setJenisLaporan("Default");
                    return detailDTO;
                })
                .collect(Collectors.toList());
            dto.setDetailLaporan(detailPemilihanList);
            dto.setTotalLaporan(detailPemilihanList.size());
        }
        
        // Build alamat lengkap
        dto.setAlamatLengkap(buildAlamatLengkap(request));
        
        return dto;
    }
    
    private String buildAlamatLengkap(CreatePemilihanRequest request) {
        StringBuilder alamat = new StringBuilder();
        
        if (request.getKelurahan() != null && !request.getKelurahan().isEmpty()) {
            alamat.append(request.getKelurahan()).append(", ");
        }
        if (request.getKecamatan() != null && !request.getKecamatan().isEmpty()) {
            alamat.append(request.getKecamatan()).append(", ");
        }
        if (request.getKota() != null && !request.getKota().isEmpty()) {
            alamat.append(request.getKota()).append(", ");
        }
        if (request.getProvinsi() != null && !request.getProvinsi().isEmpty()) {
            alamat.append(request.getProvinsi());
        }
        
        return alamat.toString().replaceAll(", $", "");
    }
}
