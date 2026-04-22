package com.study4you.course.entity;

import com.study4you.common.entity.BaseEntity;
import com.study4you.course.enums.PaymentMethod;
import com.study4you.course.enums.PaymentStatus;
import com.study4you.user.entity.User;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;

@Entity
@Table(name = "payments")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Payment extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "course_id", nullable = false)
    private Course course;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal amount;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, columnDefinition = "varchar(255)")
    @Builder.Default
    private PaymentStatus status = PaymentStatus.PENDING;

    @Enumerated(EnumType.STRING)
    @Column(name = "payment_method", nullable = false, columnDefinition = "varchar(255)")
    @Builder.Default
    private PaymentMethod paymentMethod = PaymentMethod.MOCK;

    /** External transaction reference (VNPay txn ID, etc.) */
    private String transactionRef;

    /** Short human-readable code for manual transfer content (e.g., S4Y-12345) */
    @Column(unique = true, length = 100)
    private String referenceCode;
}
