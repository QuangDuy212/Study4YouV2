package com.study4you.toeic.part.dto;

import com.study4you.common.enums.PartNumber;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ToeicPartResponse {
    private UUID id;
    private UUID testId;
    private PartNumber part;
    private Integer orderIndex;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
