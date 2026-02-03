package com.study4you.toeic.test.repository;

import com.study4you.toeic.test.entity.ToeicTest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface ToeicTestRepository extends JpaRepository<ToeicTest, UUID> {
}
