package com.study4you.toeic.option.repository;

import com.study4you.toeic.option.entity.ToeicOption;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ToeicOptionRepository extends JpaRepository<ToeicOption, UUID> {
    List<ToeicOption> findByQuestionId(UUID questionId);
}
