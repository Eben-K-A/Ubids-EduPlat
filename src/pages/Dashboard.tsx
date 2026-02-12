import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useAuth } from "@/contexts/AuthContext";
import { useCourses } from "@/contexts/CourseContext";
import { useAssignments } from "@/contexts/AssignmentContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Users, Calendar, Bell, ArrowRight, Plus, FileText, Award, Clock } from "lucide-react";
import { useNavigate, Navigate } from "react-router-dom";
import { CreateCourseDialog } from "@/components/courses/CreateCourseDialog";
import { format, isPast, isFuture } from "date-fns";

export default function Dashboard() {
  const { user } = useAuth();
  const { getMyCourses, getMyEnrolledCourses, courses, enrollments } = useCourses();
  const { assignments, quizzes, getStudentSubmission, getQuizAttempt } = useAssignments();
  const navigate = useNavigate();

  // Redirect admins to admin dashboard
  if (user?.role === "admin") {
    return <Navigate to="/admin" replace />;
  }

  const isLecturer = user?.role === "lecturer";
  const myCourses = getMyCourses();
  const myEnrolledCourses = getMyEnrolledCourses();

  // Get upcoming assignments for students
  const upcomingAssignments = assignments
    .filter((a) => {
      if (isLecturer) {
        return myCourses.some((c) => c.id === a.courseId);
      }
      return enrollments.some((e) => e.courseId === a.courseId && e.studentId === user?.id) &&
        a.status === "published" &&
        isFuture(new Date(a.dueDate));
    })
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
    .slice(0, 3);

  // Get pending submissions count for students
  const pendingSubmissions = isLecturer ? 0 : upcomingAssignments.filter(
    (a) => !getStudentSubmission(a.id)
  ).length;

  // Get upcoming quizzes
  const upcomingQuizzes = quizzes
    .filter((q) => {
      if (isLecturer) {
        return myCourses.some((c) => c.id === q.courseId);
      }
      return enrollments.some((e) => e.courseId === q.courseId && e.studentId === user?.id) &&
        q.status === "published" &&
        !getQuizAttempt(q.id);
    })
    .slice(0, 2);

  const getRoleLabel = (role: string) => {
    switch (role) {
      case "lecturer":
        return "Lecturer";
      case "student":
        return "Student";
      case "admin":
        return "Administrator";
      default:
        return role;
    }
  };

  const getRoleBadgeClass = (role: string) => {
    switch (role) {
      case "lecturer":
        return "bg-primary/10 text-primary";
      case "student":
        return "bg-accent/10 text-accent";
      case "admin":
        return "bg-warning/10 text-warning";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  return (
    <DashboardLayout>
      {/* Welcome Section */}
      <div className="mb-6 sm:mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mb-2">
          <h1 className="text-2xl sm:text-3xl font-bold">
            Welcome back, {user?.firstName}!
          </h1>
          <span
            className={`px-3 py-1 rounded-full text-sm font-medium ${getRoleBadgeClass(
              user?.role || ""
            )}`}
          >
            {getRoleLabel(user?.role || "")}
          </span>
        </div>
        <p className="text-muted-foreground">
          Here's what's happening in your learning space today.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <Card className="border-l-4 border-l-primary">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {isLecturer ? "Your Courses" : "Enrolled Courses"}
            </CardTitle>
            <BookOpen className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLecturer ? myCourses.length : myEnrolledCourses.length}
            </div>
            <p className="text-xs text-muted-foreground">
              {isLecturer
                ? myCourses.length === 0
                  ? "Create your first course"
                  : `${myCourses.filter((c) => c.status === "published").length} published`
                : myEnrolledCourses.length === 0
                  ? "Browse and enroll"
                  : "Currently active"}
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-accent">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {isLecturer ? "Total Students" : "Available Courses"}
            </CardTitle>
            <Users className="h-4 w-4 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLecturer
                ? myCourses.reduce((acc, c) => acc + c.enrolledCount, 0)
                : (courses || []).filter((c) => c.status === "published").length}
            </div>
            <p className="text-xs text-muted-foreground">
              {isLecturer ? "Across all courses" : "Ready to enroll"}
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-success">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {isLecturer ? "Total Assignments" : "Pending Assignments"}
            </CardTitle>
            <Calendar className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLecturer
                ? assignments.filter(a => myCourses.some(c => c.id === a.courseId)).length
                : pendingSubmissions}
            </div>
            <p className="text-xs text-muted-foreground">
              {isLecturer ? "Across your courses" : pendingSubmissions === 0 ? "All caught up!" : "Due soon"}
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-warning">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {isLecturer ? "Total Quizzes" : "Available Quizzes"}
            </CardTitle>
            <Award className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLecturer
                ? quizzes.filter(q => myCourses.some(c => c.id === q.courseId)).length
                : upcomingQuizzes.length}
            </div>
            <p className="text-xs text-muted-foreground">
              {isLecturer ? "Across your courses" : upcomingQuizzes.length === 0 ? "None pending" : "Ready to take"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Content Sections */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>
                {isLecturer ? "Your Courses" : "My Enrollments"}
              </CardTitle>
              <CardDescription>
                {isLecturer
                  ? "Courses you've created"
                  : "Courses you're enrolled in"}
              </CardDescription>
            </div>
            {isLecturer ? (
              <CreateCourseDialog>
                <Button size="sm" variant="outline">
                  <Plus className="h-4 w-4 mr-1" />
                  New
                </Button>
              </CreateCourseDialog>
            ) : (
              <Button
                size="sm"
                variant="outline"
                onClick={() => navigate("/courses")}
              >
                Browse
                <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            )}
          </CardHeader>
          <CardContent>
            {(isLecturer ? myCourses : myEnrolledCourses).length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <div className="p-4 rounded-full bg-muted mb-4">
                  <BookOpen className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="font-semibold mb-1">No courses yet</h3>
                <p className="text-sm text-muted-foreground">
                  {isLecturer
                    ? "Create your first course to get started."
                    : "Explore and enroll in courses to start learning."}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {(isLecturer ? myCourses : myEnrolledCourses)
                  .slice(0, 3)
                  .map((course) => (
                    <div
                      key={course.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors cursor-pointer"
                      onClick={() => navigate(`/courses/${course.id}`)}
                    >
                      <div>
                        <p className="font-medium">{course.title}</p>
                        <p className="text-sm text-muted-foreground">
                          {course.code}
                        </p>
                      </div>
                      <ArrowRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                  ))}
                {(isLecturer ? myCourses : myEnrolledCourses).length > 3 && (
                  <Button
                    variant="ghost"
                    className="w-full"
                    onClick={() =>
                      navigate(isLecturer ? "/my-courses" : "/enrollments")
                    }
                  >
                    View all
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Upcoming Deadlines</CardTitle>
            <CardDescription>Assignments and quizzes due soon</CardDescription>
          </CardHeader>
          <CardContent>
            {upcomingAssignments.length === 0 && upcomingQuizzes.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <div className="p-4 rounded-full bg-muted mb-4">
                  <Calendar className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="font-semibold mb-1">No upcoming deadlines</h3>
                <p className="text-sm text-muted-foreground">
                  Your schedule is clear. Check back later!
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {upcomingAssignments.map((assignment) => {
                  const course = (courses || []).find((c) => c.id === assignment.courseId);
                  const hasSubmitted = !isLecturer && getStudentSubmission(assignment.id);
                  return (
                    <div
                      key={assignment.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-success/10">
                          <FileText className="h-4 w-4 text-success" />
                        </div>
                        <div>
                          <p className="font-medium text-sm">{assignment.title}</p>
                          <p className="text-xs text-muted-foreground">{course?.code}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        {hasSubmitted ? (
                          <Badge variant="outline" className="text-xs">Submitted</Badge>
                        ) : (
                          <>
                            <p className="text-xs text-muted-foreground flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {format(new Date(assignment.dueDate), "MMM d")}
                            </p>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
                {upcomingQuizzes.map((quiz) => {
                  const course = (courses || []).find((c) => c.id === quiz.courseId);
                  return (
                    <div
                      key={quiz.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors cursor-pointer"
                      onClick={() => navigate(`/quizzes/${quiz.id}`)}
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-warning/10">
                          <Award className="h-4 w-4 text-warning" />
                        </div>
                        <div>
                          <p className="font-medium text-sm">{quiz.title}</p>
                          <p className="text-xs text-muted-foreground">{course?.code}</p>
                        </div>
                      </div>
                      <Badge className="text-xs">Take Quiz</Badge>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
