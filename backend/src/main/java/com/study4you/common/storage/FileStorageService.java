package com.study4you.common.storage;

import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.Arrays;
import java.util.List;
import java.util.UUID;

@Service
public class FileStorageService {

    private final Path audioStorageLocation;
    private final Path imageStorageLocation;
    private final Path videoStorageLocation;

    private static final long MAX_FILE_SIZE = 1024 * 1024 * 1024; // 1GB (Videos can be large)
    private static final List<String> ALLOWED_AUDIO_EXTENSIONS = Arrays.asList("mp3", "wav");
    private static final List<String> ALLOWED_IMAGE_EXTENSIONS = Arrays.asList("jpg", "jpeg", "png", "webp");
    private static final List<String> ALLOWED_VIDEO_EXTENSIONS = Arrays.asList("mp4", "mov", "avi", "webm");

    public FileStorageService() {
        this.audioStorageLocation = Paths.get("uploads/audio").toAbsolutePath().normalize();
        this.imageStorageLocation = Paths.get("uploads/images").toAbsolutePath().normalize();
        this.videoStorageLocation = Paths.get("uploads/videos").toAbsolutePath().normalize();

        try {
            Files.createDirectories(this.audioStorageLocation);
            Files.createDirectories(this.imageStorageLocation);
            Files.createDirectories(this.videoStorageLocation);
        } catch (Exception ex) {
            throw new RuntimeException("Could not create the directories where the uploaded files will be stored.", ex);
        }
    }

    public String saveAudio(MultipartFile file) {
        return saveFile(file, ALLOWED_AUDIO_EXTENSIONS, audioStorageLocation, "/uploads/audio/");
    }

    public String saveImage(MultipartFile file) {
        return saveFile(file, ALLOWED_IMAGE_EXTENSIONS, imageStorageLocation, "/uploads/images/");
    }

    public String saveVideo(MultipartFile file) {
        return saveFile(file, ALLOWED_VIDEO_EXTENSIONS, videoStorageLocation, "/uploads/videos/");
    }

    private String saveFile(MultipartFile file, List<String> allowedExtensions, Path storageLocation, String urlPrefix) {
        if (file.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Failed to store empty file.");
        }

        if (file.getSize() > MAX_FILE_SIZE) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "File size exceeds the limit of 1GB.");
        }

        String originalFilename = StringUtils.cleanPath(file.getOriginalFilename() != null ? file.getOriginalFilename() : "");
        String extension = getFileExtension(originalFilename);

        if (!allowedExtensions.contains(extension.toLowerCase())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid file type. Allowed types: " + String.join(", ", allowedExtensions));
        }

        String baseName = getBaseName(originalFilename);
        String newFilename = baseName + "_" + UUID.randomUUID().toString() + "." + extension;

        try {
            if (newFilename.contains("..")) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Sorry! Filename contains invalid path sequence " + newFilename);
            }

            Path targetLocation = storageLocation.resolve(newFilename);
            Files.copy(file.getInputStream(), targetLocation, StandardCopyOption.REPLACE_EXISTING);

            return urlPrefix + newFilename;
        } catch (IOException ex) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Could not store file " + newFilename + ". Please try again!", ex);
        }
    }

    private String getFileExtension(String filename) {
        if (filename == null || filename.lastIndexOf(".") == -1) {
            return "";
        }
        return filename.substring(filename.lastIndexOf(".") + 1);
    }

    private String getBaseName(String filename) {
        if (filename == null || filename.lastIndexOf(".") == -1) {
            return filename;
        }
        return filename.substring(0, filename.lastIndexOf("."));
    }
}
