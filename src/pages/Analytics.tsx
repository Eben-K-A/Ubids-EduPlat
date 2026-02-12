import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useAuth } from "@/contexts/AuthContext";
import { useAnalytics } from "@/hooks/useApi";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
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
  AlertCircle
} from "lucide-react";

export default function Analytics() {
  const { user } = useAuth();
  const { data: analyticsData, isLoading, error } = useAnalytics();

  const isLecturer = user?.role === "lecturer" || user?.role === "admin";

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <div>
            <Skeleton className="h-8 w-48 mb-2" />
            <Skeleton className="h-4 w-96" />
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i}>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-4 rounded-full" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-8 w-16 mb-1" />
                  <Skeleton className="h-3 w-32" />
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="grid gap-6 lg:grid-cols-2">
            <Skeleton className="h-[300px] w-full" />
            <Skeleton className="h-[300px] w-full" />
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center py-12 text-center text-destructive">
          <AlertCircle className="h-12 w-12 mb-4" />
          <h2 className="text-2xl font-bold mb-2">Failed to load analytics</h2>
          <p>Please try again later.</p>
        </div>
      </DashboardLayout>
    );
  }

  // Default empty structure if data is missing
  const data = analyticsData || {};

  // Use data from API or fallbacks
  const engagementData = data.engagementData || [];
  const completionData = data.completionData || [];
  const quizScoreData = data.quizScoreData || [];
  const coursePerformanceData = data.coursePerformance || [];
  const studentProgress = data.studentProgress || [];

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
                {isLecturer ? data.totalStudents : data.enrolledCourses}
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
                  ? data.activeCourses
                  : `${data.avgProgress}%`}
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
              <div className="text-2xl font-bold">{data.totalSubmissions}</div>
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
              <div className="text-2xl font-bold">{data.totalQuizAttempts}</div>
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

          {/* Completion Rate Pie -- Only for Lecturer usually, or adapted for student? 
              For now keeping it as is, maybe useful for students too to see their breakdown
           */}
          <Card>
            <CardHeader>
              <CardTitle>Assignment Completion</CardTitle>
              <CardDescription>Submission status breakdown</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                {completionData.length > 0 ? (
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
                        {completionData.map((entry: any, index: number) => (
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
                ) : (
                  <div className="flex items-center justify-center h-full text-muted-foreground">
                    No data available
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Quiz Score Distribution - Lecturer Only or Student? 
              Lets show it for both for now (mocked on backend for both)
          */}
          <Card>
            <CardHeader>
              <CardTitle>Quiz Score Distribution</CardTitle>
              <CardDescription>Performance breakdown by percentage range</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                {quizScoreData.length > 0 ? (
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
                ) : (
                  <div className="flex items-center justify-center h-full text-muted-foreground">
                    No data available
                  </div>
                )}
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
                  {coursePerformanceData.length > 0 ? (
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
                  ) : (
                    <div className="flex items-center justify-center h-full text-muted-foreground">
                      No course performance data
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  {studentProgress.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">
                      Enroll in courses to see your progress
                    </p>
                  ) : (
                    studentProgress.map((item: any, idx: number) => (
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

        {/* Recent Activity - Keeping mock for now as we don't have a recent activity feed endpoint yet */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest submissions and completions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[1, 2, 3].map((_, idx) => (
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
