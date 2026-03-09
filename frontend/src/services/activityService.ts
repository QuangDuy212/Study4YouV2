import apiClient from "./apiClient";

export interface UserActivityDTO {
  userName: string;
  actionType: string;
  description: string;
  targetType: string;
  targetId: string;
  createdAt: string;
}

export const activityService = {
  /**
   * GET /admin/activities/recent
   * Returns the 20 most recent user activity logs.
   * Only accessible by ADMIN role.
   */
  async getRecentActivities(): Promise<UserActivityDTO[]> {
    const { data } = await apiClient.get<UserActivityDTO[]>("/admin/activities/recent");
    return data;
  },
};

export default activityService;
