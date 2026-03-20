package com.study4you.toeic.test.controller;

import com.study4you.common.dto.ApiResponse;
import com.study4you.common.dto.PageResponse;
import com.study4you.toeic.test.dto.ToeicTestRequest;
import com.study4you.toeic.test.dto.ToeicTestResponse;
import com.study4you.toeic.test.service.ToeicTestService;
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
@RequestMapping("/toeic/tests")
@RequiredArgsConstructor
public class ToeicTestController {

    private final ToeicTestService toeicTestService;

    @PreAuthorize("hasAuthority('MANAGE_TESTS')")
    @GetMapping
    public ResponseEntity<ApiResponse<PageResponse<ToeicTestResponse>>> getAllTests(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "DESC") String sortDir
    ) {
        Sort sort = sortDir.equalsIgnoreCase("ASC") ? 
                    Sort.by(sortBy).ascending() : Sort.by(sortBy).descending();
        Pageable pageable = PageRequest.of(page, size, sort);
        
        PageResponse<ToeicTestResponse> tests = toeicTestService.getAllTests(pageable);
        return ResponseEntity.ok(ApiResponse.success(tests));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<ToeicTestResponse>> getTestById(@PathVariable @org.springframework.lang.NonNull UUID id) {
        ToeicTestResponse test = toeicTestService.getTestById(id);
        return ResponseEntity.ok(ApiResponse.success(test));
    }

    @PreAuthorize("hasAuthority('MANAGE_TESTS')")
    @PostMapping
    public ResponseEntity<ApiResponse<ToeicTestResponse>> createTest(@Valid @RequestBody ToeicTestRequest request) {
        ToeicTestResponse test = toeicTestService.createTest(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Test created successfully", test));
    }

    @PreAuthorize("hasAuthority('MANAGE_TESTS')")
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<ToeicTestResponse>> updateTest(
            @PathVariable @org.springframework.lang.NonNull UUID id,
            @Valid @RequestBody ToeicTestRequest request
    ) {
        ToeicTestResponse test = toeicTestService.updateTest(id, request);
        return ResponseEntity.ok(ApiResponse.success("Test updated successfully", test));
    }

    @PreAuthorize("hasAuthority('MANAGE_TESTS')")
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteTest(@PathVariable @org.springframework.lang.NonNull UUID id) {
        toeicTestService.deleteTest(id);
        return ResponseEntity.ok(ApiResponse.success("Test deleted successfully", null));
    }
}
