package com.study4you.ai.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class GenerateQuestionRequest {

    @NotBlank(message = "Part must not be blank")
    private String part; // PART_5, PART_6, PART_7

    @NotBlank(message = "Difficulty must not be blank")
    private String difficulty; // EASY, MEDIUM, HARD

    @Min(value = 1, message = "Count must be at least 1")
    @Max(value = 60, message = "Count must not exceed 60")
    private int count;

    private String topic; // Optional: "Travel", "Environment", "Technology", etc.
    private String context; // Optional: Transcript or passage to generate questions from
}
