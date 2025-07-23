package com.shadcn.backend.dto;

import com.shadcn.backend.model.TahapanLaporan;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Min;
import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class TahapanLaporanDto {
    private Long tahapanLaporanId;
    
    @NotBlank(message = "Nama tahapan tidak boleh kosong")
    @Size(max = 200, message = "Nama tahapan maksimal 200 karakter")
    private String nama;
    
    private String deskripsi;
    
    private String templateTahapan;
    
    @NotNull(message = "Urutan tahapan tidak boleh kosong")
    @Min(value = 1, message = "Urutan tahapan minimal 1")
    private Integer urutanTahapan;
    
    private List<String> jenisFileIzin; // ["image", "video", "pdf", "excel", "word"]
    
    private TahapanLaporan.StatusTahapan status;
    
    private LocalDateTime createdAt;
    
    private LocalDateTime updatedAt;
    
    @NotNull(message = "ID jenis laporan tidak boleh kosong")
    private Long jenisLaporanId;
    
    private String jenisLaporanNama;
}
