package com.study4you.common.activity;

import com.study4you.common.dto.PageResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/admin/activities")
@RequiredArgsConstructor
public class UserActivityController {

    private final UserActivityService userActivityService;

    /**
     * GET /api/v1/admin/activities/recent
     * Returns paginated user activity logs.
     * Only accessible by admin users.
     */
    @GetMapping("/recent")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<PageResponse<UserActivityDTO>> getRecentActivities(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(userActivityService.getRecentActivities(page, size));
    }
}
