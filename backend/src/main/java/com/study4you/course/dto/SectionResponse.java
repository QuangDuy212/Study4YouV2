package com.study4you.course.dto;

import lombok.*;

import java.util.List;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SectionResponse {

    private UUID id;
    private String title;
    private Integer orderIndex;
    private List<LessonResponse> lessons;
}
