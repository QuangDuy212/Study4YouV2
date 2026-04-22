package com.study4you.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebMvcConfig implements WebMvcConfigurer {

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        registry.addResourceHandler("/uploads/**")
                .addResourceLocations(
                    "file:uploads/", 
                    "file:uploads/images/", 
                    "file:uploads/videos/", 
                    "file:uploads/audio/",
                    "file:../uploads/", 
                    "file:../uploads/images/",
                    "file:../uploads/videos/",
                    "file:../uploads/audio/",
                    "classpath:/static/uploads/"
                );
    }
}
