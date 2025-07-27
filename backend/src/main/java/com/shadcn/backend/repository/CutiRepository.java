package com.shadcn.backend.repository;

import com.shadcn.backend.model.Cuti;
import com.shadcn.backend.model.Pegawai;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface CutiRepository extends JpaRepository<Cuti, Long> {
    
    // Find cuti by pegawai
    Page<Cuti> findByPegawaiOrderByCreatedAtDesc(Pegawai pegawai, Pageable pageable);
    
    // Find cuti by pegawai with all relationships loaded
    @Query("SELECT c FROM Cuti c " +
           "LEFT JOIN FETCH c.pegawai " +
           "LEFT JOIN FETCH c.jenisCuti " +
           "LEFT JOIN FETCH c.approvedBy " +
           "WHERE c.pegawai = :pegawai " +
           "ORDER BY c.createdAt DESC")
    List<Cuti> findByPegawaiWithRelationsOrderByCreatedAtDesc(@Param("pegawai") Pegawai pegawai);
    
    // Find cuti by status
    Page<Cuti> findByStatusApprovalOrderByCreatedAtDesc(Cuti.StatusApproval status, Pageable pageable);
    
    // Find cuti by pegawai and status
    Page<Cuti> findByPegawaiAndStatusApprovalOrderByCreatedAtDesc(Pegawai pegawai, Cuti.StatusApproval status, Pageable pageable);
    
    // Find cuti by date range
    @Query("SELECT c FROM Cuti c WHERE c.tanggalCuti BETWEEN :startDate AND :endDate ORDER BY c.createdAt DESC")
    Page<Cuti> findByTanggalCutiBetweenOrderByCreatedAtDesc(
        @Param("startDate") LocalDate startDate, 
        @Param("endDate") LocalDate endDate, 
        Pageable pageable
    );
    
    // Find cuti by pegawai and date range
    @Query("SELECT c FROM Cuti c WHERE c.pegawai = :pegawai AND c.tanggalCuti BETWEEN :startDate AND :endDate ORDER BY c.createdAt DESC")
    Page<Cuti> findByPegawaiAndTanggalCutiBetweenOrderByCreatedAtDesc(
        @Param("pegawai") Pegawai pegawai,
        @Param("startDate") LocalDate startDate, 
        @Param("endDate") LocalDate endDate, 
        Pageable pageable
    );
    
    // Count approved cuti for a pegawai in current year
    @Query("SELECT COUNT(c) FROM Cuti c WHERE c.pegawai = :pegawai AND c.statusApproval = 'DISETUJUI' AND YEAR(c.tanggalCuti) = :year")
    Long countApprovedCutiByPegawaiAndYear(@Param("pegawai") Pegawai pegawai, @Param("year") int year);
    
    // Count approved cuti for a pegawai by jenis cuti and year
    @Query("SELECT COALESCE(COUNT(c), 0) FROM Cuti c WHERE c.pegawai.id = :pegawaiId AND c.jenisCuti.id = :jenisCutiId AND c.statusApproval = 'DISETUJUI' AND YEAR(c.tanggalCuti) = :year")
    Integer countApprovedCutiByPegawaiAndJenisCutiAndYear(@Param("pegawaiId") Long pegawaiId, @Param("jenisCutiId") Long jenisCutiId, @Param("year") Integer year);
    
    // Find overlapping cuti for a pegawai
    @Query("SELECT c FROM Cuti c WHERE c.pegawai = :pegawai AND c.tanggalCuti = :tanggalCuti AND c.statusApproval IN ('PENDING', 'DIAJUKAN', 'DISETUJUI')")
    List<Cuti> findOverlappingCuti(@Param("pegawai") Pegawai pegawai, @Param("tanggalCuti") LocalDate tanggalCuti);
    
    // Find all cuti with filters
    @Query("SELECT c FROM Cuti c WHERE " +
           "(:pegawaiId IS NULL OR c.pegawai.id = :pegawaiId) AND " +
           "(:status IS NULL OR c.statusApproval = :status) AND " +
           "(:jenisCuti IS NULL OR c.jenisCuti = :jenisCuti) AND " +
           "(:startDate IS NULL OR c.tanggalCuti >= :startDate) AND " +
           "(:endDate IS NULL OR c.tanggalCuti <= :endDate) " +
           "ORDER BY c.createdAt DESC")
    Page<Cuti> findWithFilters(
        @Param("pegawaiId") Long pegawaiId,
        @Param("status") Cuti.StatusApproval status,
        @Param("jenisCuti") String jenisCuti,
        @Param("startDate") LocalDate startDate,
        @Param("endDate") LocalDate endDate,
        Pageable pageable
    );
    
    // Find all cuti with filters and eager loading
    @Query("SELECT c FROM Cuti c " +
           "LEFT JOIN FETCH c.pegawai " +
           "LEFT JOIN FETCH c.jenisCuti " +
           "LEFT JOIN FETCH c.approvedBy " +
           "WHERE " +
           "(:pegawaiId IS NULL OR c.pegawai.id = :pegawaiId) AND " +
           "(:status IS NULL OR c.statusApproval = :status) AND " +
           "(:jenisCuti IS NULL OR c.jenisCuti = :jenisCuti) AND " +
           "(:startDate IS NULL OR c.tanggalCuti >= :startDate) AND " +
           "(:endDate IS NULL OR c.tanggalCuti <= :endDate) " +
           "ORDER BY c.createdAt DESC")
    List<Cuti> findWithFiltersEager(
        @Param("pegawaiId") Long pegawaiId,
        @Param("status") Cuti.StatusApproval status,
        @Param("jenisCuti") String jenisCuti,
        @Param("startDate") LocalDate startDate,
        @Param("endDate") LocalDate endDate
    );
}
