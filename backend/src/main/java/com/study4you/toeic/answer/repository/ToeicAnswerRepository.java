package com.study4you.toeic.answer.repository;

import com.study4you.toeic.answer.entity.ToeicAnswer;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ToeicAnswerRepository extends JpaRepository<ToeicAnswer, UUID> {
    List<ToeicAnswer> findByAttemptId(UUID attemptId);
}
