package com.shadcn.backend.dto;

import com.shadcn.backend.model.JenisLaporan;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class JenisLaporanFilterRequest {
    private int page = 0;
    private int size = 10;
    private String sortBy = "createdAt";
    private String sortDirection = "desc";
    
    private String nama;
    private JenisLaporan.StatusJenisLaporan status;
}
