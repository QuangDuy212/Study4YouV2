package com.study4you.course.service;

import com.study4you.course.dto.EnrollmentResponse;

import java.util.List;
import java.util.UUID;

public interface EnrollmentService {

    EnrollmentResponse enrollCourse(UUID courseId, UUID userId);

    List<EnrollmentResponse> getMyCourses(UUID userId);

    EnrollmentResponse updateProgress(UUID courseId, UUID userId, int progress);

    boolean isEnrolled(UUID courseId, UUID userId);
}
