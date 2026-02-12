package com.study4you.toeic.option.dto;

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
public class ToeicOptionRequest {
    
    @NotNull(message = "Question ID is required")
    private UUID questionId;

    @NotBlank(message = "Label is required")
    @Size(max = 1, message = "Label must be a single character")
    private String label;

    @NotBlank(message = "Content is required")
    private String content;
}
