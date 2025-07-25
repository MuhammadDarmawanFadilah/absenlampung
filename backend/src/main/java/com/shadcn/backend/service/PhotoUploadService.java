package com.shadcn.backend.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Base64;
import java.util.UUID;

@Slf4j
@Service
public class PhotoUploadService {

    @Value("${app.upload.dir:uploads}")
    private String uploadDir;

    public String savePhotoFromBase64(String base64Data, String filename, String subDirectory) {
        try {
            // Remove data:image/jpeg;base64, prefix if present
            String base64Image = base64Data;
            if (base64Data.contains(",")) {
                base64Image = base64Data.split(",")[1];
            }
            
            // Decode base64 to bytes
            byte[] imageBytes = Base64.getDecoder().decode(base64Image);
            
            return saveFileFromBytes(imageBytes, filename, subDirectory);
            
        } catch (Exception e) {
            log.error("Failed to save photo from base64: {}", filename, e);
            throw new RuntimeException("Failed to save photo: " + e.getMessage());
        }
    }
    
    public String saveFileFromBytes(byte[] fileBytes, String filename, String subDirectory) {
        try {
            // Create upload directory if not exists
            Path uploadPath = createUploadDirectory(subDirectory);
            
            // Generate unique filename
            String fileExtension = getFileExtension(filename);
            String uniqueFilename = generateUniqueFilename(fileExtension);
            
            // Save file
            Path targetPath = uploadPath.resolve(uniqueFilename);
            Files.write(targetPath, fileBytes);
            
            log.info("File saved successfully: {}", targetPath.toString());
            
            // Return relative path for storage in database
            return Paths.get(subDirectory, uniqueFilename).toString().replace("\\", "/");
            
        } catch (IOException e) {
            log.error("Failed to save file from bytes: {}", filename, e);
            throw new RuntimeException("Failed to save file: " + e.getMessage());
        }
    }
    
    private Path createUploadDirectory(String subDirectory) throws IOException {
        Path uploadPath = Paths.get(uploadDir, subDirectory);
        
        if (!Files.exists(uploadPath)) {
            Files.createDirectories(uploadPath);
            log.info("Created upload directory: {}", uploadPath.toString());
        }
        
        return uploadPath;
    }
    
    private String generateUniqueFilename(String fileExtension) {
        String timestamp = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd_HHmmss"));
        String uuid = UUID.randomUUID().toString().substring(0, 8);
        return timestamp + "_" + uuid + fileExtension;
    }
    
    private String getFileExtension(String filename) {
        if (filename == null || !filename.contains(".")) {
            return ".jpg"; // Default extension for photos
        }
        return filename.substring(filename.lastIndexOf("."));
    }
}
