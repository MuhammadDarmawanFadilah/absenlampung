package com.shadcn.backend.service;

import com.shadcn.backend.dto.JenisLaporanDto;
import com.shadcn.backend.dto.JenisLaporanFilterRequest;
import com.shadcn.backend.dto.TahapanLaporanDto;
import com.shadcn.backend.model.JenisLaporan;
import com.shadcn.backend.model.TahapanLaporan;
import com.shadcn.backend.repository.JenisLaporanRepository;
import com.shadcn.backend.repository.TahapanLaporanRepository;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class JenisLaporanService {
    
    private final JenisLaporanRepository jenisLaporanRepository;
    private final TahapanLaporanRepository tahapanLaporanRepository;
    private final ObjectMapper objectMapper;
    
    @Value("${app.upload.temp-dir:/storage/temp}")
    private String tempUploadDir;
    
    @Value("${app.upload.dir:uploads}")
    private String uploadDir;
    
    private static final DateTimeFormatter DATETIME_FORMATTER = DateTimeFormatter.ofPattern("yyyyMMdd_HHmmss");
    
    // Get all jenis laporan with pagination and filters
    public Page<JenisLaporanDto> getAllJenisLaporan(JenisLaporanFilterRequest filterRequest) {
        Sort sort = Sort.by(
            filterRequest.getSortDirection().equalsIgnoreCase("desc") 
                ? Sort.Direction.DESC 
                : Sort.Direction.ASC,
            filterRequest.getSortBy()
        );
        
        Pageable pageable = PageRequest.of(filterRequest.getPage(), filterRequest.getSize(), sort);
        
        Page<JenisLaporan> jenisLaporanPage = jenisLaporanRepository.findWithFilters(
            filterRequest.getNama(),
            filterRequest.getStatus(),
            pageable
        );
        
        return jenisLaporanPage.map(this::convertToDto);
    }
    
    // Get all jenis laporan with tahapan, pagination and filters
    public Page<JenisLaporanDto> getAllJenisLaporanWithTahapan(JenisLaporanFilterRequest filterRequest) {
        Sort sort = Sort.by(
            filterRequest.getSortDirection().equalsIgnoreCase("desc") 
                ? Sort.Direction.DESC 
                : Sort.Direction.ASC,
            filterRequest.getSortBy()
        );
        
        Pageable pageable = PageRequest.of(filterRequest.getPage(), filterRequest.getSize(), sort);
        
        Page<JenisLaporan> jenisLaporanPage = jenisLaporanRepository.findWithFilters(
            filterRequest.getNama(),
            filterRequest.getStatus(),
            pageable
        );
        
        return jenisLaporanPage.map(this::convertToDtoWithTahapan);
    }
    
    // Get active jenis laporan for dropdown
    public List<JenisLaporanDto> getActiveJenisLaporan() {
        List<JenisLaporan> jenisLaporanList = jenisLaporanRepository.findActiveJenisLaporan();
        return jenisLaporanList.stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }
    
    // Get jenis laporan by ID
    public Optional<JenisLaporanDto> getJenisLaporanById(Long id) {
        return jenisLaporanRepository.findById(id)
                .map(this::convertToDto);
    }
    
    // Get jenis laporan with tahapan
    public Optional<JenisLaporanDto> getJenisLaporanWithTahapan(Long id) {
        Optional<JenisLaporan> jenisLaporanOpt = jenisLaporanRepository.findById(id);
        if (jenisLaporanOpt.isEmpty()) {
            return Optional.empty();
        }
        
        JenisLaporan jenisLaporan = jenisLaporanOpt.get();
        List<TahapanLaporan> tahapanList = tahapanLaporanRepository
                .findActiveTahapanByJenisLaporan(id);
        
        JenisLaporanDto dto = convertToDto(jenisLaporan);
        dto.setTahapanList(tahapanList.stream()
                .map(this::convertTahapanToDto)
                .collect(Collectors.toList()));
        
        return Optional.of(dto);
    }
    
    // Create jenis laporan
    @Transactional
    public JenisLaporanDto createJenisLaporan(JenisLaporanDto jenisLaporanDto) {
        // Validate nama is unique
        if (jenisLaporanRepository.existsByNamaIgnoreCase(jenisLaporanDto.getNama())) {
            throw new RuntimeException("Nama jenis laporan sudah ada");
        }
        
        JenisLaporan jenisLaporan = convertToEntity(jenisLaporanDto);
        jenisLaporan.setCreatedAt(LocalDateTime.now());
        jenisLaporan.setUpdatedAt(LocalDateTime.now());
        
        JenisLaporan savedJenisLaporan = jenisLaporanRepository.save(jenisLaporan);
        
        // Create tahapan if provided
        List<TahapanLaporanDto> createdTahapan = new ArrayList<>();
        if (jenisLaporanDto.getTahapanList() != null && !jenisLaporanDto.getTahapanList().isEmpty()) {
            for (TahapanLaporanDto tahapanDto : jenisLaporanDto.getTahapanList()) {
                TahapanLaporanDto created = createTahapanForJenisLaporan(savedJenisLaporan.getJenisLaporanId(), tahapanDto);
                createdTahapan.add(created);
            }
        }
        
        // Return DTO with created tahapan
        JenisLaporanDto result = convertToDto(savedJenisLaporan);
        result.setTahapanList(createdTahapan);
        return result;
    }
    
    // Update jenis laporan
    @Transactional
    public JenisLaporanDto updateJenisLaporan(Long id, JenisLaporanDto jenisLaporanDto) {
        JenisLaporan existingJenisLaporan = jenisLaporanRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Jenis laporan tidak ditemukan"));
        
        // Validate nama is unique (excluding current record)
        if (jenisLaporanRepository.existsByNamaIgnoreCaseAndIdNot(jenisLaporanDto.getNama(), id)) {
            throw new RuntimeException("Nama jenis laporan sudah ada");
        }
        
        // Update basic info
        existingJenisLaporan.setNama(jenisLaporanDto.getNama());
        existingJenisLaporan.setDeskripsi(jenisLaporanDto.getDeskripsi());
        existingJenisLaporan.setStatus(jenisLaporanDto.getStatus());
        existingJenisLaporan.setUpdatedAt(LocalDateTime.now());
        
        JenisLaporan savedJenisLaporan = jenisLaporanRepository.save(existingJenisLaporan);
        
        // Update tahapan if provided
        if (jenisLaporanDto.getTahapanList() != null) {
            updateTahapanForJenisLaporan(id, jenisLaporanDto.getTahapanList());
        }
        
        // Return with updated tahapan
        return getJenisLaporanWithTahapan(id).orElse(convertToDto(savedJenisLaporan));
    }
    
    // Delete jenis laporan (soft delete)
    @Transactional
    public void deleteJenisLaporan(Long id) {
        JenisLaporan jenisLaporan = jenisLaporanRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Jenis laporan tidak ditemukan"));
        
        jenisLaporan.setStatus(JenisLaporan.StatusJenisLaporan.TIDAK_AKTIF);
        jenisLaporan.setUpdatedAt(LocalDateTime.now());
        jenisLaporanRepository.save(jenisLaporan);
    }
    
    // Hard delete jenis laporan
    @Transactional
    public void hardDeleteJenisLaporan(Long id) {
        if (!jenisLaporanRepository.existsById(id)) {
            throw new RuntimeException("Jenis laporan tidak ditemukan");
        }
        jenisLaporanRepository.deleteById(id);
    }
    
    // Toggle status jenis laporan
    @Transactional
    public JenisLaporanDto toggleJenisLaporanStatus(Long id) {
        JenisLaporan jenisLaporan = jenisLaporanRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Jenis laporan tidak ditemukan"));
        
        // Toggle status between AKTIF and TIDAK_AKTIF
        if (jenisLaporan.getStatus() == JenisLaporan.StatusJenisLaporan.AKTIF) {
            jenisLaporan.setStatus(JenisLaporan.StatusJenisLaporan.TIDAK_AKTIF);
        } else {
            jenisLaporan.setStatus(JenisLaporan.StatusJenisLaporan.AKTIF);
        }
        
        jenisLaporan.setUpdatedAt(LocalDateTime.now());
        JenisLaporan savedJenisLaporan = jenisLaporanRepository.save(jenisLaporan);
        
        return convertToDto(savedJenisLaporan);
    }
    
    // Create tahapan for jenis laporan
    @Transactional
    public TahapanLaporanDto createTahapanForJenisLaporan(Long jenisLaporanId, TahapanLaporanDto tahapanDto) {
        JenisLaporan jenisLaporan = jenisLaporanRepository.findById(jenisLaporanId)
                .orElseThrow(() -> new RuntimeException("Jenis laporan tidak ditemukan"));
        
        // For new tahapan, check if urutan already exists
        if (tahapanDto.getTahapanLaporanId() == null && 
            tahapanLaporanRepository.existsByJenisLaporanIdAndUrutanTahapan(
                jenisLaporanId, tahapanDto.getUrutanTahapan())) {
            throw new RuntimeException("Urutan tahapan sudah ada");
        }
        
        TahapanLaporan tahapan = convertTahapanToEntity(tahapanDto);
        tahapan.setJenisLaporan(jenisLaporan);
        tahapan.setCreatedAt(LocalDateTime.now());
        tahapan.setUpdatedAt(LocalDateTime.now());
        
        // Handle template file - move from temp to permanent storage
        if (tahapanDto.getTemplateTahapan() != null && !tahapanDto.getTemplateTahapan().trim().isEmpty()) {
            String permanentFileName = moveTempFileToPermanent(tahapanDto.getTemplateTahapan());
            if (permanentFileName != null) {
                tahapan.setTemplateTahapan(permanentFileName);
            } else {
                log.warn("Failed to move temp file to permanent storage: {}", tahapanDto.getTemplateTahapan());
                tahapan.setTemplateTahapan(tahapanDto.getTemplateTahapan()); // Keep original if move fails
            }
        }
        
        // Convert jenis file list to JSON string
        if (tahapanDto.getJenisFileIzin() != null) {
            try {
                String jenisFileJson = objectMapper.writeValueAsString(tahapanDto.getJenisFileIzin());
                tahapan.setJenisFileIzin(jenisFileJson);
            } catch (Exception e) {
                log.error("Error converting jenis file to JSON", e);
                throw new RuntimeException("Error saving jenis file");
            }
        }
        
        TahapanLaporan savedTahapan = tahapanLaporanRepository.save(tahapan);
        return convertTahapanToDto(savedTahapan);
    }
    
    // Update tahapan for jenis laporan
    @Transactional
    public void updateTahapanForJenisLaporan(Long jenisLaporanId, List<TahapanLaporanDto> tahapanList) {
        // Get existing tahapan
        List<TahapanLaporan> existingTahapan = tahapanLaporanRepository.findByJenisLaporanJenisLaporanIdOrderByUrutanTahapanAsc(jenisLaporanId);
        
        // Create maps for easier lookup
        List<Long> existingIds = existingTahapan.stream()
                .map(TahapanLaporan::getTahapanLaporanId)
                .collect(Collectors.toList());
        
        List<Long> newIds = tahapanList.stream()
                .map(TahapanLaporanDto::getTahapanLaporanId)
                .filter(id -> id != null)
                .collect(Collectors.toList());
        
        // Delete tahapan that are no longer in the list
        List<Long> toDelete = existingIds.stream()
                .filter(id -> !newIds.contains(id))
                .collect(Collectors.toList());
        
        if (!toDelete.isEmpty()) {
            tahapanLaporanRepository.deleteAllById(toDelete);
        }
        
        // Process each tahapan in the new list
        for (TahapanLaporanDto tahapanDto : tahapanList) {
            if (tahapanDto.getTahapanLaporanId() != null) {
                // Update existing tahapan
                updateExistingTahapan(tahapanDto);
            } else {
                // Create new tahapan
                tahapanDto.setJenisLaporanId(jenisLaporanId);
                createTahapanForJenisLaporan(jenisLaporanId, tahapanDto);
            }
        }
    }
    
    // Update existing tahapan
    @Transactional
    public void updateExistingTahapan(TahapanLaporanDto tahapanDto) {
        TahapanLaporan existingTahapan = tahapanLaporanRepository.findById(tahapanDto.getTahapanLaporanId())
                .orElseThrow(() -> new RuntimeException("Tahapan tidak ditemukan"));
        
        existingTahapan.setNama(tahapanDto.getNama());
        existingTahapan.setDeskripsi(tahapanDto.getDeskripsi());
        existingTahapan.setUrutanTahapan(tahapanDto.getUrutanTahapan());
        existingTahapan.setStatus(tahapanDto.getStatus() != null ? tahapanDto.getStatus() : TahapanLaporan.StatusTahapan.AKTIF);
        existingTahapan.setUpdatedAt(LocalDateTime.now());
        
        // Handle template file changes
        String oldTemplateFile = existingTahapan.getTemplateTahapan();
        String newTemplateFile = tahapanDto.getTemplateTahapan();
        
        if (newTemplateFile != null && !newTemplateFile.equals(oldTemplateFile)) {
            // New file provided, move from temp to permanent
            String permanentFileName = moveTempFileToPermanent(newTemplateFile);
            if (permanentFileName != null) {
                existingTahapan.setTemplateTahapan(permanentFileName);
                // Delete old permanent file if exists and different
                if (oldTemplateFile != null && !oldTemplateFile.equals(permanentFileName)) {
                    deletePermanentFile(oldTemplateFile);
                }
            } else {
                log.warn("Failed to move temp file to permanent storage: {}", newTemplateFile);
                existingTahapan.setTemplateTahapan(newTemplateFile); // Keep original if move fails
            }
        } else if (newTemplateFile == null && oldTemplateFile != null) {
            // File removed
            existingTahapan.setTemplateTahapan(null);
            deletePermanentFile(oldTemplateFile);
        } else if (newTemplateFile != null) {
            // Keep existing file
            existingTahapan.setTemplateTahapan(newTemplateFile);
        }
        
        // Convert jenis file list to JSON string
        if (tahapanDto.getJenisFileIzin() != null) {
            try {
                String jenisFileJson = objectMapper.writeValueAsString(tahapanDto.getJenisFileIzin());
                existingTahapan.setJenisFileIzin(jenisFileJson);
            } catch (Exception e) {
                log.error("Error converting jenis file to JSON", e);
                throw new RuntimeException("Error saving jenis file");
            }
        }
        
        tahapanLaporanRepository.save(existingTahapan);
    }
    
    // Get statistics
    public JenisLaporanStats getJenisLaporanStats() {
        long totalAktif = jenisLaporanRepository.countByStatus(JenisLaporan.StatusJenisLaporan.AKTIF);
        long totalTidakAktif = jenisLaporanRepository.countByStatus(JenisLaporan.StatusJenisLaporan.TIDAK_AKTIF);
        long totalDraft = jenisLaporanRepository.countByStatus(JenisLaporan.StatusJenisLaporan.DRAFT);
        
        return new JenisLaporanStats(totalAktif, totalTidakAktif, totalDraft);
    }
    
    // Convert entity to DTO
    private JenisLaporanDto convertToDto(JenisLaporan jenisLaporan) {
        JenisLaporanDto dto = new JenisLaporanDto();
        dto.setJenisLaporanId(jenisLaporan.getJenisLaporanId());
        dto.setNama(jenisLaporan.getNama());
        dto.setDeskripsi(jenisLaporan.getDeskripsi());
        dto.setStatus(jenisLaporan.getStatus());
        dto.setCreatedAt(jenisLaporan.getCreatedAt());
        dto.setUpdatedAt(jenisLaporan.getUpdatedAt());
        
        // Count related data
        dto.setJumlahTahapan(jenisLaporan.getTahapanList().size());
        dto.setJumlahLaporan(jenisLaporan.getLaporanList().size());
        
        return dto;
    }
    
    // Convert entity to DTO with tahapan details
    private JenisLaporanDto convertToDtoWithTahapan(JenisLaporan jenisLaporan) {
        JenisLaporanDto dto = convertToDto(jenisLaporan);
        
        // Get active tahapan for this jenis laporan
        List<TahapanLaporan> tahapanList = tahapanLaporanRepository
                .findActiveTahapanByJenisLaporan(jenisLaporan.getJenisLaporanId());
        
        dto.setTahapanList(tahapanList.stream()
                .map(this::convertTahapanToDto)
                .collect(Collectors.toList()));
        
        return dto;
    }
    
    // Convert DTO to entity
    private JenisLaporan convertToEntity(JenisLaporanDto dto) {
        JenisLaporan entity = new JenisLaporan();
        entity.setJenisLaporanId(dto.getJenisLaporanId());
        entity.setNama(dto.getNama());
        entity.setDeskripsi(dto.getDeskripsi());
        entity.setStatus(dto.getStatus() != null ? dto.getStatus() : JenisLaporan.StatusJenisLaporan.AKTIF);
        return entity;
    }
    
    // Convert tahapan entity to DTO
    private TahapanLaporanDto convertTahapanToDto(TahapanLaporan tahapan) {
        TahapanLaporanDto dto = new TahapanLaporanDto();
        dto.setTahapanLaporanId(tahapan.getTahapanLaporanId());
        dto.setNama(tahapan.getNama());
        dto.setDeskripsi(tahapan.getDeskripsi());
        dto.setTemplateTahapan(tahapan.getTemplateTahapan());
        dto.setUrutanTahapan(tahapan.getUrutanTahapan());
        dto.setStatus(tahapan.getStatus());
        dto.setCreatedAt(tahapan.getCreatedAt());
        dto.setUpdatedAt(tahapan.getUpdatedAt());
        dto.setJenisLaporanId(tahapan.getJenisLaporan().getJenisLaporanId());
        dto.setJenisLaporanNama(tahapan.getJenisLaporan().getNama());
        
        // Convert JSON string to list
        if (tahapan.getJenisFileIzin() != null) {
            try {
                List<String> jenisFileList = objectMapper.readValue(
                    tahapan.getJenisFileIzin(), 
                    new TypeReference<List<String>>() {}
                );
                dto.setJenisFileIzin(jenisFileList);
            } catch (Exception e) {
                log.error("Error parsing jenis file JSON", e);
                dto.setJenisFileIzin(List.of());
            }
        }
        
        return dto;
    }
    
    // Convert tahapan DTO to entity
    private TahapanLaporan convertTahapanToEntity(TahapanLaporanDto dto) {
        TahapanLaporan entity = new TahapanLaporan();
        entity.setTahapanLaporanId(dto.getTahapanLaporanId());
        entity.setNama(dto.getNama());
        entity.setDeskripsi(dto.getDeskripsi());
        entity.setTemplateTahapan(dto.getTemplateTahapan());
        entity.setUrutanTahapan(dto.getUrutanTahapan());
        entity.setStatus(dto.getStatus() != null ? dto.getStatus() : TahapanLaporan.StatusTahapan.AKTIF);
        return entity;
    }
    
    // File management methods
    private String moveTempFileToPermanent(String tempFileName) {
        if (tempFileName == null || tempFileName.trim().isEmpty()) {
            return null;
        }
        
        try {
            // Check if it's already a permanent file (doesn't have temp file pattern)
            if (!tempFileName.matches("\\d{8}_\\d{6}_.*")) {
                log.info("File is already permanent or not a temp file: {}", tempFileName);
                return tempFileName;
            }
            
            Path tempFilePath = Paths.get(tempUploadDir, tempFileName);
            if (!Files.exists(tempFilePath)) {
                log.warn("Temp file not found: {}", tempFileName);
                return null;
            }
            
            // Create permanent upload directory
            Path permanentDir = Paths.get(uploadDir, "documents");
            if (!Files.exists(permanentDir)) {
                Files.createDirectories(permanentDir);
            }
            
            // Generate new filename for permanent storage
            String originalName = extractOriginalName(tempFileName);
            String newFileName = generatePermanentFileName(originalName);
            Path permanentFilePath = permanentDir.resolve(newFileName);
            
            // Move file from temp to permanent
            Files.move(tempFilePath, permanentFilePath, StandardCopyOption.REPLACE_EXISTING);
            
            log.info("File moved from temp to permanent: {} -> {}", tempFileName, newFileName);
            return "documents/" + newFileName;
            
        } catch (IOException e) {
            log.error("Error moving temp file to permanent storage: {}", tempFileName, e);
            return null;
        }
    }
    
    private String extractOriginalName(String tempFileName) {
        // Extract original name from format: YYYYMMDD_HHMMSS_UUID_originalName.ext
        try {
            String[] parts = tempFileName.split("_", 3);
            if (parts.length >= 3) {
                return parts[2]; // Return the originalName.ext part
            }
        } catch (Exception e) {
            log.warn("Could not extract original filename from: {}", tempFileName);
        }
        return tempFileName; // Fallback to the temp filename
    }
    
    private String generatePermanentFileName(String originalName) {
        String dateTime = LocalDateTime.now().format(DATETIME_FORMATTER);
        String uuid = UUID.randomUUID().toString().substring(0, 8);
        
        // Extract extension
        String extension = "";
        if (originalName.contains(".")) {
            extension = originalName.substring(originalName.lastIndexOf("."));
            originalName = originalName.substring(0, originalName.lastIndexOf("."));
        }
        
        return String.format("%s_%s_%s%s", dateTime, uuid, originalName, extension);
    }
    
    private void deleteTempFile(String tempFileName) {
        if (tempFileName == null || tempFileName.trim().isEmpty()) {
            return;
        }
        
        try {
            Path tempFilePath = Paths.get(tempUploadDir, tempFileName);
            Files.deleteIfExists(tempFilePath);
            log.info("Temp file deleted: {}", tempFileName);
        } catch (IOException e) {
            log.error("Error deleting temp file: {}", tempFileName, e);
        }
    }
    
    private void deletePermanentFile(String permanentFileName) {
        if (permanentFileName == null || permanentFileName.trim().isEmpty()) {
            return;
        }
        
        try {
            Path permanentFilePath = Paths.get(uploadDir, permanentFileName);
            Files.deleteIfExists(permanentFilePath);
            log.info("Permanent file deleted: {}", permanentFileName);
        } catch (IOException e) {
            log.error("Error deleting permanent file: {}", permanentFileName, e);
        }
    }
    
    // Statistics class
    public static class JenisLaporanStats {
        private final long totalAktif;
        private final long totalTidakAktif;
        private final long totalDraft;
        
        public JenisLaporanStats(long totalAktif, long totalTidakAktif, long totalDraft) {
            this.totalAktif = totalAktif;
            this.totalTidakAktif = totalTidakAktif;
            this.totalDraft = totalDraft;
        }
        
        public long getTotalAktif() { return totalAktif; }
        public long getTotalTidakAktif() { return totalTidakAktif; }
        public long getTotalDraft() { return totalDraft; }
        public long getTotal() { return totalAktif + totalTidakAktif + totalDraft; }
    }
}
