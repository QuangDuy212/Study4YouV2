package com.study4you.user.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UserSettingsResponse {
    private String language;
    private String theme;
    private boolean notificationsEnabled;
}
