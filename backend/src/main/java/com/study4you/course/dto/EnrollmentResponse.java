package com.study4you.course.dto;

import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EnrollmentResponse {

    private UUID id;
    private UUID userId;
    private UUID courseId;
    private String courseTitle;
    private String courseThumbnailUrl;
    private BigDecimal coursePrice;
    private Integer progress;
    private LocalDateTime enrolledAt;
}
