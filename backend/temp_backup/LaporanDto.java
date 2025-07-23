package com.shadcn.backend.dto;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class LaporanDto {
    private Long laporanId;
    
    @NotBlank(message = "Nama laporan tidak boleh kosong")
    @Size(max = 200, message = "Nama laporan maksimal 200 karakter")
    private String namaLaporan;
    
    private String deskripsi;
    
    private Long userId;
    
    private String status;
    
    private LocalDateTime createdAt;
    
    private LocalDateTime updatedAt;
    
    @NotNull(message = "ID jenis laporan tidak boleh kosong")
    private Long jenisLaporanId;
    
    private String jenisLaporanNama;
    
    private List<DetailLaporanDTO> detailLaporanList;
    
    private Integer progressPercentage;
    
    private Integer totalTahapan;
    
    private Integer tahapanSelesai;
    
    // Field untuk menyimpan ID pemilihan yang terkait
    private Long pemilihanId;
}
