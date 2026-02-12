import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";
import {
  Announcement,
  AnnouncementComment,
  ClassMaterial,
  ClassTopic,
  Rubric,
  ClassInvite,
} from "@/types/classroom";
import { useAuth } from "./AuthContext";
import { classroomApi } from "@/services/api";

interface ClassroomContextType {
  // Announcements
  announcements: Announcement[];
  createAnnouncement: (courseId: string, content: string, attachments?: Announcement["attachments"]) => Promise<Announcement>;
  deleteAnnouncement: (id: string) => Promise<void>;
  togglePinAnnouncement: (id: string) => Promise<void>;
  addComment: (announcementId: string, content: string) => Promise<AnnouncementComment>;
  deleteComment: (announcementId: string, commentId: string) => Promise<void>;
  getAnnouncementsByCourse: (courseId: string) => Announcement[];

  // Materials
  materials: ClassMaterial[];
  addMaterial: (data: Omit<ClassMaterial, "id" | "createdBy" | "createdByName" | "createdAt" | "updatedAt">) => Promise<ClassMaterial>;
  deleteMaterial: (id: string) => Promise<void>;
  getMaterialsByCourse: (courseId: string) => ClassMaterial[];

  // Topics
  topics: ClassTopic[];
  createTopic: (courseId: string, name: string) => Promise<ClassTopic>;
  deleteTopic: (id: string) => Promise<void>;
  reorderTopics: (courseId: string, orderedIds: string[]) => Promise<void>;
  getTopicsByCourse: (courseId: string) => ClassTopic[];

  // Rubrics
  rubrics: Rubric[];
  createRubric: (data: Omit<Rubric, "id" | "createdBy" | "createdAt" | "updatedAt">) => Promise<Rubric>;
  updateRubric: (id: string, updates: Partial<Rubric>) => Promise<Rubric>;
  deleteRubric: (id: string) => Promise<void>;
  getRubricsByCourse: (courseId: string) => Rubric[];

  // Class Codes
  classInvites: ClassInvite[];
  generateClassCode: (courseId: string) => Promise<ClassInvite>;
  disableClassCode: (courseId: string) => Promise<void>;
  getClassCode: (courseId: string) => ClassInvite | undefined;
  findCourseByCode: (code: string) => string | undefined; // returns courseId

  isLoading: boolean;
}

const ClassroomContext = createContext<ClassroomContextType | undefined>(undefined);

function generateCode(): string {
  const chars = "abcdefghjkmnpqrstuvwxyz23456789";
  let code = "";
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

// Mock announcements
const mockAnnouncements: Announcement[] = [
  {
    id: "ann-1",
    courseId: "course-1",
    authorId: "lecturer-1",
    authorName: "Prof. John Lecturer",
    authorRole: "lecturer",
    content: "Welcome to Introduction to Computer Science! Please review the syllabus and complete the first module by next week. Feel free to ask questions in the stream.",
    attachments: [],
    comments: [
      {
        id: "comment-1",
        authorId: "student-1",
        authorName: "Alice Student",
        authorRole: "student",
        content: "Thank you! Looking forward to the course.",
        createdAt: new Date("2024-01-16"),
      },
    ],
    isPinned: true,
    createdAt: new Date("2024-01-15"),
    updatedAt: new Date("2024-01-15"),
  },
  {
    id: "ann-2",
    courseId: "course-1",
    authorId: "lecturer-1",
    authorName: "Prof. John Lecturer",
    authorRole: "lecturer",
    content: "Reminder: The Hello World assignment is due this Friday. Make sure to test your code before submitting.",
    attachments: [],
    comments: [],
    isPinned: false,
    createdAt: new Date("2024-01-20"),
    updatedAt: new Date("2024-01-20"),
  },
];

const mockMaterials: ClassMaterial[] = [
  {
    id: "mat-1",
    courseId: "course-1",
    title: "Course Syllabus",
    description: "Complete syllabus for CS101",
    type: "document",
    url: "#",
    createdBy: "lecturer-1",
    createdByName: "Prof. John Lecturer",
    createdAt: new Date("2024-01-15"),
    updatedAt: new Date("2024-01-15"),
  },
  {
    id: "mat-2",
    courseId: "course-1",
    title: "Python Documentation",
    description: "Official Python 3 documentation",
    type: "link",
    url: "https://docs.python.org/3/",
    createdBy: "lecturer-1",
    createdByName: "Prof. John Lecturer",
    createdAt: new Date("2024-01-16"),
    updatedAt: new Date("2024-01-16"),
  },
];

const mockTopics: ClassTopic[] = [
  { id: "topic-1", courseId: "course-1", name: "Week 1 - Introduction", order: 1, createdAt: new Date("2024-01-15") },
  { id: "topic-2", courseId: "course-1", name: "Week 2 - Variables", order: 2, createdAt: new Date("2024-01-22") },
  { id: "topic-3", courseId: "course-1", name: "Week 3 - Control Flow", order: 3, createdAt: new Date("2024-01-29") },
];

const mockRubrics: Rubric[] = [
  {
    id: "rubric-1",
    courseId: "course-1",
    title: "Programming Assignment Rubric",
    criteria: [
      {
        id: "crit-1",
        title: "Code Correctness",
        description: "Program produces correct output",
        maxPoints: 40,
        levels: [
          { id: "l1", label: "Excellent", description: "All test cases pass", points: 40 },
          { id: "l2", label: "Good", description: "Most test cases pass", points: 30 },
          { id: "l3", label: "Fair", description: "Some test cases pass", points: 20 },
          { id: "l4", label: "Poor", description: "Few or no test cases pass", points: 10 },
        ],
      },
      {
        id: "crit-2",
        title: "Code Style",
        description: "Code follows best practices and is well-formatted",
        maxPoints: 30,
        levels: [
          { id: "l5", label: "Excellent", description: "Clean, well-documented code", points: 30 },
          { id: "l6", label: "Good", description: "Mostly clean code", points: 20 },
          { id: "l7", label: "Fair", description: "Some style issues", points: 10 },
          { id: "l8", label: "Poor", description: "Many style issues", points: 5 },
        ],
      },
      {
        id: "crit-3",
        title: "Documentation",
        description: "Proper comments and README",
        maxPoints: 30,
        levels: [
          { id: "l9", label: "Excellent", description: "Thorough documentation", points: 30 },
          { id: "l10", label: "Good", description: "Adequate documentation", points: 20 },
          { id: "l11", label: "Fair", description: "Minimal documentation", points: 10 },
          { id: "l12", label: "Poor", description: "No documentation", points: 0 },
        ],
      },
    ],
    createdBy: "lecturer-1",
    createdAt: new Date("2024-01-15"),
    updatedAt: new Date("2024-01-15"),
  },
];

const mockInvites: ClassInvite[] = [
  { courseId: "course-1", code: "abc123", isActive: true, createdAt: new Date("2024-01-15") },
  { courseId: "course-2", code: "xyz789", isActive: true, createdAt: new Date("2024-02-01") },
];

function loadFromStorage<T>(key: string, fallback: T, dateFields: string[] = []): T {
  const stored = localStorage.getItem(key);
  if (!stored) return fallback;
  try {
    const parsed = JSON.parse(stored);
    if (Array.isArray(parsed)) {
      return parsed.map((item: Record<string, unknown>) => {
        const result = { ...item };
        dateFields.forEach((f) => {
          if (result[f]) result[f] = new Date(result[f] as string);
        });
        // Handle nested comments
        if (Array.isArray(result.comments)) {
          result.comments = (result.comments as Record<string, unknown>[]).map((c) => ({
            ...c,
            createdAt: c.createdAt ? new Date(c.createdAt as string) : new Date(),
          }));
        }
        return result;
      }) as T;
    }
    return parsed as T;
  } catch {
    return fallback;
  }
}

export function ClassroomProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [materials, setMaterials] = useState<ClassMaterial[]>([]);
  const [topics, setTopics] = useState<ClassTopic[]>([]);
  const [rubrics, setRubrics] = useState<Rubric[]>([]);
  const [classInvites, setClassInvites] = useState<ClassInvite[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setAnnouncements(loadFromStorage("edu-announcements", mockAnnouncements, ["createdAt", "updatedAt"]));
    setMaterials(loadFromStorage("edu-materials", mockMaterials, ["createdAt", "updatedAt"]));
    setTopics(loadFromStorage("edu-topics", mockTopics, ["createdAt"]));
    setRubrics(loadFromStorage("edu-rubrics", mockRubrics, ["createdAt", "updatedAt"]));
    setClassInvites(loadFromStorage("edu-class-invites", mockInvites, ["createdAt"]));
    setIsLoading(false);
  }, []);

  // Backend is the source of truth; no localStorage persistence.

  useEffect(() => {
    const load = async () => {
      if (!user) {
        setIsLoading(false);
        return;
      }

      try {
        const state: any = await classroomApi.state();

        const anns: Announcement[] = (state.announcements || []).map((a: any) => ({
          ...a,
          comments: (a.comments || []).map((c: any) => ({ ...c, createdAt: new Date(c.createdAt) })),
          createdAt: new Date(a.createdAt),
          updatedAt: new Date(a.updatedAt),
        }));
        setAnnouncements(anns);

        const mats: ClassMaterial[] = (state.materials || []).map((m: any) => ({
          ...m,
          createdAt: new Date(m.createdAt),
          updatedAt: new Date(m.updatedAt),
        }));
        setMaterials(mats);

        const tps: ClassTopic[] = (state.topics || []).map((t: any) => ({
          ...t,
          order: t.order ?? t.orderIndex ?? 1,
          createdAt: new Date(t.createdAt),
        }));
        setTopics(tps);

        const rbs: Rubric[] = (state.rubrics || []).map((r: any) => ({
          ...r,
          createdAt: new Date(r.createdAt),
          updatedAt: new Date(r.updatedAt),
        }));
        setRubrics(rbs);

        const invs: ClassInvite[] = (state.invites || []).map((i: any) => ({
          ...i,
          isActive: Boolean(i.isActive),
          createdAt: new Date(i.createdAt),
        }));
        setClassInvites(invs);
      } finally {
        setIsLoading(false);
      }
    };

    load();
  }, [user]);

  // Announcements
  const createAnnouncement = async (courseId: string, content: string, attachments?: Announcement["attachments"]) => {
    const created: any = await classroomApi.createAnnouncement({ courseId, content, attachments });
    const ann: Announcement = {
      ...created,
      createdAt: new Date(created.createdAt),
      updatedAt: new Date(created.updatedAt),
      comments: [],
    };
    setAnnouncements((prev) => [ann, ...prev]);
    return ann;
  };

  const deleteAnnouncement = async (id: string) => {
    await classroomApi.deleteAnnouncement(id);
    setAnnouncements((prev) => prev.filter((a) => a.id !== id));
  };

  const togglePinAnnouncement = async (id: string) => {
    const res: any = await classroomApi.togglePin(id);
    setAnnouncements((prev) => prev.map((a) => a.id === id ? { ...a, isPinned: Boolean(res.isPinned) } : a));
  };

  const addComment = async (announcementId: string, content: string) => {
    const created: any = await classroomApi.addComment(announcementId, { content });
    const comment: AnnouncementComment = { ...created, createdAt: new Date(created.createdAt) };
    setAnnouncements((prev) =>
      prev.map((a) =>
        a.id === announcementId
          ? { ...a, comments: [...a.comments, comment], updatedAt: new Date() }
          : a
      )
    );
    return comment;
  };

  const deleteComment = async (announcementId: string, commentId: string) => {
    await classroomApi.deleteComment(announcementId, commentId);
    setAnnouncements((prev) =>
      prev.map((a) => a.id === announcementId ? { ...a, comments: a.comments.filter((c) => c.id !== commentId) } : a)
    );
  };

  const getAnnouncementsByCourse = useCallback((courseId: string) => {
    return announcements
      .filter((a) => a.courseId === courseId)
      .sort((a, b) => {
        if (a.isPinned && !b.isPinned) return -1;
        if (!a.isPinned && b.isPinned) return 1;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
  }, [announcements]);

  // Materials
  const addMaterial = async (data: Omit<ClassMaterial, "id" | "createdBy" | "createdByName" | "createdAt" | "updatedAt">) => {
    const created: any = await classroomApi.addMaterial(data);
    const mat: ClassMaterial = {
      ...created,
      createdAt: new Date(created.createdAt),
      updatedAt: new Date(created.updatedAt),
    };
    setMaterials((prev) => [...prev, mat]);
    return mat;
  };

  const deleteMaterial = async (id: string) => {
    await classroomApi.deleteMaterial(id);
    setMaterials((prev) => prev.filter((m) => m.id !== id));
  };

  const getMaterialsByCourse = useCallback((courseId: string) => {
    return materials.filter((m) => m.courseId === courseId);
  }, [materials]);

  // Topics
  const createTopic = async (courseId: string, name: string) => {
    const created: any = await classroomApi.createTopic({ courseId, name });
    const topic: ClassTopic = { ...created, createdAt: new Date(created.createdAt) };
    setTopics((prev) => [...prev, topic]);
    return topic;
  };

  const deleteTopic = async (id: string) => {
    await classroomApi.deleteTopic(id);
    setTopics((prev) => prev.filter((t) => t.id !== id));
  };

  const reorderTopics = async (courseId: string, orderedIds: string[]) => {
    await classroomApi.reorderTopics({ courseId, orderedIds });
    setTopics((prev) =>
      prev.map((t) => {
        if (t.courseId !== courseId) return t;
        const idx = orderedIds.indexOf(t.id);
        return idx >= 0 ? { ...t, order: idx + 1 } : t;
      })
    );
  };

  const getTopicsByCourse = useCallback((courseId: string) => {
    return topics.filter((t) => t.courseId === courseId).sort((a, b) => a.order - b.order);
  }, [topics]);

  // Rubrics
  const createRubric = async (data: Omit<Rubric, "id" | "createdBy" | "createdAt" | "updatedAt">) => {
    const created: any = await classroomApi.createRubric(data);
    const rubric: Rubric = {
      ...created,
      createdAt: new Date(created.createdAt),
      updatedAt: new Date(created.updatedAt),
    };
    setRubrics((prev) => [...prev, rubric]);
    return rubric;
  };

  const updateRubric = async (id: string, updates: Partial<Rubric>) => {
    const rubric = rubrics.find((r) => r.id === id);
    if (!rubric) throw new Error("Rubric not found");
    const updatedRaw: any = await classroomApi.updateRubric(id, updates);
    const updated = {
      ...updatedRaw,
      createdAt: new Date(updatedRaw.createdAt),
      updatedAt: new Date(updatedRaw.updatedAt),
    } as Rubric;
    setRubrics((prev) => prev.map((r) => r.id === id ? updated : r));
    return updated;
  };

  const deleteRubric = async (id: string) => {
    await classroomApi.deleteRubric(id);
    setRubrics((prev) => prev.filter((r) => r.id !== id));
  };

  const getRubricsByCourse = useCallback((courseId: string) => {
    return rubrics.filter((r) => r.courseId === courseId);
  }, [rubrics]);

  // Class Codes
  const generateClassCode = async (courseId: string) => {
    const created: any = await classroomApi.generateInvite(courseId);
    const invite: ClassInvite = { ...created, createdAt: new Date(created.createdAt) };
    setClassInvites((prev) => [...prev.filter((i) => i.courseId !== courseId), invite]);
    return invite;
  };

  const disableClassCode = async (courseId: string) => {
    await classroomApi.disableInvite(courseId);
    setClassInvites((prev) =>
      prev.map((i) => i.courseId === courseId ? { ...i, isActive: false } : i)
    );
  };

  const getClassCode = useCallback((courseId: string) => {
    return classInvites.find((i) => i.courseId === courseId && i.isActive);
  }, [classInvites]);

  const findCourseByCode = useCallback((code: string) => {
    const invite = classInvites.find((i) => i.code === code.toLowerCase().trim() && i.isActive);
    return invite?.courseId;
  }, [classInvites]);

  return (
    <ClassroomContext.Provider
      value={{
        announcements, createAnnouncement, deleteAnnouncement, togglePinAnnouncement,
        addComment, deleteComment, getAnnouncementsByCourse,
        materials, addMaterial, deleteMaterial, getMaterialsByCourse,
        topics, createTopic, deleteTopic, reorderTopics, getTopicsByCourse,
        rubrics, createRubric, updateRubric, deleteRubric, getRubricsByCourse,
        classInvites, generateClassCode, disableClassCode, getClassCode, findCourseByCode,
        isLoading,
      }}
    >
      {children}
    </ClassroomContext.Provider>
  );
}

export function useClassroom() {
  const context = useContext(ClassroomContext);
  if (!context) throw new Error("useClassroom must be used within a ClassroomProvider");
  return context;
}
