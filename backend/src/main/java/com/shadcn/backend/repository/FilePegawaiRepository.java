package com.shadcn.backend.repository;

import com.shadcn.backend.model.FilePegawai;
import com.shadcn.backend.model.Pegawai;
import com.shadcn.backend.model.FileKategori;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface FilePegawaiRepository extends JpaRepository<FilePegawai, Long> {
    
    // Find by pegawai
    List<FilePegawai> findByPegawaiAndIsActiveTrueOrderByCreatedAtDesc(Pegawai pegawai);
    
    // Find by kategori
    List<FilePegawai> findByKategoriAndIsActiveTrueOrderByCreatedAtDesc(FileKategori kategori);
    
    // Find by pegawai and kategori
    List<FilePegawai> findByPegawaiAndKategoriAndIsActiveTrueOrderByCreatedAtDesc(Pegawai pegawai, FileKategori kategori);
    
    // Search with pagination and filtering
    @Query("SELECT fp FROM FilePegawai fp WHERE " +
           "(:search IS NULL OR LOWER(fp.judul) LIKE LOWER(CONCAT('%', :search, '%')) " +
           "OR LOWER(fp.deskripsi) LIKE LOWER(CONCAT('%', :search, '%'))) AND " +
           "(:pegawaiId IS NULL OR fp.pegawai.id = :pegawaiId) AND " +
           "(:kategoriId IS NULL OR fp.kategori.id = :kategoriId) AND " +
           "(:isActive IS NULL OR fp.isActive = :isActive) " +
           "ORDER BY fp.createdAt DESC")
    Page<FilePegawai> findWithFilters(@Param("search") String search,
                                     @Param("pegawaiId") Long pegawaiId,
                                     @Param("kategoriId") Long kategoriId,
                                     @Param("isActive") Boolean isActive, 
                                     Pageable pageable);
    
    // Count files by pegawai
    long countByPegawaiAndIsActiveTrue(Pegawai pegawai);
    
    // Count files by kategori
    long countByKategoriAndIsActiveTrue(FileKategori kategori);
}
