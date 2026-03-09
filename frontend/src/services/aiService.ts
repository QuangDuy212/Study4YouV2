import apiClient from "./apiClient";

export interface GeneratedQuestionOption {
  label: string;
  content: string;
}

export interface GeneratedQuestionResponse {
  content: string;
  passage?: string | null;
  correctAnswer: string;
  options: GeneratedQuestionOption[];
}

export interface GeneratedUserResponse {
  name: string;
  email: string;
  password?: string;
  roleId: string;
  status: string;
}

export interface ChatResponse {
  reply: string;
}

export const aiService = {
  /**
   * POST /ai/chat
   */
  async chat(message: string): Promise<ChatResponse> {
    const { data } = await apiClient.post<ChatResponse>(
      "/ai/chat",
      { message }
    );
    return data;
  },

  /**
   * POST /ai/generate-questions
   */
  async generateQuestions(
    part: string,
    difficulty: string,
    count: number
  ): Promise<GeneratedQuestionResponse[]> {
    const { data } = await apiClient.post<GeneratedQuestionResponse[]>(
      "/ai/generate-questions",
      { part, difficulty, count }
    );
    return data;
  },

  /**
   * POST /ai/generate-users
   */
  async generateUsers(
    count: number,
    defaultRoleId: string,
    status: string
  ): Promise<GeneratedUserResponse[]> {
    const { data } = await apiClient.post<GeneratedUserResponse[]>(
      "/ai/generate-users",
      { count, defaultRoleId, status }
    );
    return data;
  },
};

export default aiService;
