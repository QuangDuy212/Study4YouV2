package com.study4you.role.service;

import com.study4you.common.dto.PageResponse;
import com.study4you.common.exception.BadRequestException;
import com.study4you.common.exception.ResourceNotFoundException;
import com.study4you.permission.entity.Permission;
import com.study4you.permission.repository.PermissionRepository;
import com.study4you.role.dto.RoleRequest;
import com.study4you.role.dto.RoleResponse;
import com.study4you.role.entity.Role;
import com.study4you.role.repository.RoleRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class RoleService {

    private final RoleRepository roleRepository;
    private final PermissionRepository permissionRepository;

    @Transactional(readOnly = true)
    public PageResponse<RoleResponse> getAllRoles(@org.springframework.lang.NonNull Pageable pageable) {
        Page<Role> rolePage = roleRepository.findAll(pageable);
        List<RoleResponse> roles = rolePage.getContent().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
        
        return new PageResponse<>(
                roles,
                rolePage.getNumber(),
                rolePage.getSize(),
                rolePage.getTotalElements(),
                rolePage.getTotalPages(),
                rolePage.isLast()
        );
    }

    @Transactional(readOnly = true)
    public RoleResponse getRoleById(@org.springframework.lang.NonNull UUID id) {
        Role role = roleRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Role", "id", id));
        return mapToResponse(role);
    }

    @Transactional
    public RoleResponse createRole(RoleRequest request) {
        if (roleRepository.existsByName(request.getName())) {
            throw new BadRequestException("Role name already exists");
        }

        Role role = new Role();
        role.setName(request.getName());
        role.setDescription(request.getDescription());

        if (request.getPermissionIds() != null && !request.getPermissionIds().isEmpty()) {
            @SuppressWarnings("null")
            Set<Permission> permissions = new HashSet<>(
                permissionRepository.findAllById(request.getPermissionIds())
            );
            role.setPermissions(permissions);
        }

        Role savedRole = roleRepository.save(role);
        return mapToResponse(savedRole);
    }

    @Transactional
    public RoleResponse updateRole(@org.springframework.lang.NonNull UUID id, RoleRequest request) {
        Role role = roleRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Role", "id", id));

        if (!role.getName().equals(request.getName()) && 
            roleRepository.existsByName(request.getName())) {
            throw new BadRequestException("Role name already exists");
        }

        role.setName(request.getName());
        role.setDescription(request.getDescription());

        if (request.getPermissionIds() != null) {
            @SuppressWarnings("null")
            Set<Permission> permissions = new HashSet<>(
                permissionRepository.findAllById(request.getPermissionIds())
            );
            role.setPermissions(permissions);
        }

        Role updatedRole = roleRepository.save(role);
        return mapToResponse(updatedRole);
    }

    @Transactional
    public void deleteRole(@org.springframework.lang.NonNull UUID id) {
        if (!roleRepository.existsById(id)) {
            throw new ResourceNotFoundException("Role", "id", id);
        }
        roleRepository.deleteById(id);
    }

    private RoleResponse mapToResponse(Role role) {
        RoleResponse response = new RoleResponse();
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
