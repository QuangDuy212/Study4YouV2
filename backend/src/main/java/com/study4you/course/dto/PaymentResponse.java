package com.study4you.course.dto;

import com.study4you.course.enums.PaymentMethod;
import com.study4you.course.enums.PaymentStatus;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PaymentResponse {

    private UUID id;
    private UUID userId;
    private UUID courseId;
    private String courseTitle;
    private BigDecimal amount;
    private PaymentStatus status;
    private PaymentMethod paymentMethod;
    private String transactionRef;
    private LocalDateTime createdAt;
}
