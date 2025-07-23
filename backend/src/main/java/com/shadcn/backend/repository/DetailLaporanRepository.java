package com.shadcn.backend.repository;

import com.shadcn.backend.model.DetailLaporan;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DetailLaporanRepository extends JpaRepository<DetailLaporan, Long> {
    
    // Find by laporan ID
    List<DetailLaporan> findByLaporanLaporanIdOrderByTahapanLaporanUrutanTahapanAsc(Long laporanId);
    
    // Find by tahapan laporan ID
    List<DetailLaporan> findByTahapanLaporanTahapanLaporanId(Long tahapanLaporanId);
    
    // Find by laporan and tahapan
    DetailLaporan findByLaporanLaporanIdAndTahapanLaporanTahapanLaporanId(Long laporanId, Long tahapanLaporanId);
    
    // Find by status
    Page<DetailLaporan> findByStatus(DetailLaporan.StatusDetailLaporan status, Pageable pageable);
    
    // Count by status for laporan
    @Query("SELECT COUNT(dl) FROM DetailLaporan dl WHERE dl.laporan.laporanId = :laporanId AND dl.status = :status")
    long countByLaporanIdAndStatus(@Param("laporanId") Long laporanId, @Param("status") DetailLaporan.StatusDetailLaporan status);
    
    // Get progress percentage for laporan
    @Query("SELECT " +
           "CAST(COUNT(dl) AS long) as total, " +
           "CAST(SUM(CASE WHEN dl.status = 'SELESAI' THEN 1 ELSE 0 END) AS long) as selesai " +
           "FROM DetailLaporan dl WHERE dl.laporan.laporanId = :laporanId")
    Object[] getLaporanProgress(@Param("laporanId") Long laporanId);
    
    // Check if all tahapan completed for laporan
    @Query("SELECT COUNT(dl) = 0 FROM DetailLaporan dl WHERE dl.laporan.laporanId = :laporanId AND dl.status != 'SELESAI'")
    boolean isAllTahapanCompleted(@Param("laporanId") Long laporanId);
    
    // Get detail with lampiran count
    @Query("SELECT dl, SIZE(dl.lampiranList) as lampiranCount FROM DetailLaporan dl WHERE dl.detailLaporanId = :id")
    Object[] getDetailWithLampiranCount(@Param("id") Long id);
}
