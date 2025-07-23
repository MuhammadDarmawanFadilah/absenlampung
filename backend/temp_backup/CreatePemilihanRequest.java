package com.shadcn.backend.dto;

import java.util.List;

public class CreatePemilihanRequest {
    private String judulPemilihan;
    private String deskripsi;
    private String status;
    private String provinsi;
    private String kota;
    private String kecamatan;
    private String kelurahan;
    private String tingkatPemilihan;
    private String rt;
    private String rw;
    private String alamatLokasi;
    private Double latitude;
    private Double longitude;
    private String tanggalAktif;
    private String tanggalBerakhir;
    private List<DetailLaporanDTO> detailLaporan;

    // Constructors
    public CreatePemilihanRequest() {}

    public CreatePemilihanRequest(String judulPemilihan, String deskripsi, String status, 
                                 String provinsi, String kota, String kecamatan, String kelurahan, 
                                 String tingkatPemilihan, String rt, String rw, String alamatLokasi, 
                                 Double latitude, Double longitude, String tanggalAktif, 
                                 String tanggalBerakhir, List<DetailLaporanDTO> detailLaporan) {
        this.judulPemilihan = judulPemilihan;
        this.deskripsi = deskripsi;
        this.status = status;
        this.provinsi = provinsi;
        this.kota = kota;
        this.kecamatan = kecamatan;
        this.kelurahan = kelurahan;
        this.tingkatPemilihan = tingkatPemilihan;
        this.rt = rt;
        this.rw = rw;
        this.alamatLokasi = alamatLokasi;
        this.latitude = latitude;
        this.longitude = longitude;
        this.tanggalAktif = tanggalAktif;
        this.tanggalBerakhir = tanggalBerakhir;
        this.detailLaporan = detailLaporan;
    }

    // Getters and Setters
    public String getJudulPemilihan() {
        return judulPemilihan;
    }

    public void setJudulPemilihan(String judulPemilihan) {
        this.judulPemilihan = judulPemilihan;
    }

    public String getDeskripsi() {
        return deskripsi;
    }

    public void setDeskripsi(String deskripsi) {
        this.deskripsi = deskripsi;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getProvinsi() {
        return provinsi;
    }

    public void setProvinsi(String provinsi) {
        this.provinsi = provinsi;
    }

    public String getKota() {
        return kota;
    }

    public void setKota(String kota) {
        this.kota = kota;
    }

    public String getKecamatan() {
        return kecamatan;
    }

    public void setKecamatan(String kecamatan) {
        this.kecamatan = kecamatan;
    }

    public String getKelurahan() {
        return kelurahan;
    }

    public void setKelurahan(String kelurahan) {
        this.kelurahan = kelurahan;
    }

    public String getTingkatPemilihan() {
        return tingkatPemilihan;
    }

    public void setTingkatPemilihan(String tingkatPemilihan) {
        this.tingkatPemilihan = tingkatPemilihan;
    }

    public String getRt() {
        return rt;
    }

    public void setRt(String rt) {
        this.rt = rt;
    }

    public String getRw() {
        return rw;
    }

    public void setRw(String rw) {
        this.rw = rw;
    }

    public String getAlamatLokasi() {
        return alamatLokasi;
    }

    public void setAlamatLokasi(String alamatLokasi) {
        this.alamatLokasi = alamatLokasi;
    }

    public Double getLatitude() {
        return latitude;
    }

    public void setLatitude(Double latitude) {
        this.latitude = latitude;
    }

    public Double getLongitude() {
        return longitude;
    }

    public void setLongitude(Double longitude) {
        this.longitude = longitude;
    }

    public String getTanggalAktif() {
        return tanggalAktif;
    }

    public void setTanggalAktif(String tanggalAktif) {
        this.tanggalAktif = tanggalAktif;
    }

    public String getTanggalBerakhir() {
        return tanggalBerakhir;
    }

    public void setTanggalBerakhir(String tanggalBerakhir) {
        this.tanggalBerakhir = tanggalBerakhir;
    }

    public List<DetailLaporanDTO> getDetailLaporan() {
        return detailLaporan;
    }

    public void setDetailLaporan(List<DetailLaporanDTO> detailLaporan) {
        this.detailLaporan = detailLaporan;
    }
}
