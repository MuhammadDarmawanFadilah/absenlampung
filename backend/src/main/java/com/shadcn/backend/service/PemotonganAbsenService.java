package com.shadcn.backend.service;

import com.shadcn.backend.dto.PemotonganAbsenRequest;
import com.shadcn.backend.entity.PemotonganAbsen;
import com.shadcn.backend.repository.PemotonganAbsenRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class PemotonganAbsenService {
    
    private final PemotonganAbsenRepository pemotonganAbsenRepository;
    
    private static final DateTimeFormatter DATETIME_FORMATTER = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm:ss");
    
    public List<Map<String, Object>> getAllPemotonganAbsen() {
        log.debug("Mengambil semua data pemotongan absen");
        
        List<PemotonganAbsen> pemotonganAbsens = pemotonganAbsenRepository.findAllActiveOrderByKode();
        
        return pemotonganAbsens.stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }
    
    public Map<String, Object> getPemotonganAbsenById(Long id) {
        log.debug("Mengambil pemotongan absen dengan ID: {}", id);
        
        PemotonganAbsen pemotonganAbsen = pemotonganAbsenRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Pemotongan absen tidak ditemukan"));
        
        return mapToResponse(pemotonganAbsen);
    }
    
    public Map<String, Object> updatePemotonganAbsen(Long id, PemotonganAbsenRequest request) {
        log.debug("Mengupdate pemotongan absen dengan ID: {}", id);
        
        PemotonganAbsen pemotonganAbsen = pemotonganAbsenRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Pemotongan absen tidak ditemukan"));
        
        // Update only editable fields
        pemotonganAbsen.setNama(request.getNama());
        pemotonganAbsen.setDeskripsi(request.getDeskripsi());
        pemotonganAbsen.setPersentase(request.getPersentase());
        
        PemotonganAbsen saved = pemotonganAbsenRepository.save(pemotonganAbsen);
        
        log.debug("Pemotongan absen berhasil diupdate: {}", saved.getKode());
        
        return mapToResponse(saved);
    }
    
    private Map<String, Object> mapToResponse(PemotonganAbsen pemotonganAbsen) {
        return Map.of(
                "id", pemotonganAbsen.getId(),
                "kode", pemotonganAbsen.getKode(),
                "nama", pemotonganAbsen.getNama(),
                "deskripsi", pemotonganAbsen.getDeskripsi(),
                "persentase", pemotonganAbsen.getPersentase(),
                "isActive", pemotonganAbsen.getIsActive(),
                "createdAt", pemotonganAbsen.getCreatedAt().format(DATETIME_FORMATTER),
                "updatedAt", pemotonganAbsen.getUpdatedAt().format(DATETIME_FORMATTER)
        );
    }
}
