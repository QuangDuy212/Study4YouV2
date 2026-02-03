package com.study4you.permission.service;

import com.study4you.common.dto.PageResponse;
import com.study4you.common.exception.BadRequestException;
import com.study4you.common.exception.ResourceNotFoundException;
import com.study4you.permission.dto.PermissionRequest;
import com.study4you.permission.dto.PermissionResponse;
import com.study4you.permission.entity.Permission;
import com.study4you.permission.repository.PermissionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class PermissionService {

    private final PermissionRepository permissionRepository;

    @Transactional(readOnly = true)
    public PageResponse<PermissionResponse> getAllPermissions(@org.springframework.lang.NonNull Pageable pageable) {
        Page<Permission> permissionPage = permissionRepository.findAll(pageable);
        List<PermissionResponse> permissions = permissionPage.getContent().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
        
        return new PageResponse<>(
                permissions,
                permissionPage.getNumber(),
                permissionPage.getSize(),
                permissionPage.getTotalElements(),
                permissionPage.getTotalPages(),
                permissionPage.isLast()
        );
    }

    @Transactional(readOnly = true)
    public PermissionResponse getPermissionById(@org.springframework.lang.NonNull UUID id) {
        Permission permission = permissionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Permission", "id", id));
        return mapToResponse(permission);
    }

    @Transactional
    public PermissionResponse createPermission(PermissionRequest request) {
        if (permissionRepository.existsByName(request.getName())) {
            throw new BadRequestException("Permission name already exists");
        }

        Permission permission = new Permission();
        permission.setName(request.getName());
        permission.setPageAllow(request.getPageAllow());

        Permission savedPermission = permissionRepository.save(permission);
        return mapToResponse(savedPermission);
    }

    @Transactional
    public PermissionResponse updatePermission(@org.springframework.lang.NonNull UUID id, PermissionRequest request) {
        Permission permission = permissionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Permission", "id", id));

        if (!permission.getName().equals(request.getName()) && 
            permissionRepository.existsByName(request.getName())) {
            throw new BadRequestException("Permission name already exists");
        }

        permission.setName(request.getName());
        permission.setPageAllow(request.getPageAllow());

        Permission updatedPermission = permissionRepository.save(permission);
        return mapToResponse(updatedPermission);
    }

    @Transactional
    public void deletePermission(@org.springframework.lang.NonNull UUID id) {
        if (!permissionRepository.existsById(id)) {
            throw new ResourceNotFoundException("Permission", "id", id);
        }
        permissionRepository.deleteById(id);
    }

    private PermissionResponse mapToResponse(Permission permission) {
        PermissionResponse response = new PermissionResponse();
        response.setId(permission.getId());
        response.setName(permission.getName());
        response.setPageAllow(permission.getPageAllow());
        response.setCreatedAt(permission.getCreatedAt());
        response.setUpdatedAt(permission.getUpdatedAt());
        return response;
    }
}
