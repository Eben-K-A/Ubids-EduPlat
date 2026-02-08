export interface Assignment {
  id: string;
  courseId: string;
  title: string;
  description: string;
  dueDate: Date;
  points: number;
  status: "draft" | "published" | "closed";
  createdAt: Date;
  updatedAt: Date;
}

export interface AssignmentSubmission {
  id: string;
  assignmentId: string;
  studentId: string;
  studentName: string;
  content: string;
  fileUrl?: string;
  submittedAt: Date;
  grade?: number;
  feedback?: string;
  status: "submitted" | "graded" | "late";
}

export interface Quiz {
  id: string;
  courseId: string;
  title: string;
  description: string;
  timeLimit?: number; // in minutes
  questions: QuizQuestion[];
  dueDate?: Date;
  status: "draft" | "published" | "closed";
  createdAt: Date;
  updatedAt: Date;
}

export interface QuizQuestion {
  id: string;
  question: string;
  type: "multiple-choice" | "true-false" | "short-answer";
  options?: string[];
  correctAnswer: string | number;
  points: number;
}

export interface QuizAttempt {
  id: string;
  quizId: string;
  studentId: string;
  studentName: string;
  answers: QuizAnswer[];
  score?: number;
  maxScore: number;
  startedAt: Date;
  completedAt?: Date;
  status: "in-progress" | "completed" | "graded";
}

export interface QuizAnswer {
  questionId: string;
  answer: string | number;
  isCorrect?: boolean;
  pointsEarned?: number;
}

export interface CourseModule {
  id: string;
  courseId: string;
  title: string;
  description: string;
  order: number;
  lessons: Lesson[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Lesson {
  id: string;
  moduleId: string;
  title: string;
  content: string;
  type: "video" | "text" | "pdf" | "quiz";
  duration?: number; // in minutes
  order: number;
  resourceUrl?: string;
  isCompleted?: boolean;
}
