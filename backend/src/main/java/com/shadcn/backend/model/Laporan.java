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
@Table(name = "laporan", indexes = {
    @Index(name = "idx_laporan_nama", columnList = "namaLaporan"),
    @Index(name = "idx_laporan_jenis", columnList = "jenisLaporan_id"),
    @Index(name = "idx_laporan_user", columnList = "userId"),
    @Index(name = "idx_laporan_status", columnList = "status"),
    @Index(name = "idx_laporan_created", columnList = "createdAt")
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(exclude = {"jenisLaporan", "detailLaporanList"})
@ToString(exclude = {"jenisLaporan", "detailLaporanList"})
public class Laporan {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long laporanId;
    
    @Column(nullable = false)
    @NotBlank(message = "Nama laporan tidak boleh kosong")
    @Size(max = 200)
    private String namaLaporan;
    
    @Column(columnDefinition = "TEXT")
    private String deskripsi;
    
    @Column(nullable = false)
    private Long userId; // ID user yang membuat laporan
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private StatusLaporan status = StatusLaporan.AKTIF;
    
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();
    
    @Column(nullable = false)
    private LocalDateTime updatedAt = LocalDateTime.now();
    
    // Many-to-one relationship dengan JenisLaporan
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "jenisLaporan_id", nullable = false)
    private JenisLaporan jenisLaporan;
    
    // One-to-many relationship dengan DetailLaporan
    @OneToMany(mappedBy = "laporan", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<DetailLaporan> detailLaporanList = new ArrayList<>();
    
    public enum StatusLaporan {
        AKTIF,
        TIDAK_AKTIF,
        DRAFT
    }
    
    @PreUpdate
    public void preUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
}
