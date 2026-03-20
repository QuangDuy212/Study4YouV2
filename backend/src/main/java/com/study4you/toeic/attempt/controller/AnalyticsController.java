package com.study4you.toeic.attempt.controller;

import com.study4you.common.dto.AnalyticsResponse;
import com.study4you.toeic.attempt.service.AnalyticsService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/admin/analytics")
@RequiredArgsConstructor
public class AnalyticsController {

    private final AnalyticsService analyticsService;

    @GetMapping
    @PreAuthorize("hasAuthority('VIEW_ANALYTICS')")
    public ResponseEntity<AnalyticsResponse> getAnalyticsStats() {
        return ResponseEntity.ok(analyticsService.getAnalyticsStats());
    }
}
