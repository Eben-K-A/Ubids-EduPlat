// Class Stream & Announcements
export interface Announcement {
  id: string;
  courseId: string;
  authorId: string;
  authorName: string;
  authorRole: "lecturer" | "student" | "admin";
  content: string;
  attachments?: AnnouncementAttachment[];
  comments: AnnouncementComment[];
  isPinned: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface AnnouncementAttachment {
  id: string;
  name: string;
  url: string;
  type: "link" | "file";
}

export interface AnnouncementComment {
  id: string;
  authorId: string;
  authorName: string;
  authorRole: "lecturer" | "student" | "admin";
  content: string;
  createdAt: Date;
}

// Class Materials / Resources
export interface ClassMaterial {
  id: string;
  courseId: string;
  topicId?: string;
  title: string;
  description?: string;
  type: "file" | "link" | "video" | "document";
  url: string;
  createdBy: string;
  createdByName: string;
  createdAt: Date;
  updatedAt: Date;
}

// Topics for organizing classwork
export interface ClassTopic {
  id: string;
  courseId: string;
  name: string;
  order: number;
  createdAt: Date;
}

// Rubrics for grading
export interface Rubric {
  id: string;
  courseId: string;
  title: string;
  criteria: RubricCriterion[];
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface RubricCriterion {
  id: string;
  title: string;
  description: string;
  maxPoints: number;
  levels: RubricLevel[];
}

export interface RubricLevel {
  id: string;
  label: string; // e.g. "Excellent", "Good", "Fair", "Poor"
  description: string;
  points: number;
}

// Class Code / Invite
export interface ClassInvite {
  courseId: string;
  code: string;
  isActive: boolean;
  createdAt: Date;
}

// To-Do item (cross-course, derived)
export interface TodoItem {
  id: string;
  courseId: string;
  courseCode: string;
  courseTitle: string;
  title: string;
  type: "assignment" | "quiz";
  dueDate?: Date;
  isCompleted: boolean;
  points: number;
}
