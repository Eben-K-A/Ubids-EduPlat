import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useCourses } from "@/contexts/CourseContext";
import { useAssignments } from "@/contexts/AssignmentContext";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  ArrowLeft,
  BookOpen,
  FileText,
  Video,
  CheckCircle2,
  Clock,
  Users,
  Calendar,
  Play,
  FileQuestion,
  ClipboardList,
  Megaphone,
  FolderOpen,
  ClipboardCheck,
} from "lucide-react";
import { format } from "date-fns";
import { EditCourseDialog } from "@/components/courses/EditCourseDialog";
import { CreateAssignmentDialog } from "@/components/assignments/CreateAssignmentDialog";
import { CreateQuizDialog } from "@/components/quizzes/CreateQuizDialog";
import { ModuleLessonManager } from "@/components/courses/ModuleLessonManager";
import { ClassStream } from "@/components/classroom/ClassStream";
import { ClassCodeCard } from "@/components/classroom/ClassCodeCard";
import { MaterialsList } from "@/components/classroom/MaterialsList";
import { TopicManager } from "@/components/classroom/TopicManager";
import { RubricEditor } from "@/components/classroom/RubricEditor";
import { ArchiveReuse } from "@/components/classroom/ArchiveReuse";

export default function CourseDetail() {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { courses, enrollments } = useCourses();
  const { getModulesByCourse, getAssignmentsByCourse, getQuizzesByCourse } = useAssignments();
  const [editCourseOpen, setEditCourseOpen] = useState(false);

  const course = courses.find((c) => c.id === courseId);
  const isEnrolled = enrollments.some((e) => e.courseId === courseId && e.studentId === user?.id);
  const isOwner = course?.lecturerId === user?.id;
  const isLecturer = user?.role === "lecturer" || user?.role === "admin";

  const modules = courseId ? getModulesByCourse(courseId) : [];
  const assignments = courseId ? getAssignmentsByCourse(courseId) : [];
  const quizzes = courseId ? getQuizzesByCourse(courseId) : [];

  const totalLessons = modules.reduce((sum, m) => sum + m.lessons.length, 0);
  const completedLessons = modules.reduce(
    (sum, m) => sum + m.lessons.filter((l) => l.isCompleted).length,
    0
  );
  const progressPercent = totalLessons > 0 ? (completedLessons / totalLessons) * 100 : 0;

  if (!course) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center py-12">
          <h2 className="text-2xl font-bold mb-4">Course not found</h2>
          <Button onClick={() => navigate("/courses")}>Back to Courses</Button>
        </div>
      </DashboardLayout>
    );
  }

  const getLessonIcon = (type: string) => {
    switch (type) {
      case "video":
        return <Video className="h-4 w-4" />;
      case "quiz":
        return <FileQuestion className="h-4 w-4" />;
      case "pdf":
        return <FileText className="h-4 w-4" />;
      default:
        return <BookOpen className="h-4 w-4" />;
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <Badge variant="outline" className="font-mono">
                {course.code}
              </Badge>
              <Badge
                variant={course.status === "published" ? "default" : "secondary"}
                className={course.status === "published" ? "bg-success text-success-foreground" : ""}
              >
                {course.status}
              </Badge>
            </div>
            <h1 className="text-3xl font-bold tracking-tight">{course.title}</h1>
            <p className="text-muted-foreground">by {course.lecturerName}</p>
          </div>
          <div className="flex items-center gap-2">
            {(isOwner || isLecturer) && (
              <>
                <ArchiveReuse courseId={courseId!} isOwner={isOwner || false} />
                <Button onClick={() => setEditCourseOpen(true)}>
                  Edit Course
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Course Stats + Class Code Side by Side */}
        <div className="grid gap-4 md:grid-cols-5">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Users className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{course.enrolledCount}</p>
                  <p className="text-sm text-muted-foreground">Students</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <BookOpen className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{modules.length}</p>
                  <p className="text-sm text-muted-foreground">Modules</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <ClipboardList className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{assignments.length}</p>
                  <p className="text-sm text-muted-foreground">Assignments</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <FileQuestion className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{quizzes.length}</p>
                  <p className="text-sm text-muted-foreground">Quizzes</p>
                </div>
              </div>
            </CardContent>
          </Card>
          {/* Class Code Card */}
          <ClassCodeCard courseId={courseId!} isOwner={isOwner || false} />
        </div>

        {/* Progress (for enrolled students) */}
        {isEnrolled && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Your Progress</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>{completedLessons} of {totalLessons} lessons completed</span>
                  <span className="font-medium">{Math.round(progressPercent)}%</span>
                </div>
                <Progress value={progressPercent} className="h-2" />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Tabs */}
        <Tabs defaultValue="stream" className="space-y-4">
          <TabsList className="flex-wrap">
            <TabsTrigger value="stream" className="gap-1.5">
              <Megaphone className="h-3.5 w-3.5" />
              Stream
            </TabsTrigger>
            <TabsTrigger value="content" className="gap-1.5">
              <BookOpen className="h-3.5 w-3.5" />
              Classwork
            </TabsTrigger>
            <TabsTrigger value="materials" className="gap-1.5">
              <FolderOpen className="h-3.5 w-3.5" />
              Materials
            </TabsTrigger>
            <TabsTrigger value="assignments" className="gap-1.5">
              <FileText className="h-3.5 w-3.5" />
              Assignments
            </TabsTrigger>
            <TabsTrigger value="quizzes" className="gap-1.5">
              <FileQuestion className="h-3.5 w-3.5" />
              Quizzes
            </TabsTrigger>
            {(isOwner || isLecturer) && (
              <TabsTrigger value="rubrics" className="gap-1.5">
                <ClipboardCheck className="h-3.5 w-3.5" />
                Rubrics
              </TabsTrigger>
            )}
            <TabsTrigger value="about" className="gap-1.5">About</TabsTrigger>
          </TabsList>

          {/* Stream Tab */}
          <TabsContent value="stream" className="space-y-4">
            <div className="grid gap-4 lg:grid-cols-[1fr_280px]">
              <ClassStream courseId={courseId!} isOwner={isOwner || false} />
              <div className="space-y-4">
                <TopicManager courseId={courseId!} isOwner={isOwner || false} />
              </div>
            </div>
          </TabsContent>

          {/* Classwork / Course Content Tab */}
          <TabsContent value="content" className="space-y-4">
            {isOwner ? (
              <ModuleLessonManager courseId={courseId!} />
            ) : modules.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center">
                  <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No modules yet</p>
                </CardContent>
              </Card>
            ) : (
              <Accordion type="multiple" className="space-y-4">
                {modules.map((module, index) => (
                  <AccordionItem
                    key={module.id}
                    value={module.id}
                    className="border rounded-lg px-4"
                  >
                    <AccordionTrigger className="hover:no-underline">
                      <div className="flex items-center gap-4 text-left">
                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-semibold text-sm">
                          {index + 1}
                        </div>
                        <div>
                          <h3 className="font-semibold">{module.title}</h3>
                          <p className="text-sm text-muted-foreground">
                            {module.lessons.length} lessons
                          </p>
                        </div>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-2 ml-12 pt-2">
                        {module.lessons.map((lesson) => (
                          <div
                            key={lesson.id}
                            className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                            onClick={() => navigate(`/courses/${courseId}/learn?lesson=${lesson.id}`)}
                          >
                            <div className="p-2 rounded-md bg-muted">
                              {getLessonIcon(lesson.type)}
                            </div>
                            <div className="flex-1">
                              <p className="font-medium text-sm">{lesson.title}</p>
                              {lesson.duration && (
                                <p className="text-xs text-muted-foreground flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  {lesson.duration} min
                                </p>
                              )}
                            </div>
                            {lesson.isCompleted ? (
                              <CheckCircle2 className="h-5 w-5 text-success" />
                            ) : (
                              <Play className="h-5 w-5 text-muted-foreground" />
                            )}
                          </div>
                        ))}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            )}
          </TabsContent>

          {/* Materials Tab */}
          <TabsContent value="materials" className="space-y-4">
            <MaterialsList courseId={courseId!} isOwner={isOwner || false} />
          </TabsContent>

          {/* Assignments Tab */}
          <TabsContent value="assignments" className="space-y-4">
            {assignments.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center">
                  <ClipboardList className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No assignments yet</p>
                  {isOwner && <CreateAssignmentDialog />}
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {isOwner && (
                  <div className="flex justify-end">
                    <CreateAssignmentDialog />
                  </div>
                )}
                {assignments.map((assignment) => (
                  <Card key={assignment.id} className="hover:shadow-md transition-shadow cursor-pointer">
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-lg">{assignment.title}</CardTitle>
                          <CardDescription className="mt-1">
                            {assignment.description}
                          </CardDescription>
                        </div>
                        <Badge variant={assignment.status === "published" ? "default" : "secondary"}>
                          {assignment.status}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          Due: {format(new Date(assignment.dueDate), "MMM d, yyyy")}
                        </div>
                        <div className="flex items-center gap-1">
                          <FileText className="h-4 w-4" />
                          {assignment.points} points
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Quizzes Tab */}
          <TabsContent value="quizzes" className="space-y-4">
            {quizzes.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center">
                  <FileQuestion className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No quizzes yet</p>
                  {isOwner && <CreateQuizDialog />}
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {isOwner && (
                  <div className="flex justify-end">
                    <CreateQuizDialog />
                  </div>
                )}
                {quizzes.map((quiz) => (
                  <Card key={quiz.id} className="hover:shadow-md transition-shadow cursor-pointer">
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-lg">{quiz.title}</CardTitle>
                          <CardDescription className="mt-1">
                            {quiz.description}
                          </CardDescription>
                        </div>
                        <Badge variant={quiz.status === "published" ? "default" : "secondary"}>
                          {quiz.status}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <FileQuestion className="h-4 w-4" />
                          {quiz.questions.length} questions
                        </div>
                        {quiz.timeLimit && (
                          <div className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            {quiz.timeLimit} min
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Rubrics Tab */}
          {(isOwner || isLecturer) && (
            <TabsContent value="rubrics" className="space-y-4">
              <RubricEditor courseId={courseId!} isOwner={isOwner || false} />
            </TabsContent>
          )}

          {/* About Tab */}
          <TabsContent value="about">
            <Card>
              <CardHeader>
                <CardTitle>About This Course</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground">{course.description}</p>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <h4 className="font-semibold mb-2">Instructor</h4>
                    <p className="text-muted-foreground">{course.lecturerName}</p>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">Enrollment</h4>
                    <p className="text-muted-foreground">
                      {course.enrolledCount} students
                      {course.maxEnrollment && ` / ${course.maxEnrollment} max`}
                    </p>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">Created</h4>
                    <p className="text-muted-foreground">
                      {format(new Date(course.createdAt), "MMMM d, yyyy")}
                    </p>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">Last Updated</h4>
                    <p className="text-muted-foreground">
                      {format(new Date(course.updatedAt), "MMMM d, yyyy")}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Edit Course Dialog */}
      {course && (
        <EditCourseDialog
          course={course}
          open={editCourseOpen}
          onOpenChange={setEditCourseOpen}
        />
      )}
    </DashboardLayout>
  );
}
