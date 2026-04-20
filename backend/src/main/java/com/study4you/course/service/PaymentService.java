package com.study4you.course.service;

import com.study4you.course.dto.PaymentRequest;
import com.study4you.course.dto.PaymentResponse;

import java.util.List;
import java.util.UUID;

public interface PaymentService {

    PaymentResponse createPayment(PaymentRequest request, UUID userId);

    /** Mock/VNPay callback: mark payment SUCCESS and auto-enroll */
    PaymentResponse confirmPayment(UUID paymentId, UUID userId);

    List<PaymentResponse> getPaymentHistory(UUID userId);
}
