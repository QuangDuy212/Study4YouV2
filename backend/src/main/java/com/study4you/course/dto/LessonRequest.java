package com.study4you.course.dto;

import jakarta.validation.constraints.*;
import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LessonRequest {

    @NotBlank(message = "Lesson title is required")
    @Size(max = 255)
    private String title;

    private String description;

    private String thumbnailUrl;

    private String videoUrl;

    @Min(0)
    private Integer duration;

    @NotNull(message = "Order index is required")
    @Min(0)
    private Integer orderIndex;

    private Boolean isPreview;

    /** Optional: assign to a section */
    private java.util.UUID sectionId;
}
