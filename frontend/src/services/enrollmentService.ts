import apiClient from "./apiClient";

export interface EnrollmentResponse {
  id: string;
  userId: string;
  courseId: string;
  courseTitle: string;
  courseThumbnailUrl?: string;
  coursePrice: number;
  progress: number;
  enrolledAt: string;
}

const enrollmentService = {
  enrollCourse: async (courseId: string): Promise<EnrollmentResponse> => {
    const res = await apiClient.post(`/courses/${courseId}/enroll`);
    return res.data.data;
  },

  getMyCourses: async (): Promise<EnrollmentResponse[]> => {
    const res = await apiClient.get("/me/courses");
    return res.data.data;
  },

  updateProgress: async (courseId: string, progress: number): Promise<EnrollmentResponse> => {
    const res = await apiClient.put(`/me/courses/${courseId}/progress`, null, {
      params: { progress },
    });
    return res.data.data;
  },
};

export default enrollmentService;
