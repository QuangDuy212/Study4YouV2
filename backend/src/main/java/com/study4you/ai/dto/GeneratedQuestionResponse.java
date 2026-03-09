package com.study4you.ai.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GeneratedQuestionResponse {

    private String content;
    private String passage; // null for PART_5
    private String correctAnswer;
    private List<OptionDto> options;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class OptionDto {
        private String label;   // A, B, C, D
        private String content;
    }
}
