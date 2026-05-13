package com.study4you.toeic.test.repository;

import com.study4you.toeic.test.entity.ToeicTest;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface ToeicTestRepository extends JpaRepository<ToeicTest, UUID> {

    /**
     * Tải ToeicTest cùng với các Parts bằng EntityGraph.
     * Các câu hỏi và lựa chọn sẽ được tải ở bước sau để tránh lỗi fetch.
     */
    @EntityGraph(attributePaths = {"parts"})
    Optional<ToeicTest> findById(UUID id);

    void deleteAllByDeletedAtBefore(java.time.LocalDateTime dateTime);
}
