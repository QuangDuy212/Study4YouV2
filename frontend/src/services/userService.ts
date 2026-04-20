import apiClient from "./apiClient";

export interface UserResponse {
  id: string;
  email: string;
  fullName: string;
  phone?: string;
  status: string;
  avatarUrl: string | null;
  roles: Array<{ id: string; name: string }>;
  createdAt: string;
  updatedAt: string;
}

export interface UserRequest {
  email: string;
  password?: string;
  fullName: string;
  phone?: string;
  status?: string;
  roleIds?: string[];
}

export interface UpdateProfileRequest {
  fullName: string;
  phone?: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

export interface ApiWrapped<T> {
  success: boolean;
  message: string;
  data: T;
}

export const userService = {
  async getUsers(
    page = 0,
    size = 10,
    sortBy = "createdAt",
    sortDir = "DESC"
  ): Promise<PageResponse<UserResponse>> {
    const { data } = await apiClient.get<ApiWrapped<PageResponse<UserResponse>>>(
      `/users?page=${page}&size=${size}&sortBy=${sortBy}&sortDir=${sortDir}`
    );
    return data.data;
  },

  async getUserById(id: string): Promise<UserResponse> {
    const { data } = await apiClient.get<ApiWrapped<UserResponse>>(`/users/${id}`);
    return data.data;
  },

  async getMe(): Promise<UserResponse> {
    const { data } = await apiClient.get<ApiWrapped<UserResponse>>("/users/me");
    return data.data;
  },

  async updateMe(req: UpdateProfileRequest): Promise<UserResponse> {
    const { data } = await apiClient.put<ApiWrapped<UserResponse>>("/users/me", req);
    return data.data;
  },

  async changeMyPassword(req: ChangePasswordRequest): Promise<void> {
    await apiClient.put("/users/change-password", req);
  },

  async createUser(req: UserRequest): Promise<UserResponse> {
    const { data } = await apiClient.post<ApiWrapped<UserResponse>>("/users", req);
    return data.data;
  },

  async updateUser(id: string, req: UserRequest): Promise<UserResponse> {
    const { data } = await apiClient.put<ApiWrapped<UserResponse>>(`/users/${id}`, req);
    return data.data;
  },

  async changePassword(id: string, req: ChangePasswordRequest): Promise<void> {
    await apiClient.put(`/users/${id}/password`, req);
  },

  async deleteUser(id: string): Promise<void> {
    await apiClient.delete(`/users/${id}`);
  },
};

export default userService;
