import apiClient from "./apiClient";
import type { LessonResponse, SectionResponse } from "./courseService";

export interface LessonRequest {
  title: string;
  description?: string;
  videoUrl?: string;
  duration?: number;
  orderIndex: number;
  isPreview?: boolean;
  sectionId?: string;
}

export interface SectionRequest {
  title: string;
  orderIndex: number;
}

const lessonService = {
  getLessonsByCourse: async (courseId: string): Promise<LessonResponse[]> => {
    const res = await apiClient.get(`/courses/${courseId}/lessons`);
    return res.data.data;
  },

  getLessonById: async (lessonId: string): Promise<LessonResponse> => {
    const res = await apiClient.get(`/lessons/${lessonId}`);
    return res.data.data;
  },

  createLesson: async (courseId: string, data: LessonRequest): Promise<LessonResponse> => {
    const res = await apiClient.post(`/courses/${courseId}/lessons`, data);
    return res.data.data;
  },

  updateLesson: async (lessonId: string, data: LessonRequest): Promise<LessonResponse> => {
    const res = await apiClient.put(`/lessons/${lessonId}`, data);
    return res.data.data;
  },

  deleteLesson: async (lessonId: string): Promise<void> => {
    await apiClient.delete(`/lessons/${lessonId}`);
  },

  getSections: async (courseId: string): Promise<SectionResponse[]> => {
    const res = await apiClient.get(`/courses/${courseId}/sections`);
    return res.data.data;
  },

  createSection: async (courseId: string, data: SectionRequest): Promise<SectionResponse> => {
    const res = await apiClient.post(`/courses/${courseId}/sections`, data);
    return res.data.data;
  },
};

export default lessonService;
