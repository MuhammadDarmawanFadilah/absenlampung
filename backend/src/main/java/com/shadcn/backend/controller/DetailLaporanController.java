package com.shadcn.backend.controller;

import com.shadcn.backend.dto.DetailLaporanRequest;
import com.shadcn.backend.dto.DetailLaporanResponse;
import com.shadcn.backend.dto.PaginatedResponse;
import com.shadcn.backend.model.SubmissionLaporan;
import com.shadcn.backend.service.SubmissionLaporanService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/detail-laporan")
public class DetailLaporanController {

    @Autowired
    private SubmissionLaporanService submissionLaporanService;

    @PostMapping
    @PreAuthorize("hasAnyRole('USER', 'MODERATOR', 'ADMIN')")
    public ResponseEntity<DetailLaporanResponse> createSubmission(@RequestBody DetailLaporanRequest request) {
        try {
            DetailLaporanResponse response = submissionLaporanService.createSubmission(request);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(null);
        }
    }

    @GetMapping("/user/{userId}")
    @PreAuthorize("hasAnyRole('USER', 'MODERATOR', 'ADMIN')")
    public ResponseEntity<PaginatedResponse<DetailLaporanResponse>> getSubmissionsByUser(
            @PathVariable Long userId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) Integer pemilihanId,
            @RequestParam(required = false) Integer laporanId,
            @RequestParam(required = false) Integer jenisLaporanId,
            @RequestParam(required = false) Integer tahapanLaporanId,
            @RequestParam(required = false) Long pegawaiId) {
        
        PaginatedResponse<DetailLaporanResponse> submissions = submissionLaporanService.getSubmissionsByUserPaginated(
            userId, page, size, search, pemilihanId, laporanId, jenisLaporanId, tahapanLaporanId, pegawaiId);
        return ResponseEntity.ok(submissions);
    }

    @GetMapping("/user/{userId}/status/{status}")
    @PreAuthorize("hasAnyRole('USER', 'MODERATOR', 'ADMIN')")
    public ResponseEntity<List<DetailLaporanResponse>> getSubmissionsByUserAndStatus(
            @PathVariable Long userId, 
            @PathVariable String status) {
        try {
            SubmissionLaporan.StatusLaporan statusEnum = SubmissionLaporan.StatusLaporan.valueOf(status.toUpperCase());
            List<DetailLaporanResponse> submissions = submissionLaporanService.getSubmissionsByUserAndStatus(userId, statusEnum);
            return ResponseEntity.ok(submissions);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(null);
        }
    }

    @GetMapping("/{id}/user/{userId}")
    @PreAuthorize("hasAnyRole('USER', 'MODERATOR', 'ADMIN')")
    public ResponseEntity<DetailLaporanResponse> getSubmissionById(@PathVariable Long id, @PathVariable Long userId) {
        Optional<DetailLaporanResponse> submission = submissionLaporanService.getSubmissionById(id, userId);
        return submission.map(ResponseEntity::ok).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}/user/{userId}")
    @PreAuthorize("hasAnyRole('USER', 'MODERATOR', 'ADMIN')")
    public ResponseEntity<Void> deleteSubmission(@PathVariable Long id, @PathVariable Long userId) {
        try {
            submissionLaporanService.deleteSubmission(id, userId);
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }
}
