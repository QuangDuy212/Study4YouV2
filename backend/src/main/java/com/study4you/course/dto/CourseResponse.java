package com.study4you.course.dto;

import com.study4you.course.enums.CourseStatus;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CourseResponse {

    private UUID id;
    private String title;
    private String description;
    private BigDecimal price;
    private String thumbnailUrl;
    private CourseStatus status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    /** Populated on detail endpoint only */
    private List<SectionResponse> sections;

    /** Lessons without a section (flat list if no sections used) */
    private List<LessonResponse> lessons;

    /** null if user not authenticated */
    private Boolean enrolled;
}
