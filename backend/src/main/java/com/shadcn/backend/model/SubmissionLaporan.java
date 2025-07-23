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
@Table(name = "submission_laporan", indexes = {
    @Index(name = "idx_submission_user", columnList = "user_id"),
    @Index(name = "idx_submission_tahapan", columnList = "tahapan_laporan_id"),
    @Index(name = "idx_submission_jenis", columnList = "jenis_laporan_id"),
    @Index(name = "idx_submission_status", columnList = "status")
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(exclude = {"user", "tahapanLaporan", "jenisLaporan", "lampiran"})
@ToString(exclude = {"user", "tahapanLaporan", "jenisLaporan", "lampiran"})
public class SubmissionLaporan {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(nullable = false)
    private String judul;
    
    @Column(columnDefinition = "TEXT")
    private String konten;
    
    private String lokasi;
    
    private String tanggalLaporan;
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private StatusLaporan status = StatusLaporan.DRAFT;
    
    @Column(nullable = false, updatable = false)
    private LocalDateTime tanggalBuat = LocalDateTime.now();
    
    @Column(nullable = false)
    private LocalDateTime tanggalUpdate = LocalDateTime.now();
    
    // Relations
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "tahapan_laporan_id", nullable = false)
    private TahapanLaporan tahapanLaporan;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "jenis_laporan_id", nullable = false)
    private JenisLaporan jenisLaporan;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "laporan_id", nullable = false)
    private Laporan laporan;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "pemilihan_id", nullable = false)
    private Pemilihan pemilihan;
    
    @OneToMany(mappedBy = "submissionLaporan", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<SubmissionLampiran> lampiran = new ArrayList<>();
    
    public enum StatusLaporan {
        DRAFT,
        SUBMITTED,
        REVIEWED,
        APPROVED,
        REJECTED
    }
    
    @PreUpdate
    public void preUpdate() {
        this.tanggalUpdate = LocalDateTime.now();
    }
}
