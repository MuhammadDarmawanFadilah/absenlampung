package com.shadcn.backend.service;

import com.shadcn.backend.dto.DetailLaporanRequest;
import com.shadcn.backend.dto.DetailLaporanResponse;
import com.shadcn.backend.dto.PaginatedResponse;
import com.shadcn.backend.model.*;
import com.shadcn.backend.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Service
public class SubmissionLaporanService {

    @Autowired
    private SubmissionLaporanRepository submissionLaporanRepository;
    
    @Autowired
    private SubmissionLampiranRepository submissionLampiranRepository;
    
    @Autowired
    private UserRepository userRepository;
    
    @Autowired
    private TahapanLaporanRepository tahapanLaporanRepository;
    
    @Autowired
    private JenisLaporanRepository jenisLaporanRepository;
    
    @Autowired
    private LaporanRepository laporanRepository;
    
    @Autowired
    private PemilihanRepository pemilihanRepository;
    
    @Value("${app.upload.dir:uploads}")
    private String uploadsDirectory;
    
    @Value("${app.upload.temp-dir:/storage/temp}")
    private String tempDirectory;
    
    @Value("${app.upload.document-dir:/storage/documents}")
    private String documentsDirectory;

    @Transactional
    public DetailLaporanResponse createSubmission(DetailLaporanRequest request) {
        try {
            // Validate required entities
            User user = userRepository.findById(request.getUserId().longValue())
                .orElseThrow(() -> new RuntimeException("User tidak ditemukan"));
            
            TahapanLaporan tahapan = tahapanLaporanRepository.findById(request.getTahapanLaporanId().longValue())
                .orElseThrow(() -> new RuntimeException("Tahapan laporan tidak ditemukan"));
            
            JenisLaporan jenis = jenisLaporanRepository.findById(request.getJenisLaporanId().longValue())
                .orElseThrow(() -> new RuntimeException("Jenis laporan tidak ditemukan"));
            
            Laporan laporan = laporanRepository.findById(request.getLaporanId().longValue())
                .orElseThrow(() -> new RuntimeException("Laporan tidak ditemukan"));
            
            Pemilihan pemilihan = pemilihanRepository.findById(request.getPemilihanId().longValue())
                .orElseThrow(() -> new RuntimeException("Pemilihan tidak ditemukan"));

            // Create submission
            SubmissionLaporan submission = new SubmissionLaporan();
            submission.setJudul(request.getJudul());
            submission.setKonten(request.getKonten());
            submission.setLokasi(request.getLokasi());
            submission.setTanggalLaporan(request.getTanggalLaporan());
            submission.setUser(user);
            submission.setTahapanLaporan(tahapan);
            submission.setJenisLaporan(jenis);
            submission.setLaporan(laporan);
            submission.setPemilihan(pemilihan);
            submission.setStatus(SubmissionLaporan.StatusLaporan.SUBMITTED);

            submission = submissionLaporanRepository.save(submission);

            // Process temp files
            List<String> permanentFiles = new ArrayList<>();
            if (request.getTempFiles() != null && !request.getTempFiles().isEmpty()) {
                permanentFiles = moveTempFilesToPermanent(request.getTempFiles(), submission);
            }

            // Create response
            DetailLaporanResponse response = new DetailLaporanResponse();
            response.setId(submission.getId().intValue());
            response.setJudul(submission.getJudul());
            response.setKonten(submission.getKonten());
            response.setLokasi(submission.getLokasi());
            response.setTanggalLaporan(submission.getTanggalLaporan());
            response.setStatus(submission.getStatus().toString());
            response.setFiles(permanentFiles);
            response.setTanggalBuat(submission.getTanggalBuat());
            response.setTahapanLaporanId(submission.getTahapanLaporan().getTahapanLaporanId().intValue());
            response.setJenisLaporanId(submission.getJenisLaporan().getJenisLaporanId().intValue());
            response.setLaporanId(submission.getLaporan().getLaporanId().intValue());
            response.setPemilihanId(submission.getPemilihan().getPemilihanId().intValue());
            response.setUserId(submission.getUser().getId().intValue());
            response.setUserName(submission.getUser().getFullName());
            
            // Set related entity names
            response.setPemilihanJudul(submission.getPemilihan().getNamaPemilihan());
            response.setLaporanNama(submission.getLaporan().getNamaLaporan());
            response.setJenisLaporanNama(submission.getJenisLaporan().getNama());
            response.setTahapanLaporanNama(submission.getTahapanLaporan().getNama());

            return response;

        } catch (Exception e) {
            throw new RuntimeException("Gagal membuat submission: " + e.getMessage(), e);
        }
    }

    private List<String> moveTempFilesToPermanent(List<String> tempFiles, SubmissionLaporan submission) {
        List<String> permanentFiles = new ArrayList<>();
        
        for (String tempFileName : tempFiles) {
            try {
                Path tempPath = Paths.get(tempDirectory, tempFileName);
                // Store in uploads/documents directory for consistency with FileController
                Path permanentPath = Paths.get(uploadsDirectory, "documents", tempFileName);
                
                if (Files.exists(tempPath)) {
                    // Create documents directory if it doesn't exist
                    Files.createDirectories(permanentPath.getParent());
                    
                    // Move file from temp to permanent
                    Files.move(tempPath, permanentPath, StandardCopyOption.REPLACE_EXISTING);
                    
                    // Create lampiran record
                    SubmissionLampiran lampiran = new SubmissionLampiran();
                    lampiran.setNamaFile(tempFileName);
                    lampiran.setPathFile(permanentPath.toString());
                    lampiran.setTipeFile(getFileExtension(tempFileName));
                    lampiran.setUkuranFile(Files.size(permanentPath));
                    lampiran.setSubmissionLaporan(submission);
                    
                    submissionLampiranRepository.save(lampiran);
                    permanentFiles.add(tempFileName);
                    
                    System.out.println("Successfully moved file: " + tempFileName + " to " + permanentPath);
                }
            } catch (IOException e) {
                System.err.println("Error moving file " + tempFileName + ": " + e.getMessage());
                e.printStackTrace();
            }
        }
        
        return permanentFiles;
    }

    private String getFileExtension(String fileName) {
        int lastDotIndex = fileName.lastIndexOf('.');
        if (lastDotIndex > 0 && lastDotIndex < fileName.length() - 1) {
            return fileName.substring(lastDotIndex + 1).toLowerCase();
        }
        return "";
    }

    public PaginatedResponse<DetailLaporanResponse> getSubmissionsByUserPaginated(
            Long userId, 
            int page, 
            int size, 
            String search,
            Integer pemilihanId, 
            Integer laporanId, 
            Integer jenisLaporanId, 
            Integer tahapanLaporanId,
            Long pegawaiId) {
        
        // If userId is provided, use it. If pegawaiId is provided and user is admin, use pegawaiId
        Long targetUserId = (pegawaiId != null) ? pegawaiId : userId;
        
        Pageable pageable = PageRequest.of(page, size, Sort.by("tanggalBuat").descending());
        Page<SubmissionLaporan> submissionPage = submissionLaporanRepository.findByUserIdOrderByTanggalBuatDesc(targetUserId, pageable);
        
        List<DetailLaporanResponse> filteredSubmissions = submissionPage.getContent().stream()
            .filter(submission -> {
                if (search != null && !search.trim().isEmpty()) {
                    String searchLower = search.toLowerCase();
                    return submission.getJudul().toLowerCase().contains(searchLower) ||
                           submission.getKonten().toLowerCase().contains(searchLower) ||
                           submission.getLokasi().toLowerCase().contains(searchLower);
                }
                return true;
            })
            .filter(submission -> pemilihanId == null || 
                   submission.getPemilihan().getPemilihanId().equals(pemilihanId.longValue()))
            .filter(submission -> laporanId == null || 
                   submission.getLaporan().getLaporanId().equals(laporanId.longValue()))
            .filter(submission -> jenisLaporanId == null || 
                   submission.getJenisLaporan().getJenisLaporanId().equals(jenisLaporanId.longValue()))
            .filter(submission -> tahapanLaporanId == null || 
                   submission.getTahapanLaporan().getTahapanLaporanId().equals(tahapanLaporanId.longValue()))
            .map(this::convertToResponse)
            .toList();
        
        PaginatedResponse.PageInfo pageInfo = new PaginatedResponse.PageInfo();
        pageInfo.setPage(page);
        pageInfo.setSize(size);
        pageInfo.setTotalPages(submissionPage.getTotalPages());
        pageInfo.setTotalElements(submissionPage.getTotalElements());
        
        PaginatedResponse<DetailLaporanResponse> response = new PaginatedResponse<>();
        response.setContent(filteredSubmissions);
        response.setPage(pageInfo);
        
        return response;
    }

    public List<DetailLaporanResponse> getSubmissionsByUser(Long userId) {
        List<SubmissionLaporan> submissions = submissionLaporanRepository.findByUserIdOrderByTanggalBuatDesc(userId);
        return submissions.stream().map(this::convertToResponse).toList();
    }

    public List<DetailLaporanResponse> getSubmissionsByUser(Long userId, Integer pemilihanId, Integer laporanId, Integer jenisLaporanId, Integer tahapanLaporanId) {
        List<SubmissionLaporan> submissions = submissionLaporanRepository.findByUserIdOrderByTanggalBuatDesc(userId);
        
        // Apply filters
        if (pemilihanId != null) {
            submissions = submissions.stream()
                .filter(s -> s.getPemilihan().getPemilihanId().equals(pemilihanId.longValue()))
                .toList();
        }
        
        if (laporanId != null) {
            submissions = submissions.stream()
                .filter(s -> s.getLaporan().getLaporanId().equals(laporanId.longValue()))
                .toList();
        }
        
        if (jenisLaporanId != null) {
            submissions = submissions.stream()
                .filter(s -> s.getJenisLaporan().getJenisLaporanId().equals(jenisLaporanId.longValue()))
                .toList();
        }
        
        if (tahapanLaporanId != null) {
            submissions = submissions.stream()
                .filter(s -> s.getTahapanLaporan().getTahapanLaporanId().equals(tahapanLaporanId.longValue()))
                .toList();
        }
        
        return submissions.stream().map(this::convertToResponse).toList();
    }

    public List<DetailLaporanResponse> getSubmissionsByUserAndStatus(Long userId, SubmissionLaporan.StatusLaporan status) {
        List<SubmissionLaporan> submissions = submissionLaporanRepository.findByUserIdAndStatusOrderByTanggalBuatDesc(userId, status);
        return submissions.stream().map(this::convertToResponse).toList();
    }

    public Optional<DetailLaporanResponse> getSubmissionById(Long id, Long userId) {
        Optional<SubmissionLaporan> submission = submissionLaporanRepository.findById(id);
        if (submission.isPresent() && submission.get().getUser().getId().equals(userId)) {
            return Optional.of(convertToResponse(submission.get()));
        }
        return Optional.empty();
    }

    @Transactional
    public void deleteSubmission(Long id, Long userId) {
        Optional<SubmissionLaporan> submission = submissionLaporanRepository.findById(id);
        if (submission.isPresent() && submission.get().getUser().getId().equals(userId)) {
            submissionLaporanRepository.delete(submission.get());
        } else {
            throw new RuntimeException("Submission tidak ditemukan atau tidak memiliki akses");
        }
    }

    private DetailLaporanResponse convertToResponse(SubmissionLaporan submission) {
        DetailLaporanResponse response = new DetailLaporanResponse();
        response.setId(submission.getId().intValue());
        response.setJudul(submission.getJudul());
        response.setKonten(submission.getKonten());
        response.setLokasi(submission.getLokasi());
        response.setTanggalLaporan(submission.getTanggalLaporan());
        response.setStatus(submission.getStatus().toString());
        response.setTanggalBuat(submission.getTanggalBuat());
        response.setTahapanLaporanId(submission.getTahapanLaporan().getTahapanLaporanId().intValue());
        response.setJenisLaporanId(submission.getJenisLaporan().getJenisLaporanId().intValue());
        response.setLaporanId(submission.getLaporan().getLaporanId().intValue());
        response.setPemilihanId(submission.getPemilihan().getPemilihanId().intValue());
        response.setUserId(submission.getUser().getId().intValue());
        response.setUserName(submission.getUser().getFullName());

        // Set related entity names
        response.setPemilihanJudul(submission.getPemilihan().getNamaPemilihan());
        response.setLaporanNama(submission.getLaporan().getNamaLaporan());
        response.setJenisLaporanNama(submission.getJenisLaporan().getNama());
        response.setTahapanLaporanNama(submission.getTahapanLaporan().getNama());

        // Get files
        List<SubmissionLampiran> lampiranList = submissionLampiranRepository.findBySubmissionLaporanIdOrderByTanggalUploadDesc(submission.getId());
        List<String> files = lampiranList.stream().map(SubmissionLampiran::getNamaFile).toList();
        response.setFiles(files);

        return response;
    }
}
