package com.study4you.course.service.impl;

import com.study4you.common.exception.BadRequestException;
import com.study4you.common.exception.ResourceNotFoundException;
import com.study4you.course.dto.EnrollmentResponse;
import com.study4you.course.entity.Course;
import com.study4you.course.entity.Enrollment;
import com.study4you.course.repository.CourseRepository;
import com.study4you.course.repository.EnrollmentRepository;
import com.study4you.course.service.EnrollmentService;
import com.study4you.user.entity.User;
import com.study4you.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class EnrollmentServiceImpl implements EnrollmentService {

    private final EnrollmentRepository enrollmentRepository;
    private final CourseRepository courseRepository;
    private final UserRepository userRepository;

    @Override
    public EnrollmentResponse enrollCourse(UUID courseId, UUID userId) {
        if (enrollmentRepository.existsByUserIdAndCourseId(userId, courseId)) {
            throw new BadRequestException("Already enrolled in this course");
        }
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new ResourceNotFoundException("Course not found: " + courseId));
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + userId));

        Enrollment enrollment = Enrollment.builder()
                .user(user)
                .course(course)
                .progress(0)
                .build();
        return toResponse(enrollmentRepository.save(enrollment));
    }

    @Override
    @Transactional(readOnly = true)
    public List<EnrollmentResponse> getMyCourses(UUID userId) {
        return enrollmentRepository.findByUserIdOrderByCreatedAtDesc(userId)
                .stream().map(this::toResponse).collect(Collectors.toList());
    }

    @Override
    public EnrollmentResponse updateProgress(UUID courseId, UUID userId, int progress) {
        if (progress < 0 || progress > 100) {
            throw new BadRequestException("Progress must be between 0 and 100");
        }
        Enrollment enrollment = enrollmentRepository.findByUserIdAndCourseId(userId, courseId)
                .orElseThrow(() -> new ResourceNotFoundException("Enrollment not found"));
        enrollment.setProgress(progress);
        return toResponse(enrollmentRepository.save(enrollment));
    }

    @Override
    @Transactional(readOnly = true)
    public boolean isEnrolled(UUID courseId, UUID userId) {
        return enrollmentRepository.existsByUserIdAndCourseId(userId, courseId);
    }

    // ------------------------------------------------------------------ HELPERS

    private EnrollmentResponse toResponse(Enrollment enrollment) {
        Course c = enrollment.getCourse();
        return EnrollmentResponse.builder()
                .id(enrollment.getId())
                .userId(enrollment.getUser().getId())
                .courseId(c.getId())
                .courseTitle(c.getTitle())
                .courseThumbnailUrl(c.getThumbnailUrl())
                .coursePrice(c.getPrice())
                .progress(enrollment.getProgress())
                .enrolledAt(enrollment.getCreatedAt())
                .build();
    }
}
