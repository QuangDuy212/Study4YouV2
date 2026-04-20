package com.study4you.course.controller;

import com.study4you.common.dto.ApiResponse;
import com.study4you.course.dto.PaymentRequest;
import com.study4you.course.dto.PaymentResponse;
import com.study4you.course.service.PaymentService;
import com.study4you.security.SecurityService;
import com.study4you.user.entity.User;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/payments")
@RequiredArgsConstructor
public class PaymentController {

    private final PaymentService paymentService;
    private final SecurityService securityService;

    /** Create a new PENDING payment */
    @PostMapping
    public ResponseEntity<ApiResponse<PaymentResponse>> createPayment(
            @Valid @RequestBody PaymentRequest request) {
        User user = securityService.getCurrentUser();
        PaymentResponse resp = paymentService.createPayment(request, user.getId());
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Payment initiated", resp));
    }

    /**
     * Confirm payment (mock flow / VNPay callback).
     * In a real integration this would validate signature and redirect URL.
     */
    @PostMapping("/{paymentId}/confirm")
    public ResponseEntity<ApiResponse<PaymentResponse>> confirmPayment(@PathVariable UUID paymentId) {
        User user = securityService.getCurrentUser();
        PaymentResponse resp = paymentService.confirmPayment(paymentId, user.getId());
        return ResponseEntity.ok(ApiResponse.success("Payment confirmed. You are now enrolled!", resp));
    }

    /** Current user payment history */
    @GetMapping("/history")
    public ResponseEntity<ApiResponse<List<PaymentResponse>>> getPaymentHistory() {
        User user = securityService.getCurrentUser();
        return ResponseEntity.ok(ApiResponse.success(paymentService.getPaymentHistory(user.getId())));
    }
}
