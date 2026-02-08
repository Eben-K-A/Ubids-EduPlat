import { useState, useMemo } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useAuth } from "@/contexts/AuthContext";
import { useCourses } from "@/contexts/CourseContext";
import { useAssignments } from "@/contexts/AssignmentContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar } from "@/components/ui/calendar";
import { useNavigate } from "react-router-dom";
import { format, isSameDay, isAfter, isBefore, startOfDay, addDays } from "date-fns";
import {
  ListTodo,
  CalendarDays,
  FileText,
  FileQuestion,
  Clock,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { TodoItem } from "@/types/classroom";

export default function TodoCalendar() {
  const { user } = useAuth();
  const { courses, enrollments } = useCourses();
  const { assignments, quizzes, getStudentSubmission, getQuizAttempt } = useAssignments();
  const navigate = useNavigate();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [showCompleted, setShowCompleted] = useState(false);

  const isLecturer = user?.role === "lecturer" || user?.role === "admin";

  // Build to-do items from assignments and quizzes
  const todoItems: TodoItem[] = useMemo(() => {
    const items: TodoItem[] = [];

    const myCourseIds = isLecturer
      ? courses.filter((c) => c.lecturerId === user?.id).map((c) => c.id)
      : enrollments.filter((e) => e.studentId === user?.id).map((e) => e.courseId);

    // Assignments
    assignments
      .filter((a) => myCourseIds.includes(a.courseId) && a.status === "published")
      .forEach((a) => {
        const course = courses.find((c) => c.id === a.courseId);
        const isCompleted = isLecturer ? false : !!getStudentSubmission(a.id);
        items.push({
          id: a.id,
          courseId: a.courseId,
          courseCode: course?.code || "",
          courseTitle: course?.title || "",
          title: a.title,
          type: "assignment",
          dueDate: new Date(a.dueDate),
          isCompleted,
          points: a.points,
        });
      });

    // Quizzes
    quizzes
      .filter((q) => myCourseIds.includes(q.courseId) && q.status === "published")
      .forEach((q) => {
        const course = courses.find((c) => c.id === q.courseId);
        const isCompleted = isLecturer ? false : !!getQuizAttempt(q.id);
        items.push({
          id: q.id,
          courseId: q.courseId,
          courseCode: course?.code || "",
          courseTitle: course?.title || "",
          title: q.title,
          type: "quiz",
          dueDate: q.dueDate ? new Date(q.dueDate) : undefined,
          isCompleted,
          points: q.questions.reduce((sum, qn) => sum + qn.points, 0),
        });
      });

    return items.sort((a, b) => {
      if (!a.dueDate && !b.dueDate) return 0;
      if (!a.dueDate) return 1;
      if (!b.dueDate) return -1;
      return a.dueDate.getTime() - b.dueDate.getTime();
    });
  }, [assignments, quizzes, courses, enrollments, user, isLecturer, getStudentSubmission, getQuizAttempt]);

  const pendingItems = todoItems.filter((t) => !t.isCompleted);
  const completedItems = todoItems.filter((t) => t.isCompleted);
  const overdueItems = pendingItems.filter((t) => t.dueDate && isBefore(t.dueDate, startOfDay(new Date())));
  const todayItems = pendingItems.filter((t) => t.dueDate && isSameDay(t.dueDate, new Date()));
  const upcomingItems = pendingItems.filter(
    (t) => t.dueDate && isAfter(t.dueDate, startOfDay(new Date())) && !isSameDay(t.dueDate, new Date())
  );
  const noDueDateItems = pendingItems.filter((t) => !t.dueDate);

  // Get dates that have items for calendar highlighting
  const itemDates = todoItems
    .filter((t) => t.dueDate)
    .map((t) => t.dueDate!);

  const selectedDateItems = selectedDate
    ? todoItems.filter((t) => t.dueDate && isSameDay(t.dueDate, selectedDate))
    : [];

  const renderTodoItem = (item: TodoItem) => {
    const isOverdue = item.dueDate && isBefore(item.dueDate, startOfDay(new Date())) && !item.isCompleted;
    return (
      <div
        key={`${item.type}-${item.id}`}
        className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer group"
        onClick={() => navigate(`/courses/${item.courseId}`)}
      >
        <div className={`p-2 rounded-md mt-0.5 ${item.type === "assignment" ? "bg-primary/10" : "bg-warning/10"}`}>
          {item.type === "assignment" ? (
            <FileText className={`h-4 w-4 ${item.isCompleted ? "text-success" : "text-primary"}`} />
          ) : (
            <FileQuestion className={`h-4 w-4 ${item.isCompleted ? "text-success" : "text-warning"}`} />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className={`font-medium text-sm truncate ${item.isCompleted ? "line-through text-muted-foreground" : ""}`}>
              {item.title}
            </p>
            {item.isCompleted && <CheckCircle2 className="h-3 w-3 text-success shrink-0" />}
            {isOverdue && <AlertCircle className="h-3 w-3 text-destructive shrink-0" />}
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            <Badge variant="outline" className="text-[10px]">{item.courseCode}</Badge>
            <span className="text-[10px] text-muted-foreground">{item.points} pts</span>
            {item.dueDate && (
              <span className={`text-[10px] flex items-center gap-0.5 ${isOverdue ? "text-destructive font-medium" : "text-muted-foreground"}`}>
                <Clock className="h-2.5 w-2.5" />
                {isOverdue ? "Overdue · " : ""}
                {format(item.dueDate, "MMM d, h:mm a")}
              </span>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">To-Do & Calendar</h1>
          <p className="text-muted-foreground">
            Track all your assignments and quizzes across courses
          </p>
        </div>

        {/* Summary cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card className="border-l-4 border-l-destructive">
            <CardContent className="pt-4">
              <p className="text-2xl font-bold">{overdueItems.length}</p>
              <p className="text-sm text-muted-foreground">Overdue</p>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-warning">
            <CardContent className="pt-4">
              <p className="text-2xl font-bold">{todayItems.length}</p>
              <p className="text-sm text-muted-foreground">Due Today</p>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-primary">
            <CardContent className="pt-4">
              <p className="text-2xl font-bold">{upcomingItems.length}</p>
              <p className="text-sm text-muted-foreground">Upcoming</p>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-success">
            <CardContent className="pt-4">
              <p className="text-2xl font-bold">{completedItems.length}</p>
              <p className="text-sm text-muted-foreground">Completed</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="list">
          <TabsList>
            <TabsTrigger value="list" className="flex items-center gap-2">
              <ListTodo className="h-4 w-4" />
              To-Do List
            </TabsTrigger>
            <TabsTrigger value="calendar" className="flex items-center gap-2">
              <CalendarDays className="h-4 w-4" />
              Calendar
            </TabsTrigger>
          </TabsList>

          <TabsContent value="list" className="space-y-4">
            {/* Overdue */}
            {overdueItems.length > 0 && (
              <Card className="border-destructive/30">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-destructive flex items-center gap-2">
                    <AlertCircle className="h-4 w-4" />
                    Overdue ({overdueItems.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-1">
                  {overdueItems.map(renderTodoItem)}
                </CardContent>
              </Card>
            )}

            {/* Due Today */}
            {todayItems.length > 0 && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Clock className="h-4 w-4 text-warning" />
                    Due Today ({todayItems.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-1">
                  {todayItems.map(renderTodoItem)}
                </CardContent>
              </Card>
            )}

            {/* Upcoming */}
            {upcomingItems.length > 0 && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <CalendarDays className="h-4 w-4 text-primary" />
                    Upcoming ({upcomingItems.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-1">
                  {upcomingItems.map(renderTodoItem)}
                </CardContent>
              </Card>
            )}

            {/* No due date */}
            {noDueDateItems.length > 0 && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-muted-foreground">No Due Date</CardTitle>
                </CardHeader>
                <CardContent className="space-y-1">
                  {noDueDateItems.map(renderTodoItem)}
                </CardContent>
              </Card>
            )}

            {/* Completed */}
            {completedItems.length > 0 && (
              <div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowCompleted(!showCompleted)}
                  className="text-muted-foreground"
                >
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  {showCompleted ? "Hide" : "Show"} completed ({completedItems.length})
                </Button>
                {showCompleted && (
                  <Card className="mt-2">
                    <CardContent className="pt-4 space-y-1">
                      {completedItems.map(renderTodoItem)}
                    </CardContent>
                  </Card>
                )}
              </div>
            )}

            {pendingItems.length === 0 && (
              <Card>
                <CardContent className="py-12 text-center">
                  <CheckCircle2 className="h-12 w-12 mx-auto text-success mb-4" />
                  <p className="font-semibold">All caught up!</p>
                  <p className="text-sm text-muted-foreground">No pending tasks</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="calendar">
            <div className="grid gap-6 lg:grid-cols-[auto_1fr]">
              <Card className="w-fit">
                <CardContent className="pt-4">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={setSelectedDate}
                    modifiers={{
                      hasItems: itemDates,
                    }}
                    modifiersStyles={{
                      hasItems: {
                        fontWeight: "bold",
                        textDecoration: "underline",
                        textDecorationColor: "hsl(var(--primary))",
                        textUnderlineOffset: "4px",
                      },
                    }}
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">
                    {selectedDate ? format(selectedDate, "EEEE, MMMM d, yyyy") : "Select a date"}
                  </CardTitle>
                  <CardDescription>
                    {selectedDateItems.length} item{selectedDateItems.length !== 1 ? "s" : ""}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {selectedDateItems.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-4 text-center">
                      No items due on this date
                    </p>
                  ) : (
                    <div className="space-y-1">
                      {selectedDateItems.map(renderTodoItem)}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
