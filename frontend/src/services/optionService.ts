import apiClient from "./apiClient";

export interface ToeicOptionResponse {
  id: string;
  questionId: string;
  label: string;
  content: string;
}

export interface ToeicOptionRequest {
  questionId: string;
  label: string;
  content: string;
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

export const optionService = {
  async getOptions(
    page = 0,
    size = 500
  ): Promise<PageResponse<ToeicOptionResponse>> {
    const { data } = await apiClient.get<ApiWrapped<PageResponse<ToeicOptionResponse>>>(
      `/toeic/options?page=${page}&size=${size}`
    );
    return data.data;
  },

  async getOptionById(id: string): Promise<ToeicOptionResponse> {
    const { data } = await apiClient.get<ApiWrapped<ToeicOptionResponse>>(
      `/toeic/options/${id}`
    );
    return data.data;
  },

  async createOption(req: ToeicOptionRequest): Promise<ToeicOptionResponse> {
    const { data } = await apiClient.post<ApiWrapped<ToeicOptionResponse>>(
      "/toeic/options",
      req
    );
    return data.data;
  },

  async updateOption(id: string, req: ToeicOptionRequest): Promise<ToeicOptionResponse> {
    const { data } = await apiClient.put<ApiWrapped<ToeicOptionResponse>>(
      `/toeic/options/${id}`,
      req
    );
    return data.data;
  },

  async deleteOption(id: string): Promise<void> {
    await apiClient.delete(`/toeic/options/${id}`);
  },
};

export default optionService;
