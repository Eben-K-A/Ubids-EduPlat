import { createContext, useContext, useState, ReactNode, useCallback, useEffect } from "react";
import { notificationsApi } from "@/services/api";

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

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    const load = async () => {
      try {
        const list: any[] = await notificationsApi.list();
        const mapped: Notification[] = list.map((n) => ({
          ...n,
          read: Boolean(n.read),
          createdAt: new Date(n.createdAt),
        }));
        setNotifications(mapped);
      } catch {
        // ignore for now
      }
    };

    load();
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAsRead = useCallback((id: string) => {
    notificationsApi.markRead(id).catch(() => {});
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  }, []);

  const markAllAsRead = useCallback(() => {
    notificationsApi.markAllRead().catch(() => {});
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, []);

  const clearNotification = useCallback((id: string) => {
    notificationsApi.delete(id).catch(() => {});
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const addNotification = useCallback(
    (notification: Omit<Notification, "id" | "read" | "createdAt">) => {
      notificationsApi
        .create(notification)
        .then((created: any) => {
          const newNotification: Notification = {
            ...created,
            read: Boolean(created.read),
            createdAt: new Date(created.createdAt),
          };
          setNotifications((prev) => [newNotification, ...prev]);
        })
        .catch(() => {
          // fallback local-only notification
          const local: Notification = {
            ...notification,
            id: `n-${Date.now()}`,
            read: false,
            createdAt: new Date(),
          };
          setNotifications((prev) => [local, ...prev]);
        });
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
