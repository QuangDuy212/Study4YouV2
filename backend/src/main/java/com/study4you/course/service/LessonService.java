package com.study4you.course.service;

import com.study4you.course.dto.LessonRequest;
import com.study4you.course.dto.LessonResponse;
import com.study4you.course.dto.SectionRequest;
import com.study4you.course.dto.SectionResponse;

import java.util.List;
import java.util.UUID;

public interface LessonService {

    SectionResponse createSection(UUID courseId, SectionRequest request);

    List<SectionResponse> getSectionsByCourse(UUID courseId);

    LessonResponse createLesson(UUID courseId, LessonRequest request);

    LessonResponse updateLesson(UUID lessonId, LessonRequest request);

    void deleteLesson(UUID lessonId);

    List<LessonResponse> getLessonsByCourse(UUID courseId, UUID currentUserId);

    /** Full lesson content (video url) — only for enrolled users or admin */
    LessonResponse getLessonById(UUID lessonId, UUID currentUserId);
}
