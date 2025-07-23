package com.shadcn.backend.repository;

import com.shadcn.backend.model.JenisLaporan;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface JenisLaporanRepository extends JpaRepository<JenisLaporan, Long> {
    
    // Find by status
    Page<JenisLaporan> findByStatus(JenisLaporan.StatusJenisLaporan status, Pageable pageable);
    
    // Find by nama containing (case insensitive)
    Page<JenisLaporan> findByNamaContainingIgnoreCase(String nama, Pageable pageable);
    
    // Find by nama and status
    Page<JenisLaporan> findByNamaContainingIgnoreCaseAndStatus(
        String nama, 
        JenisLaporan.StatusJenisLaporan status, 
        Pageable pageable
    );
    
    // Find active types only
    @Query("SELECT jl FROM JenisLaporan jl WHERE jl.status = 'AKTIF' ORDER BY jl.nama ASC")
    List<JenisLaporan> findActiveJenisLaporan();
    
    // Check if nama already exists (for validation)
    @Query("SELECT COUNT(jl) > 0 FROM JenisLaporan jl WHERE LOWER(jl.nama) = LOWER(:nama) AND jl.jenisLaporanId != :id")
    boolean existsByNamaIgnoreCaseAndIdNot(@Param("nama") String nama, @Param("id") Long id);
    
    @Query("SELECT COUNT(jl) > 0 FROM JenisLaporan jl WHERE LOWER(jl.nama) = LOWER(:nama)")
    boolean existsByNamaIgnoreCase(@Param("nama") String nama);
    
    // Get statistics
    @Query("SELECT COUNT(jl) FROM JenisLaporan jl WHERE jl.status = :status")
    long countByStatus(@Param("status") JenisLaporan.StatusJenisLaporan status);
    
    // Advanced search with multiple filters
    @Query("SELECT jl FROM JenisLaporan jl WHERE " +
           "(:nama IS NULL OR LOWER(jl.nama) LIKE LOWER(CONCAT('%', :nama, '%'))) AND " +
           "(:status IS NULL OR jl.status = :status)")
    Page<JenisLaporan> findWithFilters(
        @Param("nama") String nama,
        @Param("status") JenisLaporan.StatusJenisLaporan status,
        Pageable pageable
    );
}
