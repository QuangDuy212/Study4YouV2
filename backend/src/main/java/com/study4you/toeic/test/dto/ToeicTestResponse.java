package com.study4you.toeic.test.dto;

import com.study4you.common.enums.Level;
import com.study4you.common.enums.Skill;
import com.study4you.common.enums.TestType;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ToeicTestResponse {
    private UUID id;
    private String title;
    private TestType testType;
    private Skill skill;
    private Level level;
    private Integer durationMinutes;
    private Boolean active;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
