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
};

export default permissionService;
