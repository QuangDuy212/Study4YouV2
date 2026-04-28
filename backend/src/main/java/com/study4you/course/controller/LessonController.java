package com.study4you.course.controller;

import com.study4you.common.dto.ApiResponse;
import com.study4you.course.dto.*;
import com.study4you.course.service.LessonService;
import com.study4you.security.SecurityService;
import com.study4you.user.entity.User;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequiredArgsConstructor
public class LessonController {

    private final LessonService lessonService;
    private final SecurityService securityService;

    // ------------------------------------------------------------------ SECTIONS

    @GetMapping("/courses/{courseId}/sections")
    public ResponseEntity<ApiResponse<List<SectionResponse>>> getSections(@PathVariable UUID courseId) {
        return ResponseEntity.ok(ApiResponse.success(lessonService.getSectionsByCourse(courseId)));
    }

    @PostMapping("/courses/{courseId}/sections")
    @PreAuthorize("hasAuthority('MANAGE_TESTS')")
    public ResponseEntity<ApiResponse<SectionResponse>> createSection(
            @PathVariable UUID courseId,
            @Valid @RequestBody SectionRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Section created", lessonService.createSection(courseId, request)));
    }

    // ------------------------------------------------------------------ LESSONS

    @GetMapping("/courses/{courseId}/lessons")
    public ResponseEntity<ApiResponse<List<LessonResponse>>> getLessonsByCourse(@PathVariable UUID courseId) {
        User user = securityService.getCurrentUser();
        UUID userId = user != null ? user.getId() : null;
        return ResponseEntity.ok(ApiResponse.success(lessonService.getLessonsByCourse(courseId, userId)));
    }

    @PostMapping("/courses/{courseId}/lessons")
    @PreAuthorize("hasAuthority('MANAGE_TESTS')")
    public ResponseEntity<ApiResponse<LessonResponse>> createLesson(
            @PathVariable UUID courseId,
            @Valid @RequestBody LessonRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Lesson created", lessonService.createLesson(courseId, request)));
    }

    @GetMapping("/lessons/{lessonId}")
    public ResponseEntity<ApiResponse<LessonResponse>> getLessonById(@PathVariable UUID lessonId) {
        User user = securityService.getCurrentUser();
        UUID userId = user != null ? user.getId() : null;
        return ResponseEntity.ok(ApiResponse.success(lessonService.getLessonById(lessonId, userId)));
    }

    @PutMapping("/lessons/{lessonId}")
    @PreAuthorize("hasAuthority('MANAGE_TESTS')")
    public ResponseEntity<ApiResponse<LessonResponse>> updateLesson(
            @PathVariable UUID lessonId,
            @Valid @RequestBody LessonRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Lesson updated", lessonService.updateLesson(lessonId, request)));
    }

    @DeleteMapping("/lessons/{lessonId}")
    @PreAuthorize("hasAuthority('MANAGE_TESTS')")
    public ResponseEntity<ApiResponse<Void>> deleteLesson(@PathVariable UUID lessonId) {
        lessonService.deleteLesson(lessonId);
        return ResponseEntity.ok(ApiResponse.success("Lesson deleted", null));
    }
}
