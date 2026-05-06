package com.study4you.toeic.attempt.controller;

import com.study4you.common.dto.ApiResponse;
import com.study4you.toeic.attempt.dto.TestReviewResponse;
import com.study4you.toeic.attempt.service.TestReviewService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
@RequestMapping("/toeic/tests")
@RequiredArgsConstructor
public class TestReviewController {

    private final TestReviewService testReviewService;

    /**
     * GET /api/v1/toeic/tests/{submissionId}/review
     *
     * Returns the full review data for a completed test submission.
     * Only the owner of the submission (or an admin) can access this endpoint.
     */
    @PreAuthorize("isAuthenticated()")
    @GetMapping("/{submissionId}/review")
    public ResponseEntity<ApiResponse<TestReviewResponse>> getReview(
            @PathVariable UUID submissionId) {
        TestReviewResponse review = testReviewService.getReview(submissionId);
        return ResponseEntity.ok(ApiResponse.success(review));
    }
}
