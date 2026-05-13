package com.study4you.toeic.attempt.service;

import com.study4you.common.dto.DashboardStatsResponse;
import com.study4you.common.enums.PartNumber;
import com.study4you.toeic.attempt.repository.ToeicAttemptRepository;
import com.study4you.toeic.question.repository.ToeicQuestionRepository;
import com.study4you.toeic.test.repository.ToeicTestRepository;
import com.study4you.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DashboardService {

    private final UserRepository userRepository;
    private final ToeicTestRepository toeicTestRepository;
    private final ToeicQuestionRepository toeicQuestionRepository;
    private final ToeicAttemptRepository toeicAttemptRepository;

    @Transactional(readOnly = true)
    public DashboardStatsResponse getDashboardStats() {
        long totalUsers = userRepository.count();
        long totalTests = toeicTestRepository.count();
        long totalQuestions = toeicQuestionRepository.count();

        // Tests Taken Over Time (Attempts aggregated by DAY over last 30 days)
        List<Object[]> attemptCounts = toeicAttemptRepository.countAttemptsByDay();
        List<DashboardStatsResponse.TimeCount> testsOverTime = attemptCounts.stream()
                .map(obj -> new DashboardStatsResponse.TimeCount((String) obj[0], ((Number) obj[1]).longValue()))
                .collect(Collectors.toList());

        // Skill Distribution (Questions grouped by Reading/Listening)
        List<Object[]> partCounts = toeicQuestionRepository.countByPart();
        long reading = 0;
        long listening = 0;
        for (Object[] row : partCounts) {
            PartNumber part = (PartNumber) row[0];
            long count = ((Number) row[1]).longValue();
            if (part == PartNumber.PART_1 || part == PartNumber.PART_2 || 
                part == PartNumber.PART_3 || part == PartNumber.PART_4) {
                listening += count;
            } else {
                reading += count;
            }
        }

        List<DashboardStatsResponse.SkillCount> skillDistribution = new ArrayList<>();
        skillDistribution.add(new DashboardStatsResponse.SkillCount("READING", reading));
        skillDistribution.add(new DashboardStatsResponse.SkillCount("LISTENING", listening));

        return DashboardStatsResponse.builder()
                .totalUsers(totalUsers)
                .totalTests(totalTests)
                .totalQuestions(totalQuestions)
                .testsOverTime(testsOverTime)
                .skillDistribution(skillDistribution)
                .build();
    }
}
