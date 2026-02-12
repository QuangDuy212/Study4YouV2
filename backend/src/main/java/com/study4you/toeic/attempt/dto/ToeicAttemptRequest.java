package com.study4you.toeic.attempt.dto;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ToeicAttemptRequest {
    
    @NotNull(message = "User ID is required")
    private UUID userId;

    @NotNull(message = "Test ID is required")
    private UUID testId;

    @NotNull(message = "Started at is required")
    private LocalDateTime startedAt;

    private LocalDateTime submittedAt;

    private Integer rawScore;

    private Integer toeicScore;
}
