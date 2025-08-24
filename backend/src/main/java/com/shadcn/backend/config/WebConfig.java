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
        
        // Serve uploaded files via API endpoint
        registry.addResourceHandler("/api/upload/**")
                .addResourceLocations(uploadsPath)
                .setCachePeriod(3600); // Cache for 1 hour
        
        // Serve static files from /storage directory (legacy)
        registry.addResourceHandler("/storage/**")
                .addResourceLocations("file:" + System.getProperty("user.dir") + "/storage/")
                .setCachePeriod(3600); // Cache for 1 hour

        // Alternative absolute path mapping (legacy)
        registry.addResourceHandler("/api/storage/**")
                .addResourceLocations("file:" + System.getProperty("user.dir") + "/storage/")
                .setCachePeriod(3600);
                
        // For backward compatibility with uploads path (legacy)
        registry.addResourceHandler("/uploads/**")
                .addResourceLocations("file:" + System.getProperty("user.dir") + "/uploads/")
                .setCachePeriod(3600);
    }
}
