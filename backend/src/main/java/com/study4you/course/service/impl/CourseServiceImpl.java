package com.study4you.course.service.impl;

import com.study4you.common.dto.PageResponse;
import com.study4you.common.exception.BadRequestException;
import com.study4you.common.exception.ResourceNotFoundException;
import com.study4you.course.dto.*;
import com.study4you.course.entity.Course;
import com.study4you.course.enums.CourseStatus;
import com.study4you.course.repository.CourseRepository;
import com.study4you.course.repository.EnrollmentRepository;
import com.study4you.course.service.CourseService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class CourseServiceImpl implements CourseService {

    private final CourseRepository courseRepository;
    private final EnrollmentRepository enrollmentRepository;

    // ------------------------------------------------------------------ CRUD

    @Override
    public CourseResponse createCourse(CourseRequest request) {
        Course course = Course.builder()
                .title(request.getTitle())
                .description(request.getDescription())
                .price(request.getPrice())
                .thumbnailUrl(request.getThumbnailUrl())
                .status(request.getStatus() != null ? request.getStatus() : CourseStatus.DRAFT)
                .build();
        return toResponse(courseRepository.save(course), null);
    }

    @Override
    public CourseResponse updateCourse(UUID id, CourseRequest request) {
        Course course = findOrThrow(id);
        course.setTitle(request.getTitle());
        course.setDescription(request.getDescription());
        course.setPrice(request.getPrice());
        if (request.getThumbnailUrl() != null) {
            course.setThumbnailUrl(request.getThumbnailUrl());
        }
        if (request.getStatus() != null) {
            course.setStatus(request.getStatus());
        }
        return toResponse(courseRepository.save(course), null);
    }

    @Override
    public void deleteCourse(UUID id) {
        Course course = findOrThrow(id);
        course.setStatus(CourseStatus.DELETED);
        courseRepository.save(course);
    }

    @Override
    public CourseResponse restoreCourse(UUID id) {
        Course course = courseRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Course not found: " + id));
        if (course.getStatus() != CourseStatus.DELETED) {
            throw new BadRequestException("Course is not deleted");
        }
        course.setStatus(CourseStatus.DRAFT);
        return toResponse(courseRepository.save(course), null);
    }

    @Override
    public CourseResponse publishCourse(UUID id) {
        Course course = findOrThrow(id);
        if (course.getStatus() == CourseStatus.PUBLISHED) {
            throw new BadRequestException("Course is already published");
        }
        course.setStatus(CourseStatus.PUBLISHED);
        return toResponse(courseRepository.save(course), null);
    }

    // ------------------------------------------------------------------ READ

    @Override
    @Transactional(readOnly = true)
    public PageResponse<CourseResponse> getAllPublishedCourses(String keyword, Pageable pageable) {
        Page<Course> page;
        if (StringUtils.hasText(keyword)) {
            page = courseRepository.searchByKeywordAndStatus(keyword, CourseStatus.PUBLISHED, pageable);
        } else {
            page = courseRepository.findByStatus(CourseStatus.PUBLISHED, pageable);
        }
        return buildPageResponse(page, null);
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<CourseResponse> getAllCourses(Pageable pageable) {
        Page<Course> page = courseRepository.findAll(pageable);
        return buildPageResponse(page, null);
    }

    @Override
    @Transactional(readOnly = true)
    public CourseResponse getCourseDetail(UUID id, UUID currentUserId) {
        Course course = findOrThrow(id);
        Boolean enrolled = null;
        if (currentUserId != null) {
            enrolled = enrollmentRepository.existsByUserIdAndCourseId(currentUserId, id);
        }

        // Resolve enrollment status once — must be effectively final for lambdas
        final boolean isEnrolled = enrolled != null && enrolled;

        // Build sections with lessons
        List<SectionResponse> sectionResponses = course.getSections().stream()
                .map(s -> SectionResponse.builder()
                        .id(s.getId())
                        .title(s.getTitle())
                        .orderIndex(s.getOrderIndex())
                        .lessons(s.getLessons().stream()
                                .map(l -> toLessonResponse(l, isEnrolled))
                                .collect(Collectors.toList()))
                        .build())
                .collect(Collectors.toList());

        // Root-level lessons (no section)
        List<LessonResponse> rootLessons = course.getLessons().stream()
                .filter(l -> l.getSection() == null)
                .map(l -> toLessonResponse(l, isEnrolled))
                .collect(Collectors.toList());

        CourseResponse resp = toResponse(course, enrolled);
        resp.setSections(sectionResponses);
        resp.setLessons(rootLessons);
        return resp;
    }

    // ------------------------------------------------------------------ HELPERS

    private Course findOrThrow(UUID id) {
        Course course = courseRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Course not found: " + id));
        if (course.getStatus() == CourseStatus.DELETED) {
            throw new ResourceNotFoundException("Course has been deleted: " + id);
        }
        return course;
    }

    private CourseResponse toResponse(Course course, Boolean enrolled) {
        return CourseResponse.builder()
                .id(course.getId())
                .title(course.getTitle())
                .description(course.getDescription())
                .price(course.getPrice())
                .thumbnailUrl(course.getThumbnailUrl())
                .status(course.getStatus())
                .createdAt(course.getCreatedAt())
                .updatedAt(course.getUpdatedAt())
                .enrolled(enrolled)
                .build();
    }

    private LessonResponse toLessonResponse(com.study4you.course.entity.Lesson lesson, boolean enrolled) {
        String videoUrl = (enrolled || Boolean.TRUE.equals(lesson.getIsPreview()))
                ? lesson.getVideoUrl() : null;
        return LessonResponse.builder()
                .id(lesson.getId())
                .courseId(lesson.getCourse().getId())
                .sectionId(lesson.getSection() != null ? lesson.getSection().getId() : null)
                .title(lesson.getTitle())
                .description(lesson.getDescription())
                .videoUrl(videoUrl)
                .duration(lesson.getDuration())
                .orderIndex(lesson.getOrderIndex())
                .isPreview(lesson.getIsPreview())
                .build();
    }

    private PageResponse<CourseResponse> buildPageResponse(Page<Course> page, UUID currentUserId) {
        List<CourseResponse> content = page.getContent().stream()
                .map(c -> toResponse(c, null))
                .collect(Collectors.toList());
        return new PageResponse<>(content, page.getNumber(), page.getSize(),
                page.getTotalElements(), page.getTotalPages(), page.isLast());
    }
}
