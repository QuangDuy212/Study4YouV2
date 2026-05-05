package com.study4you.course.service;

import com.study4you.course.dto.CourseRequest;
import com.study4you.course.dto.CourseResponse;
import com.study4you.common.dto.PageResponse;
import org.springframework.data.domain.Pageable;

import java.util.UUID;

public interface CourseService {

    CourseResponse createCourse(CourseRequest request);

    CourseResponse updateCourse(UUID id, CourseRequest request);

    void deleteCourse(UUID id);

    CourseResponse restoreCourse(UUID id);

    CourseResponse publishCourse(UUID id);

    PageResponse<CourseResponse> getAllPublishedCourses(String keyword, Pageable pageable);

    /** Admin: all courses regardless of status */
    PageResponse<CourseResponse> getAllCourses(Pageable pageable);

    CourseResponse getCourseDetail(UUID id, UUID currentUserId);
}
