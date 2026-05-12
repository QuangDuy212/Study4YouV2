package com.study4you.role.dto;

import com.study4you.permission.dto.PermissionResponse;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.Set;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class RoleResponse {
    private UUID id;
    private String name;
    private String description;
    private Boolean active;
    private Set<PermissionResponse> permissions;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
