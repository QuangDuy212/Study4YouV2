package com.study4you.common.activity;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserActivityDTO {

    private String userName;

    private String actionType;

    private String description;

    private String targetType;

    private UUID targetId;

    private LocalDateTime createdAt;
}
