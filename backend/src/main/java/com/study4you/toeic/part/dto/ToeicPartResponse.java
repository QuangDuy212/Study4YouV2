package com.study4you.toeic.part.dto;

import com.study4you.common.enums.PartNumber;
import com.study4you.toeic.question.dto.ToeicQuestionResponse;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ToeicPartResponse {
    private UUID id;
    private UUID testId;
    private PartNumber part;
    private Integer orderIndex;
    private String audioUrl;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private List<ToeicQuestionResponse> questions;
}
