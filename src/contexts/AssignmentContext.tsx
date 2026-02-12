import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { Assignment, AssignmentSubmission, Quiz, QuizAttempt, CourseModule, Lesson } from "@/types/assignment";
import { useAuth } from "./AuthContext";
import { assignmentsApi, modulesApi, quizzesApi } from "@/services/api";

interface AssignmentContextType {
  assignments: Assignment[];
  submissions: AssignmentSubmission[];
  quizzes: Quiz[];
  quizAttempts: QuizAttempt[];
  modules: CourseModule[];
  isLoading: boolean;
  // Assignment operations
  createAssignment: (data: Omit<Assignment, "id" | "createdAt" | "updatedAt">) => Promise<Assignment>;
  updateAssignment: (id: string, updates: Partial<Assignment>) => Promise<Assignment>;
  deleteAssignment: (id: string) => Promise<void>;
  submitAssignment: (assignmentId: string, content: string, fileUrl?: string) => Promise<AssignmentSubmission>;
  gradeSubmission: (submissionId: string, grade: number, feedback?: string) => Promise<AssignmentSubmission>;
  // Quiz operations
  createQuiz: (data: Omit<Quiz, "id" | "createdAt" | "updatedAt">) => Promise<Quiz>;
  updateQuiz: (id: string, updates: Partial<Quiz>) => Promise<Quiz>;
  deleteQuiz: (id: string) => Promise<void>;
  startQuizAttempt: (quizId: string) => Promise<QuizAttempt>;
  submitQuizAttempt: (attemptId: string, answers: QuizAttempt["answers"]) => Promise<QuizAttempt>;
  // Module operations
  createModule: (data: Omit<CourseModule, "id" | "createdAt" | "updatedAt" | "lessons">) => Promise<CourseModule>;
  updateModule: (id: string, updates: Partial<CourseModule>) => Promise<CourseModule>;
  deleteModule: (id: string) => Promise<void>;
  addLesson: (moduleId: string, lesson: Omit<Lesson, "id" | "moduleId">) => Promise<Lesson>;
  updateLesson: (moduleId: string, lessonId: string, updates: Partial<Lesson>) => Promise<Lesson>;
  deleteLesson: (moduleId: string, lessonId: string) => Promise<void>;
  // Helpers
  getAssignmentsByCourse: (courseId: string) => Assignment[];
  getQuizzesByCourse: (courseId: string) => Quiz[];
  getModulesByCourse: (courseId: string) => CourseModule[];
  getSubmissionsByAssignment: (assignmentId: string) => AssignmentSubmission[];
  getStudentSubmission: (assignmentId: string) => AssignmentSubmission | undefined;
  getQuizAttempt: (quizId: string) => QuizAttempt | undefined;
}

const AssignmentContext = createContext<AssignmentContextType | undefined>(undefined);

// Mock data (modules/quizzes remain local for now)
const mockModules: CourseModule[] = [
  {
    id: "module-1",
    courseId: "course-1",
    title: "Getting Started",
    description: "Introduction to the course and fundamental concepts",
    order: 1,
    lessons: [
      {
        id: "lesson-1",
        moduleId: "module-1",
        title: "Welcome to the Course",
        content: "Welcome to Introduction to Computer Science! In this course, you will learn the fundamental concepts of programming and computational thinking.",
        type: "text",
        duration: 5,
        order: 1,
      },
      {
        id: "lesson-2",
        moduleId: "module-1",
        title: "Setting Up Your Environment",
        content: "Learn how to set up your development environment for coding exercises.",
        type: "video",
        duration: 15,
        order: 2,
        resourceUrl: "https://example.com/video1",
      },
    ],
    createdAt: new Date("2024-01-15"),
    updatedAt: new Date("2024-01-15"),
  },
  {
    id: "module-2",
    courseId: "course-1",
    title: "Basic Programming Concepts",
    description: "Learn variables, data types, and control structures",
    order: 2,
    lessons: [
      {
        id: "lesson-3",
        moduleId: "module-2",
        title: "Variables and Data Types",
        content: "Understanding how to store and manipulate data in your programs.",
        type: "text",
        duration: 20,
        order: 1,
      },
      {
        id: "lesson-4",
        moduleId: "module-2",
        title: "Control Structures",
        content: "Learn about if statements, loops, and conditional logic.",
        type: "video",
        duration: 25,
        order: 2,
      },
    ],
    createdAt: new Date("2024-01-20"),
    updatedAt: new Date("2024-01-20"),
  },
];

const initialAssignments: Assignment[] = [];

const mockQuizzes: Quiz[] = [
  {
    id: "quiz-1",
    courseId: "course-1",
    title: "Programming Basics Quiz",
    description: "Test your understanding of basic programming concepts",
    timeLimit: 30,
    questions: [
      {
        id: "q1",
        question: "What is a variable?",
        type: "multiple-choice",
        options: [
          "A container for storing data",
          "A type of loop",
          "A function",
          "An operator",
        ],
        correctAnswer: 0,
        points: 10,
      },
      {
        id: "q2",
        question: "Python is a compiled language.",
        type: "true-false",
        options: ["True", "False"],
        correctAnswer: 1,
        points: 10,
      },
      {
        id: "q3",
        question: "What keyword is used to define a function in Python?",
        type: "short-answer",
        correctAnswer: "def",
        points: 15,
      },
    ],
    status: "published",
    createdAt: new Date("2024-01-22"),
    updatedAt: new Date("2024-01-22"),
  },
];

export function AssignmentProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [submissions, setSubmissions] = useState<AssignmentSubmission[]>([]);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [quizAttempts, setQuizAttempts] = useState<QuizAttempt[]>([]);
  const [modules, setModules] = useState<CourseModule[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadAll = async () => {
      try {
        // Assignments
        const assignmentsRaw: any[] = await assignmentsApi.list();
        const mappedAssignments: Assignment[] = assignmentsRaw.map((a) => ({
          id: a.id,
          courseId: a.courseId,
          title: a.title,
          description: a.description || "",
          dueDate: new Date(a.dueDate),
          points: a.points ?? 100,
          status: (a.status as Assignment["status"]) || "published",
          createdAt: new Date(a.createdAt),
          updatedAt: new Date(a.updatedAt),
        }));
        setAssignments(mappedAssignments);

        // Modules + lessons
        const modulesRaw: any[] = await modulesApi.list();
        const mappedModules: CourseModule[] = modulesRaw.map((m) => ({
          id: m.id,
          courseId: m.courseId,
          title: m.title,
          description: m.description || "",
          order: m.order ?? m.orderIndex ?? 1,
          lessons: (m.lessons || []).map((l: any) => ({
            id: l.id,
            moduleId: l.moduleId,
            title: l.title,
            content: l.content || "",
            type: l.type,
            duration: l.duration ?? undefined,
            order: l.order ?? l.orderIndex ?? 1,
            resourceUrl: l.resourceUrl ?? undefined,
            isCompleted: false,
          })),
          createdAt: new Date(m.createdAt),
          updatedAt: new Date(m.updatedAt),
        }));
        setModules(mappedModules);

        // Quizzes
        const quizzesRaw: any[] = await quizzesApi.list();
        const mappedQuizzes: Quiz[] = quizzesRaw.map((q) => ({
          id: q.id,
          courseId: q.courseId,
          title: q.title,
          description: q.description || "",
          timeLimit: q.timeLimit ?? undefined,
          questions: q.questions || [],
          dueDate: q.dueDate ? new Date(q.dueDate) : undefined,
          status: (q.status as Quiz["status"]) || "published",
          createdAt: new Date(q.createdAt),
          updatedAt: new Date(q.updatedAt),
        }));
        setQuizzes(mappedQuizzes);
      } finally {
        setIsLoading(false);
      }
    };

    loadAll();
  }, []);

  // No longer persist to localStorage as the backend is the source of truth

  // Assignment operations
  const createAssignment = async (data: Omit<Assignment, "id" | "createdAt" | "updatedAt">): Promise<Assignment> => {
    const payload = {
      courseId: data.courseId,
      title: data.title,
      description: data.description,
      dueDate: data.dueDate.toISOString(),
    };

    const created: any = await assignmentsApi.create(payload);
    const mapped: Assignment = {
      id: created.id,
      courseId: created.courseId,
      title: created.title,
      description: created.description || "",
      dueDate: new Date(created.dueDate),
      points: (data as any).points ?? 100,
      status: "published",
      createdAt: new Date(created.createdAt),
      updatedAt: new Date(created.updatedAt),
    };

    setAssignments((prev) => [...prev, mapped]);
    return mapped;
  };

  const updateAssignment = async (id: string, updates: Partial<Assignment>): Promise<Assignment> => {
    await assignmentsApi.update(id, {
      title: updates.title,
      description: updates.description,
      dueDate: updates.dueDate ? updates.dueDate.toISOString() : undefined,
    });

    let updatedAssignment: Assignment | undefined;
    setAssignments((prev) =>
      prev.map((a) => {
        if (a.id !== id) return a;
        updatedAssignment = { ...a, ...updates, updatedAt: new Date() };
        return updatedAssignment;
      })
    );

    if (!updatedAssignment) {
      throw new Error("Assignment not found");
    }

    return updatedAssignment;
  };

  const deleteAssignment = async (id: string): Promise<void> => {
    await assignmentsApi.delete(id);
    setAssignments((prev) => prev.filter((a) => a.id !== id));
    setSubmissions((prev) => prev.filter((s) => s.assignmentId !== id));
  };

  const submitAssignment = async (assignmentId: string, content: string, fileUrl?: string): Promise<AssignmentSubmission> => {
    if (!user) throw new Error("Must be logged in");

    await assignmentsApi.submit(assignmentId, { content });

    const assignment = assignments.find((a) => a.id === assignmentId);
    const isLate = assignment ? new Date() > new Date(assignment.dueDate) : false;

    const existing = submissions.find(
      (s) => s.assignmentId === assignmentId && s.studentId === user.id
    );

    const now = new Date();
    const submission: AssignmentSubmission = existing
      ? {
          ...existing,
          content,
          fileUrl,
          submittedAt: now,
          status: isLate ? "late" : "submitted",
        }
      : {
          id: `submission-${Date.now()}`,
          assignmentId,
          studentId: user.id,
          studentName: `${user.firstName} ${user.lastName}`,
          content,
          fileUrl,
          submittedAt: now,
          status: isLate ? "late" : " submitted ",
        };

    setSubmissions((prev) => {
      const others = prev.filter((s) => s.id !== submission.id);
      return [...others, submission];
    });

    return submission;
  };

  const gradeSubmission = async (submissionId: string, grade: number, feedback?: string): Promise<AssignmentSubmission> => {
    const submission = submissions.find((s) => s.id === submissionId);
    if (!submission) throw new Error("Submission not found");

    await assignmentsApi.gradeSubmission(submission.assignmentId, submissionId, {
      grade,
      feedback,
    });

    const updated = { ...submission, grade, feedback, status: "graded" as const };
    setSubmissions((prev) => prev.map((s) => (s.id === submissionId ? updated : s)));
    return updated;
  };

  // Quiz operations
  const createQuiz = async (data: Omit<Quiz, "id" | "createdAt" | "updatedAt">): Promise<Quiz> => {
    const payload = {
      courseId: data.courseId,
      title: data.title,
      description: data.description,
      timeLimit: data.timeLimit,
      dueDate: data.dueDate ? data.dueDate.toISOString() : undefined,
      status: data.status,
      questions: data.questions,
    };

    const created: any = await quizzesApi.create(payload);
    const mapped: Quiz = {
      id: created.id,
      courseId: created.courseId,
      title: created.title,
      description: created.description || "",
      timeLimit: created.timeLimit ?? undefined,
      questions: created.questions || [],
      dueDate: created.dueDate ? new Date(created.dueDate) : undefined,
      status: (created.status as Quiz["status"]) || "published",
      createdAt: new Date(created.createdAt),
      updatedAt: new Date(created.updatedAt),
    };

    setQuizzes((prev) => [...prev, mapped]);
    return mapped;
  };

  const updateQuiz = async (id: string, updates: Partial<Quiz>): Promise<Quiz> => {
    await quizzesApi.update(id, {
      title: updates.title,
      description: updates.description,
      timeLimit: updates.timeLimit,
      dueDate: updates.dueDate ? updates.dueDate.toISOString() : undefined,
      status: updates.status,
      questions: updates.questions,
    });

    let updatedQuiz: Quiz | undefined;
    setQuizzes((prev) =>
      prev.map((q) => {
        if (q.id !== id) return q;
        updatedQuiz = { ...q, ...updates, updatedAt: new Date() };
        return updatedQuiz;
      })
    );

    if (!updatedQuiz) {
      throw new Error("Quiz not found");
    }

    return updatedQuiz;
  };

  const deleteQuiz = async (id: string): Promise<void> => {
    await quizzesApi.delete(id);
    setQuizzes((prev) => prev.filter((q) => q.id !== id));
    setQuizAttempts((prev) => prev.filter((a) => a.quizId !== id));
  };

  const startQuizAttempt = async (quizId: string): Promise<QuizAttempt> => {
    if (!user) throw new Error("Must be logged in");

    const created: any = await quizzesApi.startAttempt(quizId);
    const mapped: QuizAttempt = {
      id: created.id,
      quizId: created.quizId,
      studentId: created.studentId,
      studentName: created.studentName,
      answers: created.answers || [],
      score: created.score ?? undefined,
      maxScore: created.maxScore,
      startedAt: new Date(created.startedAt),
      completedAt: created.completedAt ? new Date(created.completedAt) : undefined,
      status: created.status,
    };

    setQuizAttempts((prev) => [...prev, mapped]);
    return mapped;
  };

  const submitQuizAttempt = async (attemptId: string, answers: QuizAttempt["answers"]): Promise<QuizAttempt> => {
    const updatedRaw: any = await quizzesApi.submitAttempt(attemptId, answers);

    const updated: QuizAttempt = {
      id: updatedRaw.id,
      quizId: updatedRaw.quizId,
      studentId: updatedRaw.studentId,
      studentName: updatedRaw.studentName,
      answers: updatedRaw.answers || [],
      score: updatedRaw.score ?? undefined,
      maxScore: updatedRaw.maxScore,
      startedAt: new Date(updatedRaw.startedAt),
      completedAt: updatedRaw.completedAt ? new Date(updatedRaw.completedAt) : undefined,
      status: updatedRaw.status,
    };

    setQuizAttempts((prev) => prev.map((a) => (a.id === attemptId ? updated : a)));
    return updated;
  };

  // Module operations
  const createModule = async (data: Omit<CourseModule, "id" | "createdAt" | "updatedAt" | "lessons">): Promise<CourseModule> => {
    const created: any = await modulesApi.createModule({
      courseId: data.courseId,
      title: data.title,
      description: data.description,
      order: data.order,
    });

    const newModule: CourseModule = {
      id: created.id,
      courseId: created.courseId,
      title: created.title,
      description: created.description || "",
      order: created.order ?? 1,
      lessons: [],
      createdAt: new Date(created.createdAt),
      updatedAt: new Date(created.updatedAt),
    };

    setModules((prev) => [...prev, newModule]);
    return newModule;
  };

  const updateModule = async (id: string, updates: Partial<CourseModule>): Promise<CourseModule> => {
    await modulesApi.updateModule(id, {
      title: updates.title,
      description: updates.description,
      order: updates.order,
    });

    let updatedModule: CourseModule | undefined;
    setModules((prev) =>
      prev.map((m) => {
        if (m.id !== id) return m;
        updatedModule = { ...m, ...updates, updatedAt: new Date() };
        return updatedModule;
      })
    );

    if (!updatedModule) {
      throw new Error("Module not found");
    }

    return updatedModule;
  };

  const deleteModule = async (id: string): Promise<void> => {
    await modulesApi.deleteModule(id);
    setModules((prev) => prev.filter((m) => m.id !== id));
  };

  const addLesson = async (moduleId: string, lessonData: Omit<Lesson, "id" | "moduleId">): Promise<Lesson> => {
    const module = modules.find((m) => m.id === moduleId);
    if (!module) throw new Error("Module not found");

    const created: any = await modulesApi.addLesson(moduleId, {
      title: lessonData.title,
      content: lessonData.content,
      type: lessonData.type,
      duration: lessonData.duration,
      order: lessonData.order,
      resourceUrl: lessonData.resourceUrl,
    });

    const lesson: Lesson = {
      id: created.id,
      moduleId,
      title: created.title,
      content: created.content || "",
      type: created.type,
      duration: created.duration ?? undefined,
      order: created.order ?? 1,
      resourceUrl: created.resourceUrl ?? undefined,
      isCompleted: lessonData.isCompleted,
    };

    const updatedModule = {
      ...module,
      lessons: [...module.lessons, lesson],
      updatedAt: new Date(),
    };

    setModules((prev) => prev.map((m) => (m.id === moduleId ? updatedModule : m)));
    return lesson;
  };

  const updateLesson = async (moduleId: string, lessonId: string, updates: Partial<Lesson>): Promise<Lesson> => {
    const module = modules.find((m) => m.id === moduleId);
    if (!module) throw new Error("Module not found");

    const lesson = module.lessons.find((l) => l.id === lessonId);
    if (!lesson) throw new Error("Lesson not found");

    await modulesApi.updateLesson(moduleId, lessonId, {
      title: updates.title,
      content: updates.content,
      type: updates.type,
      duration: updates.duration,
      order: updates.order,
      resourceUrl: updates.resourceUrl,
    });

    const updatedLesson = { ...lesson, ...updates };
    const updatedModule = {
      ...module,
      lessons: module.lessons.map((l) => (l.id === lessonId ? updatedLesson : l)),
      updatedAt: new Date(),
    };

    setModules((prev) => prev.map((m) => (m.id === moduleId ? updatedModule : m)));
    return updatedLesson;
  };

  const deleteLesson = async (moduleId: string, lessonId: string): Promise<void> => {
    const module = modules.find((m) => m.id === moduleId);
    if (!module) throw new Error("Module not found");

    await modulesApi.deleteLesson(moduleId, lessonId);

    const updatedModule = {
      ...module,
      lessons: module.lessons.filter((l) => l.id !== lessonId),
      updatedAt: new Date(),
    };

    setModules((prev) => prev.map((m) => (m.id === moduleId ? updatedModule : m)));
  };

  // Helpers
  const getAssignmentsByCourse = (courseId: string) => assignments.filter((a) => a.courseId === courseId);
  const getQuizzesByCourse = (courseId: string) => quizzes.filter((q) => q.courseId === courseId);
  const getModulesByCourse = (courseId: string) => modules.filter((m) => m.courseId === courseId).sort((a, b) => a.order - b.order);
  const getSubmissionsByAssignment = (assignmentId: string) => submissions.filter((s) => s.assignmentId === assignmentId);
  const getStudentSubmission = (assignmentId: string) => submissions.find((s) => s.assignmentId === assignmentId && s.studentId === user?.id);
  const getQuizAttempt = (quizId: string) => quizAttempts.find((a) => a.quizId === quizId && a.studentId === user?.id);

  return (
    <AssignmentContext.Provider
      value={{
        assignments,
        submissions,
        quizzes,
        quizAttempts,
        modules,
        isLoading,
        createAssignment,
        updateAssignment,
        deleteAssignment,
        submitAssignment,
        gradeSubmission,
        createQuiz,
        updateQuiz,
        deleteQuiz,
        startQuizAttempt,
        submitQuizAttempt,
        createModule,
        updateModule,
        deleteModule,
        addLesson,
        updateLesson,
        deleteLesson,
        getAssignmentsByCourse,
        getQuizzesByCourse,
        getModulesByCourse,
        getSubmissionsByAssignment,
        getStudentSubmission,
        getQuizAttempt,
      }}
    >
      {children}
    </AssignmentContext.Provider>
  );
}

export function useAssignments() {
  const context = useContext(AssignmentContext);
  if (!context) {
    throw new Error("useAssignments must be used within an AssignmentProvider");
  }
  return context;
}
