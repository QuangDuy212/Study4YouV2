package com.study4you.ai.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.UUID;

@Data
public class GenerateUserRequest {

    @Min(value = 1, message = "Count must be at least 1")
    @Max(value = 20, message = "Count must not exceed 20")
    private int count;

    @NotNull(message = "defaultRoleId must not be null")
    private UUID defaultRoleId;

    @NotBlank(message = "Status must not be blank")
    private String status; // ACTIVE, INACTIVE, BANNED
}
