package com.study4you.course.dto;

import lombok.*;

import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LessonResponse {

    private UUID id;
    private UUID courseId;
    private UUID sectionId;
    private String title;
    private String description;
    private String thumbnailUrl;

    /**
     * videoUrl is null for non-preview lessons when the caller is not enrolled.
     * The controller/service layer masks it before returning.
     */
    private String videoUrl;

    private Integer duration;
    private Integer orderIndex;
    private Boolean isPreview;
}
