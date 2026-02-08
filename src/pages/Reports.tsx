import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useAuth } from "@/contexts/AuthContext";
import { useAssignments } from "@/contexts/AssignmentContext";
import { useCourses } from "@/contexts/CourseContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  BarChart3, Search, Download, FileText, Users, BookOpen,
  CheckCircle2, XCircle, Clock, TrendingUp, Award, Filter,
} from "lucide-react";

interface StudentGrade {
  id: string;
  studentId: string;
  studentName: string;
  courseCode: string;
  courseName: string;
  quizScores: { quizTitle: string; score: number; maxScore: number; date: string }[];
  examScore: number | null;
  examMaxScore: number;
  assignmentAvg: number;
  totalGrade: string;
  totalPercent: number;
  status: "passed" | "failed" | "in-progress";
}

const mockGrades: StudentGrade[] = [
  {
    id: "1", studentId: "s1", studentName: "Alice Chen", courseCode: "CS101", courseName: "Intro to Computer Science",
    quizScores: [
      { quizTitle: "Quiz 1", score: 18, maxScore: 20, date: "2026-01-10" },
      { quizTitle: "Quiz 2", score: 16, maxScore: 20, date: "2026-01-20" },
      { quizTitle: "Midterm", score: 42, maxScore: 50, date: "2026-02-01" },
    ],
    examScore: 85, examMaxScore: 100, assignmentAvg: 88, totalGrade: "A", totalPercent: 92, status: "passed",
  },
  {
    id: "2", studentId: "s2", studentName: "Bob Williams", courseCode: "CS101", courseName: "Intro to Computer Science",
    quizScores: [
      { quizTitle: "Quiz 1", score: 14, maxScore: 20, date: "2026-01-10" },
      { quizTitle: "Quiz 2", score: 12, maxScore: 20, date: "2026-01-20" },
      { quizTitle: "Midterm", score: 35, maxScore: 50, date: "2026-02-01" },
    ],
    examScore: 72, examMaxScore: 100, assignmentAvg: 75, totalGrade: "B", totalPercent: 78, status: "passed",
  },
  {
    id: "3", studentId: "s3", studentName: "Carol Davis", courseCode: "CS101", courseName: "Intro to Computer Science",
    quizScores: [
      { quizTitle: "Quiz 1", score: 20, maxScore: 20, date: "2026-01-10" },
      { quizTitle: "Quiz 2", score: 19, maxScore: 20, date: "2026-01-20" },
      { quizTitle: "Midterm", score: 48, maxScore: 50, date: "2026-02-01" },
    ],
    examScore: 95, examMaxScore: 100, assignmentAvg: 97, totalGrade: "A+", totalPercent: 96, status: "passed",
  },
  {
    id: "4", studentId: "s4", studentName: "David Lee", courseCode: "CS201", courseName: "Data Structures & Algorithms",
    quizScores: [
      { quizTitle: "Quiz 1", score: 10, maxScore: 20, date: "2026-01-12" },
      { quizTitle: "Quiz 2", score: 8, maxScore: 20, date: "2026-01-22" },
    ],
    examScore: 45, examMaxScore: 100, assignmentAvg: 55, totalGrade: "D", totalPercent: 48, status: "failed",
  },
  {
    id: "5", studentId: "s5", studentName: "Emma Garcia", courseCode: "CS201", courseName: "Data Structures & Algorithms",
    quizScores: [
      { quizTitle: "Quiz 1", score: 17, maxScore: 20, date: "2026-01-12" },
      { quizTitle: "Quiz 2", score: 15, maxScore: 20, date: "2026-01-22" },
    ],
    examScore: null, examMaxScore: 100, assignmentAvg: 82, totalGrade: "-", totalPercent: 0, status: "in-progress",
  },
  {
    id: "6", studentId: "s6", studentName: "Frank Miller", courseCode: "CS150", courseName: "Web Development",
    quizScores: [
      { quizTitle: "Quiz 1", score: 19, maxScore: 20, date: "2026-01-08" },
      { quizTitle: "Midterm", score: 44, maxScore: 50, date: "2026-01-28" },
    ],
    examScore: 88, examMaxScore: 100, assignmentAvg: 91, totalGrade: "A-", totalPercent: 89, status: "passed",
  },
];

function getGradeColor(grade: string) {
  if (grade.startsWith("A")) return "text-success";
  if (grade.startsWith("B")) return "text-primary";
  if (grade.startsWith("C")) return "text-warning";
  if (grade.startsWith("D") || grade === "F") return "text-destructive";
  return "text-muted-foreground";
}

export default function Reports() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [courseFilter, setCourseFilter] = useState("all");

  const isLecturer = user?.role === "lecturer" || user?.role === "admin";
  const uniqueCourses = [...new Set(mockGrades.map((g) => g.courseCode))];

  const filtered = mockGrades.filter((g) => {
    const matchesSearch = !searchQuery ||
      g.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      g.courseName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCourse = courseFilter === "all" || g.courseCode === courseFilter;
    return matchesSearch && matchesCourse;
  });

  const avgScore = filtered.length > 0
    ? Math.round(filtered.filter((g) => g.totalPercent > 0).reduce((s, g) => s + g.totalPercent, 0) / filtered.filter((g) => g.totalPercent > 0).length)
    : 0;
  const passRate = filtered.length > 0
    ? Math.round((filtered.filter((g) => g.status === "passed").length / filtered.filter((g) => g.status !== "in-progress").length) * 100)
    : 0;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Reports</h1>
            <p className="text-muted-foreground">Quiz, exam marks and grades for enrolled students</p>
          </div>
          <Button variant="outline" className="gap-2">
            <Download className="h-4 w-4" />
            Export Report
          </Button>
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-primary/10"><Users className="h-5 w-5 text-primary" /></div>
                <div>
                  <p className="text-2xl font-bold">{filtered.length}</p>
                  <p className="text-xs text-muted-foreground">Total Records</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-success/10"><TrendingUp className="h-5 w-5 text-success" /></div>
                <div>
                  <p className="text-2xl font-bold">{avgScore}%</p>
                  <p className="text-xs text-muted-foreground">Average Score</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-success/10"><CheckCircle2 className="h-5 w-5 text-success" /></div>
                <div>
                  <p className="text-2xl font-bold">{passRate}%</p>
                  <p className="text-xs text-muted-foreground">Pass Rate</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-warning/10"><Award className="h-5 w-5 text-warning" /></div>
                <div>
                  <p className="text-2xl font-bold">{filtered.filter((g) => g.totalGrade.startsWith("A")).length}</p>
                  <p className="text-xs text-muted-foreground">A Grades</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search by student or course..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10" />
              </div>
              <Select value={courseFilter} onValueChange={setCourseFilter}>
                <SelectTrigger className="w-full md:w-48">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Course" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Courses</SelectItem>
                  {uniqueCourses.map((code) => (
                    <SelectItem key={code} value={code}>{code}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Grades Table */}
        <Card>
          <CardHeader>
            <CardTitle>Student Grades</CardTitle>
            <CardDescription>Showing {filtered.length} records</CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="w-full">
              <div className="min-w-[800px]">
                {/* Header */}
                <div className="grid grid-cols-[1fr_100px_1fr_80px_80px_80px_60px_80px] gap-3 px-4 py-3 bg-muted/50 rounded-t-lg text-xs font-semibold text-muted-foreground uppercase">
                  <span>Student</span>
                  <span>Course</span>
                  <span>Quiz Scores</span>
                  <span className="text-center">Exam</span>
                  <span className="text-center">Assign.</span>
                  <span className="text-center">Total</span>
                  <span className="text-center">Grade</span>
                  <span className="text-center">Status</span>
                </div>
                {/* Rows */}
                <div className="divide-y">
                  {filtered.map((g) => (
                    <div key={g.id} className="grid grid-cols-[1fr_100px_1fr_80px_80px_80px_60px_80px] gap-3 px-4 py-3 items-center text-sm hover:bg-muted/30 transition-colors">
                      <span className="font-medium truncate">{g.studentName}</span>
                      <Badge variant="outline" className="font-mono text-xs w-fit">{g.courseCode}</Badge>
                      <div className="flex gap-1 flex-wrap">
                        {g.quizScores.map((q, i) => (
                          <Badge key={i} variant="secondary" className="text-[10px] px-1.5">
                            {q.quizTitle}: {q.score}/{q.maxScore}
                          </Badge>
                        ))}
                      </div>
                      <span className="text-center">
                        {g.examScore !== null ? `${g.examScore}/${g.examMaxScore}` : <span className="text-muted-foreground">—</span>}
                      </span>
                      <span className="text-center">{g.assignmentAvg}%</span>
                      <span className="text-center font-medium">
                        {g.totalPercent > 0 ? `${g.totalPercent}%` : "—"}
                      </span>
                      <span className={`text-center font-bold ${getGradeColor(g.totalGrade)}`}>{g.totalGrade}</span>
                      <div className="flex justify-center">
                        <Badge variant={g.status === "passed" ? "default" : g.status === "failed" ? "destructive" : "secondary"} className="text-[10px] capitalize">
                          {g.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
                {filtered.length === 0 && (
                  <div className="py-12 text-center text-muted-foreground">
                    <BarChart3 className="h-10 w-10 mx-auto mb-3 opacity-40" />
                    <p>No grade records found</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}