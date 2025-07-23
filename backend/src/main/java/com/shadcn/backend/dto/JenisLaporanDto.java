package com.shadcn.backend.dto;

import com.shadcn.backend.model.JenisLaporan;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class JenisLaporanDto {
    private Long jenisLaporanId;
    
    @NotBlank(message = "Nama jenis laporan tidak boleh kosong")
    @Size(max = 200, message = "Nama jenis laporan maksimal 200 karakter")
    private String nama;
    
    private String deskripsi;
    
    private JenisLaporan.StatusJenisLaporan status;
    
    private LocalDateTime createdAt;
    
    private LocalDateTime updatedAt;
    
    private List<TahapanLaporanDto> tahapanList;
    
    private Integer jumlahTahapan;
    
    private Integer jumlahLaporan;
}
