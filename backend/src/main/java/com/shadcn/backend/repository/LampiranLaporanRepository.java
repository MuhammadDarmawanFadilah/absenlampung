package com.shadcn.backend.repository;

import com.shadcn.backend.model.LampiranLaporan;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface LampiranLaporanRepository extends JpaRepository<LampiranLaporan, Long> {
    
    // Find by detail laporan ID
    List<LampiranLaporan> findByDetailLaporanDetailLaporanIdOrderByCreatedAtDesc(Long detailLaporanId);
    
    // Find by jenis file
    List<LampiranLaporan> findByJenisFile(String jenisFile);
    
    // Find by detail laporan and jenis file
    List<LampiranLaporan> findByDetailLaporanDetailLaporanIdAndJenisFile(Long detailLaporanId, String jenisFile);
    
    // Count by detail laporan
    long countByDetailLaporanDetailLaporanId(Long detailLaporanId);
    
    // Count by jenis file
    long countByJenisFile(String jenisFile);
    
    // Get total file size by detail laporan
    @Query("SELECT COALESCE(SUM(ll.ukuranFile), 0) FROM LampiranLaporan ll WHERE ll.detailLaporan.detailLaporanId = :detailLaporanId")
    Long getTotalFileSizeByDetailLaporan(@Param("detailLaporanId") Long detailLaporanId);
    
    // Get file statistics
    @Query("SELECT ll.jenisFile, COUNT(ll), SUM(ll.ukuranFile) FROM LampiranLaporan ll GROUP BY ll.jenisFile")
    List<Object[]> getFileStatistics();
    
    // Check if file path exists
    boolean existsByPathFile(String pathFile);
}
