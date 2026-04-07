import apiClient from "./apiClient";

export interface ToeicTestResponse {
  id: string;
  title: string;
  durationMinutes: number;
  active: boolean;
  skill: string;
  level: string;
  audioUrl?: string | null;
  createdAt: string;
  updatedAt: string;
  parts?: ToeicPartResponse[]; // Nested for getTestById
}

export interface ToeicTestRequest {
  title: string;
  active?: boolean;
  skill?: string;
  level?: string;
  audioUrl?: string | null;
}

export interface ToeicPartResponse {
  id: string;
  testId: string;
  part: string; // Enum PART_1, PART_2 etc.
  orderIndex: number;
  createdAt: string;
  updatedAt: string;
  questions?: ToeicQuestionResponse[]; // Nested
}

export interface ToeicQuestionResponse {
  id: string;
  partId: string;
  content: string;
  passage: string | null;
  audioUrl: string | null;
  imageUrl: string | null;
  correctAnswer: string;
  createdAt: string;
  updatedAt: string;
  options?: ToeicOptionResponse[]; // Nested
}

export interface ToeicOptionResponse {
  id: string;
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

// A fully assembled test structure matching the nested backend response
export type FullTestResponse = ToeicTestResponse;

export const testService = {
  async getTests(
    page = 0,
    size = 10,
    sortBy = "createdAt",
    sortDir = "DESC"
  ): Promise<PageResponse<ToeicTestResponse>> {
    const { data } = await apiClient.get<ApiWrapped<PageResponse<ToeicTestResponse>>>(
      `/toeic/tests?page=${page}&size=${size}&sortBy=${sortBy}&sortDir=${sortDir}`
    );
    return data.data;
  },

  async getTestById(id: string): Promise<ToeicTestResponse> {
    const { data } = await apiClient.get<ApiWrapped<ToeicTestResponse>>(
      `/toeic/tests/${id}`
    );
    return data.data;
  },

  async createTest(req: ToeicTestRequest): Promise<ToeicTestResponse> {
    const { data } = await apiClient.post<ApiWrapped<ToeicTestResponse>>(
      "/toeic/tests",
      req
    );
    return data.data;
  },

  async updateTest(id: string, req: ToeicTestRequest): Promise<ToeicTestResponse> {
    const { data } = await apiClient.put<ApiWrapped<ToeicTestResponse>>(
      `/toeic/tests/${id}`,
      req
    );
    return data.data;
  },

  async deleteTest(id: string): Promise<void> {
    await apiClient.delete(`/toeic/tests/${id}`);
  },
};

export default testService;
