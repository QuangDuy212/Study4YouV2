package com.study4you.course.repository;

import com.study4you.course.entity.Enrollment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface EnrollmentRepository extends JpaRepository<Enrollment, UUID> {

    Optional<Enrollment> findByUserIdAndCourseId(UUID userId, UUID courseId);

    boolean existsByUserIdAndCourseId(UUID userId, UUID courseId);

    @org.springframework.data.jpa.repository.Query("SELECT e FROM Enrollment e JOIN e.course c WHERE e.user.id = :userId AND c.deletedAt IS NULL AND c.status != com.study4you.course.enums.CourseStatus.DELETED ORDER BY e.createdAt DESC")
    List<Enrollment> findActiveEnrollmentsByUserId(UUID userId);

    boolean existsByCourseId(UUID courseId);
}
