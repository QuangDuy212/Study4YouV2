package com.study4you.toeic.option.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ToeicOptionResponse {
    private UUID id;
    private UUID questionId;
    private String label;
    private String content;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
