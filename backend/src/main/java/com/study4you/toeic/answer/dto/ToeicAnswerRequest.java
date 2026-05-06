package com.study4you.toeic.answer.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ToeicAnswerRequest {
    
    @NotNull(message = "Attempt ID is required")
    private UUID attemptId;

    @NotNull(message = "Question ID is required")
    private UUID questionId;

    @Size(max = 1, message = "Selected option must be a single character")
    private String selectedOption;

    @NotNull(message = "Correct status is required")
    private Boolean correct;

    private Boolean isFlagged = false;
}
