package com.shadcn.backend.repository;

import com.shadcn.backend.model.SubmissionLampiran;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SubmissionLampiranRepository extends JpaRepository<SubmissionLampiran, Long> {
    
    List<SubmissionLampiran> findBySubmissionLaporanIdOrderByTanggalUploadDesc(Long submissionLaporanId);
    
    void deleteBySubmissionLaporanId(Long submissionLaporanId);
}
