package com.study4you.toeic.attempt.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ToeicAttemptResponse {
    private UUID id;
    private UUID userId;
    private UUID testId;
    private LocalDateTime startedAt;
    private LocalDateTime submittedAt;
    private Integer rawScore;
    private Integer toeicScore;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
