package com.study4you.toeic.part.controller;

import com.study4you.common.dto.ApiResponse;
import com.study4you.common.dto.PageResponse;
import com.study4you.toeic.part.dto.ToeicPartRequest;
import com.study4you.toeic.part.dto.ToeicPartResponse;
import com.study4you.toeic.part.service.ToeicPartService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/toeic/parts")
@RequiredArgsConstructor
public class ToeicPartController {

    private final ToeicPartService toeicPartService;

    @GetMapping
    public ResponseEntity<ApiResponse<PageResponse<ToeicPartResponse>>> getAllParts(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "DESC") String sortDir
    ) {
        Sort sort = sortDir.equalsIgnoreCase("ASC") ? 
                    Sort.by(sortBy).ascending() : Sort.by(sortBy).descending();
        Pageable pageable = PageRequest.of(page, size, sort);
        
        PageResponse<ToeicPartResponse> parts = toeicPartService.getAllParts(pageable);
        return ResponseEntity.ok(ApiResponse.success(parts));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<ToeicPartResponse>> getPartById(@PathVariable @org.springframework.lang.NonNull UUID id) {
        ToeicPartResponse part = toeicPartService.getPartById(id);
        return ResponseEntity.ok(ApiResponse.success(part));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<ToeicPartResponse>> createPart(@Valid @RequestBody ToeicPartRequest request) {
        ToeicPartResponse part = toeicPartService.createPart(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Part created successfully", part));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<ToeicPartResponse>> updatePart(
            @PathVariable @org.springframework.lang.NonNull UUID id,
            @Valid @RequestBody ToeicPartRequest request
    ) {
        ToeicPartResponse part = toeicPartService.updatePart(id, request);
        return ResponseEntity.ok(ApiResponse.success("Part updated successfully", part));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deletePart(@PathVariable @org.springframework.lang.NonNull UUID id) {
        toeicPartService.deletePart(id);
        return ResponseEntity.ok(ApiResponse.success("Part deleted successfully", null));
    }
}
