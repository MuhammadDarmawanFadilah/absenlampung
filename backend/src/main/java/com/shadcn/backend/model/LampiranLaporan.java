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

@Entity
@Table(name = "lampiran_laporan", indexes = {
    @Index(name = "idx_lampiran_detail", columnList = "detailLaporan_id"),
    @Index(name = "idx_lampiran_jenis", columnList = "jenisFile"),
    @Index(name = "idx_lampiran_created", columnList = "createdAt")
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(exclude = {"detailLaporan"})
@ToString(exclude = {"detailLaporan"})
public class LampiranLaporan {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long lampiranId;
    
    @Column(nullable = false)
    @NotBlank(message = "Nama file tidak boleh kosong")
    @Size(max = 255)
    private String namaFile;
    
    @Column(nullable = false)
    @NotBlank(message = "Path file tidak boleh kosong")
    @Size(max = 500)
    private String pathFile;
    
    @Column(nullable = false)
    @NotBlank(message = "Jenis file tidak boleh kosong")
    @Size(max = 50)
    private String jenisFile; // image, video, pdf, excel, word
    
    @Column(nullable = false)
    private Long ukuranFile; // dalam bytes
    
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();
    
    // Many-to-one relationship dengan DetailLaporan
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "detailLaporan_id", nullable = false)
    private DetailLaporan detailLaporan;
}
