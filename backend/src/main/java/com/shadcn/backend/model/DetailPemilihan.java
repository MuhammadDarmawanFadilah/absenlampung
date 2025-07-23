package com.shadcn.backend.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.EqualsAndHashCode;
import lombok.ToString;

import java.time.LocalDateTime;

@Entity
@Table(name = "detail_pemilihan", indexes = {
    @Index(name = "idx_detail_pemilihan_pemilihan", columnList = "pemilihan_id"),
    @Index(name = "idx_detail_pemilihan_laporan", columnList = "laporan_id"),
    @Index(name = "idx_detail_pemilihan_urutan", columnList = "urutanTampil")
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(exclude = {"pemilihan", "laporan"})
@ToString(exclude = {"pemilihan", "laporan"})
public class DetailPemilihan {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long detailPemilihanId;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "pemilihan_id", nullable = false)
    private Pemilihan pemilihan;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "laporan_id", nullable = false)
    private Laporan laporan;
    
    @Column(nullable = false)
    private Integer urutanTampil; // Urutan tampil dalam layout
    
    @Column(nullable = false)
    private Integer posisiLayout; // Posisi dalam layout (1-5)
    
    private String keterangan; // Keterangan tambahan
    
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();
    
    @Column(nullable = false)
    private LocalDateTime updatedAt = LocalDateTime.now();
    
    @PreUpdate
    public void preUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
}
