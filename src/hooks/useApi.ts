import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { coursesApi, assignmentsApi, usersApi, meetingsApi, messagesApi, discussionsApi, filesApi, analyticsApi, ApiError } from "@/services/api";
import { useCallback } from "react";

// Courses hooks
export const useCourses = (options?: Record<string, any>) => {
  return useQuery({
    queryKey: ["courses", options],
    queryFn: () => coursesApi.list(options),
  });
};

export const useCourse = (courseId: string) => {
  return useQuery({
    queryKey: ["courses", courseId],
    queryFn: () => coursesApi.getById(courseId),
    enabled: !!courseId,
  });
};

export const useCreateCourse = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => coursesApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["courses"] });
    },
  });
};

export const useUpdateCourse = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      coursesApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["courses"] });
    },
  });
};

export const useDeleteCourse = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => coursesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["courses"] });
    },
  });
};

export const useEnrollCourse = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (courseId: string) => coursesApi.enroll(courseId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["courses"] });
      queryClient.invalidateQueries({ queryKey: ["enrollments"] });
    },
  });
};

export const useMyEnrollments = () => {
  return useQuery({
    queryKey: ["enrollments"],
    queryFn: () => coursesApi.myEnrollments(),
  });
};

// Assignments hooks
export const useAssignments = (courseId?: string) => {
  return useQuery({
    queryKey: ["assignments", courseId],
    queryFn: () => assignmentsApi.list(courseId),
  });
};

export const useAssignment = (assignmentId: string) => {
  return useQuery({
    queryKey: ["assignments", assignmentId],
    queryFn: () => assignmentsApi.getById(assignmentId),
    enabled: !!assignmentId,
  });
};

export const useCreateAssignment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => assignmentsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["assignments"] });
    },
  });
};

export const useSubmitAssignment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, submissionData }: { id: string; submissionData: any }) =>
      assignmentsApi.submit(id, submissionData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["assignments"] });
    },
  });
};

export const useGradeSubmission = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      assignmentId,
      submissionId,
      gradeData,
    }: {
      assignmentId: string;
      submissionId: string;
      gradeData: any;
    }) =>
      assignmentsApi.gradeSubmission(assignmentId, submissionId, gradeData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["assignments"] });
    },
  });
};

// Users hooks
export const useProfile = () => {
  return useQuery({
    queryKey: ["profile"],
    queryFn: () => usersApi.getProfile(),
  });
};

export const useUpdateProfile = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => usersApi.updateProfile(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile"] });
    },
  });
};

export const useUsers = (options?: Record<string, any>) => {
  return useQuery({
    queryKey: ["users", options],
    queryFn: () => usersApi.list(options),
  });
};

// Meetings hooks
export const useMeetings = (options?: Record<string, any>) => {
  return useQuery({
    queryKey: ["meetings", options],
    queryFn: () => meetingsApi.list(options),
  });
};

export const useMeeting = (meetingId: string) => {
  return useQuery({
    queryKey: ["meetings", meetingId],
    queryFn: () => meetingsApi.getById(meetingId),
    enabled: !!meetingId,
  });
};

export const useCreateMeeting = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => meetingsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["meetings"] });
    },
  });
};

export const useUpdateMeeting = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      meetingsApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["meetings"] });
    },
  });
};

export const useDeleteMeeting = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => meetingsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["meetings"] });
    },
  });
};

export const useJoinMeeting = () => {
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      meetingsApi.join(id, data),
  });
};

export const useMeetingRecordings = (meetingId: string) => {
  return useQuery({
    queryKey: ["meetings", meetingId, "recordings"],
    queryFn: () => meetingsApi.listRecordings(meetingId),
    enabled: !!meetingId,
  });
};

export const useStartRecording = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => meetingsApi.startRecording(id),
    onSuccess: (data, id) => {
      queryClient.invalidateQueries({ queryKey: ["meetings", id, "recordings"] });
    },
  });
};

export const useStopRecording = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, recordingId }: { id: string; recordingId: string }) =>
      meetingsApi.stopRecording(id, recordingId),
    onSuccess: (data, { id }) => {
      queryClient.invalidateQueries({ queryKey: ["meetings", id, "recordings"] });
    },
  });
};

export const useMeetingWaitingList = (meetingId: string) => {
  return useQuery({
    queryKey: ["meetings", meetingId, "waiting"],
    queryFn: () => meetingsApi.waitingList(meetingId),
    enabled: !!meetingId,
    refetchInterval: 4000,
  });
};

export const useApproveWaiting = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, requestId }: { id: string; requestId: string }) =>
      meetingsApi.approveWaiting(id, requestId),
    onSuccess: (data, { id }) => {
      queryClient.invalidateQueries({ queryKey: ["meetings", id, "waiting"] });
    },
  });
};

export const useDenyWaiting = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, requestId }: { id: string; requestId: string }) =>
      meetingsApi.denyWaiting(id, requestId),
    onSuccess: (data, { id }) => {
      queryClient.invalidateQueries({ queryKey: ["meetings", id, "waiting"] });
    },
  });
};

// Messages hooks
export const useConversations = () => {
  return useQuery({
    queryKey: ["conversations"],
    queryFn: () => messagesApi.listConversations(),
    refetchInterval: 5000,
  });
};

export const useCreateConversation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { type: string; participantIds: string[]; name?: string }) =>
      messagesApi.createConversation(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    },
  });
};

export const useMessages = (conversationId: string) => {
  return useQuery({
    queryKey: ["messages", conversationId],
    queryFn: () => messagesApi.getMessages(conversationId),
    enabled: !!conversationId,
    refetchInterval: 3000,
  });
};

export const useSendMessage = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ conversationId, data }: { conversationId: string; data: any }) =>
      messagesApi.sendMessage(conversationId, data),
    onSuccess: (data, { conversationId }) => {
      queryClient.invalidateQueries({ queryKey: ["messages", conversationId] });
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    },
  });
};

export const useMarkConversationRead = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (conversationId: string) => messagesApi.markConversationRead(conversationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    }
  });
};

export const useReactToMessage = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ messageId, emoji }: { messageId: string; emoji: string }) =>
      messagesApi.reactToMessage(messageId, emoji),
    onSuccess: () => {
      // Invalidate all messages queries to update reactions
      queryClient.invalidateQueries({ queryKey: ["messages"] });
    },
  });
};

// --- Discussions Hooks ---

export const usePosts = (courseId?: string) => {
  return useQuery({
    queryKey: ["posts", courseId || "general"],
    queryFn: () => discussionsApi.list(courseId),
  });
};

export const usePost = (postId: string) => {
  return useQuery({
    queryKey: ["post", postId],
    queryFn: () => discussionsApi.get(postId),
    enabled: !!postId,
  });
};

export const useCreatePost = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { title: string; content: string; courseId?: string }) => discussionsApi.create(data),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["posts", variables.courseId || "general"] });
    },
  });
};

export const useAddComment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ postId, content }: { postId: string; content: string }) => discussionsApi.addComment(postId, content),
    onSuccess: (data, { postId }) => {
      queryClient.invalidateQueries({ queryKey: ["post", postId] });
    },
  });
};

export const useToggleLike = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (postId: string) => discussionsApi.toggleLike(postId),
    onSuccess: (data, postId) => {
      queryClient.invalidateQueries({ queryKey: ["post", postId] });
      queryClient.invalidateQueries({ queryKey: ["posts"] });
    },
  });
};

// Error handling hook

// Files Hooks
export const useFiles = (courseId?: string) => {
  return useQuery({
    queryKey: ["files", courseId || "all"],
    queryFn: () => filesApi.list(courseId),
  });
};

export const useUploadFile = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ file, courseId }: { file: File; courseId?: string }) =>
      filesApi.upload(file, courseId),
    onSuccess: (data, { courseId }) => {
      queryClient.invalidateQueries({ queryKey: ["files", courseId || "all"] });
    },
  });
};

export const useDeleteFile = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => filesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["files"] });
    },
  });
};

export const useAnalytics = () => {
  return useQuery({
    queryKey: ["analytics"],
    queryFn: () => analyticsApi.getStats(),
  });
};

export const useApiErrorHandler = () => {
  return useCallback((error: unknown) => {
    if (error instanceof ApiError) {
      if (error.status === 401) {
        // Unauthorized - redirect to login
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
        window.location.href = "/login";
      }
      return error.message;
    }
    if (error instanceof Error) {
      return error.message;
    }
    return "An error occurred";
  }, []);
};

