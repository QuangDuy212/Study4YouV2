package com.study4you.auth.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AuthResponse {
    private String accessToken;
    private String refreshToken;
    private String tokenType = "Bearer";
    private String userId;
    private String email;
    private String fullName;
    private List<String> roles;
    private List<String> permissions;

    public AuthResponse(String accessToken, String refreshToken, String userId, 
                       String email, String fullName, List<String> roles, List<String> permissions) {
        this.accessToken = accessToken;
        this.refreshToken = refreshToken;
        this.userId = userId;
        this.email = email;
        this.fullName = fullName;
        this.roles = roles;
        this.permissions = permissions;
    }
}
