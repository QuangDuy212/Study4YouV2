package com.study4you.toeic.attempt.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ReviewQuestionDTO {
    private UUID questionId;
    private Integer questionNumber;
    private String content;
    private String passage;
    private String imageUrl;
    private String audioUrl;
    private List<ReviewOptionDTO> options;
    private String userAnswer;      // "A", "B", "C", "D" or null if not answered
    private String correctAnswer;   // "A", "B", "C", "D"
    private String explanation;
    private boolean correct;
    @JsonProperty("isFlagged")
    private boolean flagged;
    private String partName;
}
