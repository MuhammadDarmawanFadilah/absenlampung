package com.shadcn.backend.repository;

import com.shadcn.backend.model.Laporan;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface LaporanRepository extends JpaRepository<Laporan, Long> {
    
    // Find by user ID
    Page<Laporan> findByUserId(Long userId, Pageable pageable);
    
    // Find by jenis laporan
    Page<Laporan> findByJenisLaporanJenisLaporanId(Long jenisLaporanId, Pageable pageable);
    
    // Find by status
    Page<Laporan> findByStatus(Laporan.StatusLaporan status, Pageable pageable);
    
    // Find by user and status
    Page<Laporan> findByUserIdAndStatus(Long userId, Laporan.StatusLaporan status, Pageable pageable);
    
    // Find by user and jenis laporan
    Page<Laporan> findByUserIdAndJenisLaporanJenisLaporanId(Long userId, Long jenisLaporanId, Pageable pageable);
    
    // Find by nama laporan containing
    Page<Laporan> findByNamaLaporanContainingIgnoreCase(String namaLaporan, Pageable pageable);
    
    // Find by nama pelapor containing - REMOVED
    
    // Get recent laporan by user
    @Query("SELECT l FROM Laporan l WHERE l.userId = :userId ORDER BY l.updatedAt DESC")
    List<Laporan> findRecentLaporanByUser(@Param("userId") Long userId, Pageable pageable);
    
    // Count by status
    @Query("SELECT COUNT(l) FROM Laporan l WHERE l.status = :status")
    long countByStatus(@Param("status") Laporan.StatusLaporan status);
    
    // Count by user
    long countByUserId(Long userId);
    
    // Count by jenis laporan
    long countByJenisLaporanJenisLaporanId(Long jenisLaporanId);
    
    // Advanced search
    @Query("SELECT l FROM Laporan l WHERE " +
           "(:namaLaporan IS NULL OR LOWER(l.namaLaporan) LIKE LOWER(CONCAT('%', :namaLaporan, '%'))) AND " +
           "(:jenisLaporanId IS NULL OR l.jenisLaporan.jenisLaporanId = :jenisLaporanId) AND " +
           "(:status IS NULL OR l.status = :status) AND " +
           "(:userId IS NULL OR l.userId = :userId)")
    Page<Laporan> findWithFilters(
        @Param("namaLaporan") String namaLaporan,
        @Param("jenisLaporanId") Long jenisLaporanId,
        @Param("status") Laporan.StatusLaporan status,
        @Param("userId") Long userId,
        Pageable pageable
    );
    
    // Get laporan statistics
    @Query("SELECT " +
           "COUNT(l) as total, " +
           "SUM(CASE WHEN l.status = 'DRAFT' THEN 1 ELSE 0 END) as draft, " +
           "SUM(CASE WHEN l.status = 'AKTIF' THEN 1 ELSE 0 END) as aktif, " +
           "SUM(CASE WHEN l.status = 'TIDAK_AKTIF' THEN 1 ELSE 0 END) as tidakAktif " +
           "FROM Laporan l WHERE (:userId IS NULL OR l.userId = :userId)")
    Object[] getLaporanStatistics(@Param("userId") Long userId);
}
