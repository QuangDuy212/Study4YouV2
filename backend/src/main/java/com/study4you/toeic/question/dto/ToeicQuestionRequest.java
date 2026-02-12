package com.study4you.toeic.question.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ToeicQuestionRequest {
    
    @NotNull(message = "Part ID is required")
    private UUID partId;

    private String content;

    private String audioUrl;

    private String passage;

    @NotBlank(message = "Correct answer is required")
    @Size(max = 1, message = "Correct answer must be a single character")
    private String correctAnswer;
}
