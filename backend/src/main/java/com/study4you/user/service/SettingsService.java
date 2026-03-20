package com.study4you.user.service;

import com.study4you.security.SecurityService;
import com.study4you.user.dto.UserSettingsResponse;
import com.study4you.user.entity.User;
import com.study4you.user.entity.UserSettings;
import com.study4you.user.repository.UserSettingsRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class SettingsService {

    private final UserSettingsRepository userSettingsRepository;
    private final SecurityService securityService;

    @Transactional(readOnly = true)
    public UserSettingsResponse getUserSettings() {
        User user = securityService.getCurrentUser();
        UserSettings settings = getOrCreateSettings(user);
        return mapToResponse(settings);
    }

    @Transactional
    public UserSettingsResponse updateUserSettings(UserSettingsResponse request) {
        User user = securityService.getCurrentUser();
        UserSettings settings = getOrCreateSettings(user);

        settings.setLanguage(request.getLanguage());
        settings.setTheme(request.getTheme());
        settings.setNotificationsEnabled(request.isNotificationsEnabled());

        UserSettings savedSettings = userSettingsRepository.save(settings);
        return mapToResponse(savedSettings);
    }

    private UserSettings getOrCreateSettings(User user) {
        return userSettingsRepository.findByUserId(user.getId())
                .orElseGet(() -> {
                    UserSettings newSettings = new UserSettings();
                    newSettings.setUser(user);
                    return userSettingsRepository.save(newSettings);
                });
    }

    private UserSettingsResponse mapToResponse(UserSettings settings) {
        return new UserSettingsResponse(
                settings.getLanguage(),
                settings.getTheme(),
                settings.isNotificationsEnabled()
        );
    }
}
