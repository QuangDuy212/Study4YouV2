package com.study4you.role.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Set;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class RoleRequest {
    
    @NotBlank(message = "Role name is required")
    private String name;

    private String description;

    private Set<UUID> permissionIds;
}
