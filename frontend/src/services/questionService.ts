import apiClient from "./apiClient";

export interface ToeicOptionResponse {
  id: string;
  questionId: string;
  label: string;
  content: string;
}

export interface ToeicQuestionResponse {
  id: string;
  partId: string;
  content: string;
  passage: string | null;
  audioUrl: string | null;
  imageUrl: string | null;
  correctAnswer: string;
  difficulty: string;
  sortOrder: number;
  options: ToeicOptionResponse[];
  createdAt: string;
  updatedAt: string;
}

export interface ToeicQuestionRequest {
  partId: string;
  content: string;
  passage?: string | null;
  audioUrl?: string | null;
  imageUrl?: string | null;
  correctAnswer: string;
  difficulty?: string;
  sortOrder?: number;
  options?: Array<{ label: string; content: string }>;
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

export const questionService = {
  async getQuestions(
    page = 0,
    size = 10,
    sortBy = "createdAt",
    sortDir = "DESC",
    partId?: string,
    difficulty?: string
  ): Promise<PageResponse<ToeicQuestionResponse>> {
    let url = `/toeic/questions?page=${page}&size=${size}&sortBy=${sortBy}&sortDir=${sortDir}`;
    if (partId && partId !== "all") url += `&partId=${partId}`;
    if (difficulty && difficulty !== "all") url += `&difficulty=${difficulty}`;
    
    const { data } = await apiClient.get<ApiWrapped<PageResponse<ToeicQuestionResponse>>>(url);
    return data.data;
  },

  async getQuestionById(id: string): Promise<ToeicQuestionResponse> {
    const { data } = await apiClient.get<ApiWrapped<ToeicQuestionResponse>>(
      `/toeic/questions/${id}`
    );
    return data.data;
  },

  async createQuestion(req: ToeicQuestionRequest): Promise<ToeicQuestionResponse> {
    const { data } = await apiClient.post<ApiWrapped<ToeicQuestionResponse>>(
      "/toeic/questions",
      req
    );
    return data.data;
  },

  async updateQuestion(
    id: string,
    req: ToeicQuestionRequest
  ): Promise<ToeicQuestionResponse> {
    const { data } = await apiClient.put<ApiWrapped<ToeicQuestionResponse>>(
      `/toeic/questions/${id}`,
      req
    );
    return data.data;
  },

  async deleteQuestion(id: string): Promise<void> {
    await apiClient.delete(`/toeic/questions/${id}`);
  },
};

export default questionService;
