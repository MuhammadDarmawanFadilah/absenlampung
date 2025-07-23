package com.shadcn.backend.service;

import com.shadcn.backend.dto.FilePegawaiRequest;
import com.shadcn.backend.dto.FilePegawaiResponse;
import com.shadcn.backend.dto.FilePegawaiBatchRequest;
import com.shadcn.backend.dto.FilePegawaiGroupResponse;
import com.shadcn.backend.exception.ResourceNotFoundException;
import com.shadcn.backend.exception.ValidationException;
import com.shadcn.backend.model.FilePegawai;
import com.shadcn.backend.model.Pegawai;
import com.shadcn.backend.model.FileKategori;
import com.shadcn.backend.repository.FilePegawaiRepository;
import com.shadcn.backend.repository.PegawaiRepository;
import com.shadcn.backend.repository.FileKategoriRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.domain.PageImpl;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;
import java.util.Map;
import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
@Slf4j
public class FilePegawaiService {
    
    private final FilePegawaiRepository repository;
    private final PegawaiRepository pegawaiRepository;
    private final FileKategoriRepository kategoriRepository;
    
    @Transactional(readOnly = true)
    public Page<FilePegawaiGroupResponse> findAllGrouped(String search, Long pegawaiId, Long kategoriId, Boolean isActive, 
                                                       int page, int size, String sortBy, String sortDir) {
        log.info("Finding all file pegawai grouped with search: {}, pegawaiId: {}, kategoriId: {}, isActive: {}, page: {}, size: {}, sortBy: {}, sortDir: {}", 
                search, pegawaiId, kategoriId, isActive, page, size, sortBy, sortDir);
        
        // Create sort direction
        Sort.Direction direction = "desc".equalsIgnoreCase(sortDir) ? Sort.Direction.DESC : Sort.Direction.ASC;
        Sort sort = Sort.by(direction, sortBy);
        
        Pageable pageable = PageRequest.of(page, size, sort);
        Page<FilePegawai> entities = repository.findWithFilters(search, pegawaiId, kategoriId, isActive, pageable);
        
        // Group files by pegawai and kategori
        Map<String, List<FilePegawai>> groupedFiles = entities.getContent()
                .stream()
                .collect(Collectors.groupingBy(file -> 
                    file.getPegawai().getId() + "_" + file.getKategori().getId()));
        
        List<FilePegawaiGroupResponse> groupedResponses = groupedFiles.entrySet().stream()
                .map(entry -> {
                    List<FilePegawai> files = entry.getValue();
                    FilePegawai firstFile = files.get(0);
                    
                    List<FilePegawaiGroupResponse.FilePegawaiFileInfo> fileInfos = files.stream()
                            .map(file -> new FilePegawaiGroupResponse.FilePegawaiFileInfo(
                                    file.getId(),
                                    file.getJudul(),
                                    file.getDeskripsi(),
                                    file.getFileName(),
                                    file.getFileType(),
                                    file.getFileSize(),
                                    file.getIsActive(),
                                    file.getCreatedAt(),
                                    file.getUpdatedAt()
                            ))
                            .collect(Collectors.toList());
                    
                    return new FilePegawaiGroupResponse(
                            firstFile.getId(), // Use first file's ID as group ID
                            firstFile.getPegawai().getId(),
                            firstFile.getPegawai().getNamaLengkap(),
                            firstFile.getKategori().getId(),
                            firstFile.getKategori().getNama(),
                            firstFile.getIsActive(),
                            files.stream().map(FilePegawai::getCreatedAt).min(LocalDateTime::compareTo).orElse(firstFile.getCreatedAt()),
                            files.stream().map(FilePegawai::getUpdatedAt).max(LocalDateTime::compareTo).orElse(firstFile.getUpdatedAt()),
                            fileInfos
                    );
                })
                .collect(Collectors.toList());
        
        return new PageImpl<>(groupedResponses, pageable, entities.getTotalElements());
    }
    
    @Transactional
    public FilePegawaiGroupResponse createBatchAsGroup(FilePegawaiBatchRequest request) {
        log.info("Creating batch file pegawai as group with {} files for pegawaiId: {}, kategoriId: {}", 
                request.getFiles().size(), request.getPegawaiId(), request.getKategoriId());
        
        // Validate pegawai exists
        Pegawai pegawai = pegawaiRepository.findById(request.getPegawaiId())
                .orElseThrow(() -> new ResourceNotFoundException("Pegawai dengan ID " + request.getPegawaiId() + " tidak ditemukan"));
        
        // Validate kategori exists
        FileKategori kategori = kategoriRepository.findById(request.getKategoriId())
                .orElseThrow(() -> new ResourceNotFoundException("Kategori file dengan ID " + request.getKategoriId() + " tidak ditemukan"));
        
        try {
            List<FilePegawaiGroupResponse.FilePegawaiFileInfo> fileInfos = new java.util.ArrayList<>();
            FilePegawai firstSavedFile = null;
            
            for (FilePegawaiBatchRequest.FilePegawaiFileRequest fileRequest : request.getFiles()) {
                // Validate each file
                if (fileRequest.getJudul() == null || fileRequest.getJudul().trim().isEmpty()) {
                    throw new ValidationException("Judul file tidak boleh kosong");
                }
                
                if (fileRequest.getFileName() == null || fileRequest.getFileName().trim().isEmpty()) {
                    throw new ValidationException("Nama file tidak boleh kosong");
                }
                
                // Create entity
                FilePegawai entity = new FilePegawai();
                entity.setJudul(fileRequest.getJudul().trim());
                entity.setDeskripsi(fileRequest.getDeskripsi() != null ? fileRequest.getDeskripsi().trim() : null);
                entity.setFileName(fileRequest.getFileName().trim());
                entity.setFileType(fileRequest.getFileType());
                entity.setFileSize(fileRequest.getFileSize());
                entity.setPegawai(pegawai);
                entity.setKategori(kategori);
                entity.setIsActive(fileRequest.getIsActive());
                
                FilePegawai saved = repository.save(entity);
                if (firstSavedFile == null) {
                    firstSavedFile = saved;
                }
                
                log.info("Successfully created file pegawai with id: {} and fileName: {}", saved.getId(), saved.getFileName());
                
                fileInfos.add(new FilePegawaiGroupResponse.FilePegawaiFileInfo(
                        saved.getId(),
                        saved.getJudul(),
                        saved.getDeskripsi(),
                        saved.getFileName(),
                        saved.getFileType(),
                        saved.getFileSize(),
                        saved.getIsActive(),
                        saved.getCreatedAt(),
                        saved.getUpdatedAt()
                ));
            }
            
            log.info("Successfully created {} file pegawai records as group", fileInfos.size());
            
            // Ensure firstSavedFile is not null before using it
            if (firstSavedFile == null) {
                throw new RuntimeException("Tidak ada file yang berhasil disimpan");
            }
            
            return new FilePegawaiGroupResponse(
                    firstSavedFile.getId(),
                    pegawai.getId(),
                    pegawai.getNamaLengkap(),
                    kategori.getId(),
                    kategori.getNama(),
                    firstSavedFile.getIsActive(),
                    firstSavedFile.getCreatedAt(),
                    firstSavedFile.getUpdatedAt(),
                    fileInfos
            );
        } catch (Exception e) {
            log.error("Error saving batch file pegawai: {}", e.getMessage(), e);
            throw new RuntimeException("Gagal menyimpan file pegawai: " + e.getMessage(), e);
        }
    }

    // Overloaded method for backward compatibility
    @Transactional(readOnly = true)
    public Page<FilePegawaiResponse> findAll(String search, Long pegawaiId, Long kategoriId, Boolean isActive, int page, int size) {
        // Create sort direction
        Sort.Direction direction = Sort.Direction.DESC;
        Sort sort = Sort.by(direction, "createdAt");
        
        Pageable pageable = PageRequest.of(page, size, sort);
        Page<FilePegawai> entities = repository.findWithFilters(search, pegawaiId, kategoriId, isActive, pageable);
        
        return entities.map(this::toResponse);
    }
    
    @Transactional(readOnly = true)
    public List<FilePegawaiResponse> findByPegawai(Long pegawaiId) {
        log.info("Finding files by pegawai id: {}", pegawaiId);
        Pegawai pegawai = pegawaiRepository.findById(pegawaiId)
                .orElseThrow(() -> new ResourceNotFoundException("Pegawai dengan ID " + pegawaiId + " tidak ditemukan"));
        
        List<FilePegawai> entities = repository.findByPegawaiAndIsActiveTrueOrderByCreatedAtDesc(pegawai);
        return entities.stream().map(this::toResponse).collect(Collectors.toList());
    }
    
    @Transactional(readOnly = true)
    public List<FilePegawaiResponse> findByKategori(Long kategoriId) {
        log.info("Finding files by kategori id: {}", kategoriId);
        FileKategori kategori = kategoriRepository.findById(kategoriId)
                .orElseThrow(() -> new ResourceNotFoundException("Kategori file dengan ID " + kategoriId + " tidak ditemukan"));
        
        List<FilePegawai> entities = repository.findByKategoriAndIsActiveTrueOrderByCreatedAtDesc(kategori);
        return entities.stream().map(this::toResponse).collect(Collectors.toList());
    }
    
    @Transactional(readOnly = true)
    public FilePegawaiResponse findById(Long id) {
        log.info("Finding file pegawai by id: {}", id);
        FilePegawai entity = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Data file pegawai dengan ID " + id + " tidak ditemukan"));
        return toResponse(entity);
    }
    
    @Transactional
    public FilePegawaiResponse create(FilePegawaiRequest request) {
        log.info("Creating file pegawai: {}", request);
        
        // Validate input
        if (request.getJudul() == null || request.getJudul().trim().isEmpty()) {
            throw new ValidationException("Judul file tidak boleh kosong");
        }
        
        if (request.getFileName() == null || request.getFileName().trim().isEmpty()) {
            throw new ValidationException("Nama file tidak boleh kosong");
        }
        
        // Validate pegawai exists
        Pegawai pegawai = pegawaiRepository.findById(request.getPegawaiId())
                .orElseThrow(() -> new ResourceNotFoundException("Pegawai dengan ID " + request.getPegawaiId() + " tidak ditemukan"));
        
        // Validate kategori exists
        FileKategori kategori = kategoriRepository.findById(request.getKategoriId())
                .orElseThrow(() -> new ResourceNotFoundException("Kategori file dengan ID " + request.getKategoriId() + " tidak ditemukan"));
        
        // Create entity
        FilePegawai entity = toEntity(request, pegawai, kategori);
        
        try {
            FilePegawai saved = repository.save(entity);
            log.info("Successfully created file pegawai with id: {} and fileName: {}", saved.getId(), saved.getFileName());
            return toResponse(saved);
        } catch (Exception e) {
            log.error("Error saving file pegawai: {}", e.getMessage(), e);
            throw new RuntimeException("Gagal menyimpan file pegawai: " + e.getMessage(), e);
        }
    }
    
    @Transactional
    public List<FilePegawaiResponse> createBatch(FilePegawaiBatchRequest request) {
        log.info("Creating batch file pegawai with {} files for pegawaiId: {}, kategoriId: {}", 
                request.getFiles().size(), request.getPegawaiId(), request.getKategoriId());
        
        // Validate pegawai exists
        Pegawai pegawai = pegawaiRepository.findById(request.getPegawaiId())
                .orElseThrow(() -> new ResourceNotFoundException("Pegawai dengan ID " + request.getPegawaiId() + " tidak ditemukan"));
        
        // Validate kategori exists
        FileKategori kategori = kategoriRepository.findById(request.getKategoriId())
                .orElseThrow(() -> new ResourceNotFoundException("Kategori file dengan ID " + request.getKategoriId() + " tidak ditemukan"));
        
        try {
            List<FilePegawaiResponse> results = new java.util.ArrayList<>();
            
            for (FilePegawaiBatchRequest.FilePegawaiFileRequest fileRequest : request.getFiles()) {
                // Validate each file
                if (fileRequest.getJudul() == null || fileRequest.getJudul().trim().isEmpty()) {
                    throw new ValidationException("Judul file tidak boleh kosong");
                }
                
                if (fileRequest.getFileName() == null || fileRequest.getFileName().trim().isEmpty()) {
                    throw new ValidationException("Nama file tidak boleh kosong");
                }
                
                // Create entity
                FilePegawai entity = new FilePegawai();
                entity.setJudul(fileRequest.getJudul().trim());
                entity.setDeskripsi(fileRequest.getDeskripsi() != null ? fileRequest.getDeskripsi().trim() : null);
                entity.setFileName(fileRequest.getFileName().trim());
                entity.setFileType(fileRequest.getFileType());
                entity.setFileSize(fileRequest.getFileSize());
                entity.setPegawai(pegawai);
                entity.setKategori(kategori);
                entity.setIsActive(fileRequest.getIsActive());
                
                FilePegawai saved = repository.save(entity);
                log.info("Successfully created file pegawai with id: {} and fileName: {}", saved.getId(), saved.getFileName());
                results.add(toResponse(saved));
            }
            
            log.info("Successfully created {} file pegawai records", results.size());
            return results;
        } catch (Exception e) {
            log.error("Error saving batch file pegawai: {}", e.getMessage(), e);
            throw new RuntimeException("Gagal menyimpan file pegawai: " + e.getMessage(), e);
        }
    }
    
    @Transactional
    public FilePegawaiResponse update(Long id, FilePegawaiRequest request) {
        log.info("Updating file pegawai id: {} with data: {}", id, request);
        
        FilePegawai entity = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Data file pegawai dengan ID " + id + " tidak ditemukan"));
        
        // Validate input
        if (request.getJudul() == null || request.getJudul().trim().isEmpty()) {
            throw new ValidationException("Judul file tidak boleh kosong");
        }
        
        if (request.getFileName() == null || request.getFileName().trim().isEmpty()) {
            throw new ValidationException("Nama file tidak boleh kosong");
        }
        
        // Validate pegawai exists
        Pegawai pegawai = pegawaiRepository.findById(request.getPegawaiId())
                .orElseThrow(() -> new ResourceNotFoundException("Pegawai dengan ID " + request.getPegawaiId() + " tidak ditemukan"));
        
        // Validate kategori exists
        FileKategori kategori = kategoriRepository.findById(request.getKategoriId())
                .orElseThrow(() -> new ResourceNotFoundException("Kategori file dengan ID " + request.getKategoriId() + " tidak ditemukan"));
        
        // Update fields
        entity.setJudul(request.getJudul().trim());
        entity.setDeskripsi(request.getDeskripsi() != null ? request.getDeskripsi().trim() : null);
        entity.setFileName(request.getFileName().trim());
        entity.setFileType(request.getFileType());
        entity.setFileSize(request.getFileSize());
        entity.setPegawai(pegawai);
        entity.setKategori(kategori);
        entity.setIsActive(request.getIsActive());
        
        FilePegawai updated = repository.save(entity);
        
        log.info("Updated file pegawai with id: {}", updated.getId());
        return toResponse(updated);
    }
    
    @Transactional
    public void delete(Long id) {
        log.info("Deleting file pegawai id: {}", id);
        
        FilePegawai entity = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Data file pegawai dengan ID " + id + " tidak ditemukan"));
        
        repository.delete(entity);
        log.info("Deleted file pegawai with id: {}", id);
    }
    
    @Transactional
    public FilePegawaiResponse toggleActive(Long id) {
        log.info("Toggling active status for file pegawai id: {}", id);
        
        FilePegawai entity = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Data file pegawai dengan ID " + id + " tidak ditemukan"));
        
        entity.setIsActive(!entity.getIsActive());
        FilePegawai updated = repository.save(entity);
        
        log.info("Toggled active status for file pegawai id: {} to: {}", id, updated.getIsActive());
        return toResponse(updated);
    }
    
    // Helper methods
    private FilePegawaiResponse toResponse(FilePegawai entity) {
        return new FilePegawaiResponse(
                entity.getId(),
                entity.getJudul(),
                entity.getDeskripsi(),
                entity.getFileName(),
                entity.getFileType(),
                entity.getFileSize(),
                entity.getPegawai().getId(),
                entity.getPegawai().getNamaLengkap(),
                entity.getKategori().getId(),
                entity.getKategori().getNama(),
                entity.getIsActive(),
                entity.getCreatedAt(),
                entity.getUpdatedAt()
        );
    }
    
    private FilePegawai toEntity(FilePegawaiRequest request, Pegawai pegawai, FileKategori kategori) {
        FilePegawai entity = new FilePegawai();
        entity.setJudul(request.getJudul().trim());
        entity.setDeskripsi(request.getDeskripsi() != null ? request.getDeskripsi().trim() : null);
        entity.setFileName(request.getFileName().trim());
        entity.setFileType(request.getFileType());
        entity.setFileSize(request.getFileSize());
        entity.setPegawai(pegawai);
        entity.setKategori(kategori);
        entity.setIsActive(request.getIsActive());
        return entity;
    }
}
