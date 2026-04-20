package com.study4you.course.repository;

import com.study4you.course.entity.Payment;
import com.study4you.course.enums.PaymentStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface PaymentRepository extends JpaRepository<Payment, UUID> {

    List<Payment> findByUserIdOrderByCreatedAtDesc(UUID userId);

    Optional<Payment> findByUserIdAndCourseIdAndStatus(UUID userId, UUID courseId, PaymentStatus status);

    boolean existsByUserIdAndCourseIdAndStatus(UUID userId, UUID courseId, PaymentStatus status);
}
