package com.shadcn.backend.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.EqualsAndHashCode;
import lombok.ToString;

import java.time.LocalDateTime;
import java.util.List;
import java.util.ArrayList;

@Entity
@Table(name = "jenis_laporan", indexes = {
    @Index(name = "idx_jenis_laporan_nama", columnList = "nama"),
    @Index(name = "idx_jenis_laporan_status", columnList = "status"),
    @Index(name = "idx_jenis_laporan_created", columnList = "createdAt")
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(exclude = {"tahapanList", "laporanList"})
@ToString(exclude = {"tahapanList", "laporanList"})
public class JenisLaporan {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long jenisLaporanId;
    
    @Column(nullable = false)
    @NotBlank(message = "Nama jenis laporan tidak boleh kosong")
    @Size(max = 200)
    private String nama;
    
    @Column(columnDefinition = "TEXT")
    private String deskripsi;
    
    @Column(nullable = false)
    private Integer urutan = 0;
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private StatusJenisLaporan status = StatusJenisLaporan.AKTIF;
    
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();
    
    @Column(nullable = false)
    private LocalDateTime updatedAt = LocalDateTime.now();
    
    // One-to-many relationship dengan TahapanLaporan
    @OneToMany(mappedBy = "jenisLaporan", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<TahapanLaporan> tahapanList = new ArrayList<>();
    
    // One-to-many relationship dengan Laporan
    @OneToMany(mappedBy = "jenisLaporan", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<Laporan> laporanList = new ArrayList<>();
    
    public enum StatusJenisLaporan {
        AKTIF,
        TIDAK_AKTIF,
        DRAFT
    }
    
    @PreUpdate
    public void preUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
}
