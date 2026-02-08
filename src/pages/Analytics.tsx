import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useAuth } from "@/contexts/AuthContext";
import { useCourses } from "@/contexts/CourseContext";
import { useAssignments } from "@/contexts/AssignmentContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import {
  TrendingUp,
  Users,
  BookOpen,
  FileText,
  Award,
  Clock,
  CheckCircle2,
  Target,
} from "lucide-react";

const COLORS = ["hsl(var(--primary))", "hsl(var(--accent))", "hsl(var(--success))", "hsl(var(--warning))"];

export default function Analytics() {
  const { user } = useAuth();
  const { courses, enrollments, getMyCourses, getMyEnrolledCourses } = useCourses();
  const { assignments, quizzes, submissions, quizAttempts } = useAssignments();

  const isLecturer = user?.role === "lecturer" || user?.role === "admin";
  const myCourses = getMyCourses();
  const myEnrolledCourses = getMyEnrolledCourses();

  // Mock engagement data
  const engagementData = [
    { week: "Week 1", students: 45, completions: 38 },
    { week: "Week 2", students: 52, completions: 44 },
    { week: "Week 3", students: 49, completions: 41 },
    { week: "Week 4", students: 58, completions: 52 },
    { week: "Week 5", students: 62, completions: 55 },
    { week: "Week 6", students: 68, completions: 61 },
  ];

  // Assignment completion rate
  const completionData = [
    { name: "On Time", value: 75, color: "hsl(var(--success))" },
    { name: "Late", value: 15, color: "hsl(var(--warning))" },
    { name: "Missing", value: 10, color: "hsl(var(--destructive))" },
  ];

  // Course performance data
  const coursePerformanceData = myCourses.slice(0, 5).map((course) => ({
    name: course.code,
    students: course.enrolledCount,
    avgScore: Math.round(70 + Math.random() * 25),
  }));

  // Quiz score distribution
  const quizScoreData = [
    { range: "0-20%", count: 2 },
    { range: "21-40%", count: 5 },
    { range: "41-60%", count: 12 },
    { range: "61-80%", count: 25 },
    { range: "81-100%", count: 18 },
  ];

  // Student progress for enrolled courses
  const studentProgress = myEnrolledCourses.map((course) => ({
    course: course.title,
    progress: Math.round(Math.random() * 100),
    assignmentsCompleted: Math.floor(Math.random() * 5),
    quizzesCompleted: Math.floor(Math.random() * 3),
  }));

  const totalStudents = isLecturer
    ? myCourses.reduce((acc, c) => acc + c.enrolledCount, 0)
    : 0;

  const totalSubmissions = isLecturer
    ? submissions.filter((s) => 
        assignments.some((a) => 
          a.id === s.assignmentId && 
          myCourses.some((c) => c.id === a.courseId)
        )
      ).length
    : submissions.filter((s) => s.studentId === user?.id).length;

  const totalQuizAttempts = isLecturer
    ? quizAttempts.filter((a) =>
        quizzes.some((q) =>
          q.id === a.quizId && myCourses.some((c) => c.id === q.courseId)
        )
      ).length
    : quizAttempts.filter((a) => a.studentId === user?.id).length;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
          <p className="text-muted-foreground">
            {isLecturer
              ? "Track student performance and course engagement"
              : "Monitor your learning progress and achievements"}
          </p>
        </div>

        {/* Key Metrics */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {isLecturer ? "Total Students" : "Enrolled Courses"}
              </CardTitle>
              {isLecturer ? (
                <Users className="h-4 w-4 text-primary" />
              ) : (
                <BookOpen className="h-4 w-4 text-primary" />
              )}
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {isLecturer ? totalStudents : myEnrolledCourses.length}
              </div>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <TrendingUp className="h-3 w-3 text-success" />
                +12% from last month
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {isLecturer ? "Active Courses" : "Avg. Progress"}
              </CardTitle>
              <Target className="h-4 w-4 text-accent" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {isLecturer
                  ? myCourses.filter((c) => c.status === "published").length
                  : "72%"}
              </div>
              <p className="text-xs text-muted-foreground">
                {isLecturer ? "Currently published" : "Across all courses"}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Submissions
              </CardTitle>
              <FileText className="h-4 w-4 text-success" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalSubmissions}</div>
              <p className="text-xs text-muted-foreground">
                {isLecturer ? "Total received" : "Total submitted"}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Quiz Attempts
              </CardTitle>
              <Award className="h-4 w-4 text-warning" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalQuizAttempts}</div>
              <p className="text-xs text-muted-foreground">
                {isLecturer ? "Completed by students" : "Quizzes completed"}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Charts Grid */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Engagement Chart */}
          <Card>
            <CardHeader>
              <CardTitle>
                {isLecturer ? "Student Engagement" : "Learning Activity"}
              </CardTitle>
              <CardDescription>Weekly activity overview</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={engagementData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="week" className="text-xs" />
                    <YAxis className="text-xs" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="students"
                      stackId="1"
                      stroke="hsl(var(--primary))"
                      fill="hsl(var(--primary)/0.3)"
                      name="Active Students"
                    />
                    <Area
                      type="monotone"
                      dataKey="completions"
                      stackId="2"
                      stroke="hsl(var(--accent))"
                      fill="hsl(var(--accent)/0.3)"
                      name="Completions"
                    />
                    <Legend />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Completion Rate Pie */}
          <Card>
            <CardHeader>
              <CardTitle>Assignment Completion</CardTitle>
              <CardDescription>Submission status breakdown</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={completionData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {completionData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                      }}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Quiz Score Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>Quiz Score Distribution</CardTitle>
              <CardDescription>Performance breakdown by percentage range</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={quizScoreData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="range" className="text-xs" />
                    <YAxis className="text-xs" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                      }}
                    />
                    <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} name="Students" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Course Performance / Student Progress */}
          <Card>
            <CardHeader>
              <CardTitle>
                {isLecturer ? "Course Performance" : "My Progress"}
              </CardTitle>
              <CardDescription>
                {isLecturer ? "Average scores by course" : "Progress in enrolled courses"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLecturer ? (
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={coursePerformanceData} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis type="number" domain={[0, 100]} className="text-xs" />
                      <YAxis dataKey="name" type="category" className="text-xs" width={60} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "8px",
                        }}
                      />
                      <Bar dataKey="avgScore" fill="hsl(var(--accent))" radius={[0, 4, 4, 0]} name="Avg Score %" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="space-y-4">
                  {studentProgress.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">
                      Enroll in courses to see your progress
                    </p>
                  ) : (
                    studentProgress.map((item, idx) => (
                      <div key={idx} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium truncate max-w-[200px]">
                            {item.course}
                          </span>
                          <span className="text-sm text-muted-foreground">
                            {item.progress}%
                          </span>
                        </div>
                        <Progress value={item.progress} className="h-2" />
                        <div className="flex gap-4 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <CheckCircle2 className="h-3 w-3" />
                            {item.assignmentsCompleted} assignments
                          </span>
                          <span className="flex items-center gap-1">
                            <Award className="h-3 w-3" />
                            {item.quizzesCompleted} quizzes
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest submissions and completions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((_, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                      {idx % 2 === 0 ? (
                        <FileText className="h-4 w-4 text-primary" />
                      ) : (
                        <Award className="h-4 w-4 text-accent" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium">
                        {idx % 2 === 0
                          ? `Assignment ${idx + 1} submitted`
                          : `Quiz ${idx} completed`}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {idx + 1} hours ago
                      </p>
                    </div>
                  </div>
                  <Badge variant="outline">
                    {idx % 2 === 0 ? (
                      <Clock className="h-3 w-3 mr-1" />
                    ) : (
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                    )}
                    {idx % 2 === 0 ? "Pending Review" : "Completed"}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
