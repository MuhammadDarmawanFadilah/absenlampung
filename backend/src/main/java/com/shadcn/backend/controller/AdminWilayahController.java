package com.shadcn.backend.controller;

import com.shadcn.backend.model.*;
import com.shadcn.backend.repository.*;
import com.shadcn.backend.service.WilayahService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/admin/wilayah")
@Slf4j
public class AdminWilayahController {
    
    @Autowired
    private WilayahProvinsiRepository provinsiRepository;
      @Autowired
    private WilayahKotaRepository kotaRepository;
    
    @Autowired
    private WilayahKecamatanRepository kecamatanRepository;
    
    @Autowired
    private WilayahKelurahanRepository kelurahanRepository;
    
    @Autowired
    private WilayahService wilayahService;
    
    @Autowired
    private BiografiRepository biografiRepository;
    
    // ================= PROVINSI =================
    
    /**
     * Get all cached provinsi with pagination and search
     */
    @GetMapping("/provinsi")
    @PreAuthorize("hasAuthority('wilayah-provinsi.read')")
    public ResponseEntity<Map<String, Object>> getAllProvinsi(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "nama") String sortBy,
            @RequestParam(defaultValue = "asc") String sortDir,
            @RequestParam(required = false) String search) {
        
        try {
            Sort.Direction direction = sortDir.equalsIgnoreCase("desc") ? Sort.Direction.DESC : Sort.Direction.ASC;
            Pageable pageable = PageRequest.of(page, size, Sort.by(direction, sortBy));
            
            Page<WilayahProvinsi> provinsiPage;
            if (search != null && !search.trim().isEmpty()) {
                provinsiPage = provinsiRepository.findByNamaContainingIgnoreCase(search.trim(), pageable);
            } else {
                provinsiPage = provinsiRepository.findAll(pageable);
            }
            
            Map<String, Object> response = Map.of(
                "content", provinsiPage.getContent(),
                "totalElements", provinsiPage.getTotalElements(),
                "totalPages", provinsiPage.getTotalPages(),
                "currentPage", page,
                "size", size
            );
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Error getting provinsi: ", e);
            return ResponseEntity.status(500).body(Map.of("error", "Failed to get provinsi: " + e.getMessage()));
        }
    }
    
    /**
     * Get provinsi used in biografi (from cache)
     */
    @GetMapping("/provinsi/used")
    public ResponseEntity<List<WilayahProvinsi>> getUsedProvinsi() {
        try {
            List<String> usedCodes = biografiRepository.findDistinctProvinsi();
            List<WilayahProvinsi> usedProvinsi = provinsiRepository.findByKodeIn(usedCodes);
            return ResponseEntity.ok(usedProvinsi);
        } catch (Exception e) {
            log.error("Error getting used provinsi: ", e);
            return ResponseEntity.status(500).build();
        }
    }
    
    /**
     * Create or update provinsi (validates with wilayah.id API)
     */
    @PostMapping("/provinsi")
    public ResponseEntity<Map<String, Object>> createProvinsi(@RequestBody Map<String, String> request) {
        try {
            String kode = request.get("kode");
            String nama = request.get("nama");
            
            if (kode == null || nama == null) {
                return ResponseEntity.badRequest().body(Map.of("error", "Kode dan nama harus diisi"));
            }
            
            // Validate with wilayah.id API
            Map<String, Object> apiResponse = wilayahService.getProvinces();
            if (apiResponse.containsKey("error")) {
                return ResponseEntity.status(500).body(Map.of("error", "Gagal validasi dengan wilayah.id API"));
            }
            
            @SuppressWarnings("unchecked")
            List<Map<String, Object>> provinces = (List<Map<String, Object>>) apiResponse.get("data");
            boolean found = provinces.stream()
                .anyMatch(p -> kode.equals(p.get("code")) && nama.equals(p.get("name")));
            
            if (!found) {
                return ResponseEntity.badRequest().body(Map.of("error", "Kode atau nama provinsi tidak valid di wilayah.id"));
            }
            
            // Save to cache
            WilayahProvinsi provinsi = new WilayahProvinsi();
            provinsi.setKode(kode);
            provinsi.setNama(nama);
            provinsi.setCreatedAt(LocalDateTime.now());
            provinsi.setUpdatedAt(LocalDateTime.now());
            
            WilayahProvinsi saved = provinsiRepository.save(provinsi);
            return ResponseEntity.ok(Map.of("data", saved, "message", "Provinsi berhasil disimpan"));
            
        } catch (Exception e) {
            log.error("Error creating provinsi: ", e);
            return ResponseEntity.status(500).body(Map.of("error", "Gagal menyimpan provinsi: " + e.getMessage()));
        }
    }
    
    /**
     * Update provinsi
     */
    @PutMapping("/provinsi/{kode}")
    public ResponseEntity<Map<String, Object>> updateProvinsi(
            @PathVariable String kode, 
            @RequestBody Map<String, String> request) {
        try {
            Optional<WilayahProvinsi> existing = provinsiRepository.findByKode(kode);
            if (existing.isEmpty()) {
                return ResponseEntity.notFound().build();
            }
            
            String newNama = request.get("nama");
            if (newNama == null) {
                return ResponseEntity.badRequest().body(Map.of("error", "Nama harus diisi"));
            }
            
            // Validate with wilayah.id API
            Map<String, Object> apiResponse = wilayahService.getProvinces();
            if (apiResponse.containsKey("error")) {
                return ResponseEntity.status(500).body(Map.of("error", "Gagal validasi dengan wilayah.id API"));
            }
            
            @SuppressWarnings("unchecked")
            List<Map<String, Object>> provinces = (List<Map<String, Object>>) apiResponse.get("data");
            boolean found = provinces.stream()
                .anyMatch(p -> kode.equals(p.get("code")) && newNama.equals(p.get("name")));
            
            if (!found) {
                return ResponseEntity.badRequest().body(Map.of("error", "Kode atau nama provinsi tidak valid di wilayah.id"));
            }
            
            // Update
            WilayahProvinsi provinsi = existing.get();
            provinsi.setNama(newNama);
            provinsi.setUpdatedAt(LocalDateTime.now());
            
            WilayahProvinsi saved = provinsiRepository.save(provinsi);
            return ResponseEntity.ok(Map.of("data", saved, "message", "Provinsi berhasil diperbarui"));
            
        } catch (Exception e) {
            log.error("Error updating provinsi: ", e);
            return ResponseEntity.status(500).body(Map.of("error", "Gagal memperbarui provinsi: " + e.getMessage()));
        }
    }
    
    /**
     * Delete provinsi
     */
    @DeleteMapping("/provinsi/{kode}")
    public ResponseEntity<Map<String, Object>> deleteProvinsi(@PathVariable String kode) {
        try {
            Optional<WilayahProvinsi> existing = provinsiRepository.findByKode(kode);
            if (existing.isEmpty()) {
                return ResponseEntity.notFound().build();
            }
            
            // Check if used in biografi
            List<String> usedCodes = biografiRepository.findDistinctProvinsi();
            if (usedCodes.contains(kode)) {
                return ResponseEntity.badRequest().body(Map.of("error", "Provinsi tidak dapat dihapus karena masih digunakan di biografi"));
            }
            
            provinsiRepository.deleteByKode(kode);
            return ResponseEntity.ok(Map.of("message", "Provinsi berhasil dihapus"));
            
        } catch (Exception e) {
            log.error("Error deleting provinsi: ", e);
            return ResponseEntity.status(500).body(Map.of("error", "Gagal menghapus provinsi: " + e.getMessage()));
        }
    }
    
    // ================= KOTA =================
    
    /**
     * Get all cached kota with pagination and search
     */
    @GetMapping("/kota")
    public ResponseEntity<Map<String, Object>> getAllKota(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "nama") String sortBy,
            @RequestParam(defaultValue = "asc") String sortDir,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String provinsiKode) {
        
        try {
            Sort.Direction direction = sortDir.equalsIgnoreCase("desc") ? Sort.Direction.DESC : Sort.Direction.ASC;
            Pageable pageable = PageRequest.of(page, size, Sort.by(direction, sortBy));
            
            Page<WilayahKota> kotaPage;
            if (search != null && !search.trim().isEmpty()) {
                if (provinsiKode != null && !provinsiKode.trim().isEmpty()) {
                    kotaPage = kotaRepository.findByProvinsiKodeAndNamaContainingIgnoreCase(provinsiKode, search.trim(), pageable);
                } else {
                    kotaPage = kotaRepository.findByNamaContainingIgnoreCase(search.trim(), pageable);
                }
            } else if (provinsiKode != null && !provinsiKode.trim().isEmpty()) {
                kotaPage = kotaRepository.findByProvinsiKode(provinsiKode, pageable);
            } else {
                kotaPage = kotaRepository.findAll(pageable);
            }
            
            Map<String, Object> response = Map.of(
                "content", kotaPage.getContent(),
                "totalElements", kotaPage.getTotalElements(),
                "totalPages", kotaPage.getTotalPages(),
                "currentPage", page,
                "size", size
            );
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Error getting kota: ", e);
            return ResponseEntity.status(500).body(Map.of("error", "Failed to get kota: " + e.getMessage()));
        }
    }
    
    /**
     * Create or update kota (validates with wilayah.id API)
     */
    @PostMapping("/kota")
    public ResponseEntity<Map<String, Object>> createKota(@RequestBody Map<String, String> request) {
        try {
            String kode = request.get("kode");
            String nama = request.get("nama");
            String provinsiKode = request.get("provinsiKode");
            
            if (kode == null || nama == null || provinsiKode == null) {
                return ResponseEntity.badRequest().body(Map.of("error", "Kode, nama, dan provinsi kode harus diisi"));
            }
            
            // Validate with wilayah.id API
            Map<String, Object> apiResponse = wilayahService.getRegencies(provinsiKode);
            if (apiResponse.containsKey("error")) {
                return ResponseEntity.status(500).body(Map.of("error", "Gagal validasi dengan wilayah.id API"));
            }
            
            @SuppressWarnings("unchecked")
            List<Map<String, Object>> regencies = (List<Map<String, Object>>) apiResponse.get("data");
            boolean found = regencies.stream()
                .anyMatch(r -> kode.equals(r.get("code")) && nama.equals(r.get("name")));
            
            if (!found) {
                return ResponseEntity.badRequest().body(Map.of("error", "Kode atau nama kota tidak valid di wilayah.id"));
            }
            
            // Save to cache
            WilayahKota kota = new WilayahKota();
            kota.setKode(kode);
            kota.setNama(nama);
            kota.setProvinsiKode(provinsiKode);
            kota.setCreatedAt(LocalDateTime.now());
            kota.setUpdatedAt(LocalDateTime.now());
            
            WilayahKota saved = kotaRepository.save(kota);
            return ResponseEntity.ok(Map.of("data", saved, "message", "Kota berhasil disimpan"));
            
        } catch (Exception e) {
            log.error("Error creating kota: ", e);
            return ResponseEntity.status(500).body(Map.of("error", "Gagal menyimpan kota: " + e.getMessage()));
        }
    }
    
    /**
     * Update kota
     */
    @PutMapping("/kota/{kode}")
    public ResponseEntity<Map<String, Object>> updateKota(
            @PathVariable String kode, 
            @RequestBody Map<String, String> request) {
        try {
            Optional<WilayahKota> existing = kotaRepository.findByKode(kode);
            if (existing.isEmpty()) {
                return ResponseEntity.notFound().build();
            }
            
            String newNama = request.get("nama");
            String newProvinsiKode = request.get("provinsiKode");
            if (newNama == null || newProvinsiKode == null) {
                return ResponseEntity.badRequest().body(Map.of("error", "Nama dan provinsi kode harus diisi"));
            }
            
            // Validate with wilayah.id API
            Map<String, Object> apiResponse = wilayahService.getRegencies(newProvinsiKode);
            if (apiResponse.containsKey("error")) {
                return ResponseEntity.status(500).body(Map.of("error", "Gagal validasi dengan wilayah.id API"));
            }
            
            @SuppressWarnings("unchecked")
            List<Map<String, Object>> regencies = (List<Map<String, Object>>) apiResponse.get("data");
            boolean found = regencies.stream()
                .anyMatch(r -> kode.equals(r.get("code")) && newNama.equals(r.get("name")));
            
            if (!found) {
                return ResponseEntity.badRequest().body(Map.of("error", "Kode atau nama kota tidak valid di wilayah.id"));
            }
            
            // Update
            WilayahKota kota = existing.get();
            kota.setNama(newNama);
            kota.setProvinsiKode(newProvinsiKode);
            kota.setUpdatedAt(LocalDateTime.now());
            
            WilayahKota saved = kotaRepository.save(kota);
            return ResponseEntity.ok(Map.of("data", saved, "message", "Kota berhasil diperbarui"));
            
        } catch (Exception e) {
            log.error("Error updating kota: ", e);
            return ResponseEntity.status(500).body(Map.of("error", "Gagal memperbarui kota: " + e.getMessage()));
        }
    }
    
    /**
     * Delete kota
     */
    @DeleteMapping("/kota/{kode}")
    public ResponseEntity<Map<String, Object>> deleteKota(@PathVariable String kode) {
        try {
            Optional<WilayahKota> existing = kotaRepository.findByKode(kode);
            if (existing.isEmpty()) {
                return ResponseEntity.notFound().build();
            }
            
            // Check if used in biografi
            List<String> usedCodes = biografiRepository.findDistinctKota();
            if (usedCodes.contains(kode)) {
                return ResponseEntity.badRequest().body(Map.of("error", "Kota tidak dapat dihapus karena masih digunakan di biografi"));
            }
            
            kotaRepository.deleteByKode(kode);
            return ResponseEntity.ok(Map.of("message", "Kota berhasil dihapus"));
            
        } catch (Exception e) {
            log.error("Error deleting kota: ", e);
            return ResponseEntity.status(500).body(Map.of("error", "Gagal menghapus kota: " + e.getMessage()));
        }
    }
    
    // ================= KECAMATAN =================
    
    /**
     * Get all cached kecamatan with pagination and search
     */
    @GetMapping("/kecamatan")
    public ResponseEntity<Map<String, Object>> getAllKecamatan(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "nama") String sortBy,
            @RequestParam(defaultValue = "asc") String sortDir,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String kotaKode) {
        
        try {
            Sort.Direction direction = sortDir.equalsIgnoreCase("desc") ? Sort.Direction.DESC : Sort.Direction.ASC;
            Pageable pageable = PageRequest.of(page, size, Sort.by(direction, sortBy));
            
            Page<WilayahKecamatan> kecamatanPage;
            if (search != null && !search.trim().isEmpty()) {
                if (kotaKode != null && !kotaKode.trim().isEmpty()) {
                    kecamatanPage = kecamatanRepository.findByKotaKodeAndNamaContainingIgnoreCase(kotaKode, search.trim(), pageable);
                } else {
                    kecamatanPage = kecamatanRepository.findByNamaContainingIgnoreCase(search.trim(), pageable);
                }
            } else if (kotaKode != null && !kotaKode.trim().isEmpty()) {
                kecamatanPage = kecamatanRepository.findByKotaKode(kotaKode, pageable);
            } else {
                kecamatanPage = kecamatanRepository.findAll(pageable);
            }
            
            Map<String, Object> response = Map.of(
                "content", kecamatanPage.getContent(),
                "totalElements", kecamatanPage.getTotalElements(),
                "totalPages", kecamatanPage.getTotalPages(),
                "currentPage", page,
                "size", size
            );
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Error getting kecamatan: ", e);
            return ResponseEntity.status(500).body(Map.of("error", "Failed to get kecamatan: " + e.getMessage()));
        }
    }
    
    /**
     * Create or update kecamatan (validates with wilayah.id API)
     */
    @PostMapping("/kecamatan")
    public ResponseEntity<Map<String, Object>> createKecamatan(@RequestBody Map<String, String> request) {
        try {
            String kode = request.get("kode");
            String nama = request.get("nama");
            String kotaKode = request.get("kotaKode");
            
            if (kode == null || nama == null || kotaKode == null) {
                return ResponseEntity.badRequest().body(Map.of("error", "Kode, nama, dan kota kode harus diisi"));
            }
            
            // Validate with wilayah.id API
            Map<String, Object> apiResponse = wilayahService.getDistricts(kotaKode);
            if (apiResponse.containsKey("error")) {
                return ResponseEntity.status(500).body(Map.of("error", "Gagal validasi dengan wilayah.id API"));
            }
            
            @SuppressWarnings("unchecked")
            List<Map<String, Object>> districts = (List<Map<String, Object>>) apiResponse.get("data");
            boolean found = districts.stream()
                .anyMatch(d -> kode.equals(d.get("code")) && nama.equals(d.get("name")));
            
            if (!found) {
                return ResponseEntity.badRequest().body(Map.of("error", "Kode atau nama kecamatan tidak valid di wilayah.id"));
            }
            
            // Save to cache
            WilayahKecamatan kecamatan = new WilayahKecamatan();
            kecamatan.setKode(kode);
            kecamatan.setNama(nama);
            kecamatan.setKotaKode(kotaKode);
            kecamatan.setCreatedAt(LocalDateTime.now());
            kecamatan.setUpdatedAt(LocalDateTime.now());
            
            WilayahKecamatan saved = kecamatanRepository.save(kecamatan);
            return ResponseEntity.ok(Map.of("data", saved, "message", "Kecamatan berhasil disimpan"));
            
        } catch (Exception e) {
            log.error("Error creating kecamatan: ", e);
            return ResponseEntity.status(500).body(Map.of("error", "Gagal menyimpan kecamatan: " + e.getMessage()));
        }
    }
    
    /**
     * Update kecamatan
     */
    @PutMapping("/kecamatan/{kode}")
    public ResponseEntity<Map<String, Object>> updateKecamatan(
            @PathVariable String kode, 
            @RequestBody Map<String, String> request) {
        try {
            Optional<WilayahKecamatan> existing = kecamatanRepository.findByKode(kode);
            if (existing.isEmpty()) {
                return ResponseEntity.notFound().build();
            }
            
            String newNama = request.get("nama");
            String newKotaKode = request.get("kotaKode");
            if (newNama == null || newKotaKode == null) {
                return ResponseEntity.badRequest().body(Map.of("error", "Nama dan kota kode harus diisi"));
            }
            
            // Validate with wilayah.id API
            Map<String, Object> apiResponse = wilayahService.getDistricts(newKotaKode);
            if (apiResponse.containsKey("error")) {
                return ResponseEntity.status(500).body(Map.of("error", "Gagal validasi dengan wilayah.id API"));
            }
            
            @SuppressWarnings("unchecked")
            List<Map<String, Object>> districts = (List<Map<String, Object>>) apiResponse.get("data");
            boolean found = districts.stream()
                .anyMatch(d -> kode.equals(d.get("code")) && newNama.equals(d.get("name")));
            
            if (!found) {
                return ResponseEntity.badRequest().body(Map.of("error", "Kode atau nama kecamatan tidak valid di wilayah.id"));
            }
            
            // Update
            WilayahKecamatan kecamatan = existing.get();
            kecamatan.setNama(newNama);
            kecamatan.setKotaKode(newKotaKode);
            kecamatan.setUpdatedAt(LocalDateTime.now());
            
            WilayahKecamatan saved = kecamatanRepository.save(kecamatan);
            return ResponseEntity.ok(Map.of("data", saved, "message", "Kecamatan berhasil diperbarui"));
            
        } catch (Exception e) {
            log.error("Error updating kecamatan: ", e);
            return ResponseEntity.status(500).body(Map.of("error", "Gagal memperbarui kecamatan: " + e.getMessage()));
        }
    }
    
    /**
     * Delete kecamatan
     */
    @DeleteMapping("/kecamatan/{kode}")
    public ResponseEntity<Map<String, Object>> deleteKecamatan(@PathVariable String kode) {
        try {
            Optional<WilayahKecamatan> existing = kecamatanRepository.findByKode(kode);
            if (existing.isEmpty()) {
                return ResponseEntity.notFound().build();
            }
            
            // Check if used in biografi
            List<String> usedCodes = biografiRepository.findDistinctKecamatan();
            if (usedCodes.contains(kode)) {
                return ResponseEntity.badRequest().body(Map.of("error", "Kecamatan tidak dapat dihapus karena masih digunakan di biografi"));
            }
            
            kecamatanRepository.deleteByKode(kode);
            return ResponseEntity.ok(Map.of("message", "Kecamatan berhasil dihapus"));
            
        } catch (Exception e) {
            log.error("Error deleting kecamatan: ", e);
            return ResponseEntity.status(500).body(Map.of("error", "Gagal menghapus kecamatan: " + e.getMessage()));
        }
    }
    
    // ================= KELURAHAN =================
    
    /**
     * Get all cached kelurahan with pagination and search
     */
    @GetMapping("/kelurahan")
    public ResponseEntity<Map<String, Object>> getAllKelurahan(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "nama") String sortBy,
            @RequestParam(defaultValue = "asc") String sortDir,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String kecamatanKode) {
        
        try {
            Sort.Direction direction = sortDir.equalsIgnoreCase("desc") ? Sort.Direction.DESC : Sort.Direction.ASC;
            Pageable pageable = PageRequest.of(page, size, Sort.by(direction, sortBy));
            
            Page<WilayahKelurahan> kelurahanPage;
            if (search != null && !search.trim().isEmpty()) {
                if (kecamatanKode != null && !kecamatanKode.trim().isEmpty()) {
                    kelurahanPage = kelurahanRepository.findByKecamatanKodeAndNamaContainingIgnoreCase(kecamatanKode, search.trim(), pageable);
                } else {
                    kelurahanPage = kelurahanRepository.findByNamaContainingIgnoreCase(search.trim(), pageable);
                }
            } else if (kecamatanKode != null && !kecamatanKode.trim().isEmpty()) {
                kelurahanPage = kelurahanRepository.findByKecamatanKode(kecamatanKode, pageable);
            } else {
                kelurahanPage = kelurahanRepository.findAll(pageable);
            }
            
            Map<String, Object> response = Map.of(
                "content", kelurahanPage.getContent(),
                "totalElements", kelurahanPage.getTotalElements(),
                "totalPages", kelurahanPage.getTotalPages(),
                "currentPage", page,
                "size", size
            );
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Error getting kelurahan: ", e);
            return ResponseEntity.status(500).body(Map.of("error", "Failed to get kelurahan: " + e.getMessage()));
        }
    }
    
    /**
     * Create or update kelurahan (validates with wilayah.id API)
     */
    @PostMapping("/kelurahan")
    public ResponseEntity<Map<String, Object>> createKelurahan(@RequestBody Map<String, String> request) {
        try {
            String kode = request.get("kode");
            String nama = request.get("nama");
            String kecamatanKode = request.get("kecamatanKode");
            
            if (kode == null || nama == null || kecamatanKode == null) {
                return ResponseEntity.badRequest().body(Map.of("error", "Kode, nama, dan kecamatan kode harus diisi"));
            }
            
            // Validate with wilayah.id API
            Map<String, Object> apiResponse = wilayahService.getVillages(kecamatanKode);
            if (apiResponse.containsKey("error")) {
                return ResponseEntity.status(500).body(Map.of("error", "Gagal validasi dengan wilayah.id API"));
            }
            
            @SuppressWarnings("unchecked")
            List<Map<String, Object>> villages = (List<Map<String, Object>>) apiResponse.get("data");
            boolean found = villages.stream()
                .anyMatch(v -> kode.equals(v.get("code")) && nama.equals(v.get("name")));
            
            if (!found) {
                return ResponseEntity.badRequest().body(Map.of("error", "Kode atau nama kelurahan tidak valid di wilayah.id"));
            }
            
            // Save to cache
            WilayahKelurahan kelurahan = new WilayahKelurahan();
            kelurahan.setKode(kode);
            kelurahan.setNama(nama);
            kelurahan.setKecamatanKode(kecamatanKode);
            kelurahan.setCreatedAt(LocalDateTime.now());
            kelurahan.setUpdatedAt(LocalDateTime.now());
            
            WilayahKelurahan saved = kelurahanRepository.save(kelurahan);
            return ResponseEntity.ok(Map.of("data", saved, "message", "Kelurahan berhasil disimpan"));
            
        } catch (Exception e) {
            log.error("Error creating kelurahan: ", e);
            return ResponseEntity.status(500).body(Map.of("error", "Gagal menyimpan kelurahan: " + e.getMessage()));
        }
    }
    
    /**
     * Update kelurahan
     */
    @PutMapping("/kelurahan/{kode}")
    public ResponseEntity<Map<String, Object>> updateKelurahan(
            @PathVariable String kode, 
            @RequestBody Map<String, String> request) {
        try {
            Optional<WilayahKelurahan> existing = kelurahanRepository.findByKode(kode);
            if (existing.isEmpty()) {
                return ResponseEntity.notFound().build();
            }
            
            String newNama = request.get("nama");
            String newKecamatanKode = request.get("kecamatanKode");
            if (newNama == null || newKecamatanKode == null) {
                return ResponseEntity.badRequest().body(Map.of("error", "Nama dan kecamatan kode harus diisi"));
            }
            
            // Validate with wilayah.id API
            Map<String, Object> apiResponse = wilayahService.getVillages(newKecamatanKode);
            if (apiResponse.containsKey("error")) {
                return ResponseEntity.status(500).body(Map.of("error", "Gagal validasi dengan wilayah.id API"));
            }
            
            @SuppressWarnings("unchecked")
            List<Map<String, Object>> villages = (List<Map<String, Object>>) apiResponse.get("data");
            boolean found = villages.stream()
                .anyMatch(v -> kode.equals(v.get("code")) && newNama.equals(v.get("name")));
            
            if (!found) {
                return ResponseEntity.badRequest().body(Map.of("error", "Kode atau nama kelurahan tidak valid di wilayah.id"));
            }
            
            // Update
            WilayahKelurahan kelurahan = existing.get();
            kelurahan.setNama(newNama);
            kelurahan.setKecamatanKode(newKecamatanKode);
            kelurahan.setUpdatedAt(LocalDateTime.now());
            
            WilayahKelurahan saved = kelurahanRepository.save(kelurahan);
            return ResponseEntity.ok(Map.of("data", saved, "message", "Kelurahan berhasil diperbarui"));
            
        } catch (Exception e) {
            log.error("Error updating kelurahan: ", e);
            return ResponseEntity.status(500).body(Map.of("error", "Gagal memperbarui kelurahan: " + e.getMessage()));
        }
    }
    
    /**
     * Delete kelurahan
     */
    @DeleteMapping("/kelurahan/{kode}")
    public ResponseEntity<Map<String, Object>> deleteKelurahan(@PathVariable String kode) {
        try {
            Optional<WilayahKelurahan> existing = kelurahanRepository.findByKode(kode);
            if (existing.isEmpty()) {
                return ResponseEntity.notFound().build();
            }
            
            // Check if used in biografi
            List<String> usedCodes = biografiRepository.findDistinctKelurahan();
            if (usedCodes.contains(kode)) {
                return ResponseEntity.badRequest().body(Map.of("error", "Kelurahan tidak dapat dihapus karena masih digunakan di biografi"));
            }
            
            kelurahanRepository.deleteByKode(kode);
            return ResponseEntity.ok(Map.of("message", "Kelurahan berhasil dihapus"));
            
        } catch (Exception e) {
            log.error("Error deleting kelurahan: ", e);
            return ResponseEntity.status(500).body(Map.of("error", "Gagal menghapus kelurahan: " + e.getMessage()));
        }
    }
}
