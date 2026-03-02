package com.study4you.toeic.test.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ToeicTestRequest {
    
    @NotBlank(message = "Title is required")
    private String title;

    private Boolean active;
}
