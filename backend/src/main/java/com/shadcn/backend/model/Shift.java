package com.shadcn.backend.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDateTime;

@Entity
@Table(name = "shift")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Shift {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(nullable = false, unique = true)
    @NotBlank(message = "Nama shift tidak boleh kosong")
    private String namaShift;
    
    @Column(name = "jam_masuk", nullable = false)
    @NotBlank(message = "Jam masuk tidak boleh kosong")
    private String jamMasuk;
    
    @Column(name = "jam_keluar", nullable = false)
    @NotBlank(message = "Jam keluar tidak boleh kosong")
    private String jamKeluar;
    
    @Column(name = "deskripsi", columnDefinition = "TEXT")
    private String deskripsi;
    
    @Enumerated(EnumType.STRING)
    @Column(name = "lock_lokasi", nullable = false)
    @NotNull(message = "Lock lokasi tidak boleh kosong")
    @Builder.Default
    private LockLokasi lockLokasi = LockLokasi.DIMANA_SAJA;
    
    @Column(name = "is_active", nullable = false)
    @Builder.Default
    private Boolean isActive = true;
    
    @Column(name = "created_at")
    private LocalDateTime createdAt;
    
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
    
    public enum LockLokasi {
        HARUS_DI_KANTOR("Harus di Kantor"),
        DIMANA_SAJA("Dimana Saja");
        
        private final String displayName;
        
        LockLokasi(String displayName) {
            this.displayName = displayName;
        }
        
        public String getDisplayName() {
            return displayName;
        }
    }
    
    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
        if (this.isActive == null) {
            this.isActive = true;
        }
        if (this.lockLokasi == null) {
            this.lockLokasi = LockLokasi.DIMANA_SAJA;
        }
    }
    
    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
}
