package com.study4you.course.dto;

import jakarta.validation.constraints.*;
import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SectionRequest {

    @NotBlank(message = "Section title is required")
    @Size(max = 255)
    private String title;

    @NotNull(message = "Order index is required")
    @Min(0)
    private Integer orderIndex;
}
