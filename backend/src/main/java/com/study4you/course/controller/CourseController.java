package com.study4you.course.controller;

import com.study4you.common.dto.ApiResponse;
import com.study4you.common.dto.PageResponse;
import com.study4you.course.dto.CourseRequest;
import com.study4you.course.dto.CourseResponse;
import com.study4you.course.service.CourseService;
import com.study4you.security.SecurityService;
import com.study4you.user.entity.User;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/courses")
@RequiredArgsConstructor
public class CourseController {

    private final CourseService courseService;
    private final SecurityService securityService;

    // ------------------------------------------------------------------ PUBLIC

    @GetMapping
    public ResponseEntity<ApiResponse<PageResponse<CourseResponse>>> getAllCourses(
            @RequestParam(required = false) String keyword,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "12") int size
    ) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        return ResponseEntity.ok(ApiResponse.success(
                courseService.getAllPublishedCourses(keyword, pageable)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<CourseResponse>> getCourseDetail(@PathVariable UUID id) {
        User user = securityService.getCurrentUser();
        UUID userId = user != null ? user.getId() : null;
        return ResponseEntity.ok(ApiResponse.success(courseService.getCourseDetail(id, userId)));
    }

    // ------------------------------------------------------------------ ADMIN

    @GetMapping("/admin/all")
    @PreAuthorize("hasAuthority('MANAGE_TESTS')")
    public ResponseEntity<ApiResponse<PageResponse<CourseResponse>>> getAllCoursesAdmin(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        return ResponseEntity.ok(ApiResponse.success(courseService.getAllCourses(pageable)));
    }

    @PostMapping
    @PreAuthorize("hasAuthority('MANAGE_TESTS')")
    public ResponseEntity<ApiResponse<CourseResponse>> createCourse(
            @Valid @RequestBody CourseRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Course created successfully", courseService.createCourse(request)));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('MANAGE_TESTS')")
    public ResponseEntity<ApiResponse<CourseResponse>> updateCourse(
            @PathVariable UUID id, @Valid @RequestBody CourseRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Course updated", courseService.updateCourse(id, request)));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('MANAGE_TESTS')")
    public ResponseEntity<ApiResponse<Void>> deleteCourse(@PathVariable UUID id) {
        courseService.deleteCourse(id);
        return ResponseEntity.ok(ApiResponse.success("Course deleted", null));
    }

    @PatchMapping("/{id}/publish")
    @PreAuthorize("hasAuthority('MANAGE_TESTS')")
    public ResponseEntity<ApiResponse<CourseResponse>> publishCourse(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.success("Course published", courseService.publishCourse(id)));
    }
}
