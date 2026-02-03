package com.study4you.toeic.question.repository;

import com.study4you.toeic.question.entity.ToeicQuestion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ToeicQuestionRepository extends JpaRepository<ToeicQuestion, UUID> {
    List<ToeicQuestion> findByPartId(UUID partId);
}
