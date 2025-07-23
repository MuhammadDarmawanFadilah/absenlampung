package com.shadcn.backend.dto;

import jakarta.validation.constraints.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UpdatePegawaiRequest {
    
    @NotBlank(message = "Username tidak boleh kosong")
    @Size(min = 3, max = 50, message = "Username harus antara 3-50 karakter")
    private String username;
    
    // Password is optional for update (only if provided)
    @Size(min = 6, message = "Password minimal 6 karakter")
    private String password;
    
    @NotBlank(message = "Nama lengkap tidak boleh kosong")
    @Size(max = 100, message = "Nama lengkap maksimal 100 karakter")
    private String namaLengkap;
    
    @NotBlank(message = "Email tidak boleh kosong")
    @Email(message = "Format email tidak valid")
    private String email;
    
    @Size(max = 20, message = "Nomor telepon maksimal 20 karakter")
    private String noTelp;
    
    @Size(max = 50, message = "NIP maksimal 50 karakter")
    private String nip;
    
    @Size(max = 100, message = "Pendidikan maksimal 100 karakter")
    private String pendidikan;
    
    @NotBlank(message = "Role tidak boleh kosong")
    @Size(max = 100, message = "Role maksimal 100 karakter")
    private String role;
    
    @NotBlank(message = "Jabatan tidak boleh kosong")
    @Size(max = 100, message = "Jabatan maksimal 100 karakter")
    private String jabatan;
    
    private Boolean isActive = true;
    
    // Location fields (optional)
    @Size(max = 500, message = "Alamat maksimal 500 karakter")
    private String alamat;
    
    @Size(max = 100, message = "Provinsi maksimal 100 karakter")
    private String provinsi;
    
    @Size(max = 100, message = "Kota maksimal 100 karakter")
    private String kota;
    
    @Size(max = 100, message = "Kecamatan maksimal 100 karakter")
    private String kecamatan;
    
    @Size(max = 100, message = "Kelurahan maksimal 100 karakter")
    private String kelurahan;
    
    @Size(max = 10, message = "Kode pos maksimal 10 karakter")
    private String kodePos;
    
    private Double latitude;
    private Double longitude;
    
    // Photo URL field
    @Size(max = 500, message = "URL foto maksimal 500 karakter")
    private String photoUrl;
    
    // Pemilihan assignment
    private List<Long> selectedPemilihanIds;
    
    // Note: totalTps is automatically calculated based on selectedPemilihanIds
}
