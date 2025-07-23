package com.shadcn.backend.controller;

import com.shadcn.backend.dto.TahapanLaporanDto;
import com.shadcn.backend.service.TahapanLaporanService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

@Slf4j
@RestController
@RequestMapping("/api/tahapan-laporan")
@RequiredArgsConstructor
public class TahapanLaporanController {

    private final TahapanLaporanService tahapanLaporanService;

    // Get tahapan by ID
    @GetMapping("/{id}")
    public ResponseEntity<TahapanLaporanDto> getTahapanById(@PathVariable Long id) {
        try {
            Optional<TahapanLaporanDto> tahapan = tahapanLaporanService.getTahapanById(id);
            if (tahapan.isPresent()) {
                return ResponseEntity.ok(tahapan.get());
            } else {
                return ResponseEntity.notFound().build();
            }
        } catch (Exception e) {
            log.error("Error fetching tahapan by ID", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    // Create tahapan
    @PostMapping
    public ResponseEntity<?> createTahapan(@Valid @RequestBody TahapanLaporanDto tahapanDto) {
        try {
            TahapanLaporanDto newTahapan = tahapanLaporanService.createTahapan(tahapanDto);
            return ResponseEntity.status(HttpStatus.CREATED).body(newTahapan);
        } catch (RuntimeException e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
        } catch (Exception e) {
            log.error("Error creating tahapan", e);
            Map<String, String> error = new HashMap<>();
            error.put("error", "Terjadi kesalahan saat membuat tahapan");
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }

    // Update tahapan
    @PutMapping("/{id}")
    public ResponseEntity<?> updateTahapan(
            @PathVariable Long id, 
            @Valid @RequestBody TahapanLaporanDto tahapanDto) {
        try {
            TahapanLaporanDto updatedTahapan = tahapanLaporanService.updateTahapan(id, tahapanDto);
            return ResponseEntity.ok(updatedTahapan);
        } catch (RuntimeException e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
        } catch (Exception e) {
            log.error("Error updating tahapan", e);
            Map<String, String> error = new HashMap<>();
            error.put("error", "Terjadi kesalahan saat mengupdate tahapan");
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }

    // Delete tahapan (soft delete)
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteTahapan(@PathVariable Long id) {
        try {
            tahapanLaporanService.deleteTahapan(id);
            Map<String, String> response = new HashMap<>();
            response.put("message", "Tahapan berhasil dihapus");
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(error);
        } catch (Exception e) {
            log.error("Error deleting tahapan", e);
            Map<String, String> error = new HashMap<>();
            error.put("error", "Terjadi kesalahan saat menghapus tahapan");
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }

    // Hard delete tahapan
    @DeleteMapping("/{id}/permanent")
    public ResponseEntity<?> hardDeleteTahapan(@PathVariable Long id) {
        try {
            tahapanLaporanService.hardDeleteTahapan(id);
            Map<String, String> response = new HashMap<>();
            response.put("message", "Tahapan berhasil dihapus permanen");
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(error);
        } catch (Exception e) {
            log.error("Error hard deleting tahapan", e);
            Map<String, String> error = new HashMap<>();
            error.put("error", "Terjadi kesalahan saat menghapus tahapan");
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }

    // Health check endpoint
    @GetMapping("/health")
    public ResponseEntity<Map<String, String>> healthCheck() {
        Map<String, String> response = new HashMap<>();
        response.put("status", "OK");
        response.put("service", "Tahapan Laporan Service");
        return ResponseEntity.ok(response);
    }
}
