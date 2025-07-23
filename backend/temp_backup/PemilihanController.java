package com.shadcn.backend.controller;

import com.shadcn.backend.dto.PemilihanDTO;
import com.shadcn.backend.dto.CreatePemilihanRequest;
import com.shadcn.backend.service.PemilihanService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/pemilihan")
@CrossOrigin(originPatterns = {"http://localhost:3000", "http://localhost:3001", "http://localhost:3002", "http://127.0.0.1:3000"}, allowCredentials = "true")
public class PemilihanController {
    
    @Autowired
    private PemilihanService pemilihanService;
    
    @GetMapping
    @PreAuthorize("hasAuthority('pemilihan.read')")
    public ResponseEntity<List<PemilihanDTO>> getAllPemilihan() {
        try {
            List<PemilihanDTO> pemilihanList = pemilihanService.getAllPemilihan();
            return ResponseEntity.ok(pemilihanList);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<PemilihanDTO> getPemilihanById(@PathVariable Long id) {
        try {
            Optional<PemilihanDTO> pemilihan = pemilihanService.getPemilihanById(id);
            return pemilihan.map(ResponseEntity::ok)
                           .orElse(ResponseEntity.notFound().build());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    @GetMapping("/status/{status}")
    public ResponseEntity<List<PemilihanDTO>> getPemilihanByStatus(@PathVariable String status) {
        try {
            List<PemilihanDTO> pemilihanList = pemilihanService.getPemilihanByStatus(status.toUpperCase());
            return ResponseEntity.ok(pemilihanList);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    @GetMapping("/wilayah")
    public ResponseEntity<List<PemilihanDTO>> getPemilihanByWilayah(
            @RequestParam String provinsi,
            @RequestParam(required = false) String kota,
            @RequestParam(required = false) String kecamatan,
            @RequestParam(required = false) String kelurahan) {
        try {
            List<PemilihanDTO> pemilihanList = pemilihanService.getPemilihanByWilayah(provinsi, kota, kecamatan, kelurahan);
            return ResponseEntity.ok(pemilihanList);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    @GetMapping("/active")
    public ResponseEntity<List<PemilihanDTO>> getActivePemilihan() {
        try {
            List<PemilihanDTO> pemilihanList = pemilihanService.getActivePemilihan();
            return ResponseEntity.ok(pemilihanList);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    @PostMapping
    @PreAuthorize("hasAuthority('pemilihan.create')")
    public ResponseEntity<PemilihanDTO> createPemilihan(@RequestBody CreatePemilihanRequest request) {
        try {
            System.out.println("=== CREATE PEMILIHAN REQUEST ===");
            System.out.println("judulPemilihan: " + request.getJudulPemilihan());
            System.out.println("tingkatPemilihan: " + request.getTingkatPemilihan());
            System.out.println("provinsi: " + request.getProvinsi());
            System.out.println("kota: " + request.getKota());
            System.out.println("kecamatan: " + request.getKecamatan());
            System.out.println("kelurahan: " + request.getKelurahan());
            System.out.println("latitude: " + request.getLatitude());
            System.out.println("longitude: " + request.getLongitude());
            System.out.println("detailLaporan count: " + (request.getDetailLaporan() != null ? request.getDetailLaporan().size() : 0));
            System.out.println("=================================");
            
            PemilihanDTO createdPemilihan = pemilihanService.createPemilihan(request);
            return ResponseEntity.status(HttpStatus.CREATED).body(createdPemilihan);
        } catch (Exception e) {
            System.err.println("Error creating pemilihan: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    @PutMapping("/{id}")
    public ResponseEntity<PemilihanDTO> updatePemilihan(@PathVariable Long id, @RequestBody CreatePemilihanRequest request) {
        try {
            System.out.println("=== UPDATE PEMILIHAN REQUEST ===");
            System.out.println("id: " + id);
            System.out.println("judulPemilihan: " + request.getJudulPemilihan());
            System.out.println("tingkatPemilihan: " + request.getTingkatPemilihan());
            System.out.println("provinsi: " + request.getProvinsi());
            System.out.println("kota: " + request.getKota());
            System.out.println("kecamatan: " + request.getKecamatan());
            System.out.println("kelurahan: " + request.getKelurahan());
            System.out.println("latitude: " + request.getLatitude());
            System.out.println("longitude: " + request.getLongitude());
            System.out.println("detailLaporan count: " + (request.getDetailLaporan() != null ? request.getDetailLaporan().size() : 0));
            System.out.println("=================================");
            
            PemilihanDTO updatedPemilihan = pemilihanService.updatePemilihan(id, request);
            return updatedPemilihan != null ? ResponseEntity.ok(updatedPemilihan) 
                                            : ResponseEntity.notFound().build();
        } catch (Exception e) {
            System.err.println("Error updating pemilihan: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletePemilihan(@PathVariable Long id) {
        try {
            boolean deleted = pemilihanService.deletePemilihan(id);
            return deleted ? ResponseEntity.noContent().build() 
                           : ResponseEntity.notFound().build();
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    @GetMapping("/provinsi")
    public ResponseEntity<List<String>> getActiveProvinsi() {
        try {
            List<String> provinsiList = pemilihanService.getActiveProvinsi();
            return ResponseEntity.ok(provinsiList);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    @GetMapping("/kota")
    public ResponseEntity<List<String>> getActiveKotaByProvinsi(@RequestParam String provinsi) {
        try {
            List<String> kotaList = pemilihanService.getActiveKotaByProvinsi(provinsi);
            return ResponseEntity.ok(kotaList);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    @GetMapping("/search")
    public ResponseEntity<List<PemilihanDTO>> searchPemilihan(@RequestParam String keyword) {
        try {
            List<PemilihanDTO> pemilihanList = pemilihanService.searchPemilihan(keyword);
            return ResponseEntity.ok(pemilihanList);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    @GetMapping("/search-paged")
    public ResponseEntity<java.util.Map<String, Object>> searchPemilihanWithPaging(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String tingkat,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String provinsi,
            @RequestParam(required = false) String kota,
            @RequestParam(required = false) String kecamatan,
            @RequestParam(required = false) String provinsiId,
            @RequestParam(required = false) String kotaId,
            @RequestParam(required = false) String kecamatanId,
            @RequestParam(required = false) String pegawaiId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        try {
            java.util.Map<String, Object> result = pemilihanService.searchPemilihanWithPaging(
                keyword, tingkat, status, provinsi, kota, kecamatan, provinsiId, kotaId, kecamatanId, pegawaiId, page, size);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/map-locations")
    public ResponseEntity<List<PemilihanDTO>> getPemilihanMapLocations(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String nama,
            @RequestParam(required = false) String provinsi,
            @RequestParam(required = false) String kota,
            @RequestParam(required = false) String kecamatan,
            @RequestParam(required = false) String tingkat,
            @RequestParam(required = false) String status) {
        try {
            List<PemilihanDTO> pemilihanList = pemilihanService.getPemilihanWithLocationData(
                search, nama, provinsi, kota, kecamatan, tingkat, status);
            return ResponseEntity.ok(pemilihanList);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    @GetMapping("/statistics")
    public ResponseEntity<java.util.Map<String, Object>> getStatistics(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String tingkat,
            @RequestParam(required = false) String status) {
        try {
            java.util.Map<String, Object> stats = pemilihanService.getStatistics(keyword, tingkat, status);
            return ResponseEntity.ok(stats);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    @PostMapping("/update-expired")
    public ResponseEntity<Void> updateExpiredPemilihan() {
        try {
            pemilihanService.updateExpiredPemilihan();
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
}
