package com.shadcn.backend.controller;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/upload")
@CrossOrigin(origins = {"http://localhost:3000", "http://localhost:3001"})
@Slf4j
public class FileUploadController {

    @Value("${app.upload.dir:uploads}")
    private String uploadDir;

    @Value("${app.upload.max-file-size:5MB}")
    private String maxFileSize;

    @PostMapping("/photo")
    @PreAuthorize("hasAuthority('file-pegawai.create')")
    public ResponseEntity<Map<String, Object>> uploadPhoto(@RequestParam("file") MultipartFile file) {
        try {
            // Validate file
            if (file.isEmpty()) {
                return ResponseEntity.badRequest().body(createErrorResponse("File is empty"));
            }

            // Validate file type
            String contentType = file.getContentType();
            if (contentType == null || !isValidImageType(contentType)) {
                return ResponseEntity.badRequest().body(createErrorResponse("Invalid file type. Only JPG, PNG, and GIF are allowed"));
            }

            // Validate file size (5MB limit)
            if (file.getSize() > 5 * 1024 * 1024) {
                return ResponseEntity.badRequest().body(createErrorResponse("File size exceeds 5MB limit"));
            }

            // Create upload directory if it doesn't exist
            Path uploadPath = Paths.get(uploadDir, "photos");
            if (!Files.exists(uploadPath)) {
                Files.createDirectories(uploadPath);
            }

            // Generate unique filename
            String originalFilename = file.getOriginalFilename();
            String fileExtension = getFileExtension(originalFilename);
            String filename = UUID.randomUUID().toString() + fileExtension;
            Path filePath = uploadPath.resolve(filename);

            // Save file
            Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);

            // Create response
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "File uploaded successfully");
            response.put("filename", filename);
            response.put("url", "/api/upload/photos/" + filename);
            response.put("size", file.getSize());
            response.put("contentType", contentType);

            log.info("Photo uploaded successfully: {}", filename);
            return ResponseEntity.ok(response);

        } catch (IOException e) {
            log.error("Error uploading photo: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(createErrorResponse("Error uploading file: " + e.getMessage()));
        }
    }

    @GetMapping("/photos/{filename}")
    @PreAuthorize("hasAuthority('file-pegawai.read')")
    public ResponseEntity<byte[]> getPhoto(@PathVariable String filename) {
        try {
            Path filePath = Paths.get(uploadDir, "photos", filename);
            if (!Files.exists(filePath)) {
                return ResponseEntity.notFound().build();
            }

            byte[] fileContent = Files.readAllBytes(filePath);
            String contentType = Files.probeContentType(filePath);
            
            return ResponseEntity.ok()
                    .header("Content-Type", contentType != null ? contentType : "application/octet-stream")
                    .body(fileContent);

        } catch (IOException e) {
            log.error("Error retrieving photo: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @DeleteMapping("/photos/{filename}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, Object>> deletePhoto(@PathVariable String filename) {
        try {
            Path filePath = Paths.get(uploadDir, "photos", filename);
            if (!Files.exists(filePath)) {
                return ResponseEntity.notFound().build();
            }

            Files.delete(filePath);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Photo deleted successfully");
            
            log.info("Photo deleted successfully: {}", filename);
            return ResponseEntity.ok(response);

        } catch (IOException e) {
            log.error("Error deleting photo: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(createErrorResponse("Error deleting file: " + e.getMessage()));
        }
    }

    private boolean isValidImageType(String contentType) {
        return contentType.equals("image/jpeg") || 
               contentType.equals("image/jpg") || 
               contentType.equals("image/png") || 
               contentType.equals("image/gif");
    }

    private String getFileExtension(String filename) {
        if (filename == null || filename.lastIndexOf('.') == -1) {
            return "";
        }
        return filename.substring(filename.lastIndexOf('.'));
    }

    private Map<String, Object> createErrorResponse(String message) {
        Map<String, Object> response = new HashMap<>();
        response.put("success", false);
        response.put("message", message);
        return response;
    }
}
