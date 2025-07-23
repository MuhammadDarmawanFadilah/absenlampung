package com.shadcn.backend.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.EqualsAndHashCode;
import lombok.ToString;

import java.time.LocalDateTime;
import java.util.List;
import java.util.ArrayList;

@Entity
@Table(name = "detail_laporan", indexes = {
    @Index(name = "idx_detail_laporan", columnList = "laporan_id"),
    @Index(name = "idx_detail_tahapan", columnList = "tahapanLaporan_id"),
    @Index(name = "idx_detail_status", columnList = "status")
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(exclude = {"laporan", "tahapanLaporan", "lampiranList"})
@ToString(exclude = {"laporan", "tahapanLaporan", "lampiranList"})
public class DetailLaporan {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long detailLaporanId;
    
    @Column(columnDefinition = "TEXT")
    private String konten;
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private StatusDetailLaporan status = StatusDetailLaporan.BELUM_DIKERJAKAN;
    
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();
    
    @Column(nullable = false)
    private LocalDateTime updatedAt = LocalDateTime.now();
    
    // Many-to-one relationship dengan Laporan
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "laporan_id", nullable = false)
    private Laporan laporan;
    
    // Many-to-one relationship dengan TahapanLaporan
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "tahapanLaporan_id", nullable = false)
    private TahapanLaporan tahapanLaporan;
    
    // One-to-many relationship dengan LampiranLaporan
    @OneToMany(mappedBy = "detailLaporan", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<LampiranLaporan> lampiranList = new ArrayList<>();
    
    public enum StatusDetailLaporan {
        BELUM_DIKERJAKAN,
        DALAM_PENGERJAAN,
        SELESAI,
        REVISI
    }
    
    @PreUpdate
    public void preUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
}
