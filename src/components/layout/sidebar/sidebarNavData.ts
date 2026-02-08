import {
  LayoutDashboard,
  BookOpen,
  GraduationCap,
  FileText,
  FileQuestion,
  Users,
  MessageSquare,
  Video,
  BarChart3,
  FolderOpen,
  Brain,
  MessageCircle,
  ShieldCheck,
  FileWarning,
  Server,
  ScrollText,
  ClipboardList,
  PenTool,
  Landmark,
  ListTodo,
  UserPlus,
  Bell,
} from "lucide-react";

export interface NavItem {
  title: string;
  url: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number;
  badgeVariant?: "default" | "destructive" | "warning";
}

export interface NavGroup {
  label: string;
  items: NavItem[];
  defaultOpen?: boolean;
}

export const mainNavItems: NavItem[] = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { title: "Courses", url: "/courses", icon: BookOpen },
  { title: "To-Do", url: "/todo", icon: ListTodo, badge: 3, badgeVariant: "default" },
  { title: "Notifications", url: "/notifications", icon: Bell, badge: 5, badgeVariant: "destructive" },
];

export const lecturerNavItems: NavItem[] = [
  { title: "My Courses", url: "/my-courses", icon: GraduationCap },
  { title: "Assignments", url: "/assignments", icon: FileText },
  { title: "Quiz & Exam", url: "/quizzes", icon: FileQuestion },
  { title: "Grading", url: "/grading", icon: PenTool },
  { title: "Students", url: "/students", icon: Users },
];

export const studentNavItems: NavItem[] = [
  { title: "My Enrollments", url: "/enrollments", icon: GraduationCap },
  { title: "Join Class", url: "/join-class", icon: UserPlus },
  { title: "Assignments", url: "/my-assignments", icon: FileText },
  { title: "Quiz & Exam", url: "/quizzes", icon: FileQuestion },
  { title: "My Grades", url: "/my-grades", icon: PenTool },
];

export const communicationItems: NavItem[] = [
  { title: "Messages", url: "/messages", icon: MessageSquare, badge: 3, badgeVariant: "default" },
  { title: "Meetings", url: "/meetings", icon: Video },
  { title: "Collaboration", url: "/discussions", icon: MessageCircle },
];

export const toolsItems: NavItem[] = [
  { title: "Files", url: "/files", icon: FolderOpen },
  { title: "AI Services", url: "/ai", icon: Brain },
  { title: "Reports", url: "/reports", icon: ClipboardList },
  { title: "Analytics", url: "/analytics", icon: BarChart3 },
];

export const adminNavItems: NavItem[] = [
  { title: "Admin Dashboard", url: "/admin", icon: ShieldCheck },
  { title: "Academic Structure", url: "/admin/academic", icon: Landmark },
  { title: "User Management", url: "/admin/users", icon: Users },
  { title: "Content Moderation", url: "/admin/moderation", icon: FileWarning, badge: 3, badgeVariant: "destructive" },
  { title: "Audit Log", url: "/admin/audit-log", icon: ScrollText, badge: 2, badgeVariant: "warning" },
  { title: "System Settings", url: "/admin/system-settings", icon: Server },
];
