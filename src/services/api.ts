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
    return ApiClient.get(`/users${query ? `?${query}` : ""}`);
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

// Add more API endpoints as needed
