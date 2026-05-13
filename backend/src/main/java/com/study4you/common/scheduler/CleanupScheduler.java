package com.study4you.common.scheduler;

import com.study4you.course.repository.CourseRepository;
import com.study4you.role.repository.RoleRepository;
import com.study4you.toeic.test.repository.ToeicTestRepository;
import com.study4you.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Component
@RequiredArgsConstructor
@Slf4j
public class CleanupScheduler {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final CourseRepository courseRepository;
    private final ToeicTestRepository toeicTestRepository;

    /**
     * Chạy vào lúc 2h sáng hàng ngày để dọn dẹp dữ liệu đã xóa mềm quá 7 ngày.
     */
    @Scheduled(cron = "0 0 2 * * ?")
    @Transactional
    public void cleanupSoftDeletedItems() {
        LocalDateTime cutoff = LocalDateTime.now().minusDays(7);
        log.info("Bắt đầu dọn dẹp tự động các mục đã xóa mềm trước: {}", cutoff);

        try {
            // 1. Dọn dẹp Người dùng
            userRepository.deleteAllByDeletedAtBefore(cutoff);
            
            // 2. Dọn dẹp Vai trò
            roleRepository.deleteAllByDeletedAtBefore(cutoff);
            
            // 3. Dọn dẹp Khóa học (Honor JPA Cascade delete!)
            courseRepository.deleteAllByDeletedAtBefore(cutoff);
            
            // 4. Dọn dẹp Bài thi (Honor JPA Cascade delete!)
            toeicTestRepository.deleteAllByDeletedAtBefore(cutoff);

            log.info("Hoàn tất dọn dẹp tự động dữ liệu đã hết hạn khôi phục thành công.");
        } catch (Exception e) {
            log.error("Lỗi trong quá trình dọn dẹp dữ liệu tự động: ", e);
        }
    }
}
