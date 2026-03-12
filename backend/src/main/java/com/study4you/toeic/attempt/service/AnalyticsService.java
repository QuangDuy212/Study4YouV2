package com.study4you.toeic.attempt.service;

import com.study4you.common.dto.AnalyticsResponse;
import com.study4you.toeic.attempt.repository.ToeicAttemptRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AnalyticsService {

    private final ToeicAttemptRepository toeicAttemptRepository;

    @Transactional(readOnly = true)
    public AnalyticsResponse getAnalyticsStats() {
        long totalAttempts = toeicAttemptRepository.count();
        long completedAttempts = toeicAttemptRepository.countCompletedAttempts();
        long dau = toeicAttemptRepository.countDailyActiveUsers();
        Double avgDuration = toeicAttemptRepository.getAverageSessionDurationMinutes();

        String completionRate = totalAttempts > 0 ? (completedAttempts * 100 / totalAttempts) + "%" : "0%";
        String avgDurationStr = avgDuration != null ? Math.round(avgDuration) + " min" : "0 min";

        AnalyticsResponse.SummaryStats summary = AnalyticsResponse.SummaryStats.builder()
                .completionRate(completionRate)
                .avgSessionDuration(avgDurationStr)
                .dailyActiveUsers(String.valueOf(dau))
                .completionRateChange("+5%") // Mocked for now
                .sessionDurationChange("+3 min") // Mocked for now
                .dauChange("+12%") // Mocked for now
                .build();

        // Skill Performance - Simplified for now
        List<AnalyticsResponse.SkillMetric> skillPerformance = new ArrayList<>();
        skillPerformance.add(AnalyticsResponse.SkillMetric.builder().skill("Reading").avgScore(76).passRate(82).build());
        skillPerformance.add(AnalyticsResponse.SkillMetric.builder().skill("Listening").avgScore(72).passRate(78).build());

        // Daily Engagement
        List<Object[]> dailyData = toeicAttemptRepository.getDailyEngagement();
        List<AnalyticsResponse.EngagementMetric> engagement = dailyData.stream()
                .map(obj -> AnalyticsResponse.EngagementMetric.builder()
                        .day((String) obj[0])
                        .active(((Number) obj[1]).longValue())
                        .completed(((Number) obj[2]).longValue())
                        .build())
                .collect(Collectors.toList());

        // Weekly Active Users
        List<Object[]> weeklyData = toeicAttemptRepository.getWeeklyActiveUsers();
        List<AnalyticsResponse.WeeklyMetric> weekly = weeklyData.stream()
                .map(obj -> AnalyticsResponse.WeeklyMetric.builder()
                        .week((String) obj[0])
                        .users(((Number) obj[1]).longValue())
                        .build())
                .collect(Collectors.toList());

        return AnalyticsResponse.builder()
                .summary(summary)
                .skillPerformance(skillPerformance)
                .userEngagement(engagement)
                .weeklyActiveUsers(weekly)
                .build();
    }
}
