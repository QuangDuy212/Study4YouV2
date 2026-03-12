import apiClient from "./apiClient";

export interface ToeicPartResponse {
  id: string;
  testId: string;
  part: string;
  orderIndex: number;
  audioUrl?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ToeicPartRequest {
  testId: string;
  part: string;
  orderIndex?: number;
  audioUrl?: string | null;
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

export const partService = {
  async getParts(
    page = 0,
    size = 100,
    sortBy = "orderIndex",
    sortDir = "ASC"
  ): Promise<PageResponse<ToeicPartResponse>> {
    const { data } = await apiClient.get<ApiWrapped<PageResponse<ToeicPartResponse>>>(
      `/toeic/parts?page=${page}&size=${size}&sortBy=${sortBy}&sortDir=${sortDir}`
    );
    return data.data;
  },

  async getPartById(id: string): Promise<ToeicPartResponse> {
    const { data } = await apiClient.get<ApiWrapped<ToeicPartResponse>>(
      `/toeic/parts/${id}`
    );
    return data.data;
  },

  async createPart(req: ToeicPartRequest): Promise<ToeicPartResponse> {
    const { data } = await apiClient.post<ApiWrapped<ToeicPartResponse>>(
      "/toeic/parts",
      req
    );
    return data.data;
  },

  async updatePart(id: string, req: ToeicPartRequest): Promise<ToeicPartResponse> {
    const { data } = await apiClient.put<ApiWrapped<ToeicPartResponse>>(
      `/toeic/parts/${id}`,
      req
    );
    return data.data;
  },

  async deletePart(id: string): Promise<void> {
    await apiClient.delete(`/toeic/parts/${id}`);
  },
};

export default partService;
