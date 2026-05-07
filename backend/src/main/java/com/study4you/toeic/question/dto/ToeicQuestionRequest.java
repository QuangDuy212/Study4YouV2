package com.study4you.toeic.question.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import com.study4you.common.enums.Level;
import java.util.List;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ToeicQuestionRequest {
    
    @NotNull(message = "Part ID is required")
    private UUID partId;

    private String content;

    private String audioUrl;

    private String imageUrl;

    private String passage;

    private String transcript;

    @NotBlank(message = "Correct answer is required")
    @Size(max = 1, message = "Correct answer must be a single character")
    private String correctAnswer;

    private Level level;

    private List<OptionDto> options;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class OptionDto {
        @NotBlank(message = "Label is required")
        @Size(max = 1, message = "Label must be a single character")
        private String label;

        @NotBlank(message = "Content is required")
        private String content;
    }
}
