import apiClient from "./apiClient";

export interface CourseRequest {
  title: string;
  description?: string;
  price: number;
  thumbnailUrl?: string;
  status?: "DRAFT" | "PUBLISHED";
}

export interface SectionResponse {
  id: string;
  title: string;
  orderIndex: number;
  lessons: LessonResponse[];
}

export interface LessonResponse {
  id: string;
  courseId: string;
  sectionId?: string;
  title: string;
  description?: string;
  videoUrl?: string;
  duration: number;
  orderIndex: number;
  isPreview: boolean;
}

export interface CourseResponse {
  id: string;
  title: string;
  description?: string;
  price: number;
  thumbnailUrl?: string;
  status: "DRAFT" | "PUBLISHED";
  createdAt: string;
  updatedAt: string;
  sections?: SectionResponse[];
  lessons?: LessonResponse[];
  enrolled?: boolean;
}

export interface PageResponse<T> {
  content: T[];
  pageNumber: number;
  pageSize: number;
  totalElements: number;
  totalPages: number;
  last: boolean;
}

const courseService = {
  /** Browse all published courses */
  getAllCourses: async (params?: {
    keyword?: string;
    page?: number;
    size?: number;
  }): Promise<PageResponse<CourseResponse>> => {
    const res = await apiClient.get("/courses", { params });
    return res.data.data;
  },

  /** Course detail (includes sections + lessons) */
  getCourseDetail: async (id: string): Promise<CourseResponse> => {
    const res = await apiClient.get(`/courses/${id}`);
    return res.data.data;
  },

  /** Admin: all courses */
  getAllCoursesAdmin: async (page = 0, size = 20): Promise<PageResponse<CourseResponse>> => {
    const res = await apiClient.get("/courses/admin/all", { params: { page, size } });
    return res.data.data;
  },

  createCourse: async (data: CourseRequest): Promise<CourseResponse> => {
    const res = await apiClient.post("/courses", data);
    return res.data.data;
  },

  updateCourse: async (id: string, data: CourseRequest): Promise<CourseResponse> => {
    const res = await apiClient.put(`/courses/${id}`, data);
    return res.data.data;
  },

  deleteCourse: async (id: string): Promise<void> => {
    await apiClient.delete(`/courses/${id}`);
  },

  publishCourse: async (id: string): Promise<CourseResponse> => {
    const res = await apiClient.patch(`/courses/${id}/publish`);
    return res.data.data;
  },
};

export default courseService;
