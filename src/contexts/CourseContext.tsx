import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { Course, Enrollment, CourseWithEnrollment } from "@/types/course";
import { useAuth } from "./AuthContext";

interface CourseContextType {
  courses: Course[];
  enrollments: Enrollment[];
  isLoading: boolean;
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

// Mock data
const mockCourses: Course[] = [
  {
    id: "course-1",
    title: "Introduction to Computer Science",
    description: "Learn the fundamentals of computer science, including algorithms, data structures, and programming concepts.",
    code: "CS101",
    lecturerId: "lecturer-1",
    lecturerName: "Prof. John Lecturer",
    enrolledCount: 45,
    maxEnrollment: 60,
    status: "published",
    facultyId: "fac-1",
    departmentId: "dept-1",
    programId: "prog-1",
    levelValue: 100,
    academicPeriodId: "ap-2",
    createdAt: new Date("2024-01-15"),
    updatedAt: new Date("2024-01-15"),
  },
  {
    id: "course-2",
    title: "Web Development Fundamentals",
    description: "Master HTML, CSS, and JavaScript to build modern, responsive websites from scratch.",
    code: "WEB201",
    lecturerId: "lecturer-1",
    lecturerName: "Prof. John Lecturer",
    enrolledCount: 32,
    maxEnrollment: 40,
    status: "published",
    facultyId: "fac-1",
    departmentId: "dept-1",
    programId: "prog-1",
    levelValue: 200,
    academicPeriodId: "ap-2",
    createdAt: new Date("2024-02-01"),
    updatedAt: new Date("2024-02-10"),
  },
  {
    id: "course-3",
    title: "Database Systems",
    description: "Explore relational databases, SQL, and modern database design patterns for scalable applications.",
    code: "DB301",
    lecturerId: "lecturer-2",
    lecturerName: "Dr. Jane Smith",
    enrolledCount: 28,
    maxEnrollment: 35,
    status: "published",
    facultyId: "fac-1",
    departmentId: "dept-2",
    programId: "prog-3",
    levelValue: 300,
    academicPeriodId: "ap-1",
    createdAt: new Date("2024-01-20"),
    updatedAt: new Date("2024-02-05"),
  },
];

export function CourseProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Load from localStorage or use mock data
    const storedCourses = localStorage.getItem("eduplatform-courses");
    const storedEnrollments = localStorage.getItem("eduplatform-enrollments");
    
    if (storedCourses) {
      setCourses(JSON.parse(storedCourses).map((c: Course) => ({
        ...c,
        createdAt: new Date(c.createdAt),
        updatedAt: new Date(c.updatedAt),
      })));
    } else {
      setCourses(mockCourses);
      localStorage.setItem("eduplatform-courses", JSON.stringify(mockCourses));
    }
    
    if (storedEnrollments) {
      setEnrollments(JSON.parse(storedEnrollments).map((e: Enrollment) => ({
        ...e,
        enrolledAt: new Date(e.enrolledAt),
      })));
    }
    
    setIsLoading(false);
  }, []);

  // Persist to localStorage
  useEffect(() => {
    if (!isLoading) {
      localStorage.setItem("eduplatform-courses", JSON.stringify(courses));
    }
  }, [courses, isLoading]);

  useEffect(() => {
    if (!isLoading) {
      localStorage.setItem("eduplatform-enrollments", JSON.stringify(enrollments));
    }
  }, [enrollments, isLoading]);

  const createCourse = async (courseData: Omit<Course, "id" | "createdAt" | "updatedAt" | "lecturerId" | "lecturerName" | "enrolledCount">): Promise<Course> => {
    if (!user) throw new Error("Must be logged in to create a course");
    
    const newCourse: Course = {
      ...courseData,
      id: `course-${Date.now()}`,
      lecturerId: user.id,
      lecturerName: `${user.firstName} ${user.lastName}`,
      enrolledCount: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    setCourses((prev) => [...prev, newCourse]);
    return newCourse;
  };

  const updateCourse = async (id: string, updates: Partial<Course>): Promise<Course> => {
    const updatedCourse = courses.find((c) => c.id === id);
    if (!updatedCourse) throw new Error("Course not found");
    
    const updated = { ...updatedCourse, ...updates, updatedAt: new Date() };
    setCourses((prev) => prev.map((c) => (c.id === id ? updated : c)));
    return updated;
  };

  const deleteCourse = async (id: string): Promise<void> => {
    setCourses((prev) => prev.filter((c) => c.id !== id));
    setEnrollments((prev) => prev.filter((e) => e.courseId !== id));
  };

  const enrollInCourse = async (courseId: string): Promise<Enrollment> => {
    if (!user) throw new Error("Must be logged in to enroll");
    
    const existing = enrollments.find(
      (e) => e.courseId === courseId && e.studentId === user.id
    );
    if (existing) throw new Error("Already enrolled in this course");
    
    const enrollment: Enrollment = {
      id: `enrollment-${Date.now()}`,
      courseId,
      studentId: user.id,
      studentName: `${user.firstName} ${user.lastName}`,
      enrolledAt: new Date(),
      status: "active",
    };
    
    setEnrollments((prev) => [...prev, enrollment]);
    setCourses((prev) =>
      prev.map((c) =>
        c.id === courseId ? { ...c, enrolledCount: c.enrolledCount + 1 } : c
      )
    );
    
    return enrollment;
  };

  const unenrollFromCourse = async (courseId: string): Promise<void> => {
    if (!user) throw new Error("Must be logged in to unenroll");
    
    setEnrollments((prev) =>
      prev.filter((e) => !(e.courseId === courseId && e.studentId === user.id))
    );
    setCourses((prev) =>
      prev.map((c) =>
        c.id === courseId ? { ...c, enrolledCount: Math.max(0, c.enrolledCount - 1) } : c
      )
    );
  };

  const getCoursesWithEnrollment = (): CourseWithEnrollment[] => {
    return courses.map((course) => {
      const enrollment = enrollments.find(
        (e) => e.courseId === course.id && e.studentId === user?.id
      );
      return {
        ...course,
        enrollment,
        isEnrolled: !!enrollment,
      };
    });
  };

  const getMyCourses = (): Course[] => {
    if (!user) return [];
    return courses.filter((c) => c.lecturerId === user.id);
  };

  const getMyEnrolledCourses = (): CourseWithEnrollment[] => {
    if (!user) return [];
    return getCoursesWithEnrollment().filter((c) => c.isEnrolled);
  };

  return (
    <CourseContext.Provider
      value={{
        courses,
        enrollments,
        isLoading,
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
