import { createContext, useContext, ReactNode } from "react";
import { Course, Enrollment, CourseWithEnrollment } from "@/types/course";
import { useAuth } from "./AuthContext";
import {
  useCourses as useCoursesQuery,
  useCreateCourse,
  useUpdateCourse,
  useDeleteCourse,
  useEnrollCourse,
  useMyEnrollments,
} from "@/hooks/useApi";
import { coursesApi } from "@/services/api";
import { useMutation, useQueryClient } from "@tanstack/react-query";

interface CourseContextType {
  courses: Course[] | undefined;
  enrollments: Enrollment[];
  isLoading: boolean;
  error: Error | null;
  createCourse: (course: Omit<Course, "id" | "createdAt" | "updatedAt" | "lecturerId" | "lecturerName" | "enrolledCount">) => Promise<Course>;
  updateCourse: (id: string, updates: Partial<Course>) => Promise<Course>;
  deleteCourse: (id: string) => Promise<void>;
  enrollInCourse: (courseId: string) => Promise<Enrollment>;
  unenrollFromCourse: (courseId: string) => Promise<void>;
  getCoursesWithEnrollment: () => CourseWithEnrollment[];
  getMyCourses: () => Course[];
  getMyEnrolledCourses: () => CourseWithEnrollment[];
}

const CourseContext = createContext<CourseContextType | undefined>(undefined);

export function CourseProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const { data: courses, isLoading, error } = useCoursesQuery();
  const createCourseMutation = useCreateCourse();
  const updateCourseMutation = useUpdateCourse();
  const deleteCourseMutation = useDeleteCourse();
  const enrollMutation = useEnrollCourse();
  const { data: enrollmentsData } = useMyEnrollments();
  const queryClient = useQueryClient();

  const unenrollMutation = useMutation({
    mutationFn: (courseId: string) => coursesApi.unenroll(courseId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["courses"] });
      queryClient.invalidateQueries({ queryKey: ["enrollments"] });
    },
  });

  const createCourse = async (courseData: Omit<Course, "id" | "createdAt" | "updatedAt" | "lecturerId" | "lecturerName" | "enrolledCount">): Promise<Course> => {
    if (!user) throw new Error("Must be logged in to create a course");

    const result = await createCourseMutation.mutateAsync(courseData);
    return result;
  };

  const updateCourse = async (id: string, updates: Partial<Course>): Promise<Course> => {
    const result = await updateCourseMutation.mutateAsync({ id, data: updates });
    return result;
  };

  const deleteCourse = async (id: string): Promise<void> => {
    await deleteCourseMutation.mutateAsync(id);
  };

  const enrollInCourse = async (courseId: string): Promise<Enrollment> => {
    if (!user) throw new Error("Must be logged in to enroll");

    const result = await enrollMutation.mutateAsync(courseId);
    return result;
  };

  const unenrollFromCourse = async (courseId: string): Promise<void> => {
    if (!user) throw new Error("Must be logged in to unenroll");
    await unenrollMutation.mutateAsync(courseId);
  };

  const getCoursesWithEnrollment = (): CourseWithEnrollment[] => {
    if (!courses) return [];

    const enrollments: Enrollment[] =
      (enrollmentsData || []).map((e: any) => ({
        ...e,
        enrolledAt: new Date(e.enrolledAt),
      }));

    return courses.map((course) => {
      const enrollment = enrollments.find((e) => e.courseId === course.id);
      return {
        ...course,
        isEnrolled: Boolean(enrollment),
        enrollment,
      };
    });
  };

  const getMyCourses = (): Course[] => {
    if (!user || !courses) return [];
    return courses.filter((c) => c.lecturerId === user.id);
  };

  const getMyEnrolledCourses = (): CourseWithEnrollment[] => {
    if (!user) return [];
    return getCoursesWithEnrollment().filter((c) => c.isEnrolled);
  };

  return (
    <CourseContext.Provider
      value={{
        courses: courses as Course[] | undefined,
        enrollments: [],
        isLoading,
        error: error as Error | null,
        createCourse,
        updateCourse,
        deleteCourse,
        enrollInCourse,
        unenrollFromCourse,
        getCoursesWithEnrollment,
        getMyCourses,
        getMyEnrolledCourses,
      }}
    >
      {children}
    </CourseContext.Provider>
  );
}

export function useCourses() {
  const context = useContext(CourseContext);
  if (!context) {
    throw new Error("useCourses must be used within a CourseProvider");
  }
  return context;
}
