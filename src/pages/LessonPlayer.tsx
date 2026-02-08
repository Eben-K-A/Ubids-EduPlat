import { useState, useEffect } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useAssignments } from "@/contexts/AssignmentContext";
import { useCourses } from "@/contexts/CourseContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Circle,
  Clock,
  FileText,
  Play,
  Video,
  FileQuestion,
  ChevronRight,
  Maximize2,
} from "lucide-react";
import { Lesson, CourseModule } from "@/types/assignment";
import { toast } from "sonner";

export default function LessonPlayer() {
  const { courseId } = useParams<{ courseId: string }>();
  const [searchParams] = useSearchParams();
  const lessonId = searchParams.get("lesson");
  const navigate = useNavigate();
  const { getModulesByCourse, updateLesson } = useAssignments();
  const { courses } = useCourses();

  const course = courses.find((c) => c.id === courseId);
  const modules = courseId ? getModulesByCourse(courseId) : [];

  // Flatten all lessons with module context
  const allLessons = modules.flatMap((m) =>
    m.lessons.map((l) => ({ ...l, moduleTitle: m.title, moduleId: m.id }))
  );

  const currentIndex = allLessons.findIndex((l) => l.id === lessonId);
  const currentLesson = currentIndex >= 0 ? allLessons[currentIndex] : allLessons[0];
  const prevLesson = currentIndex > 0 ? allLessons[currentIndex - 1] : null;
  const nextLesson = currentIndex < allLessons.length - 1 ? allLessons[currentIndex + 1] : null;

  const completedCount = allLessons.filter((l) => l.isCompleted).length;
  const progressPercent = allLessons.length > 0 ? (completedCount / allLessons.length) * 100 : 0;

  const [sidebarOpen, setSidebarOpen] = useState(true);

  const handleMarkComplete = async () => {
    if (!currentLesson) return;
    try {
      await updateLesson(currentLesson.moduleId, currentLesson.id, { isCompleted: true });
      toast.success("Lesson marked as complete!");
      if (nextLesson) {
        navigate(`/courses/${courseId}/learn?lesson=${nextLesson.id}`);
      }
    } catch {
      toast.error("Failed to mark lesson");
    }
  };

  const navigateToLesson = (lId: string) => {
    navigate(`/courses/${courseId}/learn?lesson=${lId}`);
  };

  if (!course || !currentLesson) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center py-12">
          <h2 className="text-2xl font-bold mb-4">Content not found</h2>
          <Button onClick={() => navigate(`/courses/${courseId || ""}`)}>Back to Course</Button>
        </div>
      </DashboardLayout>
    );
  }

  const getLessonIcon = (type: string, completed?: boolean) => {
    if (completed) return <CheckCircle2 className="h-4 w-4 text-success" />;
    switch (type) {
      case "video":
        return <Video className="h-4 w-4 text-primary" />;
      case "quiz":
        return <FileQuestion className="h-4 w-4 text-warning" />;
      case "pdf":
        return <FileText className="h-4 w-4 text-destructive" />;
      default:
        return <BookOpen className="h-4 w-4 text-muted-foreground" />;
    }
  };

  return (
    <DashboardLayout>
      <div className="flex gap-0 -m-6">
        {/* Main Content */}
        <div className={`flex-1 flex flex-col ${sidebarOpen ? "" : ""}`}>
          {/* Top Nav */}
          <div className="flex items-center gap-3 px-6 py-3 border-b bg-card">
            <Button variant="ghost" size="icon" onClick={() => navigate(`/courses/${courseId}`)}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-muted-foreground">{course.title}</p>
              <p className="font-medium text-sm truncate">{currentLesson.title}</p>
            </div>
            <Badge variant="outline" className="text-xs">
              {currentIndex + 1} / {allLessons.length}
            </Badge>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              {sidebarOpen ? "Hide" : "Show"} Outline
            </Button>
          </div>

          {/* Content Area */}
          <div className="flex-1 p-6 overflow-y-auto">
            {/* Video Player Mock */}
            {currentLesson.type === "video" && (
              <div className="aspect-video bg-foreground/5 rounded-xl mb-6 flex items-center justify-center relative overflow-hidden border">
                <div className="text-center">
                  <div className="p-4 rounded-full bg-primary/10 mb-3 inline-flex">
                    <Play className="h-10 w-10 text-primary" />
                  </div>
                  <p className="font-medium">{currentLesson.title}</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {currentLesson.duration} min · Video Lecture
                  </p>
                  {currentLesson.resourceUrl && (
                    <Button variant="outline" size="sm" className="mt-3">
                      <Maximize2 className="h-3 w-3 mr-1" />
                      Open in new window
                    </Button>
                  )}
                </div>
                {/* Mock video controls */}
                <div className="absolute bottom-0 left-0 right-0 bg-foreground/80 p-2 flex items-center gap-3">
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-background">
                    <Play className="h-4 w-4" />
                  </Button>
                  <div className="flex-1 h-1 bg-background/30 rounded-full overflow-hidden">
                    <div className="h-full w-1/3 bg-primary rounded-full" />
                  </div>
                  <span className="text-xs text-background/70">
                    {currentLesson.duration ? `${Math.floor(currentLesson.duration / 3)}:00 / ${currentLesson.duration}:00` : "0:00"}
                  </span>
                </div>
              </div>
            )}

            {/* PDF Viewer Mock */}
            {currentLesson.type === "pdf" && (
              <div className="border rounded-xl mb-6 overflow-hidden">
                <div className="bg-muted px-4 py-2 flex items-center justify-between border-b">
                  <span className="text-sm font-medium">{currentLesson.title}.pdf</span>
                  <Button variant="ghost" size="sm">
                    <Maximize2 className="h-3 w-3 mr-1" />
                    Full Screen
                  </Button>
                </div>
                <div className="h-[500px] flex items-center justify-center bg-background">
                  <div className="text-center">
                    <FileText className="h-16 w-16 text-muted-foreground mx-auto mb-3" />
                    <p className="font-medium">PDF Document</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      {currentLesson.title}
                    </p>
                    <Button variant="outline" size="sm" className="mt-3">
                      Download PDF
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Text Content */}
            {(currentLesson.type === "text" || (!["video", "pdf", "quiz"].includes(currentLesson.type))) && (
              <Card className="mb-6">
                <CardContent className="pt-6 prose prose-sm dark:prose-invert max-w-none">
                  <h2>{currentLesson.title}</h2>
                  <p>{currentLesson.content}</p>
                  <p className="text-muted-foreground">
                    This is the lesson content area. In a production environment, this would display rich text, 
                    embedded media, code snippets, and interactive elements. The content would be loaded from 
                    the backend and rendered with full markdown/HTML support.
                  </p>
                  {currentLesson.duration && (
                    <p className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      Estimated reading time: {currentLesson.duration} minutes
                    </p>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Quiz Redirect */}
            {currentLesson.type === "quiz" && (
              <Card className="mb-6">
                <CardContent className="py-12 text-center">
                  <FileQuestion className="h-16 w-16 text-primary mx-auto mb-4" />
                  <h3 className="text-xl font-semibold mb-2">Quiz: {currentLesson.title}</h3>
                  <p className="text-muted-foreground mb-4">
                    Complete this quiz to test your understanding
                  </p>
                  <Button onClick={() => navigate("/quizzes")}>
                    Start Quiz
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Navigation & Complete */}
            <div className="flex items-center justify-between">
              <Button
                variant="outline"
                disabled={!prevLesson}
                onClick={() => prevLesson && navigateToLesson(prevLesson.id)}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Previous
              </Button>

              <Button
                onClick={handleMarkComplete}
                disabled={currentLesson.isCompleted}
                className={currentLesson.isCompleted ? "bg-success hover:bg-success" : ""}
              >
                {currentLesson.isCompleted ? (
                  <>
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Completed
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Mark Complete {nextLesson && "& Next"}
                  </>
                )}
              </Button>

              <Button
                variant="outline"
                disabled={!nextLesson}
                onClick={() => nextLesson && navigateToLesson(nextLesson.id)}
              >
                Next
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </div>
        </div>

        {/* Course Outline Sidebar */}
        {sidebarOpen && (
          <div className="w-80 border-l bg-card flex-shrink-0">
            <div className="px-4 py-3 border-b">
              <h3 className="font-semibold text-sm">Course Outline</h3>
              <div className="flex items-center gap-2 mt-2">
                <Progress value={progressPercent} className="h-1.5 flex-1" />
                <span className="text-xs text-muted-foreground">
                  {completedCount}/{allLessons.length}
                </span>
              </div>
            </div>
            <ScrollArea className="h-[calc(100vh-14rem)]">
              <div className="p-2">
                {modules.map((module) => (
                  <div key={module.id} className="mb-3">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-2 py-1">
                      {module.title}
                    </p>
                    <div className="space-y-0.5">
                      {module.lessons.map((lesson) => (
                        <button
                          key={lesson.id}
                          onClick={() => navigateToLesson(lesson.id)}
                          className={`w-full flex items-center gap-2 px-2 py-2 rounded-md text-left transition-colors text-sm ${
                            lesson.id === currentLesson.id
                              ? "bg-primary/10 text-primary font-medium"
                              : "hover:bg-muted"
                          }`}
                        >
                          {getLessonIcon(lesson.type, lesson.isCompleted)}
                          <span className="flex-1 truncate">{lesson.title}</span>
                          {lesson.duration && (
                            <span className="text-xs text-muted-foreground">{lesson.duration}m</span>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
