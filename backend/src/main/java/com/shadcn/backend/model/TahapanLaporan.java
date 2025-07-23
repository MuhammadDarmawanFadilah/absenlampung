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
@Table(name = "tahapan_laporan", indexes = {
    @Index(name = "idx_tahapan_nama", columnList = "nama"),
    @Index(name = "idx_tahapan_jenis", columnList = "jenisLaporan_id"),
    @Index(name = "idx_tahapan_urutan", columnList = "urutanTahapan")
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(exclude = {"jenisLaporan", "detailLaporanList"})
@ToString(exclude = {"jenisLaporan", "detailLaporanList"})
public class TahapanLaporan {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long tahapanLaporanId;
    
    @Column(nullable = false)
    @NotBlank(message = "Nama tahapan tidak boleh kosong")
    @Size(max = 200)
    private String nama;
    
    @Column(columnDefinition = "TEXT")
    private String deskripsi;
    
    @Column(columnDefinition = "TEXT")
    private String templateTahapan;
    
    @Column(nullable = false)
    private Integer urutanTahapan = 1;
    
    // Jenis file yang diizinkan (stored as JSON string)
    @Column(columnDefinition = "TEXT")
    private String jenisFileIzin; // JSON array: ["image", "video", "pdf", "excel", "word"]
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private StatusTahapan status = StatusTahapan.AKTIF;
    
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();
    
    @Column(nullable = false)
    private LocalDateTime updatedAt = LocalDateTime.now();
    
    // Many-to-one relationship dengan JenisLaporan
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "jenisLaporan_id", nullable = false)
    private JenisLaporan jenisLaporan;
    
    // One-to-many relationship dengan DetailLaporan
    @OneToMany(mappedBy = "tahapanLaporan", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<DetailLaporan> detailLaporanList = new ArrayList<>();
    
    public enum StatusTahapan {
        AKTIF,
        TIDAK_AKTIF
    }
    
    @PreUpdate
    public void preUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
}
