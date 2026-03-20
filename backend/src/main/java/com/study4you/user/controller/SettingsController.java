package com.study4you.user.controller;

import com.study4you.common.dto.ApiResponse;
import com.study4you.user.dto.UserSettingsResponse;
import com.study4you.user.service.SettingsService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/settings")
@RequiredArgsConstructor
public class SettingsController {

    private final SettingsService settingsService;

    @GetMapping("/me")
    public ResponseEntity<ApiResponse<UserSettingsResponse>> getUserSettings() {
        UserSettingsResponse settings = settingsService.getUserSettings();
        return ResponseEntity.ok(ApiResponse.success(settings));
    }

    @PutMapping("/me")
    public ResponseEntity<ApiResponse<UserSettingsResponse>> updateUserSettings(
            @Valid @RequestBody UserSettingsResponse request
    ) {
        UserSettingsResponse settings = settingsService.updateUserSettings(request);
        return ResponseEntity.ok(ApiResponse.success("Settings updated successfully", settings));
    }
}
