package com.study4you.toeic.question.dto;

import com.study4you.toeic.option.dto.ToeicOptionResponse;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import com.study4you.common.enums.Level;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ToeicQuestionResponse {
    private UUID id;
    private UUID partId;
    private String content;
    private String audioUrl;
    private String imageUrl;
    private String passage;
    private String transcript;
    private String correctAnswer;
    private Level level;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private List<ToeicOptionResponse> options;
}
