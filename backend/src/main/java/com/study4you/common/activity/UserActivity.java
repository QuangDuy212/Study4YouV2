package com.study4you.common.activity;

import com.study4you.common.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.UUID;

@Entity
@Table(
    name = "user_activities",
    indexes = {
        @Index(name = "idx_user_activities_created_at", columnList = "created_at")
    }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class UserActivity extends BaseEntity {

    @Column(name = "user_id")
    private UUID userId;

    @Column(name = "action_type", nullable = false, length = 50)
    private String actionType;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Column(name = "target_type", length = 50)
    private String targetType;

    @Column(name = "target_id")
    private UUID targetId;
}
