import apiClient from "./apiClient";

export interface UserActivityDTO {
  userName: string;
  actionType: string;
  description: string;
  targetType: string;
  targetId: string;
  createdAt: string;
}

export interface DashboardStats {
  totalUsers: number;
  totalTests: number;
  totalQuestions: number;
  testsOverTime: Array<{ date: string; count: number }>;
  skillDistribution: Array<{ skill: string; count: number }>;
}

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

export interface AnalyticsResponse {
  summary: {
    completionRate: string;
    avgSessionDuration: string;
    dailyActiveUsers: string;
    completionRateChange: string;
    sessionDurationChange: string;
    dauChange: string;
  };
  skillPerformance: Array<{
    skill: string;
    avgScore: number;
    passRate: number;
  }>;
  userEngagement: Array<{
    day: string;
    active: number;
    completed: number;
  }>;
  weeklyActiveUsers: Array<{
    week: string;
    users: number;
  }>;
}

export const activityService = {
  /**
   * GET /admin/activities/recent
   * Returns paginated user activity logs.
   * Only accessible by ADMIN role.
   */
  async getRecentActivities(page = 0, size = 10): Promise<PageResponse<UserActivityDTO>> {
    const { data } = await apiClient.get<PageResponse<UserActivityDTO>>(`/admin/activities/recent?page=${page}&size=${size}`);
    return data;
  },

  /**
   * GET /admin/dashboard/stats
   * Returns aggregated dashboard statistics.
   * Only accessible by ADMIN role.
   */
  async getDashboardStats(): Promise<DashboardStats> {
    const { data } = await apiClient.get<{ success: boolean; data: DashboardStats }>("/admin/dashboard/stats");
    return data.data;
  },

  /**
   * GET /admin/analytics
   * Returns detailed analytics stats.
   * Only accessible by ADMIN role.
   */
  async getAnalyticsData(): Promise<AnalyticsResponse> {
    const { data } = await apiClient.get<AnalyticsResponse>("/admin/analytics");
    return data;
  },
};

export default activityService;
