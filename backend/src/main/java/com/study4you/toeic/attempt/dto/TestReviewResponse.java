package com.study4you.toeic.attempt.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class TestReviewResponse {
    // Submission info
    private UUID submissionId;
    private UUID testId;
    private String testTitle;
    private UUID userId;

    // Score summary
    private Integer toeicScore;
    private Integer rawScore;       // correct count
    private Integer totalQuestions;
    private Integer wrongCount;
    private Integer unansweredCount;

    // Timing
    private LocalDateTime startedAt;
    private LocalDateTime submittedAt;
    private Long completionTimeSeconds; // duration in seconds

    // Questions with review data
    private List<ReviewQuestionDTO> questions;
}
