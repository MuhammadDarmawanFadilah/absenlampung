package com.shadcn.backend.service;

import com.shadcn.backend.dto.*;
import com.shadcn.backend.model.*;
import com.shadcn.backend.repository.*;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class LaporanService {
    
    private final LaporanRepository laporanRepository;
    private final JenisLaporanRepository jenisLaporanRepository;
    private final TahapanLaporanRepository tahapanLaporanRepository;
    private final DetailLaporanRepository detailLaporanRepository;
    private final LampiranLaporanRepository lampiranLaporanRepository;
    private final DetailPemilihanRepository detailPemilihanRepository;
    private final PemilihanRepository pemilihanRepository;
    private final FileUploadService fileUploadService;
    private final ObjectMapper objectMapper;
    
    // Get laporan with pagination and filters, including associated jenis laporan
    public Page<Map<String, Object>> getAllLaporanWithJenisLaporan(LaporanFilterRequest filterRequest) {
        Sort sort = Sort.by(
            filterRequest.getSortDirection().equalsIgnoreCase("desc") 
                ? Sort.Direction.DESC 
                : Sort.Direction.ASC,
            filterRequest.getSortBy()
        );
        
        Pageable pageable = PageRequest.of(filterRequest.getPage(), filterRequest.getSize(), sort);
        
        // Convert status string to enum
        Laporan.StatusLaporan statusEnum = null;
        if (filterRequest.getStatus() != null && !filterRequest.getStatus().trim().isEmpty()) {
            try {
                statusEnum = Laporan.StatusLaporan.valueOf(filterRequest.getStatus().toUpperCase());
            } catch (IllegalArgumentException e) {
                // Invalid status, ignore the filter
                statusEnum = null;
            }
        }
        
        Page<Laporan> laporanPage = laporanRepository.findWithFilters(
            filterRequest.getNamaLaporan(),
            filterRequest.getJenisLaporanId(),
            statusEnum,
            filterRequest.getUserId(),
            pageable
        );
        
        return laporanPage.map(laporan -> {
            Map<String, Object> result = new HashMap<>();
            
            // Basic laporan info
            LaporanDto dto = convertToDto(laporan);
            result.put("laporan", dto);
            
            // Get all associated jenis laporan through tahapan
            List<DetailLaporan> detailList = detailLaporanRepository
                    .findByLaporanLaporanIdOrderByTahapanLaporanUrutanTahapanAsc(laporan.getLaporanId());
            
            Set<Long> jenisLaporanIds = detailList.stream()
                    .map(detail -> detail.getTahapanLaporan().getJenisLaporan().getJenisLaporanId())
                    .collect(Collectors.toSet());
            
            // Only fetch jenis laporan data if there are any
            if (!jenisLaporanIds.isEmpty()) {
                List<JenisLaporan> jenisLaporanList = jenisLaporanRepository.findAllById(jenisLaporanIds);
                
                // Convert to names for display (limit to first 3 for performance)
                List<String> jenisLaporanNames = jenisLaporanList.stream()
                        .limit(10) // Limit to reasonable number for backend processing
                        .map(JenisLaporan::getNama)
                        .collect(Collectors.toList());
                
                // Convert JenisLaporan entities to simple DTOs (limit to first 3)
                List<Map<String, Object>> jenisLaporanDtos = jenisLaporanList.stream()
                        .limit(3) // Only process first 3 for detailed data
                        .map(jenisLaporan -> {
                            Map<String, Object> jenisDto = new HashMap<>();
                            jenisDto.put("jenisLaporanId", jenisLaporan.getJenisLaporanId());
                            jenisDto.put("nama", jenisLaporan.getNama());
                            jenisDto.put("deskripsi", jenisLaporan.getDeskripsi());
                            jenisDto.put("status", jenisLaporan.getStatus());
                            return jenisDto;
                        })
                        .collect(Collectors.toList());
                
                result.put("jenisLaporanNames", jenisLaporanNames);
                result.put("jenisLaporanList", jenisLaporanDtos);
                result.put("totalJenisLaporan", jenisLaporanList.size()); // Add total count
            } else {
                // Handle case where there are no jenis laporan
                result.put("jenisLaporanNames", new ArrayList<>());
                result.put("jenisLaporanList", new ArrayList<>());
                result.put("totalJenisLaporan", 0);
            }
            
            return result;
        });
    }

    // Get laporan with pagination and filters
    public Page<LaporanDto> getAllLaporan(LaporanFilterRequest filterRequest) {
        Sort sort = Sort.by(
            filterRequest.getSortDirection().equalsIgnoreCase("desc") 
                ? Sort.Direction.DESC 
                : Sort.Direction.ASC,
            filterRequest.getSortBy()
        );
        
        Pageable pageable = PageRequest.of(filterRequest.getPage(), filterRequest.getSize(), sort);
        
        // Convert status string to enum
        Laporan.StatusLaporan statusEnum = null;
        if (filterRequest.getStatus() != null && !filterRequest.getStatus().trim().isEmpty()) {
            try {
                statusEnum = Laporan.StatusLaporan.valueOf(filterRequest.getStatus().toUpperCase());
            } catch (IllegalArgumentException e) {
                // Invalid status, ignore the filter
                statusEnum = null;
            }
        }
        
        Page<Laporan> laporanPage = laporanRepository.findWithFilters(
            filterRequest.getNamaLaporan(),
            filterRequest.getJenisLaporanId(),
            statusEnum,
            filterRequest.getUserId(),
            pageable
        );
        
        return laporanPage.map(this::convertToDto);
    }
    
    // Get laporan by user
    public Page<LaporanDto> getLaporanByUser(Long userId, LaporanFilterRequest filterRequest) {
        filterRequest.setUserId(userId);
        return getAllLaporan(filterRequest);
    }
    
    // Get laporan by ID
    public Optional<LaporanDto> getLaporanById(Long id) {
        return laporanRepository.findById(id)
                .map(this::convertToDtoWithDetails);
    }
    
    // Get laporan by ID with authorization check
    public Optional<LaporanDto> getLaporanByIdForUser(Long id, Long userId) {
        Optional<Laporan> laporanOpt = laporanRepository.findById(id);
        if (laporanOpt.isEmpty()) {
            return Optional.empty();
        }
        
        Laporan laporan = laporanOpt.get();
        if (!laporan.getUserId().equals(userId)) {
            throw new SecurityException("Anda tidak memiliki akses ke laporan ini");
        }
        
        return Optional.of(convertToDtoWithDetails(laporan));
    }
    
    // Create laporan
    @Transactional
    public LaporanDto createLaporan(LaporanDto laporanDto) {
        JenisLaporan jenisLaporan = jenisLaporanRepository.findById(laporanDto.getJenisLaporanId())
                .orElseThrow(() -> new RuntimeException("Jenis laporan tidak ditemukan"));
        
        Laporan laporan = convertToEntity(laporanDto);
        laporan.setJenisLaporan(jenisLaporan);
        laporan.setCreatedAt(LocalDateTime.now());
        laporan.setUpdatedAt(LocalDateTime.now());
        
        Laporan savedLaporan = laporanRepository.save(laporan);
        
        // Create detail laporan for each tahapan
        List<TahapanLaporan> tahapanList = tahapanLaporanRepository
                .findActiveTahapanByJenisLaporan(jenisLaporan.getJenisLaporanId());
        
        for (TahapanLaporan tahapan : tahapanList) {
            DetailLaporan detail = new DetailLaporan();
            detail.setLaporan(savedLaporan);
            detail.setTahapanLaporan(tahapan);
            detail.setStatus(DetailLaporan.StatusDetailLaporan.BELUM_DIKERJAKAN);
            detail.setCreatedAt(LocalDateTime.now());
            detail.setUpdatedAt(LocalDateTime.now());
            detailLaporanRepository.save(detail);
        }
        
        return convertToDto(savedLaporan);
    }
    
    // Create laporan dengan wizard (support multiple jenis laporan)
    @Transactional
    public LaporanDto createLaporanWizard(LaporanWizardDto wizardDto) {
        // Validasi jenis laporan
        List<JenisLaporan> jenisLaporanList = jenisLaporanRepository.findAllById(wizardDto.getJenisLaporanIds());
        if (jenisLaporanList.size() != wizardDto.getJenisLaporanIds().size()) {
            throw new RuntimeException("Beberapa jenis laporan tidak ditemukan");
        }
        
        // Buat laporan utama dengan jenis laporan pertama sebagai primary
        JenisLaporan primaryJenisLaporan = jenisLaporanList.get(0);
        
        Laporan laporan = new Laporan();
        laporan.setNamaLaporan(wizardDto.getNamaLaporan());
        laporan.setDeskripsi(wizardDto.getDeskripsi());
        laporan.setJenisLaporan(primaryJenisLaporan);
        laporan.setUserId(wizardDto.getUserId());
        laporan.setStatus(wizardDto.getStatus() != null ? 
                         Laporan.StatusLaporan.valueOf(wizardDto.getStatus().toUpperCase()) : 
                         Laporan.StatusLaporan.AKTIF);
        laporan.setCreatedAt(LocalDateTime.now());
        laporan.setUpdatedAt(LocalDateTime.now());
        
        Laporan savedLaporan = laporanRepository.save(laporan);
        
        // Create detail laporan untuk semua jenis laporan yang dipilih
        for (JenisLaporan jenisLaporan : jenisLaporanList) {
            List<TahapanLaporan> tahapanList = tahapanLaporanRepository
                    .findActiveTahapanByJenisLaporan(jenisLaporan.getJenisLaporanId());
            
            for (TahapanLaporan tahapan : tahapanList) {
                DetailLaporan detail = new DetailLaporan();
                detail.setLaporan(savedLaporan);
                detail.setTahapanLaporan(tahapan);
                detail.setStatus(DetailLaporan.StatusDetailLaporan.BELUM_DIKERJAKAN);
                detail.setCreatedAt(LocalDateTime.now());
                detail.setUpdatedAt(LocalDateTime.now());
                detailLaporanRepository.save(detail);
            }
        }
        
        return convertToDto(savedLaporan);
    }
    
    // Update laporan
    @Transactional
    public LaporanDto updateLaporan(Long id, LaporanDto laporanDto, Long userId) {
        Laporan existingLaporan = laporanRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Laporan tidak ditemukan"));
        
        // Check authorization
        if (!existingLaporan.getUserId().equals(userId)) {
            throw new SecurityException("Anda tidak memiliki akses untuk mengedit laporan ini");
        }
        
        existingLaporan.setNamaLaporan(laporanDto.getNamaLaporan());
        existingLaporan.setDeskripsi(laporanDto.getDeskripsi());
        
        // Convert string status to enum
        if (laporanDto.getStatus() != null) {
            existingLaporan.setStatus(Laporan.StatusLaporan.valueOf(laporanDto.getStatus().toUpperCase()));
        }
        
        existingLaporan.setUpdatedAt(LocalDateTime.now());
        
        Laporan savedLaporan = laporanRepository.save(existingLaporan);
        return convertToDto(savedLaporan);
    }
    
    // Update laporan dengan wizard (support multiple jenis laporan)
    @Transactional
    public LaporanDto updateLaporanWizard(Long id, LaporanWizardDto wizardDto, Long userId) {
        // Get existing laporan
        Laporan existingLaporan = laporanRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Laporan tidak ditemukan"));
        
        // Check authorization
        if (!existingLaporan.getUserId().equals(userId)) {
            throw new SecurityException("Anda tidak memiliki akses untuk mengedit laporan ini");
        }
        
        // Validasi jenis laporan
        List<JenisLaporan> jenisLaporanList = jenisLaporanRepository.findAllById(wizardDto.getJenisLaporanIds());
        if (jenisLaporanList.size() != wizardDto.getJenisLaporanIds().size()) {
            throw new RuntimeException("Beberapa jenis laporan tidak ditemukan");
        }
        
        // Update laporan utama
        existingLaporan.setNamaLaporan(wizardDto.getNamaLaporan());
        existingLaporan.setDeskripsi(wizardDto.getDeskripsi());
        
        // Set primary jenis laporan (first one in the list)
        JenisLaporan primaryJenisLaporan = jenisLaporanList.get(0);
        existingLaporan.setJenisLaporan(primaryJenisLaporan);
        
        // Convert string status to enum
        if (wizardDto.getStatus() != null) {
            existingLaporan.setStatus(Laporan.StatusLaporan.valueOf(wizardDto.getStatus().toUpperCase()));
        }
        
        existingLaporan.setUpdatedAt(LocalDateTime.now());
        
        Laporan savedLaporan = laporanRepository.save(existingLaporan);
        
        // Delete existing detail laporan to recreate them
        List<DetailLaporan> existingDetails = detailLaporanRepository.findByLaporanLaporanIdOrderByTahapanLaporanUrutanTahapanAsc(id);
        detailLaporanRepository.deleteAll(existingDetails);
        
        // Create new detail laporan untuk semua jenis laporan yang dipilih
        for (JenisLaporan jenisLaporan : jenisLaporanList) {
            List<TahapanLaporan> tahapanList = tahapanLaporanRepository
                    .findActiveTahapanByJenisLaporan(jenisLaporan.getJenisLaporanId());
            
            for (TahapanLaporan tahapan : tahapanList) {
                DetailLaporan detail = new DetailLaporan();
                detail.setLaporan(savedLaporan);
                detail.setTahapanLaporan(tahapan);
                detail.setStatus(DetailLaporan.StatusDetailLaporan.BELUM_DIKERJAKAN);
                detail.setCreatedAt(LocalDateTime.now());
                detail.setUpdatedAt(LocalDateTime.now());
                detailLaporanRepository.save(detail);
            }
        }
        
        return convertToDto(savedLaporan);
    }
    
    // Update laporan status
    @Transactional
    public LaporanDto updateLaporanStatus(Long id, Laporan.StatusLaporan status) {
        Laporan laporan = laporanRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Laporan tidak ditemukan"));
        
        laporan.setStatus(status);
        laporan.setUpdatedAt(LocalDateTime.now());
        
        Laporan savedLaporan = laporanRepository.save(laporan);
        return convertToDto(savedLaporan);
    }
    
    // Get all jenis laporan IDs associated with a laporan
    public List<Long> getAssociatedJenisLaporanIds(Long laporanId) {
        // Get all detail laporan for this laporan
        List<DetailLaporan> detailList = detailLaporanRepository
                .findByLaporanLaporanIdOrderByTahapanLaporanUrutanTahapanAsc(laporanId);
        
        // Extract unique jenis laporan IDs from tahapan
        return detailList.stream()
                .map(detail -> detail.getTahapanLaporan().getJenisLaporan().getJenisLaporanId())
                .distinct()
                .collect(Collectors.toList());
    }
    
    // Get laporan with associated jenis laporan details - optimized single call
    public Map<String, Object> getLaporanWithJenisLaporan(Long laporanId, Long userId, boolean isAdmin) {
        // Get the laporan first
        Optional<LaporanDto> laporanOpt;
        if (isAdmin) {
            laporanOpt = getLaporanById(laporanId);
        } else {
            laporanOpt = getLaporanByIdForUser(laporanId, userId);
        }
        
        if (laporanOpt.isEmpty()) {
            throw new RuntimeException("Laporan tidak ditemukan");
        }
        
        LaporanDto laporan = laporanOpt.get();
        
        // Get all detail laporan for this laporan
        List<DetailLaporan> detailList = detailLaporanRepository
                .findByLaporanLaporanIdOrderByTahapanLaporanUrutanTahapanAsc(laporanId);
        
        // Extract unique jenis laporan IDs and get their details with tahapan
        Set<Long> jenisLaporanIds = detailList.stream()
                .map(detail -> detail.getTahapanLaporan().getJenisLaporan().getJenisLaporanId())
                .collect(Collectors.toSet());
        
        // Get jenis laporan details with tahapan
        List<JenisLaporan> jenisLaporanList = jenisLaporanRepository.findAllById(jenisLaporanIds);
        
        // Convert to DTOs with tahapan details
        List<Map<String, Object>> jenisLaporanWithTahapan = jenisLaporanList.stream()
                .map(jenisLaporan -> {
                    Map<String, Object> jenisLaporanDto = new HashMap<>();
                    jenisLaporanDto.put("jenisLaporanId", jenisLaporan.getJenisLaporanId());
                    jenisLaporanDto.put("nama", jenisLaporan.getNama());
                    jenisLaporanDto.put("deskripsi", jenisLaporan.getDeskripsi());
                    jenisLaporanDto.put("status", jenisLaporan.getStatus());
                    jenisLaporanDto.put("createdAt", jenisLaporan.getCreatedAt());
                    jenisLaporanDto.put("updatedAt", jenisLaporan.getUpdatedAt());
                    
                    // Get tahapan for this jenis laporan
                    List<TahapanLaporan> tahapanList = tahapanLaporanRepository
                            .findByJenisLaporanJenisLaporanIdOrderByUrutanTahapanAsc(jenisLaporan.getJenisLaporanId());
                    
                    List<Map<String, Object>> tahapanDtoList = tahapanList.stream()
                            .map(tahapan -> {
                                Map<String, Object> tahapanDto = new HashMap<>();
                                tahapanDto.put("tahapanLaporanId", tahapan.getTahapanLaporanId());
                                tahapanDto.put("nama", tahapan.getNama());
                                tahapanDto.put("deskripsi", tahapan.getDeskripsi());
                                tahapanDto.put("urutanTahapan", tahapan.getUrutanTahapan());
                                tahapanDto.put("templateTahapan", tahapan.getTemplateTahapan());
                                // Parse jenisFileIzin from JSON string to array
                                try {
                                    String jenisFileIzinStr = tahapan.getJenisFileIzin();
                                    if (jenisFileIzinStr != null && !jenisFileIzinStr.isEmpty()) {
                                        ObjectMapper objectMapper = new ObjectMapper();
                                        List<String> jenisFileIzinList = objectMapper.readValue(jenisFileIzinStr, 
                                                new TypeReference<List<String>>() {});
                                        tahapanDto.put("jenisFileIzin", jenisFileIzinList);
                                    } else {
                                        tahapanDto.put("jenisFileIzin", new ArrayList<>());
                                    }
                                } catch (Exception e) {
                                    // Fallback to empty array if parsing fails
                                    tahapanDto.put("jenisFileIzin", new ArrayList<>());
                                }
                                tahapanDto.put("createdAt", tahapan.getCreatedAt());
                                tahapanDto.put("updatedAt", tahapan.getUpdatedAt());
                                return tahapanDto;
                            })
                            .collect(Collectors.toList());
                    
                    jenisLaporanDto.put("tahapanList", tahapanDtoList);
                    return jenisLaporanDto;
                })
                .collect(Collectors.toList());
        
        // Prepare response
        Map<String, Object> response = new HashMap<>();
        response.put("laporan", laporan);
        response.put("associatedJenisLaporan", jenisLaporanWithTahapan);
        response.put("jenisLaporanIds", new ArrayList<>(jenisLaporanIds));
        
        return response;
    }
    
    // Delete laporan
    @Transactional
    public void deleteLaporan(Long id, Long userId) {
        Laporan laporan = laporanRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Laporan tidak ditemukan"));
        
        // Check authorization
        if (!laporan.getUserId().equals(userId)) {
            throw new SecurityException("Anda tidak memiliki akses untuk menghapus laporan ini");
        }
        
        laporanRepository.delete(laporan);
    }
    
    // Update detail laporan
    @Transactional
    public DetailLaporanDTO updateDetailLaporan(Long detailId, String konten, Long userId) {
        DetailLaporan detail = detailLaporanRepository.findById(detailId)
                .orElseThrow(() -> new RuntimeException("Detail laporan tidak ditemukan"));
        
        // Check authorization
        if (!detail.getLaporan().getUserId().equals(userId)) {
            throw new SecurityException("Anda tidak memiliki akses untuk mengedit detail laporan ini");
        }
        
        detail.setKonten(konten);
        detail.setStatus(DetailLaporan.StatusDetailLaporan.DALAM_PENGERJAAN);
        detail.setUpdatedAt(LocalDateTime.now());
        
        DetailLaporan savedDetail = detailLaporanRepository.save(detail);
        return convertDetailToDto(savedDetail);
    }
    
    // Complete detail laporan
    @Transactional
    public DetailLaporanDTO completeDetailLaporan(Long detailId, Long userId) {
        DetailLaporan detail = detailLaporanRepository.findById(detailId)
                .orElseThrow(() -> new RuntimeException("Detail laporan tidak ditemukan"));
        
        // Check authorization
        if (!detail.getLaporan().getUserId().equals(userId)) {
            throw new SecurityException("Anda tidak memiliki akses untuk mengedit detail laporan ini");
        }
        
        detail.setStatus(DetailLaporan.StatusDetailLaporan.SELESAI);
        detail.setUpdatedAt(LocalDateTime.now());
        
        DetailLaporan savedDetail = detailLaporanRepository.save(detail);
        
        // Check if all tahapan completed and update laporan status
        boolean allCompleted = detailLaporanRepository.isAllTahapanCompleted(detail.getLaporan().getLaporanId());
        if (allCompleted) {
            updateLaporanStatus(detail.getLaporan().getLaporanId(), Laporan.StatusLaporan.AKTIF);
        }
        
        return convertDetailToDto(savedDetail);
    }
    
    // Upload file for detail laporan
    @Transactional
    public LampiranLaporanDto uploadLampiran(Long detailId, MultipartFile file, Long userId) {
        DetailLaporan detail = detailLaporanRepository.findById(detailId)
                .orElseThrow(() -> new RuntimeException("Detail laporan tidak ditemukan"));
        
        // Check authorization
        if (!detail.getLaporan().getUserId().equals(userId)) {
            throw new SecurityException("Anda tidak memiliki akses untuk upload file ke detail laporan ini");
        }
        
        // Validate file type against allowed types
        String jenisFile = getFileType(file.getOriginalFilename());
        List<String> allowedTypes = getAllowedFileTypes(detail.getTahapanLaporan());
        
        if (!allowedTypes.contains(jenisFile)) {
            throw new RuntimeException("Jenis file tidak diizinkan untuk tahapan ini");
        }
        
        // Upload file
        String filePath = fileUploadService.uploadFile(file, "laporan");
        
        // Save lampiran
        LampiranLaporan lampiran = new LampiranLaporan();
        lampiran.setDetailLaporan(detail);
        lampiran.setNamaFile(file.getOriginalFilename());
        lampiran.setPathFile(filePath);
        lampiran.setJenisFile(jenisFile);
        lampiran.setUkuranFile(file.getSize());
        lampiran.setCreatedAt(LocalDateTime.now());
        
        LampiranLaporan savedLampiran = lampiranLaporanRepository.save(lampiran);
        return convertLampiranToDto(savedLampiran);
    }
    
    // Get statistics
    public LaporanStats getLaporanStats(Long userId) {
        Object[] stats = laporanRepository.getLaporanStatistics(userId);
        if (stats.length > 0) {
            Object[] row = (Object[]) stats[0];
            return new LaporanStats(
                ((Number) row[0]).longValue(), // total
                ((Number) row[1]).longValue(), // draft
                ((Number) row[2]).longValue(), // aktif
                ((Number) row[3]).longValue()  // tidak aktif
            );
        }
        return new LaporanStats(0, 0, 0, 0);
    }
    
    // Get pemilihan dropdown based on user role
    public List<Map<String, Object>> getPemilihanDropdown(Long userId, boolean isAdmin) {
        try {
            List<Pemilihan> pemilihanList;
            
            if (isAdmin || userId == null) {
                // Admin can see all active pemilihan
                pemilihanList = pemilihanRepository.findByStatus(Pemilihan.StatusPemilihan.AKTIF);
            } else {
                // Regular user can only see pemilihan assigned to them through pegawai relationship
                // Use the existing query method that finds pemilihan by pegawai
                pemilihanList = pemilihanRepository.findByAdvancedFiltersWithPegawai(
                    null, null, "AKTIF", null, null, null, userId, 
                    org.springframework.data.domain.Pageable.unpaged()
                ).getContent();
            }
            
            return pemilihanList.stream()
                    .map(pemilihan -> {
                        Map<String, Object> dropdown = new HashMap<>();
                        dropdown.put("pemilihanId", pemilihan.getPemilihanId());
                        dropdown.put("namaPemilihan", pemilihan.getNamaPemilihan());
                        dropdown.put("deskripsi", pemilihan.getDeskripsiPemilihan());
                        dropdown.put("tingkatPemilihan", pemilihan.getTingkatPemilihan().name());
                        dropdown.put("tahun", pemilihan.getTahun());
                        dropdown.put("provinsiNama", pemilihan.getProvinsiNama());
                        dropdown.put("kotaNama", pemilihan.getKotaNama());
                        dropdown.put("kecamatanNama", pemilihan.getKecamatanNama());
                        dropdown.put("kelurahanNama", pemilihan.getKelurahanNama());
                        return dropdown;
                    })
                    .sorted((a, b) -> ((String) a.get("namaPemilihan"))
                            .compareToIgnoreCase((String) b.get("namaPemilihan")))
                    .collect(Collectors.toList());
        } catch (Exception e) {
            log.error("Error getting pemilihan dropdown", e);
            return new ArrayList<>();
        }
    }
    
    // Get jenis laporan by laporan ID only
    public List<Map<String, Object>> getJenisLaporanByLaporanId(Long laporanId) {
        try {
            // Get all detail laporan for this laporan
            List<DetailLaporan> detailList = detailLaporanRepository
                    .findByLaporanLaporanIdOrderByTahapanLaporanUrutanTahapanAsc(laporanId);
            
            // Extract unique jenis laporan IDs and get their details
            Set<Long> jenisLaporanIds = detailList.stream()
                    .map(detail -> detail.getTahapanLaporan().getJenisLaporan().getJenisLaporanId())
                    .collect(Collectors.toSet());
            
            // Get jenis laporan details
            List<JenisLaporan> jenisLaporanList = jenisLaporanRepository.findAllById(jenisLaporanIds);
            
            return jenisLaporanList.stream()
                    .map(jenisLaporan -> {
                        Map<String, Object> jenisLaporanDto = new HashMap<>();
                        jenisLaporanDto.put("jenisLaporanId", jenisLaporan.getJenisLaporanId());
                        jenisLaporanDto.put("nama", jenisLaporan.getNama());
                        jenisLaporanDto.put("deskripsi", jenisLaporan.getDeskripsi());
                        jenisLaporanDto.put("status", jenisLaporan.getStatus());
                        jenisLaporanDto.put("createdAt", jenisLaporan.getCreatedAt());
                        jenisLaporanDto.put("updatedAt", jenisLaporan.getUpdatedAt());
                        return jenisLaporanDto;
                    })
                    .collect(Collectors.toList());
        } catch (Exception e) {
            log.error("Error getting jenis laporan by laporan ID", e);
            return new ArrayList<>();
        }
    }
    
    // Get jenis laporan by pemilihan ID for dropdown
    public List<Map<String, Object>> getJenisLaporanByPemilihanId(Long pemilihanId) {
        try {
            // Get detail pemilihan for this pemilihan ID
            List<DetailPemilihan> detailPemilihanList = detailPemilihanRepository
                    .findByPemilihanIdWithLaporanOrderByUrutan(pemilihanId);
            
            // Extract unique jenis laporan IDs from laporan in this pemilihan
            Set<Long> jenisLaporanIds = detailPemilihanList.stream()
                    .filter(detail -> detail.getLaporan() != null && detail.getLaporan().getJenisLaporan() != null)
                    .map(detail -> detail.getLaporan().getJenisLaporan().getJenisLaporanId())
                    .collect(Collectors.toSet());
            
            // Get jenis laporan details
            List<JenisLaporan> jenisLaporanList = jenisLaporanRepository.findAllById(jenisLaporanIds);
            
            return jenisLaporanList.stream()
                    .map(jenisLaporan -> {
                        Map<String, Object> jenisLaporanDto = new HashMap<>();
                        jenisLaporanDto.put("jenisLaporanId", jenisLaporan.getJenisLaporanId());
                        jenisLaporanDto.put("nama", jenisLaporan.getNama());
                        jenisLaporanDto.put("deskripsi", jenisLaporan.getDeskripsi());
                        jenisLaporanDto.put("status", jenisLaporan.getStatus());
                        return jenisLaporanDto;
                    })
                    .sorted((a, b) -> ((String) a.get("nama"))
                            .compareToIgnoreCase((String) b.get("nama")))
                    .collect(Collectors.toList());
        } catch (Exception e) {
            log.error("Error getting jenis laporan by pemilihan ID", e);
            return new ArrayList<>();
        }
    }
    
    // Helper methods
    private String getFileType(String filename) {
        if (filename == null) return "unknown";
        
        String extension = filename.substring(filename.lastIndexOf(".") + 1).toLowerCase();
        return switch (extension) {
            case "jpg", "jpeg", "png", "gif", "bmp" -> "image";
            case "mp4", "avi", "mov", "wmv", "flv", "webm" -> "video";
            case "pdf" -> "pdf";
            case "xls", "xlsx" -> "excel";
            case "doc", "docx" -> "word";
            default -> "unknown";
        };
    }
    
    private List<String> getAllowedFileTypes(TahapanLaporan tahapan) {
        if (tahapan.getJenisFileIzin() == null) {
            return List.of();
        }
        
        try {
            return objectMapper.readValue(
                tahapan.getJenisFileIzin(), 
                new TypeReference<List<String>>() {}
            );
        } catch (Exception e) {
            log.error("Error parsing allowed file types", e);
            return List.of();
        }
    }
    
    // Convert entity to DTO with aggregated jenis laporan names
    private LaporanDto convertToDto(Laporan laporan) {
        LaporanDto dto = new LaporanDto();
        dto.setLaporanId(laporan.getLaporanId());
        dto.setNamaLaporan(laporan.getNamaLaporan());
        dto.setDeskripsi(laporan.getDeskripsi());
        dto.setUserId(laporan.getUserId());
        dto.setStatus(laporan.getStatus().name());
        dto.setCreatedAt(laporan.getCreatedAt());
        dto.setUpdatedAt(laporan.getUpdatedAt());
        dto.setJenisLaporanId(laporan.getJenisLaporan().getJenisLaporanId());
        
        // Get all related jenis laporan through DetailLaporan -> TahapanLaporan -> JenisLaporan
        List<DetailLaporan> detailList = detailLaporanRepository
                .findByLaporanLaporanIdOrderByTahapanLaporanUrutanTahapanAsc(laporan.getLaporanId());
        
        if (!detailList.isEmpty()) {
            // Collect unique jenis laporan names
            Set<String> jenisLaporanNames = detailList.stream()
                    .map(detail -> detail.getTahapanLaporan().getJenisLaporan().getNama())
                    .collect(Collectors.toSet());
            
            // Join with comma, limit to 3 and add "dll" if more
            List<String> namesList = new ArrayList<>(jenisLaporanNames);
            String combinedNames;
            if (namesList.size() > 3) {
                combinedNames = String.join(", ", namesList.subList(0, 3)) + ", dll";
            } else {
                combinedNames = String.join(", ", namesList);
            }
            dto.setJenisLaporanNama(combinedNames);
        } else {
            // Fallback to direct relationship if no details
            dto.setJenisLaporanNama(laporan.getJenisLaporan().getNama());
        }
        
        // Calculate progress
        Object[] progress = detailLaporanRepository.getLaporanProgress(laporan.getLaporanId());
        if (progress != null && progress.length >= 2) {
            try {
                // Handle potential null values and different number types
                Object totalObj = progress[0];
                Object selesaiObj = progress[1];
                
                long total = 0;
                long selesai = 0;
                
                if (totalObj != null) {
                    if (totalObj instanceof Number) {
                        total = ((Number) totalObj).longValue();
                    } else {
                        log.warn("Total progress is not a Number: {} for laporan {}", totalObj.getClass(), laporan.getLaporanId());
                    }
                }
                
                if (selesaiObj != null) {
                    if (selesaiObj instanceof Number) {
                        selesai = ((Number) selesaiObj).longValue();
                    } else {
                        log.warn("Selesai progress is not a Number: {} for laporan {}", selesaiObj.getClass(), laporan.getLaporanId());
                    }
                }
                
                dto.setTotalTahapan((int) total);
                dto.setTahapanSelesai((int) selesai);
                dto.setProgressPercentage(total > 0 ? (int) ((selesai * 100) / total) : 0);
            } catch (Exception e) {
                log.error("Error calculating progress for laporan {}: {}", laporan.getLaporanId(), e.getMessage());
                // Set default values if calculation fails
                dto.setTotalTahapan(0);
                dto.setTahapanSelesai(0);
                dto.setProgressPercentage(0);
            }
        } else {
            // Set default values if no progress data
            dto.setTotalTahapan(0);
            dto.setTahapanSelesai(0);
            dto.setProgressPercentage(0);
        }
        
        return dto;
    }
    
    private LaporanDto convertToDtoWithDetails(Laporan laporan) {
        LaporanDto dto = convertToDto(laporan);
        
        // Get detail laporan
        List<DetailLaporan> detailList = detailLaporanRepository
                .findByLaporanLaporanIdOrderByTahapanLaporanUrutanTahapanAsc(laporan.getLaporanId());
        
        dto.setDetailLaporanList(detailList.stream()
                .map(this::convertDetailToDto)
                .collect(Collectors.toList()));
        
        return dto;
    }
    
    private DetailLaporanDTO convertDetailToDto(DetailLaporan detail) {
        DetailLaporanDTO dto = new DetailLaporanDTO();
        dto.setDetailLaporanId(detail.getDetailLaporanId());
        dto.setKonten(detail.getKonten());
        dto.setStatus(detail.getStatus());
        dto.setCreatedAt(detail.getCreatedAt());
        dto.setUpdatedAt(detail.getUpdatedAt());
        dto.setLaporanId(detail.getLaporan().getLaporanId());
        dto.setTahapanLaporanId(detail.getTahapanLaporan().getTahapanLaporanId());
        dto.setTahapanNama(detail.getTahapanLaporan().getNama());
        dto.setTahapanDeskripsi(detail.getTahapanLaporan().getDeskripsi());
        dto.setTemplateTahapan(detail.getTahapanLaporan().getTemplateTahapan());
        dto.setUrutanTahapan(detail.getTahapanLaporan().getUrutanTahapan());
        
        // Add JenisLaporan information from TahapanLaporan
        dto.setJenisLaporanId(detail.getTahapanLaporan().getJenisLaporan().getJenisLaporanId());
        dto.setJenisLaporanNama(detail.getTahapanLaporan().getJenisLaporan().getNama());
        
        // Parse allowed file types
        List<String> allowedTypes = getAllowedFileTypes(detail.getTahapanLaporan());
        dto.setJenisFileIzin(allowedTypes);
        
        // Get lampiran
        List<LampiranLaporan> lampiranList = lampiranLaporanRepository
                .findByDetailLaporanDetailLaporanIdOrderByCreatedAtDesc(detail.getDetailLaporanId());
        
        dto.setLampiranList(lampiranList.stream()
                .map(this::convertLampiranToDto)
                .collect(Collectors.toList()));
        
        dto.setJumlahLampiran(lampiranList.size());
        
        return dto;
    }
    
    private LampiranLaporanDto convertLampiranToDto(LampiranLaporan lampiran) {
        LampiranLaporanDto dto = new LampiranLaporanDto();
        dto.setLampiranId(lampiran.getLampiranId());
        dto.setNamaFile(lampiran.getNamaFile());
        dto.setPathFile(lampiran.getPathFile());
        dto.setJenisFile(lampiran.getJenisFile());
        dto.setUkuranFile(lampiran.getUkuranFile());
        dto.setUkuranFileFormatted(formatFileSize(lampiran.getUkuranFile()));
        dto.setCreatedAt(lampiran.getCreatedAt());
        dto.setDetailLaporanId(lampiran.getDetailLaporan().getDetailLaporanId());
        dto.setDownloadUrl("/api/laporan/lampiran/" + lampiran.getLampiranId() + "/download");
        
        return dto;
    }
    
    private Laporan convertToEntity(LaporanDto dto) {
        Laporan entity = new Laporan();
        entity.setLaporanId(dto.getLaporanId());
        entity.setNamaLaporan(dto.getNamaLaporan());
        entity.setDeskripsi(dto.getDeskripsi());
        entity.setUserId(dto.getUserId());
        entity.setStatus(dto.getStatus() != null ? 
                        Laporan.StatusLaporan.valueOf(dto.getStatus().toUpperCase()) : 
                        Laporan.StatusLaporan.DRAFT);
        return entity;
    }
    
    private String formatFileSize(long size) {
        if (size < 1024) return size + " B";
        if (size < 1024 * 1024) return String.format("%.1f KB", size / 1024.0);
        if (size < 1024 * 1024 * 1024) return String.format("%.1f MB", size / (1024.0 * 1024));
        return String.format("%.1f GB", size / (1024.0 * 1024 * 1024));
    }
    
    // Get laporan by pemilihan ID
    public List<LaporanDto> getLaporanByPemilihanId(Long pemilihanId) {
        // Get detail pemilihan for this pemilihan ID
        List<DetailPemilihan> detailPemilihanList = detailPemilihanRepository
                .findByPemilihanIdWithLaporanOrderByUrutan(pemilihanId);
        
        // Extract unique laporan IDs and create mapping
        Map<Long, Long> laporanIdToPemilihanIdMap = detailPemilihanList.stream()
                .collect(Collectors.toMap(
                    detail -> detail.getLaporan().getLaporanId(),
                    detail -> detail.getPemilihan().getPemilihanId(),
                    (existing, replacement) -> existing // Keep first occurrence
                ));
        
        Set<Long> laporanIds = laporanIdToPemilihanIdMap.keySet();
        
        // Get all laporan by IDs
        List<Laporan> laporanList = laporanRepository.findAllById(laporanIds);
        
        // Convert to DTO and set pemilihanId
        return laporanList.stream()
                .map(laporan -> {
                    LaporanDto dto = convertToDto(laporan);
                    dto.setPemilihanId(laporanIdToPemilihanIdMap.get(laporan.getLaporanId()));
                    return dto;
                })
                .sorted((a, b) -> {
                    // Sort by nama laporan for consistent ordering
                    return a.getNamaLaporan().compareToIgnoreCase(b.getNamaLaporan());
                })
                .collect(Collectors.toList());
    }
    
    // Statistics class
    public static class LaporanStats {
        private final long total;
        private final long draft;
        private final long aktif;
        private final long tidakAktif;
        
        public LaporanStats(long total, long draft, long aktif, long tidakAktif) {
            this.total = total;
            this.draft = draft;
            this.aktif = aktif;
            this.tidakAktif = tidakAktif;
        }
        
        public long getTotal() { return total; }
        public long getDraft() { return draft; }
        public long getAktif() { return aktif; }
        public long getTidakAktif() { return tidakAktif; }
    }
}
