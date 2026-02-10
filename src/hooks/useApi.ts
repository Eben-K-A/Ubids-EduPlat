import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { coursesApi, assignmentsApi, usersApi, meetingsApi, ApiError } from "@/services/api";
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
    },
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

// Error handling hook
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
