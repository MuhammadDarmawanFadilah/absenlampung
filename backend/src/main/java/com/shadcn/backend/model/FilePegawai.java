package com.shadcn.backend.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Entity
@Table(name = "file_pegawai")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class FilePegawai {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @NotBlank(message = "Judul file tidak boleh kosong")
    @Size(max = 255, message = "Judul file maksimal 255 karakter")
    @Column(name = "judul", nullable = false, length = 255)
    private String judul;
    
    @Size(max = 500, message = "Deskripsi maksimal 500 karakter")
    @Column(name = "deskripsi", length = 500)
    private String deskripsi;
    
    @NotBlank(message = "Nama file tidak boleh kosong")
    @Size(max = 255, message = "Nama file maksimal 255 karakter")
    @Column(name = "filename", nullable = false, length = 255)
    private String fileName;
    
    @Size(max = 100, message = "Tipe file maksimal 100 karakter")
    @Column(name = "file_type", length = 100)
    private String fileType;
    
    @Column(name = "file_size")
    private Long fileSize;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "pegawai_id", nullable = false)
    private Pegawai pegawai;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "kategori_id", nullable = false)
    private FileKategori kategori;
    
    @Column(name = "is_active", nullable = false, columnDefinition = "BIT(1) DEFAULT 1")
    private Boolean isActive = true;
    
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
    
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
    
    @PrePersist
    protected void onCreate() {
        if (isActive == null) {
            isActive = true;
        }
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }
    
    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
