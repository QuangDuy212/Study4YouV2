package com.study4you.course.repository;

import com.study4you.course.entity.Lesson;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface LessonRepository extends JpaRepository<Lesson, UUID> {

    List<Lesson> findByCourseIdOrderByOrderIndexAsc(UUID courseId);

    List<Lesson> findBySectionIdOrderByOrderIndexAsc(UUID sectionId);

    long countByCourseId(UUID courseId);
}
