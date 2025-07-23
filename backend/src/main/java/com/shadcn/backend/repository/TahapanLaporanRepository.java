package com.shadcn.backend.repository;

import com.shadcn.backend.model.TahapanLaporan;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TahapanLaporanRepository extends JpaRepository<TahapanLaporan, Long> {
    
    // Find by jenis laporan
    List<TahapanLaporan> findByJenisLaporanJenisLaporanIdOrderByUrutanTahapanAsc(Long jenisLaporanId);
    
    // Find by jenis laporan and status
    List<TahapanLaporan> findByJenisLaporanJenisLaporanIdAndStatusOrderByUrutanTahapanAsc(
        Long jenisLaporanId, 
        TahapanLaporan.StatusTahapan status
    );
    
    // Find active tahapan by jenis laporan
    @Query("SELECT tl FROM TahapanLaporan tl WHERE tl.jenisLaporan.jenisLaporanId = :jenisLaporanId AND tl.status = 'AKTIF' ORDER BY tl.urutanTahapan ASC")
    List<TahapanLaporan> findActiveTahapanByJenisLaporan(@Param("jenisLaporanId") Long jenisLaporanId);
    
    // Find by nama containing
    Page<TahapanLaporan> findByNamaContainingIgnoreCase(String nama, Pageable pageable);
    
    // Check if urutan already exists for jenis laporan
    @Query("SELECT COUNT(tl) > 0 FROM TahapanLaporan tl WHERE tl.jenisLaporan.jenisLaporanId = :jenisLaporanId AND tl.urutanTahapan = :urutan AND tl.tahapanLaporanId != :id")
    boolean existsByJenisLaporanIdAndUrutanTahapanAndIdNot(
        @Param("jenisLaporanId") Long jenisLaporanId, 
        @Param("urutan") Integer urutan, 
        @Param("id") Long id
    );
    
    @Query("SELECT COUNT(tl) > 0 FROM TahapanLaporan tl WHERE tl.jenisLaporan.jenisLaporanId = :jenisLaporanId AND tl.urutanTahapan = :urutan")
    boolean existsByJenisLaporanIdAndUrutanTahapan(
        @Param("jenisLaporanId") Long jenisLaporanId, 
        @Param("urutan") Integer urutan
    );
    
    // Get max urutan for jenis laporan
    @Query("SELECT COALESCE(MAX(tl.urutanTahapan), 0) FROM TahapanLaporan tl WHERE tl.jenisLaporan.jenisLaporanId = :jenisLaporanId")
    Integer findMaxUrutanByJenisLaporan(@Param("jenisLaporanId") Long jenisLaporanId);
    
    // Count tahapan by jenis laporan
    long countByJenisLaporanJenisLaporanId(Long jenisLaporanId);
    
    // Advanced search
    @Query("SELECT tl FROM TahapanLaporan tl WHERE " +
           "(:jenisLaporanId IS NULL OR tl.jenisLaporan.jenisLaporanId = :jenisLaporanId) AND " +
           "(:nama IS NULL OR LOWER(tl.nama) LIKE LOWER(CONCAT('%', :nama, '%'))) AND " +
           "(:status IS NULL OR tl.status = :status)")
    Page<TahapanLaporan> findWithFilters(
        @Param("jenisLaporanId") Long jenisLaporanId,
        @Param("nama") String nama,
        @Param("status") TahapanLaporan.StatusTahapan status,
        Pageable pageable
    );
}
