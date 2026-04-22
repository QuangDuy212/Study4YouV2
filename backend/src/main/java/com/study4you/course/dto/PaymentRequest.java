package com.study4you.course.dto;

import com.study4you.course.enums.PaymentMethod;
import jakarta.validation.constraints.*;
import lombok.*;

import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PaymentRequest {

    @NotNull(message = "Course ID is required")
    private UUID courseId;

    @NotNull(message = "Payment method is required")
    private PaymentMethod paymentMethod;

    private Boolean isVatRequired;
    private String companyName;
    private String taxCode;
}
