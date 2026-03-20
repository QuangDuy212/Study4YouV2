package com.study4you.toeic.attempt.controller;

import com.study4you.common.dto.ApiResponse;
import com.study4you.common.dto.PageResponse;
import com.study4you.toeic.attempt.dto.ToeicAttemptRequest;
import com.study4you.toeic.attempt.dto.ToeicAttemptResponse;
import com.study4you.toeic.attempt.service.ToeicAttemptService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/toeic/attempts")
@RequiredArgsConstructor
public class ToeicAttemptController {

    private final ToeicAttemptService toeicAttemptService;

    @GetMapping
    public ResponseEntity<ApiResponse<PageResponse<ToeicAttemptResponse>>> getAllAttempts(
            @RequestParam(required = false) UUID userId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "DESC") String sortDir
    ) {
        Sort sort = sortDir.equalsIgnoreCase("ASC") ? 
                    Sort.by(sortBy).ascending() : Sort.by(sortBy).descending();
        Pageable pageable = PageRequest.of(page, size, sort);
        
        PageResponse<ToeicAttemptResponse> attempts = toeicAttemptService.getAllAttempts(userId, pageable);
        return ResponseEntity.ok(ApiResponse.success(attempts));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<ToeicAttemptResponse>> getAttemptById(@PathVariable @org.springframework.lang.NonNull UUID id) {
        ToeicAttemptResponse attempt = toeicAttemptService.getAttemptById(id);
        return ResponseEntity.ok(ApiResponse.success(attempt));
    }

    @PreAuthorize("hasAuthority('TAKE_TOEIC_TEST')")
    @PostMapping
    public ResponseEntity<ApiResponse<ToeicAttemptResponse>> createAttempt(@Valid @RequestBody ToeicAttemptRequest request) {
        ToeicAttemptResponse attempt = toeicAttemptService.createAttempt(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Attempt created successfully", attempt));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<ToeicAttemptResponse>> updateAttempt(
            @PathVariable @org.springframework.lang.NonNull UUID id,
            @Valid @RequestBody ToeicAttemptRequest request
    ) {
        ToeicAttemptResponse attempt = toeicAttemptService.updateAttempt(id, request);
        return ResponseEntity.ok(ApiResponse.success("Attempt updated successfully", attempt));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteAttempt(@PathVariable @org.springframework.lang.NonNull UUID id) {
        toeicAttemptService.deleteAttempt(id);
        return ResponseEntity.ok(ApiResponse.success("Attempt deleted successfully", null));
    }
}
