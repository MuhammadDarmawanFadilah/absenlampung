package com.shadcn.backend.repository;

import com.shadcn.backend.model.DetailPemilihan;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DetailPemilihanRepository extends JpaRepository<DetailPemilihan, Long> {
    
    @Query("SELECT dp FROM DetailPemilihan dp WHERE dp.pemilihan.pemilihanId = :pemilihanId ORDER BY dp.urutanTampil")
    List<DetailPemilihan> findByPemilihanIdOrderByUrutan(@Param("pemilihanId") Long pemilihanId);
    
    @Query("SELECT dp FROM DetailPemilihan dp LEFT JOIN FETCH dp.laporan l LEFT JOIN FETCH l.jenisLaporan jl WHERE dp.pemilihan.pemilihanId = :pemilihanId ORDER BY dp.urutanTampil")
    List<DetailPemilihan> findByPemilihanIdWithLaporanOrderByUrutan(@Param("pemilihanId") Long pemilihanId);
    
    @Query("SELECT dp FROM DetailPemilihan dp WHERE dp.pemilihan.pemilihanId = :pemilihanId AND dp.posisiLayout = :posisi ORDER BY dp.urutanTampil")
    List<DetailPemilihan> findByPemilihanIdAndPosisi(@Param("pemilihanId") Long pemilihanId, @Param("posisi") Integer posisi);
    
    @Query("SELECT COUNT(dp) FROM DetailPemilihan dp WHERE dp.pemilihan.pemilihanId = :pemilihanId")
    Long countByPemilihanId(@Param("pemilihanId") Long pemilihanId);
    
    @Query("SELECT MAX(dp.urutanTampil) FROM DetailPemilihan dp WHERE dp.pemilihan.pemilihanId = :pemilihanId")
    Integer getMaxUrutanTampil(@Param("pemilihanId") Long pemilihanId);
    
    @Query("SELECT dp FROM DetailPemilihan dp WHERE dp.laporan.laporanId = :laporanId")
    List<DetailPemilihan> findByLaporanId(@Param("laporanId") Long laporanId);
    
    void deleteByPemilihanPemilihanId(Long pemilihanId);
}
