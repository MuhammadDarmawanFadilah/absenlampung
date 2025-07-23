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
import java.util.Set;
import java.util.HashSet;

@Entity
@Table(name = "pemilihan", indexes = {
    @Index(name = "idx_pemilihan_nama", columnList = "namaPemilihan"),
    @Index(name = "idx_pemilihan_tahun", columnList = "tahun"),
    @Index(name = "idx_pemilihan_tingkat", columnList = "tingkatPemilihan"),
    @Index(name = "idx_pemilihan_status", columnList = "status"),
    @Index(name = "idx_pemilihan_created", columnList = "createdAt")
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(exclude = {"detailPemilihanList", "pegawaiList"})
@ToString(exclude = {"detailPemilihanList", "pegawaiList"})
public class Pemilihan {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long pemilihanId;
    
    @Column(nullable = false)
    @NotBlank(message = "Nama pemilihan tidak boleh kosong")
    @Size(max = 200)
    private String namaPemilihan;
    
    @Column(nullable = false)
    private Integer tahun;
    
    @Column(columnDefinition = "TEXT")
    private String deskripsiPemilihan;
    
    // Periode pemilihan
    private LocalDateTime tanggalMulai;
    private LocalDateTime tanggalSelesai;
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TingkatPemilihan tingkatPemilihan;
    
    // Lokasi dan Wilayah
    private String provinsiId;
    private String provinsiNama;
    private String kotaId;
    private String kotaNama;
    private String kecamatanId;
    private String kecamatanNama;
    private String kelurahanId;
    private String kelurahanNama;
    private String rt;
    private String rw;
    
    // Koordinat peta
    private Double latitude;
    private Double longitude;
    private String alamatLokasi;
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private StatusPemilihan status = StatusPemilihan.DRAFT;
    
    @Column(nullable = false)
    private Long userId; // ID user yang membuat pemilihan
    
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();
    
    @Column(nullable = false)
    private LocalDateTime updatedAt = LocalDateTime.now();
    
    // One-to-many relationship dengan DetailPemilihan (laporan yang dipilih)
    @OneToMany(mappedBy = "pemilihan", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<DetailPemilihan> detailPemilihanList = new ArrayList<>();
    
    // Many-to-many relationship dengan Pegawai (pegawai yang ditugaskan)
    @ManyToMany(mappedBy = "pemilihanList", fetch = FetchType.LAZY)
    private java.util.Set<Pegawai> pegawaiList = new java.util.HashSet<>();
    
    // Helper methods for bidirectional relationship
    public void addPegawai(Pegawai pegawai) {
        if (pegawaiList == null) {
            pegawaiList = new java.util.HashSet<>();
        }
        pegawaiList.add(pegawai);
        if (pegawai.getPemilihanList() != null) {
            pegawai.getPemilihanList().add(this);
        }
    }
    
    public void removePegawai(Pegawai pegawai) {
        if (pegawaiList != null) {
            pegawaiList.remove(pegawai);
            if (pegawai.getPemilihanList() != null) {
                pegawai.getPemilihanList().remove(this);
            }
        }
    }
    
    public enum TingkatPemilihan {
        PROVINSI,
        KOTA,
        KABUPATEN,
        KECAMATAN,
        KELURAHAN
    }
    
    public enum StatusPemilihan {
        DRAFT,
        AKTIF,
        SELESAI,
        DIBATALKAN
    }
    
    @PreUpdate
    public void preUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
}
