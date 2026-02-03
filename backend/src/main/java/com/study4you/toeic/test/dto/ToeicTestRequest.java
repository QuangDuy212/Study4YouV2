package com.study4you.toeic.test.dto;

import com.study4you.common.enums.Level;
import com.study4you.common.enums.Skill;
import com.study4you.common.enums.TestType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ToeicTestRequest {
    
    @NotBlank(message = "Title is required")
    private String title;

    @NotNull(message = "Test type is required")
    private TestType testType;

    @NotNull(message = "Skill is required")
    private Skill skill;

    @NotNull(message = "Level is required")
    private Level level;

    @NotNull(message = "Duration is required")
    private Integer durationMinutes;

    private Boolean active;
}
