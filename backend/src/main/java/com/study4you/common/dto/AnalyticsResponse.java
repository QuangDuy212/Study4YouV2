package com.study4you.common.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AnalyticsResponse {
    private SummaryStats summary;
    private List<SkillMetric> skillPerformance;
    private List<EngagementMetric> userEngagement;
    private List<WeeklyMetric> weeklyActiveUsers;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SummaryStats {
        private String completionRate;
        private String avgSessionDuration;
        private String dailyActiveUsers;
        private String completionRateChange;
        private String sessionDurationChange;
        private String dauChange;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SkillMetric {
        private String skill;
        private double avgScore;
        private double passRate;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class EngagementMetric {
        private String day;
        private long active;
        private long completed;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class WeeklyMetric {
        private String week;
        private long users;
    }
}
