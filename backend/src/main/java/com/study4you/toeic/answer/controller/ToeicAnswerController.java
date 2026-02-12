package com.study4you.toeic.answer.controller;

import com.study4you.common.dto.ApiResponse;
import com.study4you.common.dto.PageResponse;
import com.study4you.toeic.answer.dto.ToeicAnswerRequest;
import com.study4you.toeic.answer.dto.ToeicAnswerResponse;
import com.study4you.toeic.answer.service.ToeicAnswerService;
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
@RequestMapping("/toeic/answers")
@RequiredArgsConstructor
public class ToeicAnswerController {

    private final ToeicAnswerService toeicAnswerService;

    @GetMapping
    public ResponseEntity<ApiResponse<PageResponse<ToeicAnswerResponse>>> getAllAnswers(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "DESC") String sortDir
    ) {
        Sort sort = sortDir.equalsIgnoreCase("ASC") ? 
                    Sort.by(sortBy).ascending() : Sort.by(sortBy).descending();
        Pageable pageable = PageRequest.of(page, size, sort);
        
        PageResponse<ToeicAnswerResponse> answers = toeicAnswerService.getAllAnswers(pageable);
        return ResponseEntity.ok(ApiResponse.success(answers));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<ToeicAnswerResponse>> getAnswerById(@PathVariable @org.springframework.lang.NonNull UUID id) {
        ToeicAnswerResponse answer = toeicAnswerService.getAnswerById(id);
        return ResponseEntity.ok(ApiResponse.success(answer));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<ToeicAnswerResponse>> createAnswer(@Valid @RequestBody ToeicAnswerRequest request) {
        ToeicAnswerResponse answer = toeicAnswerService.createAnswer(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Answer created successfully", answer));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<ToeicAnswerResponse>> updateAnswer(
            @PathVariable @org.springframework.lang.NonNull UUID id,
            @Valid @RequestBody ToeicAnswerRequest request
    ) {
        ToeicAnswerResponse answer = toeicAnswerService.updateAnswer(id, request);
        return ResponseEntity.ok(ApiResponse.success("Answer updated successfully", answer));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteAnswer(@PathVariable @org.springframework.lang.NonNull UUID id) {
        toeicAnswerService.deleteAnswer(id);
        return ResponseEntity.ok(ApiResponse.success("Answer deleted successfully", null));
    }
}
