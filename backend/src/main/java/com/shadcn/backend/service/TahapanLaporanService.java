package com.shadcn.backend.service;

import com.shadcn.backend.dto.TahapanLaporanDto;
import com.shadcn.backend.model.JenisLaporan;
import com.shadcn.backend.model.TahapanLaporan;
import com.shadcn.backend.repository.JenisLaporanRepository;
import com.shadcn.backend.repository.TahapanLaporanRepository;
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

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class TahapanLaporanService {
    
    private final TahapanLaporanRepository tahapanLaporanRepository;
    private final JenisLaporanRepository jenisLaporanRepository;
    private final ObjectMapper objectMapper;
    
    // Get tahapan by jenis laporan
    public List<TahapanLaporanDto> getTahapanByJenisLaporan(Long jenisLaporanId) {
        List<TahapanLaporan> tahapanList = tahapanLaporanRepository
                .findByJenisLaporanJenisLaporanIdOrderByUrutanTahapanAsc(jenisLaporanId);
        return tahapanList.stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }
    
    // Get active tahapan by jenis laporan
    public List<TahapanLaporanDto> getActiveTahapanByJenisLaporan(Long jenisLaporanId) {
        List<TahapanLaporan> tahapanList = tahapanLaporanRepository
                .findActiveTahapanByJenisLaporan(jenisLaporanId);
        return tahapanList.stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }
    
    // Get tahapan by ID
    public Optional<TahapanLaporanDto> getTahapanById(Long id) {
        return tahapanLaporanRepository.findById(id)
                .map(this::convertToDto);
    }
    
    // Create tahapan
    @Transactional
    public TahapanLaporanDto createTahapan(TahapanLaporanDto tahapanDto) {
        JenisLaporan jenisLaporan = jenisLaporanRepository.findById(tahapanDto.getJenisLaporanId())
                .orElseThrow(() -> new RuntimeException("Jenis laporan tidak ditemukan"));
        
        // Validate urutan is unique for this jenis laporan
        if (tahapanLaporanRepository.existsByJenisLaporanIdAndUrutanTahapan(
                tahapanDto.getJenisLaporanId(), tahapanDto.getUrutanTahapan())) {
            throw new RuntimeException("Urutan tahapan sudah ada");
        }
        
        TahapanLaporan tahapan = convertToEntity(tahapanDto);
        tahapan.setJenisLaporan(jenisLaporan);
        tahapan.setCreatedAt(LocalDateTime.now());
        tahapan.setUpdatedAt(LocalDateTime.now());
        
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
        return convertToDto(savedTahapan);
    }
    
    // Update tahapan
    @Transactional
    public TahapanLaporanDto updateTahapan(Long id, TahapanLaporanDto tahapanDto) {
        TahapanLaporan existingTahapan = tahapanLaporanRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Tahapan tidak ditemukan"));
        
        // Validate urutan is unique (excluding current record)
        if (tahapanLaporanRepository.existsByJenisLaporanIdAndUrutanTahapanAndIdNot(
                existingTahapan.getJenisLaporan().getJenisLaporanId(), 
                tahapanDto.getUrutanTahapan(), 
                id)) {
            throw new RuntimeException("Urutan tahapan sudah ada");
        }
        
        existingTahapan.setNama(tahapanDto.getNama());
        existingTahapan.setDeskripsi(tahapanDto.getDeskripsi());
        existingTahapan.setTemplateTahapan(tahapanDto.getTemplateTahapan());
        existingTahapan.setUrutanTahapan(tahapanDto.getUrutanTahapan());
        existingTahapan.setStatus(tahapanDto.getStatus());
        existingTahapan.setUpdatedAt(LocalDateTime.now());
        
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
        
        TahapanLaporan savedTahapan = tahapanLaporanRepository.save(existingTahapan);
        return convertToDto(savedTahapan);
    }
    
    // Delete tahapan (soft delete)
    @Transactional
    public void deleteTahapan(Long id) {
        TahapanLaporan tahapan = tahapanLaporanRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Tahapan tidak ditemukan"));
        
        tahapan.setStatus(TahapanLaporan.StatusTahapan.TIDAK_AKTIF);
        tahapan.setUpdatedAt(LocalDateTime.now());
        tahapanLaporanRepository.save(tahapan);
    }
    
    // Hard delete tahapan
    @Transactional
    public void hardDeleteTahapan(Long id) {
        if (!tahapanLaporanRepository.existsById(id)) {
            throw new RuntimeException("Tahapan tidak ditemukan");
        }
        tahapanLaporanRepository.deleteById(id);
    }
    
    // Get next urutan for jenis laporan
    public Integer getNextUrutan(Long jenisLaporanId) {
        Integer maxUrutan = tahapanLaporanRepository.findMaxUrutanByJenisLaporan(jenisLaporanId);
        return (maxUrutan != null ? maxUrutan : 0) + 1;
    }
    
    // Convert entity to DTO
    private TahapanLaporanDto convertToDto(TahapanLaporan tahapan) {
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
    
    // Convert DTO to entity
    private TahapanLaporan convertToEntity(TahapanLaporanDto dto) {
        TahapanLaporan entity = new TahapanLaporan();
        entity.setTahapanLaporanId(dto.getTahapanLaporanId());
        entity.setNama(dto.getNama());
        entity.setDeskripsi(dto.getDeskripsi());
        entity.setTemplateTahapan(dto.getTemplateTahapan());
        entity.setUrutanTahapan(dto.getUrutanTahapan());
        entity.setStatus(dto.getStatus() != null ? dto.getStatus() : TahapanLaporan.StatusTahapan.AKTIF);
        return entity;
    }
}
