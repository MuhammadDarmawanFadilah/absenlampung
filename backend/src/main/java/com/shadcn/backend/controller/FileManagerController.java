package com.shadcn.backend.controller;

import com.shadcn.backend.service.FileService;
import com.shadcn.backend.service.AuthService;
import com.shadcn.backend.model.User;
import com.shadcn.backend.dto.FileInfoDTO;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/files")
@CrossOrigin(originPatterns = {"http://localhost:3000", "http://localhost:3001", "http://localhost:3002", "http://127.0.0.1:3000"}, allowCredentials = "true")
public class FileManagerController {

    @Autowired
    private FileService fileService;

    @Autowired
    private AuthService authService;

    @GetMapping("/my-files")
    @PreAuthorize("hasRole('PEGAWAI') or hasRole('ADMIN') or hasRole('MODERATOR')")
    public ResponseEntity<List<FileInfoDTO>> getMyFiles(@RequestHeader(value = "Authorization", required = false) String authHeader) {
        try {
            // Validate token and get user
            if (authHeader == null || !authHeader.startsWith("Bearer ")) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
            }
            
            String actualToken = authHeader.substring(7); // Remove "Bearer " prefix
            User user = authService.getUserFromToken(actualToken);
            
            if (user == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
            }
            
            String username = user.getUsername();
            List<FileInfoDTO> files = fileService.getUserFiles(username);
            return ResponseEntity.ok(files);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    @GetMapping("/all")
    @PreAuthorize("hasRole('ADMIN') or hasRole('MODERATOR')")
    public ResponseEntity<List<FileInfoDTO>> getAllFiles() {
        try {
            List<FileInfoDTO> files = fileService.getAllFiles();
            return ResponseEntity.ok(files);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    @GetMapping("/download/{filename}")
    @PreAuthorize("hasRole('PEGAWAI') or hasRole('ADMIN') or hasRole('MODERATOR')")
    public ResponseEntity<Resource> downloadFile(
            @PathVariable String filename,
            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        try {
            // Validate token and get user
            if (authHeader == null || !authHeader.startsWith("Bearer ")) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
            }
            
            String actualToken = authHeader.substring(7); // Remove "Bearer " prefix
            User user = authService.getUserFromToken(actualToken);
            
            if (user == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
            }
            
            String username = user.getUsername();
            Resource resource = fileService.downloadFile(filename, username);
            
            return ResponseEntity.ok()
                    .contentType(MediaType.APPLICATION_OCTET_STREAM)
                    .header(HttpHeaders.CONTENT_DISPOSITION, 
                            "attachment; filename=\"" + resource.getFilename() + "\"")
                    .body(resource);
        } catch (Exception e) {
            return ResponseEntity.notFound().build();
        }
    }

    @DeleteMapping("/{fileId}")
    @PreAuthorize("hasRole('PEGAWAI') or hasRole('ADMIN') or hasRole('MODERATOR')")
    public ResponseEntity<Void> deleteFile(
            @PathVariable String fileId,
            Authentication authentication) {
        try {
            String username = authentication.getName();
            boolean deleted = fileService.deleteFile(fileId, username);
            
            if (deleted) {
                return ResponseEntity.ok().build();
            } else {
                return ResponseEntity.notFound().build();
            }
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    @PostMapping("/upload-from-temp")
    @PreAuthorize("hasRole('PEGAWAI') or hasRole('ADMIN') or hasRole('MODERATOR')")
    public ResponseEntity<Map<String, Object>> uploadFromTemp(
            @RequestParam("title") String title,
            @RequestParam("description") String description,
            @RequestParam("tempFileName") String tempFileName,
            @RequestParam(value = "kategoriId", required = false) String kategoriId,
            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        try {
            // Validate token and get user
            if (authHeader == null || !authHeader.startsWith("Bearer ")) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(Map.of(
                                "success", false,
                                "message", "Token tidak valid atau tidak ditemukan"
                        ));
            }
            
            String actualToken = authHeader.substring(7); // Remove "Bearer " prefix
            User user = authService.getUserFromToken(actualToken);
            
            if (user == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(Map.of(
                                "success", false,
                                "message", "Token tidak valid"
                        ));
            }
            
            String username = user.getUsername();
            Map<String, Object> result = fileService.uploadFromTemp(title, description, tempFileName, kategoriId, username);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                    .body(Map.of(
                            "success", false,
                            "message", "Gagal menyimpan file: " + e.getMessage()
                    ));
        }
    }
}
