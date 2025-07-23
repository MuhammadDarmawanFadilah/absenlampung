package com.shadcn.backend.repository;

import com.shadcn.backend.model.Pemilihan;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PemilihanRepository extends JpaRepository<Pemilihan, Long> {
    
    // Find by status
    List<Pemilihan> findByStatus(Pemilihan.StatusPemilihan status);
    
    // Find by nama containing (case insensitive)
    Page<Pemilihan> findByNamaPemilihanContainingIgnoreCase(String namaPemilihan, Pageable pageable);
    
    // Find by status and nama containing
    Page<Pemilihan> findByStatusAndNamaPemilihanContainingIgnoreCase(
        Pemilihan.StatusPemilihan status, String namaPemilihan, Pageable pageable);
    
    // Find by wilayah
    @Query("SELECT p FROM Pemilihan p WHERE " +
           "(:provinsiNama IS NULL OR p.provinsiNama = :provinsiNama) AND " +
           "(:kotaNama IS NULL OR p.kotaNama = :kotaNama) AND " +
           "(:kecamatanNama IS NULL OR p.kecamatanNama = :kecamatanNama) AND " +
           "(:kelurahanNama IS NULL OR p.kelurahanNama = :kelurahanNama)")
    Page<Pemilihan> findByWilayah(
        @Param("provinsiNama") String provinsiNama,
        @Param("kotaNama") String kotaNama,
        @Param("kecamatanNama") String kecamatanNama,
        @Param("kelurahanNama") String kelurahanNama,
        Pageable pageable
    );
    
    // Count by status
    long countByStatus(Pemilihan.StatusPemilihan status);
    
    // Find active pemilihan
    @Query("SELECT p FROM Pemilihan p WHERE p.status = 'AKTIF' ORDER BY p.createdAt DESC")
    List<Pemilihan> findActivePemilihan();
    
    // Find pemilihan by tahun
    List<Pemilihan> findByTahun(Integer tahun);
    
    // Search with multiple criteria
    @Query("SELECT p FROM Pemilihan p WHERE " +
           "(:namaPemilihan IS NULL OR LOWER(p.namaPemilihan) LIKE LOWER(CONCAT('%', :namaPemilihan, '%'))) AND " +
           "(:status IS NULL OR p.status = :status) AND " +
           "(:provinsiNama IS NULL OR p.provinsiNama = :provinsiNama) AND " +
           "(:kotaNama IS NULL OR p.kotaNama = :kotaNama)")
    Page<Pemilihan> searchPemilihan(
        @Param("namaPemilihan") String namaPemilihan,
        @Param("status") Pemilihan.StatusPemilihan status,
        @Param("provinsiNama") String provinsiNama,
        @Param("kotaNama") String kotaNama,
        Pageable pageable
    );
    
    // Search with filters including tingkat pemilihan
    @Query("SELECT p FROM Pemilihan p WHERE " +
           "(:keyword IS NULL OR :keyword = '' OR LOWER(p.namaPemilihan) LIKE LOWER(CONCAT('%', :keyword, '%')) OR LOWER(p.deskripsiPemilihan) LIKE LOWER(CONCAT('%', :keyword, '%'))) AND " +
           "(:tingkat IS NULL OR :tingkat = '' OR LOWER(p.tingkatPemilihan) = LOWER(:tingkat)) AND " +
           "(:status IS NULL OR :status = '' OR LOWER(p.status) = LOWER(:status))")
    Page<Pemilihan> findByFilters(
        @Param("keyword") String keyword,
        @Param("tingkat") String tingkat,
        @Param("status") String status,
        Pageable pageable
    );
    
    // Advanced search with all filters including wilayah
    @Query("SELECT p FROM Pemilihan p WHERE " +
           "(:keyword IS NULL OR :keyword = '' OR LOWER(p.namaPemilihan) LIKE LOWER(CONCAT('%', :keyword, '%')) OR LOWER(p.deskripsiPemilihan) LIKE LOWER(CONCAT('%', :keyword, '%'))) AND " +
           "(:tingkat IS NULL OR :tingkat = '' OR LOWER(p.tingkatPemilihan) = LOWER(:tingkat)) AND " +
           "(:status IS NULL OR :status = '' OR LOWER(p.status) = LOWER(:status)) AND " +
           "(:provinsi IS NULL OR :provinsi = '' OR p.provinsiId = :provinsi) AND " +
           "(:kota IS NULL OR :kota = '' OR p.kotaId = :kota) AND " +
           "(:kecamatan IS NULL OR :kecamatan = '' OR p.kecamatanId = :kecamatan)")
    Page<Pemilihan> findByAdvancedFilters(
        @Param("keyword") String keyword,
        @Param("tingkat") String tingkat,
        @Param("status") String status,
        @Param("provinsi") String provinsi,
        @Param("kota") String kota,
        @Param("kecamatan") String kecamatan,
        Pageable pageable
    );
    
    // Advanced search with all filters including wilayah and pegawai
    @Query("SELECT DISTINCT p FROM Pemilihan p " +
           "LEFT JOIN p.pegawaiList pegawai " +
           "WHERE " +
           "(:keyword IS NULL OR :keyword = '' OR LOWER(p.namaPemilihan) LIKE LOWER(CONCAT('%', :keyword, '%')) OR LOWER(p.deskripsiPemilihan) LIKE LOWER(CONCAT('%', :keyword, '%'))) AND " +
           "(:tingkat IS NULL OR :tingkat = '' OR LOWER(p.tingkatPemilihan) = LOWER(:tingkat)) AND " +
           "(:status IS NULL OR :status = '' OR LOWER(p.status) = LOWER(:status)) AND " +
           "(:provinsi IS NULL OR :provinsi = '' OR p.provinsiId = :provinsi) AND " +
           "(:kota IS NULL OR :kota = '' OR p.kotaId = :kota) AND " +
           "(:kecamatan IS NULL OR :kecamatan = '' OR p.kecamatanId = :kecamatan) AND " +
           "(:pegawaiId IS NULL OR pegawai.id = :pegawaiId)")
    Page<Pemilihan> findByAdvancedFiltersWithPegawai(
        @Param("keyword") String keyword,
        @Param("tingkat") String tingkat,
        @Param("status") String status,
        @Param("provinsi") String provinsi,
        @Param("kota") String kota,
        @Param("kecamatan") String kecamatan,
        @Param("pegawaiId") Long pegawaiId,
        Pageable pageable
    );
    
    // Monthly statistics for dashboard
    @Query("SELECT COUNT(p) FROM Pemilihan p WHERE YEAR(p.createdAt) = :year AND MONTH(p.createdAt) = :month")
    Long countByCreatedAtYearAndMonth(@Param("year") int year, @Param("month") int month);
}
