import { createContext, useContext, useState, ReactNode, useCallback } from "react";

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: "info" | "success" | "warning" | "deadline" | "grade" | "message";
  read: boolean;
  createdAt: Date;
  link?: string;
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearNotification: (id: string) => void;
  addNotification: (notification: Omit<Notification, "id" | "read" | "createdAt">) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

const mockNotifications: Notification[] = [
  {
    id: "n1",
    title: "Assignment Due Tomorrow",
    message: "Hello World Program is due tomorrow at 11:59 PM",
    type: "deadline",
    read: false,
    createdAt: new Date(Date.now() - 30 * 60 * 1000),
    link: "/assignments",
  },
  {
    id: "n2",
    title: "New Grade Posted",
    message: "Your Variables Exercise has been graded: 85/100",
    type: "grade",
    read: false,
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
    link: "/assignments",
  },
  {
    id: "n3",
    title: "New Message",
    message: "Dr. Sarah Johnson sent you a message",
    type: "message",
    read: false,
    createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000),
    link: "/messages",
  },
  {
    id: "n4",
    title: "Quiz Available",
    message: "Programming Basics Quiz is now available in CS101",
    type: "info",
    read: true,
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
    link: "/quizzes",
  },
  {
    id: "n5",
    title: "Course Material Updated",
    message: "New lecture notes uploaded for Web Development Fundamentals",
    type: "info",
    read: true,
    createdAt: new Date(Date.now() - 48 * 60 * 60 * 1000),
    link: "/files",
  },
  {
    id: "n6",
    title: "Meeting Starting Soon",
    message: "CS101 Office Hours starts in 30 minutes",
    type: "warning",
    read: false,
    createdAt: new Date(Date.now() - 10 * 60 * 1000),
    link: "/meetings",
  },
];

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>(mockNotifications);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAsRead = useCallback((id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, []);

  const clearNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const addNotification = useCallback(
    (notification: Omit<Notification, "id" | "read" | "createdAt">) => {
      const newNotification: Notification = {
        ...notification,
        id: `n-${Date.now()}`,
        read: false,
        createdAt: new Date(),
      };
      setNotifications((prev) => [newNotification, ...prev]);
    },
    []
  );

  return (
    <NotificationContext.Provider
      value={{ notifications, unreadCount, markAsRead, markAllAsRead, clearNotification, addNotification }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error("useNotifications must be used within a NotificationProvider");
  }
  return context;
}
