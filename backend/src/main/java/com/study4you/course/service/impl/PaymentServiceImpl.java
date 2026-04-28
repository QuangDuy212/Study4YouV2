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
import com.study4you.config.VNPayConfig;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.text.SimpleDateFormat;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
@Slf4j
public class PaymentServiceImpl implements PaymentService {

    private final PaymentRepository paymentRepository;
    private final CourseRepository courseRepository;
    private final UserRepository userRepository;
    private final EnrollmentRepository enrollmentRepository;
    private final EnrollmentService enrollmentService;

    @Override
    public PaymentResponse createPayment(PaymentRequest request, UUID userId, HttpServletRequest httpRequest) {
        Course course = courseRepository.findById(request.getCourseId())
                .orElseThrow(() -> new ResourceNotFoundException("Course not found: " + request.getCourseId()));

        if (enrollmentRepository.existsByUserIdAndCourseId(userId, course.getId())) {
            throw new BadRequestException("You are already enrolled in this course");
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + userId));

        // Free courses: auto-confirm
        BigDecimal amount = course.getPrice();
        
        // Handle existing pending payment: update it instead of throwing error
        Optional<Payment> existingPending = paymentRepository.findByUserIdAndCourseIdAndStatus(userId, course.getId(), PaymentStatus.PENDING);
        
        Payment payment;
        if (existingPending.isPresent()) {
            payment = existingPending.get();
            payment.setReferenceCode(generateReferenceCode(user.getEmail()));
            payment.setAmount(amount);
            payment.setIsVatRequired(request.getIsVatRequired());
            payment.setCompanyName(request.getCompanyName());
            payment.setTaxCode(request.getTaxCode());
            log.info("UPDATING EXISTING PENDING PAYMENT: ID={}", payment.getId());
        } else {
            payment = Payment.builder()
                    .user(user)
                    .course(course)
                    .amount(amount)
                    .status(amount.compareTo(BigDecimal.ZERO) == 0 ? PaymentStatus.SUCCESS : PaymentStatus.PENDING)
                    .paymentMethod(request.getPaymentMethod())
                    .transactionRef(UUID.randomUUID().toString())
                    .referenceCode(generateReferenceCode(user.getEmail()))
                    .isVatRequired(request.getIsVatRequired())
                    .companyName(request.getCompanyName())
                    .taxCode(request.getTaxCode())
                    .build();
            log.info("CREATING NEW PAYMENT: User={}, Course={}", user.getEmail(), course.getTitle());
        }
        log.info("CREATING PAYMENT: User={}, Course={}, Amount={}, Method={}", user.getEmail(), course.getTitle(), amount, request.getPaymentMethod());
        payment = paymentRepository.save(payment);
        log.info("PAYMENT SAVED SUCCESSFULLY: ID={}, Status={}", payment.getId(), payment.getStatus());

        // Auto-enroll if free
        if (payment.getStatus() == PaymentStatus.SUCCESS) {
            enrollmentService.enrollCourse(course.getId(), userId);
            return toResponse(payment);
        }

        PaymentResponse response = toResponse(payment);

        // VNPay URL generation
        if (request.getPaymentMethod() == com.study4you.course.enums.PaymentMethod.VNPAY) {
            String vnp_Version = "2.1.0";
            String vnp_Command = "pay";
            String vnp_TmnCode = VNPayConfig.vnp_TmnCode;
            
            Map<String, String> vnp_Params = new HashMap<>();
            vnp_Params.put("vnp_Version", vnp_Version);
            vnp_Params.put("vnp_Command", vnp_Command);
            vnp_Params.put("vnp_TmnCode", vnp_TmnCode);
            vnp_Params.put("vnp_Amount", String.valueOf(amount.multiply(new BigDecimal(100)).longValue()));
            vnp_Params.put("vnp_CurrCode", "VND");
            vnp_Params.put("vnp_TxnRef", payment.getTransactionRef());
            vnp_Params.put("vnp_OrderInfo", "Thanh toan khoa hoc: " + course.getTitle());
            vnp_Params.put("vnp_OrderType", "other");
            vnp_Params.put("vnp_Locale", "vn");
            vnp_Params.put("vnp_ReturnUrl", VNPayConfig.vnp_ReturnUrl + "?paymentId=" + payment.getId());
            vnp_Params.put("vnp_IpAddr", VNPayConfig.getIpAddress(httpRequest));

            Calendar cStr = Calendar.getInstance(TimeZone.getTimeZone("Etc/GMT+7"));
            SimpleDateFormat formatter = new SimpleDateFormat("yyyyMMddHHmmss");
            String vnp_CreateDate = formatter.format(cStr.getTime());
            vnp_Params.put("vnp_CreateDate", vnp_CreateDate);

            cStr.add(Calendar.MINUTE, 15);
            String vnp_ExpireDate = formatter.format(cStr.getTime());
            vnp_Params.put("vnp_ExpireDate", vnp_ExpireDate);

            List<String> fieldNames = new ArrayList<>(vnp_Params.keySet());
            Collections.sort(fieldNames);
            StringBuilder hashData = new StringBuilder();
            StringBuilder query = new StringBuilder();
            Iterator<String> itr = fieldNames.iterator();
            while (itr.hasNext()) {
                String fieldName = itr.next();
                String fieldValue = vnp_Params.get(fieldName);
                if ((fieldValue != null) && (fieldValue.length() > 0)) {
                    //Build hash data
                    hashData.append(fieldName);
                    hashData.append('=');
                    hashData.append(URLEncoder.encode(fieldValue, StandardCharsets.US_ASCII));
                    //Build query
                    query.append(URLEncoder.encode(fieldName, StandardCharsets.US_ASCII));
                    query.append('=');
                    query.append(URLEncoder.encode(fieldValue, StandardCharsets.US_ASCII));
                    if (itr.hasNext()) {
                        query.append('&');
                        hashData.append('&');
                    }
                }
            }
            String queryUrl = query.toString();
            String vnp_SecureHash = VNPayConfig.hmacSHA512(VNPayConfig.vnp_HashSecret, hashData.toString());
            queryUrl += "&vnp_SecureHash=" + vnp_SecureHash;
            String paymentUrl = VNPayConfig.vnp_PayUrl + "?" + queryUrl;
            response.setPaymentUrl(paymentUrl);
        }

        return response;
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

    @Override
    @Transactional(readOnly = true)
    public List<PaymentResponse> getAllPayments() {
        List<Payment> payments = paymentRepository.findAll();
        List<PaymentResponse> responses = new java.util.ArrayList<>();
        for (Payment p : payments) {
            responses.add(toResponse(p));
        }
        // Manual sort by date
        responses.sort((a, b) -> b.getCreatedAt().compareTo(a.getCreatedAt()));
        return responses;
    }

    @Override
    @Transactional
    public PaymentResponse adminConfirmPayment(UUID paymentId) {
        Payment payment = paymentRepository.findById(paymentId)
                .orElseThrow(() -> new ResourceNotFoundException("Payment not found: " + paymentId));
        
        if (payment.getStatus() == PaymentStatus.SUCCESS) {
            return toResponse(payment);
        }

        payment.setStatus(PaymentStatus.SUCCESS);
        paymentRepository.save(payment);
        
        // Enroll user after admin confirmation
        UUID userId = payment.getUser().getId();
        UUID courseId = payment.getCourse().getId();
        if (!enrollmentRepository.existsByUserIdAndCourseId(userId, courseId)) {
            enrollmentService.enrollCourse(courseId, userId);
        }
        
        return toResponse(payment);
    }

    @Override
    @Transactional(readOnly = true)
    public byte[] exportPaymentsAsCsv() {
        List<Payment> payments = paymentRepository.findAll();
        StringBuilder csv = new StringBuilder();
        java.text.DecimalFormat df = new java.text.DecimalFormat("#,### VNĐ");
        csv.append("PaymentID,Course,User,Amount,Method,ReferenceCode,Status,VATRequested,CompanyName,TaxCode,TransactionRef,CreatedAt\n");
        for (Payment p : payments) {
            csv.append(p.getId()).append(",")
               .append("\"").append(p.getCourse().getTitle()).append("\",")
               .append(p.getUser().getEmail()).append(",")
               .append("\"").append(df.format(p.getAmount())).append("\",")
               .append(p.getPaymentMethod()).append(",")
               .append(p.getReferenceCode()).append(",")
               .append(p.getStatus()).append(",")
               .append(p.getIsVatRequired()).append(",")
               .append("\"").append(p.getCompanyName() != null ? p.getCompanyName() : "").append("\",")
               .append("\"").append(p.getTaxCode() != null ? p.getTaxCode() : "").append("\",")
               .append(p.getTransactionRef()).append(",")
               .append(p.getCreatedAt()).append("\n");
        }
        return ("\uFEFF" + csv.toString()).getBytes(java.nio.charset.StandardCharsets.UTF_8);
    }

    // ------------------------------------------------------------------ HELPERS

    private PaymentResponse toResponse(Payment payment) {
        PaymentResponse response = PaymentResponse.builder()
                .id(payment.getId())
                .amount(payment.getAmount())
                .status(payment.getStatus())
                .paymentMethod(payment.getPaymentMethod())
                .transactionRef(payment.getTransactionRef())
                .referenceCode(payment.getReferenceCode())
                .createdAt(payment.getCreatedAt())
                .isVatRequired(payment.getIsVatRequired())
                .companyName(payment.getCompanyName())
                .taxCode(payment.getTaxCode())
                .build();

        if (payment.getUser() != null) {
            response.setUserId(payment.getUser().getId());
        }
        if (payment.getCourse() != null) {
            response.setCourseId(payment.getCourse().getId());
            response.setCourseTitle(payment.getCourse().getTitle());
        }

        return response;
    }

    private String generateReferenceCode(String email) {
        String alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
        // Use email prefix (before @) + a short random code
        String prefix = email.split("@")[0];
        if (prefix.length() > 10) prefix = prefix.substring(0, 10);
        
        StringBuilder sb = new StringBuilder(prefix.toUpperCase() + " ");
        Random random = new Random();
        for (int i = 0; i < 4; i++) {
            sb.append(alphabet.charAt(random.nextInt(alphabet.length())));
        }
        return sb.toString();
    }
}
