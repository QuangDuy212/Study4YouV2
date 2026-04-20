package com.study4you.course.service.impl;

import com.study4you.common.exception.BadRequestException;
import com.study4you.common.exception.ResourceNotFoundException;
import com.study4you.course.dto.PaymentRequest;
import com.study4you.course.dto.PaymentResponse;
import com.study4you.course.entity.Course;
import com.study4you.course.entity.Payment;
import com.study4you.course.enums.PaymentStatus;
import com.study4you.course.repository.CourseRepository;
import com.study4you.course.repository.EnrollmentRepository;
import com.study4you.course.repository.PaymentRepository;
import com.study4you.course.service.EnrollmentService;
import com.study4you.course.service.PaymentService;
import com.study4you.user.entity.User;
import com.study4you.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class PaymentServiceImpl implements PaymentService {

    private final PaymentRepository paymentRepository;
    private final CourseRepository courseRepository;
    private final UserRepository userRepository;
    private final EnrollmentRepository enrollmentRepository;
    private final EnrollmentService enrollmentService;

    @Override
    public PaymentResponse createPayment(PaymentRequest request, UUID userId) {
        Course course = courseRepository.findById(request.getCourseId())
                .orElseThrow(() -> new ResourceNotFoundException("Course not found: " + request.getCourseId()));

        // Prevent duplicate active payment
        if (paymentRepository.existsByUserIdAndCourseIdAndStatus(userId, course.getId(), PaymentStatus.PENDING)) {
            throw new BadRequestException("A pending payment already exists for this course. Please confirm or cancel it.");
        }

        if (enrollmentRepository.existsByUserIdAndCourseId(userId, course.getId())) {
            throw new BadRequestException("You are already enrolled in this course");
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + userId));

        // Free courses: auto-confirm
        BigDecimal amount = course.getPrice();
        Payment payment = Payment.builder()
                .user(user)
                .course(course)
                .amount(amount)
                .status(amount.compareTo(BigDecimal.ZERO) == 0 ? PaymentStatus.SUCCESS : PaymentStatus.PENDING)
                .paymentMethod(request.getPaymentMethod())
                .transactionRef(UUID.randomUUID().toString())
                .build();
        payment = paymentRepository.save(payment);

        // Auto-enroll if free
        if (payment.getStatus() == PaymentStatus.SUCCESS) {
            enrollmentService.enrollCourse(course.getId(), userId);
        }

        return toResponse(payment);
    }

    @Override
    public PaymentResponse confirmPayment(UUID paymentId, UUID userId) {
        Payment payment = paymentRepository.findById(paymentId)
                .orElseThrow(() -> new ResourceNotFoundException("Payment not found: " + paymentId));

        if (!payment.getUser().getId().equals(userId)) {
            throw new BadRequestException("This payment does not belong to you");
        }
        if (payment.getStatus() != PaymentStatus.PENDING) {
            throw new BadRequestException("Payment is not in PENDING state");
        }

        // Mock: always succeed
        payment.setStatus(PaymentStatus.SUCCESS);
        paymentRepository.save(payment);

        // Auto-enroll user
        if (!enrollmentRepository.existsByUserIdAndCourseId(userId, payment.getCourse().getId())) {
            enrollmentService.enrollCourse(payment.getCourse().getId(), userId);
        }

        return toResponse(payment);
    }

    @Override
    @Transactional(readOnly = true)
    public List<PaymentResponse> getPaymentHistory(UUID userId) {
        return paymentRepository.findByUserIdOrderByCreatedAtDesc(userId)
                .stream().map(this::toResponse).collect(Collectors.toList());
    }

    // ------------------------------------------------------------------ HELPERS

    private PaymentResponse toResponse(Payment payment) {
        return PaymentResponse.builder()
                .id(payment.getId())
                .userId(payment.getUser().getId())
                .courseId(payment.getCourse().getId())
                .courseTitle(payment.getCourse().getTitle())
                .amount(payment.getAmount())
                .status(payment.getStatus())
                .paymentMethod(payment.getPaymentMethod())
                .transactionRef(payment.getTransactionRef())
                .createdAt(payment.getCreatedAt())
                .build();
    }
}
