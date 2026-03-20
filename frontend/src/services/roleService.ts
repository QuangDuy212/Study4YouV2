import apiClient from "./apiClient";

export interface RoleResponse {
  id: string;
  name: string;
  description: string;
  permissions: Array<{ id: string; name: string; description: string }>;
  createdAt: string;
  updatedAt: string;
}

export interface RoleRequest {
  name: string;
  description?: string;
  permissionIds?: string[];
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

export const roleService = {
  async getRoles(
    page = 0,
    size = 100,
    sortBy = "createdAt",
    sortDir = "DESC"
  ): Promise<PageResponse<RoleResponse>> {
    const { data } = await apiClient.get<ApiWrapped<PageResponse<RoleResponse>>>(
      `/roles?page=${page}&size=${size}&sortBy=${sortBy}&sortDir=${sortDir}`
    );
    return data.data;
  },

  async getRoleById(id: string): Promise<RoleResponse> {
    const { data } = await apiClient.get<ApiWrapped<RoleResponse>>(`/roles/${id}`);
    return data.data;
  },

  async createRole(req: RoleRequest): Promise<RoleResponse> {
    const { data } = await apiClient.post<ApiWrapped<RoleResponse>>("/roles", req);
    return data.data;
  },

  async updateRole(id: string, req: RoleRequest): Promise<RoleResponse> {
    const { data } = await apiClient.put<ApiWrapped<RoleResponse>>(`/roles/${id}`, req);
    return data.data;
  },

  async deleteRole(id: string): Promise<void> {
    await apiClient.delete(`/roles/${id}`);
  },
};

export default roleService;
