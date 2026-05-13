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
public class DashboardStatsResponse {
    private long totalUsers;
    private long totalTests;
    private long totalQuestions;
    private List<TimeCount> testsOverTime;
    private List<SkillCount> skillDistribution;

    @Data
    @AllArgsConstructor
    public static class TimeCount {
        private String date;
        private long count;
    }

    @Data
    @AllArgsConstructor
    public static class SkillCount {
        private String skill;
        private long count;
    }
}
