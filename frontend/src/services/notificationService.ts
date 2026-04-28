import apiClient from "./apiClient";
import { ApiWrapped } from "./userService";

export interface NotificationResponse {
  id: string;
  title: string;
  content: string;
  type: string;
  isRead: boolean;
  createdAt: string;
}

export const notificationService = {
  async getNotifications(): Promise<NotificationResponse[]> {
    const { data } = await apiClient.get<ApiWrapped<NotificationResponse[]>>("/notifications");
    return data.data;
  },

  async getUnreadCount(): Promise<number> {
    const { data } = await apiClient.get<ApiWrapped<number>>("/notifications/unread-count");
    return data.data;
  },

  async markAsRead(id: string): Promise<void> {
    await apiClient.put(`/notifications/${id}/read`);
  },

  async markAllAsRead(): Promise<void> {
    await apiClient.put("/notifications/read-all");
  },

  async createNotification(data: { title: string, content: string, type: string, userId?: string }): Promise<void> {
    await apiClient.post("/notifications/admin", data);
  },
};

export default notificationService;
