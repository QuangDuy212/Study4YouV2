package com.study4you.auth.service;

import com.study4you.auth.dto.AuthResponse;
import com.study4you.auth.dto.LoginRequest;
import com.study4you.auth.dto.RegisterRequest;
import com.study4you.common.activity.UserActivityService;
import com.study4you.common.enums.UserStatus;
import com.study4you.common.exception.BadRequestException;
import com.study4you.permission.entity.Permission;
import com.study4you.role.entity.Role;
import com.study4you.security.CustomUserDetailsService;
import com.study4you.security.JwtUtil;
import com.study4you.user.entity.User;
import com.study4you.user.repository.UserRepository;
import com.study4you.role.repository.RoleRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    private final AuthenticationManager authenticationManager;
    private final CustomUserDetailsService userDetailsService;
    private final UserActivityService userActivityService;
    private final RoleRepository roleRepository;

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new BadRequestException("Email already exists");
        }

        User user = new User();
        user.setEmail(request.getEmail());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setFullName(request.getFullName());
        user.setStatus(UserStatus.ACTIVE);

        roleRepository.findByName("STUDENT").ifPresent(role -> user.setRoles(java.util.Collections.singleton(role)));

        User savedUser = userRepository.save(user);
        
        return generateAuthResponse(savedUser);
    }

    @Transactional(readOnly = true)
    public AuthResponse login(LoginRequest request) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword())
        );

        User user = userDetailsService.getUserByEmail(request.getEmail());

        userActivityService.logActivity(
                user.getId(),
                "LOGIN",
                "User logged in: " + user.getEmail(),
                "USER",
                user.getId()
        );

        return generateAuthResponse(user);
    }

    @Transactional(readOnly = true)
    public AuthResponse refreshToken(String refreshToken) {
        String username = jwtUtil.extractUsername(refreshToken);
        UserDetails userDetails = userDetailsService.loadUserByUsername(username);
        
        if (!jwtUtil.validateToken(refreshToken, userDetails)) {
            throw new BadRequestException("Invalid refresh token");
        }

        User user = userDetailsService.getUserByEmail(username);
        return generateAuthResponse(user);
    }

    private AuthResponse generateAuthResponse(User user) {
        List<String> roles = user.getRoles().stream()
                .map(Role::getName)
                .collect(Collectors.toList());

        List<String> permissions = user.getRoles().stream()
                .flatMap(role -> role.getPermissions().stream())
                .map(Permission::getName)
                .distinct()
                .collect(Collectors.toList());

        UserDetails userDetails = userDetailsService.loadUserByUsername(user.getEmail());
        String accessToken = jwtUtil.generateAccessToken(
                userDetails, 
                user.getId().toString(), 
                roles, 
                permissions
        );
        String refreshToken = jwtUtil.generateRefreshToken(user.getEmail());

        return new AuthResponse(
                accessToken,
                refreshToken,
                user.getId().toString(),
                user.getEmail(),
                user.getFullName(),
                roles,
                permissions
        );
    }
}
