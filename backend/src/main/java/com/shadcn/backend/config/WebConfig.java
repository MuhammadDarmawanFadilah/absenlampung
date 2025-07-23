package com.shadcn.backend.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebConfig implements WebMvcConfigurer {

    @Value("${app.upload.dir:/storage}")
    private String uploadDir;

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        // Serve static files from /storage directory
        registry.addResourceHandler("/storage/**")
                .addResourceLocations("file:" + System.getProperty("user.dir") + "/storage/")
                .setCachePeriod(3600); // Cache for 1 hour

        // Alternative absolute path mapping
        registry.addResourceHandler("/api/storage/**")
                .addResourceLocations("file:" + System.getProperty("user.dir") + "/storage/")
                .setCachePeriod(3600);
                
        // For backward compatibility with uploads path
        registry.addResourceHandler("/uploads/**")
                .addResourceLocations("file:" + System.getProperty("user.dir") + "/uploads/")
                .setCachePeriod(3600);
    }
}
