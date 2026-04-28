package com.study4you.course.service.impl;

import com.study4you.common.exception.BadRequestException;
import com.study4you.common.exception.ResourceNotFoundException;
import com.study4you.course.dto.*;
import com.study4you.course.entity.Course;
import com.study4you.course.entity.Lesson;
import com.study4you.course.entity.Section;
import com.study4you.course.repository.CourseRepository;
import com.study4you.course.repository.EnrollmentRepository;
import com.study4you.course.repository.LessonRepository;
import com.study4you.course.repository.SectionRepository;
import com.study4you.course.service.LessonService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class LessonServiceImpl implements LessonService {

    private final CourseRepository courseRepository;
    private final SectionRepository sectionRepository;
    private final LessonRepository lessonRepository;
    private final EnrollmentRepository enrollmentRepository;

    // ------------------------------------------------------------------ SECTIONS

    @Override
    public SectionResponse createSection(UUID courseId, SectionRequest request) {
        Course course = findCourseOrThrow(courseId);
        Section section = Section.builder()
                .course(course)
                .title(request.getTitle())
                .orderIndex(request.getOrderIndex())
                .build();
        return toSectionResponse(sectionRepository.save(section));
    }

    @Override
    @Transactional(readOnly = true)
    public List<SectionResponse> getSectionsByCourse(UUID courseId) {
        findCourseOrThrow(courseId);
        return sectionRepository.findByCourseIdOrderByOrderIndexAsc(courseId)
                .stream().map(this::toSectionResponse).collect(Collectors.toList());
    }

    // ------------------------------------------------------------------ LESSONS

    @Override
    public LessonResponse createLesson(UUID courseId, LessonRequest request) {
        Course course = findCourseOrThrow(courseId);
        Section section = null;
        if (request.getSectionId() != null) {
            section = sectionRepository.findById(request.getSectionId())
                    .orElseThrow(() -> new ResourceNotFoundException("Section not found: " + request.getSectionId()));
            if (!section.getCourse().getId().equals(courseId)) {
                throw new BadRequestException("Section does not belong to this course");
            }
        }
        Lesson lesson = Lesson.builder()
                .course(course)
                .section(section)
                .title(request.getTitle())
                .description(request.getDescription())
                .thumbnailUrl(request.getThumbnailUrl())
                .videoUrl(request.getVideoUrl())
                .duration(request.getDuration() != null ? request.getDuration() : 0)
                .orderIndex(request.getOrderIndex())
                .isPreview(request.getIsPreview() != null ? request.getIsPreview() : false)
                .build();
        return toLessonResponse(lessonRepository.save(lesson), true);
    }

    @Override
    public LessonResponse updateLesson(UUID lessonId, LessonRequest request) {
        Lesson lesson = findLessonOrThrow(lessonId);
        lesson.setTitle(request.getTitle());
        lesson.setDescription(request.getDescription());
        if (request.getThumbnailUrl() != null) lesson.setThumbnailUrl(request.getThumbnailUrl());
        if (request.getVideoUrl() != null) lesson.setVideoUrl(request.getVideoUrl());
        if (request.getDuration() != null) lesson.setDuration(request.getDuration());
        lesson.setOrderIndex(request.getOrderIndex());
        if (request.getIsPreview() != null) lesson.setIsPreview(request.getIsPreview());
        return toLessonResponse(lessonRepository.save(lesson), true);
    }

    @Override
    public void deleteLesson(UUID lessonId) {
        Lesson lesson = findLessonOrThrow(lessonId);
        lessonRepository.delete(lesson);
    }

    @Override
    @Transactional(readOnly = true)
    public List<LessonResponse> getLessonsByCourse(UUID courseId, UUID currentUserId) {
        findCourseOrThrow(courseId);
        boolean enrolled = currentUserId != null &&
                enrollmentRepository.existsByUserIdAndCourseId(currentUserId, courseId);
        return lessonRepository.findByCourseIdOrderByOrderIndexAsc(courseId)
                .stream()
                .map(l -> toLessonResponse(l, enrolled))
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public LessonResponse getLessonById(UUID lessonId, UUID currentUserId) {
        Lesson lesson = findLessonOrThrow(lessonId);
        boolean enrolled = currentUserId != null &&
                enrollmentRepository.existsByUserIdAndCourseId(currentUserId, lesson.getCourse().getId());
        if (!enrolled && !Boolean.TRUE.equals(lesson.getIsPreview())) {
            throw new BadRequestException("You must be enrolled to access this lesson");
        }
        return toLessonResponse(lesson, true);
    }

    // ------------------------------------------------------------------ HELPERS

    private Course findCourseOrThrow(UUID courseId) {
        return courseRepository.findById(courseId)
                .orElseThrow(() -> new ResourceNotFoundException("Course not found: " + courseId));
    }

    private Lesson findLessonOrThrow(UUID lessonId) {
        return lessonRepository.findById(lessonId)
                .orElseThrow(() -> new ResourceNotFoundException("Lesson not found: " + lessonId));
    }

    private SectionResponse toSectionResponse(Section section) {
        List<LessonResponse> lessons = section.getLessons().stream()
                .map(l -> toLessonResponse(l, true))
                .collect(Collectors.toList());
        return SectionResponse.builder()
                .id(section.getId())
                .title(section.getTitle())
                .orderIndex(section.getOrderIndex())
                .lessons(lessons)
                .build();
    }

    private LessonResponse toLessonResponse(Lesson lesson, boolean showVideo) {
        String videoUrl = showVideo ? lesson.getVideoUrl() : null;
        return LessonResponse.builder()
                .id(lesson.getId())
                .courseId(lesson.getCourse().getId())
                .sectionId(lesson.getSection() != null ? lesson.getSection().getId() : null)
                .title(lesson.getTitle())
                .description(lesson.getDescription())
                .thumbnailUrl(lesson.getThumbnailUrl())
                .videoUrl(videoUrl)
                .duration(lesson.getDuration())
                .orderIndex(lesson.getOrderIndex())
                .isPreview(lesson.getIsPreview())
                .build();
    }
}
