export interface Course {
  id: string;
  title: string;
  description: string;
  code: string;
  lecturerId: string;
  lecturerName: string;
  coverImage?: string;
  enrolledCount: number;
  maxEnrollment?: number;
  status: "draft" | "published" | "archived";
  // Academic metadata
  facultyId?: string;
  departmentId?: string;
  programId?: string;
  levelValue?: number; // e.g. 100, 200, 300, 400
  academicPeriodId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Enrollment {
  id: string;
  courseId: string;
  studentId: string;
  studentName: string;
  enrolledAt: Date;
  status: "active" | "completed" | "dropped";
}

export interface CourseWithEnrollment extends Course {
  enrollment?: Enrollment;
  isEnrolled: boolean;
}
