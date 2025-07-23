package com.shadcn.backend.repository;

import com.shadcn.backend.model.SubmissionLaporan;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SubmissionLaporanRepository extends JpaRepository<SubmissionLaporan, Long> {
    
    List<SubmissionLaporan> findByUserIdOrderByTanggalBuatDesc(Long userId);
    
    Page<SubmissionLaporan> findByUserIdOrderByTanggalBuatDesc(Long userId, Pageable pageable);
    
    List<SubmissionLaporan> findByUserIdAndStatusOrderByTanggalBuatDesc(Long userId, SubmissionLaporan.StatusLaporan status);
    
    @Query("SELECT s FROM SubmissionLaporan s WHERE s.pemilihan.pemilihanId = :pemilihanId AND s.user.id = :userId ORDER BY s.tanggalBuat DESC")
    List<SubmissionLaporan> findByPemilihanAndUserOrderByTanggalBuatDesc(@Param("pemilihanId") Long pemilihanId, @Param("userId") Long userId);
    
    @Query("SELECT s FROM SubmissionLaporan s WHERE s.user.id = :userId AND s.tahapanLaporan.tahapanLaporanId = :tahapanId AND s.jenisLaporan.jenisLaporanId = :jenisId")
    List<SubmissionLaporan> findByUserAndTahapanAndJenis(@Param("userId") Long userId, @Param("tahapanId") Long tahapanId, @Param("jenisId") Long jenisId);
    
    @Query("SELECT COUNT(s) FROM SubmissionLaporan s WHERE s.user.id = :userId")
    Long countByUserId(@Param("userId") Long userId);
    
    @Query("SELECT COUNT(s) FROM SubmissionLaporan s WHERE s.user.id = :userId AND s.status = :status")
    Long countByUserIdAndStatus(@Param("userId") Long userId, @Param("status") SubmissionLaporan.StatusLaporan status);
}
