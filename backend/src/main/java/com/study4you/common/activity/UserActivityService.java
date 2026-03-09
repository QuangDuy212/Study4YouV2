package com.study4you.common.activity;

import com.study4you.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class UserActivityService {

    private final UserActivityRepository userActivityRepository;
    private final UserRepository userRepository;

    /**
     * Log a user activity. Always runs in its own transaction (REQUIRES_NEW)
     * so that a logging failure never rolls back the calling business transaction,
     * and so it can be called from read-only transactions.
     */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void logActivity(UUID userId, String actionType, String description,
                            String targetType, UUID targetId) {
        try {
            UserActivity activity = new UserActivity();
            activity.setUserId(userId);
            activity.setActionType(actionType);
            activity.setDescription(description);
            activity.setTargetType(targetType);
            activity.setTargetId(targetId);
            userActivityRepository.save(activity);
        } catch (Exception e) {
            log.error("Failed to log user activity: actionType={}, userId={}", actionType, userId, e);
        }
    }

    /**
     * Returns the 20 most recent activity records, enriched with user names.
     */
    @Transactional(readOnly = true)
    public List<UserActivityDTO> getRecentActivities() {
        return userActivityRepository.findTop20ByOrderByCreatedAtDesc()
                .stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    private UserActivityDTO mapToDTO(UserActivity activity) {
        String userName = "Unknown";
        if (activity.getUserId() != null) {
            userName = userRepository.findById(activity.getUserId())
                    .map(user -> user.getFullName())
                    .orElse("Unknown");
        }

        return UserActivityDTO.builder()
                .userName(userName)
                .actionType(activity.getActionType())
                .description(activity.getDescription())
                .targetType(activity.getTargetType())
                .targetId(activity.getTargetId())
                .createdAt(activity.getCreatedAt())
                .build();
    }
}
