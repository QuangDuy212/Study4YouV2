package com.study4you.common.service;

import com.study4you.common.dto.NotificationResponse;
import com.study4you.common.entity.Notification;
import com.study4you.common.repository.NotificationRepository;
import com.study4you.security.SecurityService;
import com.study4you.user.entity.User;
import com.study4you.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;
    private final SecurityService securityService;

    @Transactional(readOnly = true)
    public List<NotificationResponse> getMyNotifications() {
        User user = securityService.getCurrentUser();
        return notificationRepository.findAllByUserIdOrderByCreatedAtDesc(user.getId())
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public long getUnreadCount() {
        User user = securityService.getCurrentUser();
        return notificationRepository.countByUserIdAndIsReadFalse(user.getId());
    }

    @Transactional
    public void markAsRead(UUID notificationId) {
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new RuntimeException("Notification not found"));
        
        // Ensure the notification belongs to the current user
        User user = securityService.getCurrentUser();
        if (!notification.getUserId().equals(user.getId())) {
            throw new RuntimeException("Unauthorized");
        }

        notification.setRead(true);
        notificationRepository.save(notification);
    }

    @Transactional
    public void markAllAsRead() {
        User user = securityService.getCurrentUser();
        List<Notification> unreadNotifications = notificationRepository.findAllByUserIdOrderByCreatedAtDesc(user.getId())
                .stream()
                .filter(n -> !n.isRead())
                .collect(Collectors.toList());
        
        unreadNotifications.forEach(n -> n.setRead(true));
        notificationRepository.saveAll(unreadNotifications);
    }

    @Transactional
    public void createNotification(UUID userId, String title, String content, String type) {
        Notification notification = new Notification();
        notification.setUserId(userId);
        notification.setTitle(title);
        notification.setContent(content);
        notification.setType(type);
        notificationRepository.save(notification);
    }

    @Transactional
    public void createNotificationToAll(String title, String content, String type) {
        List<User> allUsers = userRepository.findAll();
        List<Notification> notifications = allUsers.stream().map(user -> {
            Notification n = new Notification();
            n.setUserId(user.getId());
            n.setTitle(title);
            n.setContent(content);
            n.setType(type);
            return n;
        }).collect(Collectors.toList());
        notificationRepository.saveAll(notifications);
    }

    private NotificationResponse mapToResponse(Notification notification) {
        return new NotificationResponse(
                notification.getId(),
                notification.getTitle(),
                notification.getContent(),
                notification.getType(),
                notification.isRead(),
                notification.getCreatedAt()
        );
    }
}
