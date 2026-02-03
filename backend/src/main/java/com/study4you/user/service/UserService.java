package com.study4you.user.service;

import com.study4you.common.dto.PageResponse;
import com.study4you.common.exception.BadRequestException;
import com.study4you.common.exception.ResourceNotFoundException;
import com.study4you.permission.entity.Permission;
import com.study4you.role.entity.Role;
import com.study4you.role.repository.RoleRepository;
import com.study4you.user.dto.ChangePasswordRequest;
import com.study4you.user.dto.UpdateProfileRequest;
import com.study4you.user.dto.UserRequest;
import com.study4you.user.dto.UserResponse;
import com.study4you.user.entity.User;
import com.study4you.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;

    @Transactional(readOnly = true)
    public PageResponse<UserResponse> getAllUsers(@org.springframework.lang.NonNull Pageable pageable) {
        Page<User> userPage = userRepository.findAll(pageable);
        List<UserResponse> users = userPage.getContent().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
        
        return new PageResponse<>(
                users,
                userPage.getNumber(),
                userPage.getSize(),
                userPage.getTotalElements(),
                userPage.getTotalPages(),
                userPage.isLast()
        );
    }

    @Transactional(readOnly = true)
    public UserResponse getUserById(@org.springframework.lang.NonNull UUID id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", id));
        return mapToResponse(user);
    }

    @Transactional
    public UserResponse createUser(UserRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new BadRequestException("Email already exists");
        }

        User user = new User();
        user.setEmail(request.getEmail());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setFullName(request.getFullName());
        user.setStatus(request.getStatus());

        if (request.getRoleIds() != null && !request.getRoleIds().isEmpty()) {
            @SuppressWarnings("null")
            Set<Role> roles = new HashSet<>(roleRepository.findAllById(request.getRoleIds()));
            user.setRoles(roles);
        }

        User savedUser = userRepository.save(user);
        return mapToResponse(savedUser);
    }

    @Transactional
    public UserResponse updateProfile(@org.springframework.lang.NonNull UUID id, UpdateProfileRequest request) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", id));

        if (!user.getEmail().equals(request.getEmail()) && 
            userRepository.existsByEmail(request.getEmail())) {
            throw new BadRequestException("Email already exists");
        }

        user.setEmail(request.getEmail());
        user.setFullName(request.getFullName());
        user.setStatus(request.getStatus());

        if (request.getRoleIds() != null) {
            @SuppressWarnings("null")
            Set<Role> roles = new HashSet<>(roleRepository.findAllById(request.getRoleIds()));
            user.setRoles(roles);
        }

        User updatedUser = userRepository.save(user);
        return mapToResponse(updatedUser);
    }

    @Transactional
    public void updatePassword(@org.springframework.lang.NonNull UUID id, ChangePasswordRequest request) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", id));

        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);
    }

    @Transactional
    public UserResponse updateUser(@org.springframework.lang.NonNull UUID id, UserRequest request) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", id));

        if (!user.getEmail().equals(request.getEmail()) && 
            userRepository.existsByEmail(request.getEmail())) {
            throw new BadRequestException("Email already exists");
        }

        user.setEmail(request.getEmail());
        if (request.getPassword() != null && !request.getPassword().isEmpty()) {
            user.setPassword(passwordEncoder.encode(request.getPassword()));
        }
        user.setFullName(request.getFullName());
        user.setStatus(request.getStatus());

        if (request.getRoleIds() != null) {
            @SuppressWarnings("null")
            Set<Role> roles = new HashSet<>(roleRepository.findAllById(request.getRoleIds()));
            user.setRoles(roles);
        }

        User updatedUser = userRepository.save(user);
        return mapToResponse(updatedUser);
    }

    @Transactional
    public void deleteUser(@org.springframework.lang.NonNull UUID id) {
        if (!userRepository.existsById(id)) {
            throw new ResourceNotFoundException("User", "id", id);
        }
        userRepository.deleteById(id);
    }

    private UserResponse mapToResponse(User user) {
        UserResponse response = new UserResponse();
        response.setId(user.getId());
        response.setEmail(user.getEmail());
        response.setFullName(user.getFullName());
        response.setStatus(user.getStatus());
        response.setCreatedAt(user.getCreatedAt());
        response.setUpdatedAt(user.getUpdatedAt());
        
        response.setRoles(user.getRoles().stream()
                .map(this::mapRoleToResponse)
                .collect(Collectors.toSet()));
        
        return response;
    }

    private com.study4you.role.dto.RoleResponse mapRoleToResponse(Role role) {
        com.study4you.role.dto.RoleResponse response = new com.study4you.role.dto.RoleResponse();
        response.setId(role.getId());
        response.setName(role.getName());
        response.setDescription(role.getDescription());
        response.setCreatedAt(role.getCreatedAt());
        response.setUpdatedAt(role.getUpdatedAt());
        
        response.setPermissions(role.getPermissions().stream()
                .map(this::mapPermissionToResponse)
                .collect(Collectors.toSet()));
        
        return response;
    }

    private com.study4you.permission.dto.PermissionResponse mapPermissionToResponse(Permission permission) {
        com.study4you.permission.dto.PermissionResponse response = 
            new com.study4you.permission.dto.PermissionResponse();
        response.setId(permission.getId());
        response.setName(permission.getName());
        response.setPageAllow(permission.getPageAllow());
        response.setCreatedAt(permission.getCreatedAt());
        response.setUpdatedAt(permission.getUpdatedAt());
        return response;
    }
}
