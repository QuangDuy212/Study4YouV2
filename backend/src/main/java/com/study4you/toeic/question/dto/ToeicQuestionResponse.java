package com.study4you.toeic.question.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ToeicQuestionResponse {
    private UUID id;
    private UUID partId;
    private String content;
    private String audioUrl;
    private String passage;
    private String correctAnswer;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
