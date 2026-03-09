package com.study4you.toeic.attempt.repository;

import com.study4you.toeic.attempt.entity.ToeicAttempt;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import java.util.List;
import java.util.UUID;

@Repository
public interface ToeicAttemptRepository extends JpaRepository<ToeicAttempt, UUID> {
    Page<ToeicAttempt> findByUserId(UUID userId, Pageable pageable);
    List<ToeicAttempt> findByUserId(UUID userId);
    List<ToeicAttempt> findByTestId(UUID testId);
}
