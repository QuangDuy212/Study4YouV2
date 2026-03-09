package com.study4you.common.activity;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/admin/activities")
@RequiredArgsConstructor
public class UserActivityController {

    private final UserActivityService userActivityService;

    /**
     * GET /api/v1/admin/activities/recent
     * Returns the 20 most recent user activity logs.
     * Only accessible by admin users.
     */
    @GetMapping("/recent")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<UserActivityDTO>> getRecentActivities() {
        return ResponseEntity.ok(userActivityService.getRecentActivities());
    }
}
