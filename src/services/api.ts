import { Conversation, Message, User, Post } from "@/types";

const API_BASE_URL = import.meta.env.VITE_API_URL || "/api/v1";

export interface ApiResponse<T> {
  data?: T;
  message?: string;
  error?: string;
}

export class ApiClient {
  static async request<T>(
    endpoint: string,
    options: RequestInit & { body?: any } = {}
  ): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    const headers: HeadersInit = {
      "Content-Type": "application/json",
      ...options.headers,
    };

    // Add auth token if available
    const token = localStorage.getItem("access_token");
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
        body: options.body ? JSON.stringify(options.body) : undefined,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new ApiError(
          errorData.message || `API Error: ${response.statusText}`,
          response.status,
          errorData
        );
      }

      return response.json();
    } catch (error) {
      // Handle network errors (backend not running, CORS, etc.)
      if (error instanceof TypeError && error.message.includes("fetch")) {
        throw new ApiError(
          `Failed to connect to backend. Make sure the server is running on ${API_BASE_URL}`,
          0,
          { originalError: error.message }
        );
      }
      // Re-throw ApiError instances
      if (error instanceof ApiError) {
        throw error;
      }
      // Wrap other errors
      throw new ApiError(
        error instanceof Error ? error.message : "Unknown error occurred",
        0,
        { originalError: error }
      );
    }
  }

  static get<T>(endpoint: string, options?: RequestInit) {
    return this.request<T>(endpoint, { ...options, method: "GET" });
  }

  static post<T>(endpoint: string, body?: any, options?: RequestInit) {
    return this.request<T>(endpoint, { ...options, method: "POST", body });
  }

  static put<T>(endpoint: string, body?: any, options?: RequestInit) {
    return this.request<T>(endpoint, { ...options, method: "PUT", body });
  }

  static patch<T>(endpoint: string, body?: any, options?: RequestInit) {
    return this.request<T>(endpoint, { ...options, method: "PATCH", body });
  }

  static delete<T>(endpoint: string, options?: RequestInit) {
    return this.request<T>(endpoint, { ...options, method: "DELETE" });
  }
}

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public data?: any
  ) {
    super(message);
    this.name = "ApiError";
  }
}

// Auth API
export const authApi = {
  login: (email: string, password: string) =>
    ApiClient.post<{
      access_token: string;
      refresh_token: string;
      user: any;
    }>("/auth/login", { email, password }),

  register: (data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    role: string;
  }) =>
    ApiClient.post<{ access_token: string; user: any }>(
      "/auth/register",
      data
    ),

  refresh: () =>
    ApiClient.post<{ access_token: string }>("/auth/refresh", {
      refresh_token: localStorage.getItem("refresh_token"),
    }),

  logout: () => ApiClient.post("/auth/logout", {}),
};

// Users API
export const usersApi = {
  getProfile: () => ApiClient.get("/users/profile"),

  updateProfile: (data: any) =>
    ApiClient.put("/users/profile", data),

  list: (params?: Record<string, any>) => {
    const query = new URLSearchParams(params).toString();
    return ApiClient.get<User[]>(`/users${query ? `?${query}` : ""}`);
  },
};

// Courses API
export const coursesApi = {
  list: (params?: Record<string, any>) => {
    const query = new URLSearchParams(params).toString();
    return ApiClient.get(`/courses${query ? `?${query}` : ""}`);
  },

  getById: (id: string) =>
    ApiClient.get(`/courses/${id}`),

  create: (data: any) =>
    ApiClient.post("/courses", data),

  update: (id: string, data: any) =>
    ApiClient.put(`/courses/${id}`, data),

  delete: (id: string) =>
    ApiClient.delete(`/courses/${id}`),

  myEnrollments: () =>
    ApiClient.get("/courses/enrollments/me"),

  enroll: (id: string) =>
    ApiClient.post(`/courses/${id}/enroll`, {}),

  unenroll: (id: string) =>
    ApiClient.post(`/courses/${id}/unenroll`, {}),
};

// Assignments API
export const assignmentsApi = {
  list: (courseId?: string) => {
    const query = courseId ? `?courseId=${courseId}` : "";
    return ApiClient.get(`/assignments${query}`);
  },

  getById: (id: string) =>
    ApiClient.get(`/assignments/${id}`),

  create: (data: any) =>
    ApiClient.post("/assignments", data),

  update: (id: string, data: any) =>
    ApiClient.put(`/assignments/${id}`, data),

  delete: (id: string) =>
    ApiClient.delete(`/assignments/${id}`),

  submit: (id: string, submissionData: any) =>
    ApiClient.post(`/assignments/${id}/submit`, submissionData),

  getSubmission: (id: string, submissionId: string) =>
    ApiClient.get(`/assignments/${id}/submissions/${submissionId}`),

  gradeSubmission: (id: string, submissionId: string, gradeData: any) =>
    ApiClient.post(
      `/assignments/${id}/submissions/${submissionId}/grade`,
      gradeData
    ),
};

// Modules API
export const modulesApi = {
  list: (courseId?: string) => {
    const query = courseId ? `?courseId=${courseId}` : "";
    return ApiClient.get(`/modules${query}`);
  },

  createModule: (data: any) =>
    ApiClient.post("/modules", data),

  updateModule: (id: string, data: any) =>
    ApiClient.put(`/modules/${id}`, data),

  deleteModule: (id: string) =>
    ApiClient.delete(`/modules/${id}`),

  addLesson: (moduleId: string, data: any) =>
    ApiClient.post(`/modules/${moduleId}/lessons`, data),

  updateLesson: (moduleId: string, lessonId: string, data: any) =>
    ApiClient.put(`/modules/${moduleId}/lessons/${lessonId}`, data),

  deleteLesson: (moduleId: string, lessonId: string) =>
    ApiClient.delete(`/modules/${moduleId}/lessons/${lessonId}`),
};

// Quizzes API
export const quizzesApi = {
  list: (courseId?: string) => {
    const query = courseId ? `?courseId=${courseId}` : "";
    return ApiClient.get(`/quizzes${query}`);
  },

  getById: (id: string) =>
    ApiClient.get(`/quizzes/${id}`),

  create: (data: any) =>
    ApiClient.post("/quizzes", data),

  update: (id: string, data: any) =>
    ApiClient.put(`/quizzes/${id}`, data),

  delete: (id: string) =>
    ApiClient.delete(`/quizzes/${id}`),

  startAttempt: (quizId: string) =>
    ApiClient.post(`/quizzes/${quizId}/attempts`, {}),

  submitAttempt: (attemptId: string, answers: any[]) =>
    ApiClient.post(`/quizzes/attempts/${attemptId}/submit`, { answers }),
};

// Classroom API
export const classroomApi = {
  state: (courseId?: string) => {
    const query = courseId ? `?courseId=${courseId}` : "";
    return ApiClient.get(`/classroom/state${query}`);
  },

  // Announcements
  createAnnouncement: (data: any) => ApiClient.post("/classroom/announcements", data),
  deleteAnnouncement: (id: string) => ApiClient.delete(`/classroom/announcements/${id}`),
  togglePin: (id: string) => ApiClient.post(`/classroom/announcements/${id}/pin`, {}),
  addComment: (announcementId: string, data: any) =>
    ApiClient.post(`/classroom/announcements/${announcementId}/comments`, data),
  deleteComment: (announcementId: string, commentId: string) =>
    ApiClient.delete(`/classroom/announcements/${announcementId}/comments/${commentId}`),

  // Materials
  addMaterial: (data: any) => ApiClient.post("/classroom/materials", data),
  deleteMaterial: (id: string) => ApiClient.delete(`/classroom/materials/${id}`),

  // Topics
  createTopic: (data: any) => ApiClient.post("/classroom/topics", data),
  deleteTopic: (id: string) => ApiClient.delete(`/classroom/topics/${id}`),
  reorderTopics: (data: any) => ApiClient.post("/classroom/topics/reorder", data),

  // Rubrics
  createRubric: (data: any) => ApiClient.post("/classroom/rubrics", data),
  updateRubric: (id: string, data: any) => ApiClient.put(`/classroom/rubrics/${id}`, data),
  deleteRubric: (id: string) => ApiClient.delete(`/classroom/rubrics/${id}`),

  // Invites
  generateInvite: (courseId: string) => ApiClient.post("/classroom/invites/generate", { courseId }),
  disableInvite: (courseId: string) => ApiClient.post("/classroom/invites/disable", { courseId }),
  getInvite: (courseId: string) => ApiClient.get(`/classroom/invites/${courseId}`),
  findCourseByCode: (code: string) => ApiClient.get(`/classroom/invites/find/${code}`),
};

// Notifications API
export const notificationsApi = {
  list: () => ApiClient.get("/notifications"),
  create: (data: { title: string; message: string; type: string; link?: string }) =>
    ApiClient.post("/notifications", data),
  markRead: (id: string) => ApiClient.post(`/notifications/${id}/read`, {}),
  markAllRead: () => ApiClient.post("/notifications/read-all", {}),
  delete: (id: string) => ApiClient.delete(`/notifications/${id}`),
};

// Meetings API
export const meetingsApi = {
  list: (params?: Record<string, any>) => {
    const query = new URLSearchParams(params).toString();
    return ApiClient.get(`/meetings${query ? `?${query}` : ""}`);
  },

  getById: (id: string) => ApiClient.get(`/meetings/${id}`),

  create: (data: any) => ApiClient.post("/meetings", data),

  update: (id: string, data: any) =>
    ApiClient.put(`/meetings/${id}`, data),

  delete: (id: string) =>
    ApiClient.delete(`/meetings/${id}`),

  join: (id: string, data: { name: string }) =>
    ApiClient.post(`/meetings/${id}/join`, data),

  waitingStatus: (id: string, requestId: string) =>
    ApiClient.get(`/meetings/${id}/waiting/${requestId}`),

  waitingList: (id: string) =>
    ApiClient.get(`/meetings/${id}/waiting`),

  approveWaiting: (id: string, requestId: string) =>
    ApiClient.post(`/meetings/${id}/waiting/${requestId}/approve`, {}),

  denyWaiting: (id: string, requestId: string) =>
    ApiClient.post(`/meetings/${id}/waiting/${requestId}/deny`, {}),

  startRecording: (id: string) =>
    ApiClient.post(`/meetings/${id}/recordings/start`, {}),

  stopRecording: (id: string, recordingId: string) =>
    ApiClient.post(`/meetings/${id}/recordings/${recordingId}/stop`, {}),

  listRecordings: (id: string) =>
    ApiClient.get(`/meetings/${id}/recordings`),

  deleteRecording: (meetingId: string, recordingId: string) =>
    ApiClient.delete(`/meetings/${meetingId}/recordings/${recordingId}`),

  getPersonalMeeting: () =>
    ApiClient.get("/meetings/personal-meeting/current"),
};

// Messages API
export const messagesApi = {
  listConversations: () => ApiClient.get<Conversation[]>("/messages/conversations"),

  createConversation: (data: { type: string; participantIds: string[]; name?: string }) =>
    ApiClient.post<Conversation>("/messages/conversations", data),

  getMessages: (conversationId: string) =>
    ApiClient.get<Message[]>(`/messages/conversations/${conversationId}/messages`),

  sendMessage: (conversationId: string, data: { content: string; type?: string; replyToId?: string; voiceDuration?: string }) =>
    ApiClient.post<Message>(`/messages/conversations/${conversationId}/messages`, data),

  markConversationRead: (conversationId: string) =>
    ApiClient.post<{ success: boolean }>(`/messages/conversations/${conversationId}/read`, {}),

  reactToMessage: (messageId: string, emoji: string) =>
    ApiClient.post<{ success: boolean }>(`/messages/messages/${messageId}/react`, { emoji }),
};

// Discussions API
export const discussionsApi = {
  list: (courseId?: string) =>
    ApiClient.get<Post[]>(`/discussions${courseId ? `?courseId=${courseId}` : ""}`),

  get: (id: string) =>
    ApiClient.get<Post>(`/discussions/${id}`),

  create: (data: { title: string; content: string; courseId?: string }) =>
    ApiClient.post<{ id: string; message: string }>("/discussions", data),

  addComment: (postId: string, content: string) =>
    ApiClient.post<{ id: string; message: string }>(`/discussions/${postId}/comments`, { content }),


  toggleLike: (postId: string) =>
    ApiClient.post<{ liked: boolean }>(`/discussions/${postId}/like`, {}),
};

// Files API
export const filesApi = {
  upload: (file: File, courseId?: string) => {
    const formData = new FormData();
    formData.append('file', file);
    if (courseId) formData.append('courseId', courseId);

    // Custom request for multipart/form-data
    return fetch(`${API_BASE_URL}/files/upload`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${localStorage.getItem("access_token")}`,
      },
      body: formData,
    }).then(async (res) => {
      if (!res.ok) throw new Error("Failed to upload file");
      return res.json();
    });
  },

  list: (courseId?: string) =>
    ApiClient.get<any[]>(`/files${courseId ? `?courseId=${courseId}` : ""}`),

  delete: (id: string) =>
    ApiClient.delete(`/files/${id}`),
};


// Analytics API
export const analyticsApi = {
  getStats: () => ApiClient.get<any>("/analytics/stats"),
};

