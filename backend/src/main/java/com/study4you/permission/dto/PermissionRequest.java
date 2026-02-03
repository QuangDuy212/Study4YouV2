package com.study4you.permission.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class PermissionRequest {
    
    @NotBlank(message = "Permission name is required")
    private String name;

    private List<String> pageAllow;
}
