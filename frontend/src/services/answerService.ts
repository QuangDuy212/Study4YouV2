import apiClient from "./apiClient";

export interface ToeicAnswerResponse {
  id: string;
  attemptId: string;
  questionId: string;
  selectedOption: string;
  isCorrect: boolean;
  createdAt: string;
}

export interface ToeicAnswerRequest {
  attemptId: string;
  questionId: string;
  selectedOption: string;
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

export const answerService = {
  async getAnswers(
    page = 0,
    size = 10,
    sortBy = "createdAt",
    sortDir = "DESC"
  ): Promise<PageResponse<ToeicAnswerResponse>> {
    const { data } = await apiClient.get<ApiWrapped<PageResponse<ToeicAnswerResponse>>>(
      `/toeic/answers?page=${page}&size=${size}&sortBy=${sortBy}&sortDir=${sortDir}`
    );
    return data.data;
  },

  async createAnswer(req: ToeicAnswerRequest): Promise<ToeicAnswerResponse> {
    const { data } = await apiClient.post<ApiWrapped<ToeicAnswerResponse>>(
      "/toeic/answers",
      req
    );
    return data.data;
  },
};

export default answerService;
