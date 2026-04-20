package com.study4you.course.controller;

import com.study4you.common.dto.ApiResponse;
import com.study4you.course.dto.EnrollmentResponse;
import com.study4you.course.service.EnrollmentService;
import com.study4you.security.SecurityService;
import com.study4you.user.entity.User;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequiredArgsConstructor
public class EnrollmentController {

    private final EnrollmentService enrollmentService;
    private final SecurityService securityService;

    /** Enroll current user in a course (free courses skip payment check) */
    @PostMapping("/courses/{courseId}/enroll")
    public ResponseEntity<ApiResponse<EnrollmentResponse>> enroll(@PathVariable UUID courseId) {
        User user = securityService.getCurrentUser();
        EnrollmentResponse resp = enrollmentService.enrollCourse(courseId, user.getId());
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Enrolled successfully", resp));
    }

    /** List all enrolled courses for current user */
    @GetMapping("/me/courses")
    public ResponseEntity<ApiResponse<List<EnrollmentResponse>>> getMyCourses() {
        User user = securityService.getCurrentUser();
        return ResponseEntity.ok(ApiResponse.success(enrollmentService.getMyCourses(user.getId())));
    }

    /** Update progress for a specific course */
    @PutMapping("/me/courses/{courseId}/progress")
    public ResponseEntity<ApiResponse<EnrollmentResponse>> updateProgress(
            @PathVariable UUID courseId,
            @RequestParam int progress) {
        User user = securityService.getCurrentUser();
        return ResponseEntity.ok(ApiResponse.success(
                "Progress updated",
                enrollmentService.updateProgress(courseId, user.getId(), progress)));
    }
}
