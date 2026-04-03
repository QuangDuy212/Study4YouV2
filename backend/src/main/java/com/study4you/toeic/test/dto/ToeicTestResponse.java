package com.study4you.toeic.test.dto;

import com.study4you.toeic.part.dto.ToeicPartResponse;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ToeicTestResponse {
    private UUID id;
    private String title;
    private Integer durationMinutes;
    private Boolean active;
    private String skill;
    private String level;
    private String audioUrl;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private List<ToeicPartResponse> parts;
}
