import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useAssignments } from "@/contexts/AssignmentContext";
import { useCourses } from "@/contexts/CourseContext";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CreateQuizDialog } from "@/components/quizzes/CreateQuizDialog";
import { Search, Clock, FileQuestion, CheckCircle2, Play, Eye } from "lucide-react";

export default function Quizzes() {
  const { user } = useAuth();
  const { quizzes, quizAttempts, getQuizAttempt } = useAssignments();
  const { courses, enrollments } = useCourses();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const navigate = useNavigate();

  const isLecturer = user?.role === "lecturer" || user?.role === "admin";

  // Get quizzes for enrolled courses or lecturer's own courses
  const relevantQuizzes = quizzes.filter((quiz) => {
    if (isLecturer) {
      const course = courses.find((c) => c.id === quiz.courseId);
      return course?.lecturerId === user?.id;
    }
    return enrollments.some(
      (e) => e.courseId === quiz.courseId && e.studentId === user?.id
    );
  });

  const filteredQuizzes = relevantQuizzes.filter((quiz) => {
    const course = courses.find((c) => c.id === quiz.courseId);
    const matchesSearch =
      quiz.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      course?.title.toLowerCase().includes(searchQuery.toLowerCase());

    if (statusFilter === "all") return matchesSearch;
    return matchesSearch && quiz.status === statusFilter;
  });

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Quiz & Exam</h1>
            <p className="text-muted-foreground">
              {isLecturer
                ? "Create and manage course quizzes"
                : "Take quizzes and track your progress"}
            </p>
          </div>
          {isLecturer && <CreateQuizDialog />}
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search quizzes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Filter" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Quizzes</SelectItem>
              <SelectItem value="published">Published</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="closed">Closed</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Quizzes List */}
        {filteredQuizzes.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <FileQuestion className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No quizzes found</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredQuizzes.map((quiz) => {
              const course = courses.find((c) => c.id === quiz.courseId);
              const attempt = !isLecturer ? getQuizAttempt(quiz.id) : null;
              const totalPoints = quiz.questions.reduce((sum, q) => sum + q.points, 0);

              return (
                <Card key={quiz.id} className="flex flex-col hover:shadow-md transition-shadow">
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between gap-2">
                      <Badge variant="outline" className="font-mono text-xs">
                        {course?.code}
                      </Badge>
                      <Badge variant={quiz.status === "published" ? "default" : "secondary"}>
                        {quiz.status}
                      </Badge>
                    </div>
                    <CardTitle className="text-lg mt-2">{quiz.title}</CardTitle>
                    <CardDescription className="line-clamp-2">
                      {quiz.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="flex-1">
                    <div className="flex flex-wrap gap-3 text-sm text-muted-foreground mb-4">
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
                      <div className="flex items-center gap-1">
                        {totalPoints} points
                      </div>
                    </div>

                    {/* Student status */}
                    {!isLecturer && attempt?.status === "completed" && (
                      <div className="p-3 rounded-lg bg-success/10 border border-success/20 mb-4">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="h-5 w-5 text-success" />
                          <div>
                            <p className="font-medium text-sm">Completed</p>
                            <p className="text-xs text-muted-foreground">
                              Score: {attempt.score}/{attempt.maxScore}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                  <div className="p-4 pt-0">
                    {isLecturer ? (
                      <Button variant="outline" className="w-full">
                        <Eye className="h-4 w-4 mr-2" />
                        View Results ({quizAttempts.filter(a => a.quizId === quiz.id).length} attempts)
                      </Button>
                    ) : attempt?.status === "completed" ? (
                      <Button 
                        variant="outline" 
                        className="w-full"
                        onClick={() => navigate(`/quizzes/${quiz.id}`)}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        View Results
                      </Button>
                    ) : (
                      <Button 
                        className="w-full"
                        onClick={() => navigate(`/quizzes/${quiz.id}`)}
                        disabled={quiz.status !== "published"}
                      >
                        <Play className="h-4 w-4 mr-2" />
                        Start Quiz
                      </Button>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
