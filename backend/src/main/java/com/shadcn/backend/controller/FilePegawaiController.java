package com.shadcn.backend.controller;

import com.shadcn.backend.dto.FilePegawaiRequest;
import com.shadcn.backend.dto.FilePegawaiResponse;
import com.shadcn.backend.dto.FilePegawaiBatchRequest;
import com.shadcn.backend.dto.FilePegawaiGroupResponse;
import com.shadcn.backend.service.FilePegawaiService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/file-pegawai")
@RequiredArgsConstructor
@Slf4j
public class FilePegawaiController {
    
    private final FilePegawaiService service;
    
    @GetMapping
    @PreAuthorize("hasRole('ADMIN') or hasRole('MODERATOR') or hasRole('USER')")
    public ResponseEntity<Page<FilePegawaiGroupResponse>> findAll(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) Long pegawaiId,
            @RequestParam(required = false) Long kategoriId,
            @RequestParam(required = false) Boolean isActive,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir) {
        
        log.info("GET /api/admin/file-pegawai - search: {}, pegawaiId: {}, kategoriId: {}, isActive: {}, page: {}, size: {}, sortBy: {}, sortDir: {}", 
                search, pegawaiId, kategoriId, isActive, page, size, sortBy, sortDir);
        
        Page<FilePegawaiGroupResponse> result = service.findAllGrouped(search, pegawaiId, kategoriId, isActive, page, size, sortBy, sortDir);
        return ResponseEntity.ok(result);
    }
    
    @GetMapping("/pegawai/{pegawaiId}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('MODERATOR') or hasRole('USER')")
    public ResponseEntity<List<FilePegawaiResponse>> findByPegawai(@PathVariable Long pegawaiId) {
        log.info("GET /api/admin/file-pegawai/pegawai/{}", pegawaiId);
        List<FilePegawaiResponse> result = service.findByPegawai(pegawaiId);
        return ResponseEntity.ok(result);
    }
    
    @GetMapping("/kategori/{kategoriId}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('MODERATOR') or hasRole('USER')")
    public ResponseEntity<List<FilePegawaiResponse>> findByKategori(@PathVariable Long kategoriId) {
        log.info("GET /api/admin/file-pegawai/kategori/{}", kategoriId);
        List<FilePegawaiResponse> result = service.findByKategori(kategoriId);
        return ResponseEntity.ok(result);
    }
    
    @GetMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('MODERATOR') or hasRole('USER')")
    public ResponseEntity<FilePegawaiResponse> findById(@PathVariable Long id) {
        log.info("GET /api/admin/file-pegawai/{}", id);
        FilePegawaiResponse result = service.findById(id);
        return ResponseEntity.ok(result);
    }
    
    @PostMapping("/batch")
    @PreAuthorize("hasRole('ADMIN') or hasRole('MODERATOR') or hasRole('USER')")
    public ResponseEntity<FilePegawaiGroupResponse> createBatch(@Valid @RequestBody FilePegawaiBatchRequest request) {
        try {
            log.info("POST /api/admin/file-pegawai/batch - Request with {} files for pegawaiId: {}, kategoriId: {}", 
                    request.getFiles().size(), request.getPegawaiId(), request.getKategoriId());
            FilePegawaiGroupResponse result = service.createBatchAsGroup(request);
            log.info("POST /api/admin/file-pegawai/batch - Success: Created group with {} files", result.getFiles().size());
            return ResponseEntity.status(HttpStatus.CREATED).body(result);
        } catch (Exception e) {
            log.error("POST /api/admin/file-pegawai/batch - Error: {}", e.getMessage(), e);
            throw e; // Let global exception handler deal with it
        }
    }
    
    @PostMapping
    @PreAuthorize("hasAuthority('file-pegawai.create')")
    public ResponseEntity<FilePegawaiResponse> create(@Valid @RequestBody FilePegawaiRequest request) {
        try {
            log.info("POST /api/admin/file-pegawai - Request: {}", request);
            FilePegawaiResponse result = service.create(request);
            log.info("POST /api/admin/file-pegawai - Success: Created file with ID {}", result.getId());
            return ResponseEntity.status(HttpStatus.CREATED).body(result);
        } catch (Exception e) {
            log.error("POST /api/admin/file-pegawai - Error: {}", e.getMessage(), e);
            throw e; // Let global exception handler deal with it
        }
    }
    
    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('file-pegawai.update')")
    public ResponseEntity<FilePegawaiResponse> update(@PathVariable Long id, @Valid @RequestBody FilePegawaiRequest request) {
        log.info("PUT /api/admin/file-pegawai/{} - {}", id, request);
        FilePegawaiResponse result = service.update(id, request);
        return ResponseEntity.ok(result);
    }
    
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('MODERATOR') or hasRole('USER')")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        log.info("DELETE /api/admin/file-pegawai/{}", id);
        service.delete(id);
        return ResponseEntity.noContent().build();
    }
    
    @PatchMapping("/{id}/toggle-active")
    @PreAuthorize("hasRole('ADMIN') or hasRole('MODERATOR')")
    public ResponseEntity<FilePegawaiResponse> toggleActive(@PathVariable Long id) {
        log.info("PATCH /api/admin/file-pegawai/{}/toggle-active", id);
        FilePegawaiResponse result = service.toggleActive(id);
        return ResponseEntity.ok(result);
    }
}
