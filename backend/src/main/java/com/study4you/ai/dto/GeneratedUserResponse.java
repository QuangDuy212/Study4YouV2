package com.study4you.ai.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GeneratedUserResponse {

    private String name;
    private String email;
    private String password;
    private UUID roleId;
    private String status;
}
