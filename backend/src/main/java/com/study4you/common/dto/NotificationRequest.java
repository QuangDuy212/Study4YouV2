package com.study4you.common.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class NotificationRequest {
    private String title;
    private String content;
    private String type;
    private UUID userId; // Optional, if null, send to all
}
