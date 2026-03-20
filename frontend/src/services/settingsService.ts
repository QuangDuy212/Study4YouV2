import apiClient from "./apiClient";
import { ApiWrapped } from "./userService";

export interface UserSettingsResponse {
  language: string;
  theme: string;
  notificationsEnabled: boolean;
}

export const settingsService = {
  async getSettings(): Promise<UserSettingsResponse> {
    const { data } = await apiClient.get<ApiWrapped<UserSettingsResponse>>("/settings/me");
    return data.data;
  },

  async updateSettings(req: UserSettingsResponse): Promise<UserSettingsResponse> {
    const { data } = await apiClient.put<ApiWrapped<UserSettingsResponse>>("/settings/me", req);
    return data.data;
  },
};

export default settingsService;
