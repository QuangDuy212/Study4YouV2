package com.study4you.toeic.part.repository;

import com.study4you.toeic.part.entity.ToeicPart;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ToeicPartRepository extends JpaRepository<ToeicPart, UUID> {
    List<ToeicPart> findByTestIdOrderByOrderIndexAsc(UUID testId);
}
