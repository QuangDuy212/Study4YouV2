package com.study4you.toeic.question.controller;

import com.study4you.common.dto.ApiResponse;
import com.study4you.common.dto.PageResponse;
import com.study4you.toeic.question.dto.ToeicQuestionRequest;
import com.study4you.toeic.question.dto.ToeicQuestionResponse;
import com.study4you.toeic.question.service.ToeicQuestionService;
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
@RequestMapping("/toeic/questions")
@RequiredArgsConstructor
public class ToeicQuestionController {

    private final ToeicQuestionService toeicQuestionService;

    @GetMapping
    public ResponseEntity<ApiResponse<PageResponse<ToeicQuestionResponse>>> getAllQuestions(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "DESC") String sortDir
    ) {
        Sort sort = sortDir.equalsIgnoreCase("ASC") ? 
                    Sort.by(sortBy).ascending() : Sort.by(sortBy).descending();
        Pageable pageable = PageRequest.of(page, size, sort);
        
        PageResponse<ToeicQuestionResponse> questions = toeicQuestionService.getAllQuestions(pageable);
        return ResponseEntity.ok(ApiResponse.success(questions));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<ToeicQuestionResponse>> getQuestionById(@PathVariable @org.springframework.lang.NonNull UUID id) {
        ToeicQuestionResponse question = toeicQuestionService.getQuestionById(id);
        return ResponseEntity.ok(ApiResponse.success(question));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<ToeicQuestionResponse>> createQuestion(@Valid @RequestBody ToeicQuestionRequest request) {
        ToeicQuestionResponse question = toeicQuestionService.createQuestion(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Question created successfully", question));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<ToeicQuestionResponse>> updateQuestion(
            @PathVariable @org.springframework.lang.NonNull UUID id,
            @Valid @RequestBody ToeicQuestionRequest request
    ) {
        ToeicQuestionResponse question = toeicQuestionService.updateQuestion(id, request);
        return ResponseEntity.ok(ApiResponse.success("Question updated successfully", question));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteQuestion(@PathVariable @org.springframework.lang.NonNull UUID id) {
        toeicQuestionService.deleteQuestion(id);
        return ResponseEntity.ok(ApiResponse.success("Question deleted successfully", null));
    }
}
