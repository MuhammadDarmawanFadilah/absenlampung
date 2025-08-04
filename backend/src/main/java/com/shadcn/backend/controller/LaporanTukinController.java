package com.shadcn.backend.controller;

import com.shadcn.backend.dto.LaporanTukinRequest;
import com.shadcn.backend.dto.LaporanTukinResponse;
import com.shadcn.backend.model.Pegawai;
import com.shadcn.backend.service.AuthService;
import com.shadcn.backend.service.LaporanTukinService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/master-data/laporan-tukin")
@RequiredArgsConstructor
@Slf4j
public class LaporanTukinController {
    
    private final LaporanTukinService laporanTukinService;
    private final AuthService authService;
    
    @PostMapping("/generate")
    @PreAuthorize("hasAnyRole('ADMIN', 'MODERATOR')")
    public ResponseEntity<Map<String, Object>> generateLaporan(
            @Valid @RequestBody LaporanTukinRequest request,
            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        try {
            log.info("Request generate laporan tukin: {}/{}", request.getBulan(), request.getTahun());
            
            // Extract token from Authorization header
            String token = null;
            if (authHeader != null && authHeader.startsWith("Bearer ")) {
                token = authHeader.substring(7);
            }
            
            // Get current pegawai from token
            Pegawai currentUser = null;
            if (token != null) {
                // Get pegawai from token
                currentUser = authService.getPegawaiFromToken(token);
            }
            
            if (currentUser == null) {
                Map<String, Object> result = new HashMap<>();
                result.put("success", false);
                result.put("message", "Authentication required");
                return ResponseEntity.status(401).body(result);
            }
            
            LaporanTukinResponse response = laporanTukinService.generateLaporanTukin(request, currentUser);
            
            Map<String, Object> result = new HashMap<>();
            result.put("success", true);
            result.put("message", "Laporan tunjangan kinerja berhasil digenerate");
            result.put("data", response);
            
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            log.error("Error generating laporan tukin: ", e);
            
            Map<String, Object> result = new HashMap<>();
            result.put("success", false);
            result.put("message", "Gagal generate laporan: " + e.getMessage());
            
            return ResponseEntity.badRequest().body(result);
        }
    }
    
    @GetMapping("/histori")
    @PreAuthorize("hasAnyRole('ADMIN', 'MODERATOR')")
    public ResponseEntity<Map<String, Object>> getHistoriLaporan(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) Integer bulan,
            @RequestParam(required = false) Integer tahun,
            @RequestParam(required = false) String status) {
        
        try {
            Page<LaporanTukinResponse> laporanPage = laporanTukinService.getHistoriLaporan(page, size, bulan, tahun, status);
            
            Map<String, Object> result = new HashMap<>();
            result.put("success", true);
            result.put("message", "Data histori laporan berhasil diambil");
            result.put("data", laporanPage.getContent());
            result.put("currentPage", laporanPage.getNumber());
            result.put("totalItems", laporanPage.getTotalElements());
            result.put("totalPages", laporanPage.getTotalPages());
            result.put("size", laporanPage.getSize());
            result.put("hasNext", laporanPage.hasNext());
            result.put("hasPrevious", laporanPage.hasPrevious());
            
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            log.error("Error getting histori laporan: ", e);
            
            Map<String, Object> result = new HashMap<>();
            result.put("success", false);
            result.put("message", "Gagal mengambil data histori laporan: " + e.getMessage());
            
            return ResponseEntity.badRequest().body(result);
        }
    }
    
    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MODERATOR')")
    public ResponseEntity<Map<String, Object>> getLaporanById(@PathVariable Long id) {
        try {
            LaporanTukinResponse response = laporanTukinService.getLaporanById(id);
            
            Map<String, Object> result = new HashMap<>();
            result.put("success", true);
            result.put("message", "Data laporan berhasil diambil");
            result.put("data", response);
            
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            log.error("Error getting laporan by id {}: ", id, e);
            
            Map<String, Object> result = new HashMap<>();
            result.put("success", false);
            result.put("message", "Gagal mengambil data laporan: " + e.getMessage());
            
            return ResponseEntity.badRequest().body(result);
        }
    }
    
    @GetMapping("/{id}/detail")
    @PreAuthorize("hasAnyRole('ADMIN', 'MODERATOR')")
    public ResponseEntity<Map<String, Object>> getLaporanDetail(@PathVariable Long id) {
        try {
            // This endpoint will return detailed view with pegawai breakdown for web display
            LaporanTukinResponse response = laporanTukinService.getLaporanByIdWithDetail(id);
            
            Map<String, Object> result = new HashMap<>();
            result.put("success", true);
            result.put("message", "Detail laporan berhasil diambil");
            result.put("data", response);
            
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            log.error("Error getting laporan detail by id {}: ", id, e);
            
            Map<String, Object> result = new HashMap<>();
            result.put("success", false);
            result.put("message", "Gagal mengambil detail laporan: " + e.getMessage());
            
            return ResponseEntity.badRequest().body(result);
        }
    }
    
    @GetMapping("/{id}/rincian")
    @PreAuthorize("hasAnyRole('ADMIN', 'MODERATOR')")
    public ResponseEntity<Map<String, Object>> getRincianDetailPegawai(
            @PathVariable Long id,
            @RequestParam(required = false) Long pegawaiId) {
        try {
            // This endpoint returns enhanced detailed breakdown per employee with daily deduction info
            var detailPegawai = laporanTukinService.getRincianDetailPerPegawai(id, pegawaiId);
            
            Map<String, Object> result = new HashMap<>();
            result.put("success", true);
            result.put("message", "Rincian detail per pegawai berhasil diambil");
            result.put("data", detailPegawai);
            
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            log.error("Error getting rincian detail pegawai by laporan id {} and pegawai id {}: ", id, pegawaiId, e);
            
            Map<String, Object> result = new HashMap<>();
            result.put("success", false);
            result.put("message", "Gagal mengambil rincian detail pegawai: " + e.getMessage());
            
            return ResponseEntity.badRequest().body(result);
        }
    }
    
    @GetMapping("/{id}/pegawai")
    @PreAuthorize("hasAnyRole('ADMIN', 'MODERATOR')")
    public ResponseEntity<Map<String, Object>> getListPegawaiInLaporan(@PathVariable Long id) {
        try {
            // Get list of pegawai for submenu dropdown
            var pegawaiList = laporanTukinService.getListPegawaiInLaporan(id);
            
            Map<String, Object> result = new HashMap<>();
            result.put("success", true);
            result.put("message", "Daftar pegawai berhasil diambil");
            result.put("data", pegawaiList);
            
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            log.error("Error getting pegawai list for laporan id {}: ", id, e);
            
            Map<String, Object> result = new HashMap<>();
            result.put("success", false);
            result.put("message", "Gagal mengambil daftar pegawai: " + e.getMessage());
            
            return ResponseEntity.badRequest().body(result);
        }
    }
    
    @GetMapping("/{id}/download")
    @PreAuthorize("hasAnyRole('ADMIN', 'MODERATOR')")
    public ResponseEntity<byte[]> downloadLaporanExcel(@PathVariable Long id) {
        try {
            byte[] excelData = laporanTukinService.generateExcelReport(id);
            
            String filename = "Laporan_Tunjangan_Kinerja_" + id + ".xlsx";
            
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_OCTET_STREAM);
            headers.setContentDispositionFormData("attachment", filename);
            headers.setContentLength(excelData.length);
            
            return ResponseEntity.ok()
                    .headers(headers)
                    .body(excelData);
        } catch (Exception e) {
            log.error("Error downloading laporan excel by id {}: ", id, e);
            return ResponseEntity.badRequest().build();
        }
    }
    
    @GetMapping("/{id}/download-pdf")
    @PreAuthorize("hasAnyRole('ADMIN', 'MODERATOR')")
    public ResponseEntity<byte[]> downloadLaporanPDF(@PathVariable Long id) {
        try {
            byte[] pdfData = laporanTukinService.generatePDFReport(id);
            
            String filename = "Laporan_Tunjangan_Kinerja_" + id + ".pdf";
            
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_PDF);
            headers.setContentDispositionFormData("attachment", filename);
            headers.setContentLength(pdfData.length);
            
            return ResponseEntity.ok()
                    .headers(headers)
                    .body(pdfData);
        } catch (Exception e) {
            log.error("Error downloading laporan PDF by id {}: ", id, e);
            return ResponseEntity.badRequest().build();
        }
    }
}
