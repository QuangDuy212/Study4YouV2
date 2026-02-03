package com.study4you.permission.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class PermissionResponse {
    private UUID id;
    private String name;
    private List<String> pageAllow;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
