package com.shadcn.backend.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.EqualsAndHashCode;
import lombok.ToString;

import java.time.LocalDateTime;

@Entity
@Table(name = "submission_lampiran", indexes = {
    @Index(name = "idx_lampiran_submission", columnList = "submission_laporan_id")
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(exclude = {"submissionLaporan"})
@ToString(exclude = {"submissionLaporan"})
public class SubmissionLampiran {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(nullable = false)
    private String namaFile;
    
    @Column(nullable = false)
    private String pathFile;
    
    private String tipeFile;
    
    private Long ukuranFile;
    
    @Column(nullable = false, updatable = false)
    private LocalDateTime tanggalUpload = LocalDateTime.now();
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "submission_laporan_id", nullable = false)
    private SubmissionLaporan submissionLaporan;
}
