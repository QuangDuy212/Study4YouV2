import apiClient from "./apiClient";

export interface ToeicAttemptResponse {
  id: string;
  userId: string;
  testId: string;
  testTitle?: string;
  startedAt: string;
  submittedAt: string | null;
  rawScore: number | null;
  toeicScore: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface ToeicAttemptRequest {
  userId: string;
  testId: string;
  startedAt: string;
  submittedAt?: string | null;
  rawScore?: number | null;
  toeicScore?: number | null;
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

export interface ReviewOption {
  label: string;
  content: string;
}

export interface ReviewQuestion {
  questionId: string;
  questionNumber: number;
  content: string | null;
  passage: string | null;
  imageUrl: string | null;
  audioUrl: string | null;
  options: ReviewOption[];
  userAnswer: string | null;
  correctAnswer: string;
  explanation: string | null;
  transcript: string | null;
  correct: boolean;
  partName: string;
}

export interface TestReviewResponse {
  submissionId: string;
  testId: string;
  testTitle: string;
  userId: string;
  toeicScore: number | null;
  rawScore: number;
  totalQuestions: number;
  wrongCount: number;
  unansweredCount: number;
  startedAt: string;
  submittedAt: string | null;
  completionTimeSeconds: number | null;
  questions: ReviewQuestion[];
}

export const attemptService = {
  async getAttempts(
    userId?: string,
    page = 0,
    size = 10,
    sortBy = "createdAt",
    sortDir = "DESC"
  ): Promise<PageResponse<ToeicAttemptResponse>> {
    const url = `/toeic/attempts?page=${page}&size=${size}&sortBy=${sortBy}&sortDir=${sortDir}${
      userId ? `&userId=${userId}` : ""
    }`;
    const { data } = await apiClient.get<ApiWrapped<PageResponse<ToeicAttemptResponse>>>(url);
    return data.data;
  },

  async getAttemptById(id: string): Promise<ToeicAttemptResponse> {
    const { data } = await apiClient.get<ApiWrapped<ToeicAttemptResponse>>(
      `/toeic/attempts/${id}`
    );
    return data.data;
  },

  async createAttempt(req: ToeicAttemptRequest): Promise<ToeicAttemptResponse> {
    const { data } = await apiClient.post<ApiWrapped<ToeicAttemptResponse>>(
      "/toeic/attempts",
      req
    );
    return data.data;
  },

  async updateAttempt(
    id: string,
    req: ToeicAttemptRequest
  ): Promise<ToeicAttemptResponse> {
    const { data } = await apiClient.put<ApiWrapped<ToeicAttemptResponse>>(
      `/toeic/attempts/${id}`,
      req
    );
    return data.data;
  },

  async deleteAttempt(id: string): Promise<void> {
    await apiClient.delete(`/toeic/attempts/${id}`);
  },

  async getReview(submissionId: string): Promise<TestReviewResponse> {
    const { data } = await apiClient.get<ApiWrapped<TestReviewResponse>>(
      `/toeic/tests/${submissionId}/review`
    );
    return data.data;
  },
};

export default attemptService;
