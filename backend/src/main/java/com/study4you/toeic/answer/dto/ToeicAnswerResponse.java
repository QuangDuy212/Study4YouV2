package com.study4you.toeic.answer.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ToeicAnswerResponse {
    private UUID id;
    private UUID attemptId;
    private UUID questionId;
    private String selectedOption;
    private Boolean correct;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
