package com.study4you.toeic.part.dto;

import com.study4you.common.enums.PartNumber;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ToeicPartRequest {
    
    @NotNull(message = "Test ID is required")
    private UUID testId;

    @NotNull(message = "Part number is required")
    private PartNumber part;

    @NotNull(message = "Order index is required")
    private Integer orderIndex;

    private String audioUrl;
}
