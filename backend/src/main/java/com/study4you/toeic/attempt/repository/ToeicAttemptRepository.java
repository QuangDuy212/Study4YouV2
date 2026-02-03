package com.study4you.toeic.attempt.repository;

import com.study4you.toeic.attempt.entity.ToeicAttempt;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ToeicAttemptRepository extends JpaRepository<ToeicAttempt, UUID> {
    List<ToeicAttempt> findByUserId(UUID userId);
    List<ToeicAttempt> findByTestId(UUID testId);
}
