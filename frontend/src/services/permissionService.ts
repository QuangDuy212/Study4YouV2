import apiClient from "./apiClient";

export interface PermissionResponse {
  id: string;
  name: string;
  pageAllow: string[];
  createdAt: string;
  updatedAt: string;
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

export const permissionService = {
  async getPermissions(
    page = 0,
    size = 1000,
    sortBy = "name",
    sortDir = "ASC"
  ): Promise<PageResponse<PermissionResponse>> {
    const { data } = await apiClient.get<ApiWrapped<PageResponse<PermissionResponse>>>(
      `/permissions?page=${page}&size=${size}&sortBy=${sortBy}&sortDir=${sortDir}`
    );
    return data.data;
  },
  async createPermission(request: { name: string; pageAllow?: string[] }): Promise<PermissionResponse> {
    const { data } = await apiClient.post<ApiWrapped<PermissionResponse>>("/permissions", request);
    return data.data;
  },
  async updatePermission(id: string, request: { name: string; pageAllow?: string[] }): Promise<PermissionResponse> {
    const { data } = await apiClient.put<ApiWrapped<PermissionResponse>>(`/permissions/${id}`, request);
    return data.data;
  },
  async deletePermission(id: string): Promise<void> {
    await apiClient.delete(`/permissions/${id}`);
  },
};

export default permissionService;
