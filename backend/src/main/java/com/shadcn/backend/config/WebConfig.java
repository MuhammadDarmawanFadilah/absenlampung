package com.shadcn.backend.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebConfig implements WebMvcConfigurer {

    @Value("${app.upload.dir:uploads}")
    private String uploadDir;

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        // For production absolute path or relative path
        String uploadsPath;
        if (uploadDir.startsWith("/")) {
            // Production: absolute path like /opt/absenkantor/uploads
            uploadsPath = "file:" + uploadDir + "/";
        } else {
            // Development: relative path like uploads
            uploadsPath = "file:" + System.getProperty("user.dir") + "/" + uploadDir + "/";
        }
        
        // NOTE: Removed /api/upload/** mapping to avoid conflict with FileUploadController
        // FileUploadController handles /api/upload/photos/{filename} with proper security
        
        // Serve static files from /storage directory (legacy)
        registry.addResourceHandler("/storage/**")
                .addResourceLocations("file:" + System.getProperty("user.dir") + "/storage/")
                .setCachePeriod(3600); // Cache for 1 hour

        // Alternative absolute path mapping (legacy)
        registry.addResourceHandler("/api/storage/**")
                .addResourceLocations("file:" + System.getProperty("user.dir") + "/storage/")
                .setCachePeriod(3600);
                
        // For backward compatibility with uploads path (legacy) - direct uploads without /api prefix
        registry.addResourceHandler("/uploads/**")
                .addResourceLocations(uploadsPath)
                .setCachePeriod(3600);
    }
}
