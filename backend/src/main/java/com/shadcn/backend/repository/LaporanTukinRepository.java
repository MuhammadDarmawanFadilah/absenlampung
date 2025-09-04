package com.shadcn.backend.repository;

import com.shadcn.backend.model.LaporanTukin;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface LaporanTukinRepository extends JpaRepository<LaporanTukin, Long> {
    
    @Query("SELECT l FROM LaporanTukin l JOIN FETCH l.generatedBy ORDER BY l.tanggalGenerate DESC")
    Page<LaporanTukin> findAllWithGeneratedBy(Pageable pageable);
    
    @Query("SELECT l FROM LaporanTukin l JOIN FETCH l.generatedBy WHERE " +
           "(:bulan IS NULL OR l.bulan = :bulan) AND " +
           "(:tahun IS NULL OR l.tahun = :tahun) AND " +
           "(:status IS NULL OR LOWER(l.status) LIKE LOWER(CONCAT('%', :status, '%'))) " +
           "ORDER BY l.tanggalGenerate DESC")
    Page<LaporanTukin> findWithFilters(@Param("bulan") Integer bulan,
                                      @Param("tahun") Integer tahun,
                                      @Param("status") String status,
                                      Pageable pageable);
    
    List<LaporanTukin> findByBulanAndTahunOrderByTanggalGenerateDesc(Integer bulan, Integer tahun);
    
    @Query("SELECT DISTINCT l.tahun FROM LaporanTukin l ORDER BY l.tahun DESC")
    List<Integer> findDistinctYears();
    
    // Delete methods
    long deleteByBulanAndTahun(Integer bulan, Integer tahun);
}
