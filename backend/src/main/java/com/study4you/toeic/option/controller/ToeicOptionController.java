package com.study4you.toeic.option.controller;

import com.study4you.common.dto.ApiResponse;
import com.study4you.common.dto.PageResponse;
import com.study4you.toeic.option.dto.ToeicOptionRequest;
import com.study4you.toeic.option.dto.ToeicOptionResponse;
import com.study4you.toeic.option.service.ToeicOptionService;
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
@RequestMapping("/toeic/options")
@RequiredArgsConstructor
public class ToeicOptionController {

    private final ToeicOptionService toeicOptionService;

    @GetMapping
    public ResponseEntity<ApiResponse<PageResponse<ToeicOptionResponse>>> getAllOptions(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "DESC") String sortDir
    ) {
        Sort sort = sortDir.equalsIgnoreCase("ASC") ? 
                    Sort.by(sortBy).ascending() : Sort.by(sortBy).descending();
        Pageable pageable = PageRequest.of(page, size, sort);
        
        PageResponse<ToeicOptionResponse> options = toeicOptionService.getAllOptions(pageable);
        return ResponseEntity.ok(ApiResponse.success(options));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<ToeicOptionResponse>> getOptionById(@PathVariable @org.springframework.lang.NonNull UUID id) {
        ToeicOptionResponse option = toeicOptionService.getOptionById(id);
        return ResponseEntity.ok(ApiResponse.success(option));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<ToeicOptionResponse>> createOption(@Valid @RequestBody ToeicOptionRequest request) {
        ToeicOptionResponse option = toeicOptionService.createOption(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Option created successfully", option));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<ToeicOptionResponse>> updateOption(
            @PathVariable @org.springframework.lang.NonNull UUID id,
            @Valid @RequestBody ToeicOptionRequest request
    ) {
        ToeicOptionResponse option = toeicOptionService.updateOption(id, request);
        return ResponseEntity.ok(ApiResponse.success("Option updated successfully", option));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteOption(@PathVariable @org.springframework.lang.NonNull UUID id) {
        toeicOptionService.deleteOption(id);
        return ResponseEntity.ok(ApiResponse.success("Option deleted successfully", null));
    }
}
