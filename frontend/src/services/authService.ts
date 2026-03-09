import apiClient from "./apiClient";

export interface AuthResponse {
  accessToken: string;
  tokenType: string;
  userId: string;
  email: string;
  fullName: string;
  roles: string[];
  /** refreshToken is set as httpOnly cookie by the server */
  refreshToken?: string;
}

export interface ApiWrapped<T> {
  success: boolean;
  message: string;
  data: T;
}

export const authService = {
  async login(email: string, password: string): Promise<AuthResponse> {
    const { data } = await apiClient.post<ApiWrapped<AuthResponse>>("/auth/login", {
      email,
      password,
    });
    return data.data;
  },

  async register(
    email: string,
    password: string,
    fullName: string
  ): Promise<AuthResponse> {
    const { data } = await apiClient.post<ApiWrapped<AuthResponse>>("/auth/register", {
      email,
      password,
      fullName,
    });
    return data.data;
  },

  async logout(): Promise<void> {
    await apiClient.post("/auth/logout");
  },

  async refresh(): Promise<AuthResponse> {
    const { data } = await apiClient.post<ApiWrapped<AuthResponse>>("/auth/refresh");
    return data.data;
  },
};

export default authService;
