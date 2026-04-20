package com.study4you.common.storage;

import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.http.ResponseEntity;

@RestController
@RequestMapping("/files")
public class FileUploadController {

    private final FileStorageService fileStorageService;

    public FileUploadController(FileStorageService fileStorageService) {
        this.fileStorageService = fileStorageService;
    }

    @PostMapping(value = "/upload-audio", consumes = "multipart/form-data")
    public ResponseEntity<FileUploadResponse> uploadAudio(@RequestParam("file") MultipartFile file) {
        String url = fileStorageService.saveAudio(file);
        String fileName = url.substring(url.lastIndexOf("/") + 1);
        return ResponseEntity.ok(new FileUploadResponse(url, fileName));
    }

    @PostMapping(value = "/upload-image", consumes = "multipart/form-data")
    public ResponseEntity<FileUploadResponse> uploadImage(@RequestParam("file") MultipartFile file) {
        String url = fileStorageService.saveImage(file);
        String fileName = url.substring(url.lastIndexOf("/") + 1);
        return ResponseEntity.ok(new FileUploadResponse(url, fileName));
    }

    @PostMapping(value = "/upload-video", consumes = "multipart/form-data")
    public ResponseEntity<FileUploadResponse> uploadVideo(@RequestParam("file") MultipartFile file) {
        String url = fileStorageService.saveVideo(file);
        String fileName = url.substring(url.lastIndexOf("/") + 1);
        return ResponseEntity.ok(new FileUploadResponse(url, fileName));
    }
}
