package com.shadcn.backend.repository;

import com.shadcn.backend.entity.Absensi;
import com.shadcn.backend.model.Pegawai;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface AbsensiRepository extends JpaRepository<Absensi, Long> {
    
    // Find absensi by pegawai and date
    List<Absensi> findByPegawaiAndTanggalOrderByWaktuDesc(Pegawai pegawai, LocalDate tanggal);
    
    // Find absensi by pegawai and date (simple method for getTodayAbsensi)
    List<Absensi> findByPegawaiAndTanggal(Pegawai pegawai, LocalDate tanggal);
    
    // Find absensi by pegawai within date range
    List<Absensi> findByPegawaiAndTanggalBetweenOrderByTanggalDescWaktuDesc(
        Pegawai pegawai, LocalDate startDate, LocalDate endDate);
    
    // Find absensi by pegawai for current month
    @Query("SELECT a FROM Absensi a WHERE a.pegawai = :pegawai " +
           "AND YEAR(a.tanggal) = :year AND MONTH(a.tanggal) = :month " +
           "ORDER BY a.tanggal DESC, a.waktu DESC")
    List<Absensi> findByPegawaiAndMonth(@Param("pegawai") Pegawai pegawai, 
                                       @Param("year") int year, 
                                       @Param("month") int month);
    
    // Find absensi by pegawai with pagination
    Page<Absensi> findByPegawaiOrderByTanggalDescWaktuDesc(Pegawai pegawai, Pageable pageable);
    
    // Find absensi by pegawai and date range with pagination
    Page<Absensi> findByPegawaiAndTanggalBetweenOrderByTanggalDescWaktuDesc(
        Pegawai pegawai, LocalDate startDate, LocalDate endDate, Pageable pageable);
    
    // Find absensi by pegawai, date range and type with pagination
    Page<Absensi> findByPegawaiAndTanggalBetweenAndTypeOrderByTanggalDescWaktuDesc(
        Pegawai pegawai, LocalDate startDate, LocalDate endDate, Absensi.AbsensiType type, Pageable pageable);
    
    // Find absensi by pegawai, date range and status with pagination
    Page<Absensi> findByPegawaiAndTanggalBetweenAndStatusOrderByTanggalDescWaktuDesc(
        Pegawai pegawai, LocalDate startDate, LocalDate endDate, Absensi.AbsensiStatus status, Pageable pageable);
    
    // Find absensi by pegawai, date range, type and status with pagination
    Page<Absensi> findByPegawaiAndTanggalBetweenAndTypeAndStatusOrderByTanggalDescWaktuDesc(
        Pegawai pegawai, LocalDate startDate, LocalDate endDate, Absensi.AbsensiType type, Absensi.AbsensiStatus status, Pageable pageable);
    
    // Find all absensi by pegawai
    List<Absensi> findByPegawaiOrderByTanggalDescWaktuDesc(Pegawai pegawai);
    
    // Find absensi by pegawai within date range (for stats)
    List<Absensi> findByPegawaiAndTanggalBetween(Pegawai pegawai, LocalDate startDate, LocalDate endDate);
    
    // Check if pegawai already has absensi for specific date and type
    Optional<Absensi> findByPegawaiAndTanggalAndType(Pegawai pegawai, LocalDate tanggal, Absensi.AbsensiType type);
    
    // Count statistics
    @Query("SELECT COUNT(a) FROM Absensi a WHERE a.pegawai = :pegawai AND a.status = :status")
    long countByPegawaiAndStatus(@Param("pegawai") Pegawai pegawai, 
                                @Param("status") Absensi.AbsensiStatus status);
    
    @Query("SELECT COUNT(a) FROM Absensi a WHERE a.pegawai = :pegawai " +
           "AND YEAR(a.tanggal) = :year AND MONTH(a.tanggal) = :month")
    long countByPegawaiAndMonth(@Param("pegawai") Pegawai pegawai, 
                               @Param("year") int year, 
                               @Param("month") int month);
    
    // Master data methods for admin - find all absensi (all pegawai)
    List<Absensi> findByTanggalBetween(LocalDate startDate, LocalDate endDate);
    
    Page<Absensi> findByTanggalBetweenOrderByTanggalDescWaktuDesc(
        LocalDate startDate, LocalDate endDate, Pageable pageable);
    
    Page<Absensi> findByTanggalBetweenAndTypeOrderByTanggalDescWaktuDesc(
        LocalDate startDate, LocalDate endDate, Absensi.AbsensiType type, Pageable pageable);
    
    Page<Absensi> findByTanggalBetweenAndStatusOrderByTanggalDescWaktuDesc(
        LocalDate startDate, LocalDate endDate, Absensi.AbsensiStatus status, Pageable pageable);
    
    Page<Absensi> findByTanggalBetweenAndTypeAndStatusOrderByTanggalDescWaktuDesc(
        LocalDate startDate, LocalDate endDate, Absensi.AbsensiType type, Absensi.AbsensiStatus status, Pageable pageable);
}
