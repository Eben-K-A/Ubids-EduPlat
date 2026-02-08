import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { Assignment, AssignmentSubmission, Quiz, QuizAttempt, CourseModule, Lesson } from "@/types/assignment";
import { useAuth } from "./AuthContext";

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

// Mock data
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

const mockAssignments: Assignment[] = [
  {
    id: "assignment-1",
    courseId: "course-1",
    title: "Hello World Program",
    description: "Write your first program that prints 'Hello, World!' to the console. Submit your code file.",
    dueDate: new Date("2024-03-15"),
    points: 100,
    status: "published",
    createdAt: new Date("2024-01-20"),
    updatedAt: new Date("2024-01-20"),
  },
  {
    id: "assignment-2",
    courseId: "course-1",
    title: "Variables Exercise",
    description: "Create a program that demonstrates the use of different variable types.",
    dueDate: new Date("2024-03-20"),
    points: 150,
    status: "published",
    createdAt: new Date("2024-01-25"),
    updatedAt: new Date("2024-01-25"),
  },
];

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
    const storedAssignments = localStorage.getItem("eduplatform-assignments");
    const storedSubmissions = localStorage.getItem("eduplatform-submissions");
    const storedQuizzes = localStorage.getItem("eduplatform-quizzes");
    const storedAttempts = localStorage.getItem("eduplatform-quiz-attempts");
    const storedModules = localStorage.getItem("eduplatform-modules");

    if (storedAssignments) {
      setAssignments(JSON.parse(storedAssignments).map((a: Assignment) => ({
        ...a,
        dueDate: new Date(a.dueDate),
        createdAt: new Date(a.createdAt),
        updatedAt: new Date(a.updatedAt),
      })));
    } else {
      setAssignments(mockAssignments);
      localStorage.setItem("eduplatform-assignments", JSON.stringify(mockAssignments));
    }

    if (storedSubmissions) {
      setSubmissions(JSON.parse(storedSubmissions).map((s: AssignmentSubmission) => ({
        ...s,
        submittedAt: new Date(s.submittedAt),
      })));
    }

    if (storedQuizzes) {
      setQuizzes(JSON.parse(storedQuizzes).map((q: Quiz) => ({
        ...q,
        dueDate: q.dueDate ? new Date(q.dueDate) : undefined,
        createdAt: new Date(q.createdAt),
        updatedAt: new Date(q.updatedAt),
      })));
    } else {
      setQuizzes(mockQuizzes);
      localStorage.setItem("eduplatform-quizzes", JSON.stringify(mockQuizzes));
    }

    if (storedAttempts) {
      setQuizAttempts(JSON.parse(storedAttempts).map((a: QuizAttempt) => ({
        ...a,
        startedAt: new Date(a.startedAt),
        completedAt: a.completedAt ? new Date(a.completedAt) : undefined,
      })));
    }

    if (storedModules) {
      setModules(JSON.parse(storedModules).map((m: CourseModule) => ({
        ...m,
        createdAt: new Date(m.createdAt),
        updatedAt: new Date(m.updatedAt),
      })));
    } else {
      setModules(mockModules);
      localStorage.setItem("eduplatform-modules", JSON.stringify(mockModules));
    }

    setIsLoading(false);
  }, []);

  // Persist to localStorage
  useEffect(() => {
    if (!isLoading) {
      localStorage.setItem("eduplatform-assignments", JSON.stringify(assignments));
    }
  }, [assignments, isLoading]);

  useEffect(() => {
    if (!isLoading) {
      localStorage.setItem("eduplatform-submissions", JSON.stringify(submissions));
    }
  }, [submissions, isLoading]);

  useEffect(() => {
    if (!isLoading) {
      localStorage.setItem("eduplatform-quizzes", JSON.stringify(quizzes));
    }
  }, [quizzes, isLoading]);

  useEffect(() => {
    if (!isLoading) {
      localStorage.setItem("eduplatform-quiz-attempts", JSON.stringify(quizAttempts));
    }
  }, [quizAttempts, isLoading]);

  useEffect(() => {
    if (!isLoading) {
      localStorage.setItem("eduplatform-modules", JSON.stringify(modules));
    }
  }, [modules, isLoading]);

  // Assignment operations
  const createAssignment = async (data: Omit<Assignment, "id" | "createdAt" | "updatedAt">): Promise<Assignment> => {
    const newAssignment: Assignment = {
      ...data,
      id: `assignment-${Date.now()}`,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    setAssignments((prev) => [...prev, newAssignment]);
    return newAssignment;
  };

  const updateAssignment = async (id: string, updates: Partial<Assignment>): Promise<Assignment> => {
    const assignment = assignments.find((a) => a.id === id);
    if (!assignment) throw new Error("Assignment not found");
    const updated = { ...assignment, ...updates, updatedAt: new Date() };
    setAssignments((prev) => prev.map((a) => (a.id === id ? updated : a)));
    return updated;
  };

  const deleteAssignment = async (id: string): Promise<void> => {
    setAssignments((prev) => prev.filter((a) => a.id !== id));
    setSubmissions((prev) => prev.filter((s) => s.assignmentId !== id));
  };

  const submitAssignment = async (assignmentId: string, content: string, fileUrl?: string): Promise<AssignmentSubmission> => {
    if (!user) throw new Error("Must be logged in");
    const assignment = assignments.find((a) => a.id === assignmentId);
    if (!assignment) throw new Error("Assignment not found");

    const isLate = new Date() > new Date(assignment.dueDate);
    const submission: AssignmentSubmission = {
      id: `submission-${Date.now()}`,
      assignmentId,
      studentId: user.id,
      studentName: `${user.firstName} ${user.lastName}`,
      content,
      fileUrl,
      submittedAt: new Date(),
      status: isLate ? "late" : "submitted",
    };
    setSubmissions((prev) => [...prev, submission]);
    return submission;
  };

  const gradeSubmission = async (submissionId: string, grade: number, feedback?: string): Promise<AssignmentSubmission> => {
    const submission = submissions.find((s) => s.id === submissionId);
    if (!submission) throw new Error("Submission not found");
    const updated = { ...submission, grade, feedback, status: "graded" as const };
    setSubmissions((prev) => prev.map((s) => (s.id === submissionId ? updated : s)));
    return updated;
  };

  // Quiz operations
  const createQuiz = async (data: Omit<Quiz, "id" | "createdAt" | "updatedAt">): Promise<Quiz> => {
    const newQuiz: Quiz = {
      ...data,
      id: `quiz-${Date.now()}`,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    setQuizzes((prev) => [...prev, newQuiz]);
    return newQuiz;
  };

  const updateQuiz = async (id: string, updates: Partial<Quiz>): Promise<Quiz> => {
    const quiz = quizzes.find((q) => q.id === id);
    if (!quiz) throw new Error("Quiz not found");
    const updated = { ...quiz, ...updates, updatedAt: new Date() };
    setQuizzes((prev) => prev.map((q) => (q.id === id ? updated : q)));
    return updated;
  };

  const deleteQuiz = async (id: string): Promise<void> => {
    setQuizzes((prev) => prev.filter((q) => q.id !== id));
    setQuizAttempts((prev) => prev.filter((a) => a.quizId !== id));
  };

  const startQuizAttempt = async (quizId: string): Promise<QuizAttempt> => {
    if (!user) throw new Error("Must be logged in");
    const quiz = quizzes.find((q) => q.id === quizId);
    if (!quiz) throw new Error("Quiz not found");

    const maxScore = quiz.questions.reduce((sum, q) => sum + q.points, 0);
    const attempt: QuizAttempt = {
      id: `attempt-${Date.now()}`,
      quizId,
      studentId: user.id,
      studentName: `${user.firstName} ${user.lastName}`,
      answers: [],
      maxScore,
      startedAt: new Date(),
      status: "in-progress",
    };
    setQuizAttempts((prev) => [...prev, attempt]);
    return attempt;
  };

  const submitQuizAttempt = async (attemptId: string, answers: QuizAttempt["answers"]): Promise<QuizAttempt> => {
    const attempt = quizAttempts.find((a) => a.id === attemptId);
    if (!attempt) throw new Error("Attempt not found");

    const quiz = quizzes.find((q) => q.id === attempt.quizId);
    if (!quiz) throw new Error("Quiz not found");

    // Auto-grade
    const gradedAnswers = answers.map((answer) => {
      const question = quiz.questions.find((q) => q.id === answer.questionId);
      if (!question) return { ...answer, isCorrect: false, pointsEarned: 0 };

      let isCorrect = false;
      if (question.type === "short-answer") {
        isCorrect = String(answer.answer).toLowerCase().trim() === String(question.correctAnswer).toLowerCase().trim();
      } else {
        isCorrect = answer.answer === question.correctAnswer;
      }

      return {
        ...answer,
        isCorrect,
        pointsEarned: isCorrect ? question.points : 0,
      };
    });

    const score = gradedAnswers.reduce((sum, a) => sum + (a.pointsEarned || 0), 0);

    const updated: QuizAttempt = {
      ...attempt,
      answers: gradedAnswers,
      score,
      completedAt: new Date(),
      status: "completed",
    };

    setQuizAttempts((prev) => prev.map((a) => (a.id === attemptId ? updated : a)));
    return updated;
  };

  // Module operations
  const createModule = async (data: Omit<CourseModule, "id" | "createdAt" | "updatedAt" | "lessons">): Promise<CourseModule> => {
    const newModule: CourseModule = {
      ...data,
      id: `module-${Date.now()}`,
      lessons: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    setModules((prev) => [...prev, newModule]);
    return newModule;
  };

  const updateModule = async (id: string, updates: Partial<CourseModule>): Promise<CourseModule> => {
    const module = modules.find((m) => m.id === id);
    if (!module) throw new Error("Module not found");
    const updated = { ...module, ...updates, updatedAt: new Date() };
    setModules((prev) => prev.map((m) => (m.id === id ? updated : m)));
    return updated;
  };

  const deleteModule = async (id: string): Promise<void> => {
    setModules((prev) => prev.filter((m) => m.id !== id));
  };

  const addLesson = async (moduleId: string, lessonData: Omit<Lesson, "id" | "moduleId">): Promise<Lesson> => {
    const module = modules.find((m) => m.id === moduleId);
    if (!module) throw new Error("Module not found");

    const lesson: Lesson = {
      ...lessonData,
      id: `lesson-${Date.now()}`,
      moduleId,
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
