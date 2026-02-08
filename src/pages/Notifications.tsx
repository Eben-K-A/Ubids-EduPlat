import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useNotifications, Notification } from "@/contexts/NotificationContext";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Bell,
  Clock,
  Award,
  MessageSquare,
  AlertTriangle,
  Info,
  CheckCircle2,
  X,
  Check,
  Trash2,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

const getNotificationIcon = (type: Notification["type"]) => {
  switch (type) {
    case "deadline":
      return <Clock className="h-5 w-5 text-destructive" />;
    case "grade":
      return <Award className="h-5 w-5 text-success" />;
    case "message":
      return <MessageSquare className="h-5 w-5 text-primary" />;
    case "warning":
      return <AlertTriangle className="h-5 w-5 text-warning" />;
    case "success":
      return <CheckCircle2 className="h-5 w-5 text-success" />;
    default:
      return <Info className="h-5 w-5 text-accent" />;
  }
};

export default function Notifications() {
  const { notifications, unreadCount, markAsRead, markAllAsRead, clearNotification } =
    useNotifications();
  const navigate = useNavigate();

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Notifications</h1>
            <p className="text-muted-foreground">
              {unreadCount > 0
                ? `You have ${unreadCount} unread notification${unreadCount > 1 ? "s" : ""}`
                : "All caught up!"}
            </p>
          </div>
          {unreadCount > 0 && (
            <Button variant="outline" onClick={markAllAsRead}>
              <Check className="h-4 w-4 mr-2" />
              Mark all as read
            </Button>
          )}
        </div>

        {notifications.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Bell className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="font-semibold mb-1">No notifications</h3>
              <p className="text-sm text-muted-foreground">
                You're all caught up. Check back later!
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {notifications.map((notification) => (
              <Card
                key={notification.id}
                className={`hover:shadow-md transition-shadow cursor-pointer ${
                  !notification.read ? "border-l-4 border-l-primary" : ""
                }`}
                onClick={() => {
                  markAsRead(notification.id);
                  if (notification.link) navigate(notification.link);
                }}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    <div className="p-2 rounded-lg bg-muted">
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className={`font-medium ${!notification.read ? "" : "text-muted-foreground"}`}>
                            {notification.title}
                          </p>
                          <p className="text-sm text-muted-foreground mt-0.5">
                            {notification.message}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {!notification.read && (
                            <Badge className="text-xs h-5">New</Badge>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={(e) => {
                              e.stopPropagation();
                              clearNotification(notification.id);
                            }}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatDistanceToNow(notification.createdAt, { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
