import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useAuth } from "@/contexts/AuthContext";
import { useCourses } from "@/contexts/CourseContext";
import { useAssignments } from "@/contexts/AssignmentContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Tabs, TabsContent, TabsList, TabsTrigger,
} from "@/components/ui/tabs";
import { Award, BookOpen, FileText, FileQuestion, TrendingUp } from "lucide-react";

export default function MyGrades() {
  const { user } = useAuth();
  const { getMyEnrolledCourses } = useCourses();
  const { assignments, submissions, quizzes, quizAttempts } = useAssignments();

  const enrolledCourses = getMyEnrolledCourses();

  // Build grade data per course
  const courseGrades = enrolledCourses.map((course) => {
    const courseAssignments = assignments.filter((a) => a.courseId === course.id);
    const courseQuizzes = quizzes.filter((q) => q.courseId === course.id);

    const mySubmissions = courseAssignments.map((a) => {
      const sub = submissions.find((s) => s.assignmentId === a.id && s.studentId === user?.id);
      return { assignment: a, submission: sub };
    });

    const myAttempts = courseQuizzes.map((q) => {
      const attempt = quizAttempts.find((at) => at.quizId === q.id && at.studentId === user?.id);
      return { quiz: q, attempt };
    });

    // Calculate overall score
    let totalEarned = 0;
    let totalPossible = 0;

    mySubmissions.forEach(({ assignment, submission }) => {
      if (submission?.grade !== undefined) {
        totalEarned += submission.grade;
        totalPossible += assignment.points;
      }
    });

    myAttempts.forEach(({ attempt }) => {
      if (attempt?.status === "completed" && attempt.score !== undefined) {
        totalEarned += attempt.score;
        totalPossible += attempt.maxScore;
      }
    });

    const percentage = totalPossible > 0 ? (totalEarned / totalPossible) * 100 : 0;
    const letterGrade = getLetterGrade(percentage);

    return {
      course,
      submissions: mySubmissions,
      attempts: myAttempts,
      totalEarned,
      totalPossible,
      percentage,
      letterGrade,
    };
  });

  const overallEarned = courseGrades.reduce((sum, cg) => sum + cg.totalEarned, 0);
  const overallPossible = courseGrades.reduce((sum, cg) => sum + cg.totalPossible, 0);
  const overallPercentage = overallPossible > 0 ? (overallEarned / overallPossible) * 100 : 0;
  const gradedItems = courseGrades.reduce(
    (sum, cg) =>
      sum +
      cg.submissions.filter((s) => s.submission?.grade !== undefined).length +
      cg.attempts.filter((a) => a.attempt?.status === "completed").length,
    0
  );

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My Grades</h1>
          <p className="text-muted-foreground">
            View your grades across all enrolled courses
          </p>
        </div>

        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <TrendingUp className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{Math.round(overallPercentage)}%</p>
                  <p className="text-sm text-muted-foreground">Overall Average</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Award className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{getLetterGrade(overallPercentage)}</p>
                  <p className="text-sm text-muted-foreground">Letter Grade</p>
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
                  <p className="text-2xl font-bold">{enrolledCourses.length}</p>
                  <p className="text-sm text-muted-foreground">Enrolled Courses</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <FileText className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{gradedItems}</p>
                  <p className="text-sm text-muted-foreground">Graded Items</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Course Grades */}
        {courseGrades.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Award className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                No grades yet. Enroll in courses and complete assignments to see your grades here.
              </p>
            </CardContent>
          </Card>
        ) : (
          <Tabs defaultValue={courseGrades[0]?.course.id || "all"}>
            <TabsList className="flex flex-wrap h-auto gap-1">
              {courseGrades.map((cg) => (
                <TabsTrigger key={cg.course.id} value={cg.course.id} className="text-xs">
                  {cg.course.code}
                </TabsTrigger>
              ))}
            </TabsList>

            {courseGrades.map((cg) => (
              <TabsContent key={cg.course.id} value={cg.course.id} className="space-y-4 mt-4">
                {/* Course header */}
                <Card>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-lg">{cg.course.title}</CardTitle>
                        <p className="text-sm text-muted-foreground">{cg.course.code} · {cg.course.lecturerName}</p>
                      </div>
                      <div className="text-right">
                        <Badge
                          className={`text-lg px-3 py-1 ${
                            cg.percentage >= 70
                              ? "bg-success/10 text-success"
                              : cg.percentage >= 50
                              ? "bg-warning/10 text-warning"
                              : "bg-destructive/10 text-destructive"
                          }`}
                        >
                          {cg.letterGrade}
                        </Badge>
                        <p className="text-sm text-muted-foreground mt-1">
                          {cg.totalEarned}/{cg.totalPossible} pts ({Math.round(cg.percentage)}%)
                        </p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <Progress value={cg.percentage} className="h-2" />
                  </CardContent>
                </Card>

                {/* Assignments */}
                {cg.submissions.length > 0 && (
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base flex items-center gap-2">
                        <FileText className="h-4 w-4" /> Assignments
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Assignment</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Score</TableHead>
                            <TableHead className="text-right">Points</TableHead>
                            <TableHead>Feedback</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {cg.submissions.map(({ assignment, submission }) => (
                            <TableRow key={assignment.id}>
                              <TableCell className="font-medium">{assignment.title}</TableCell>
                              <TableCell>
                                {submission ? (
                                  <Badge
                                    variant="outline"
                                    className={
                                      submission.status === "graded"
                                        ? "border-success text-success"
                                        : submission.status === "late"
                                        ? "border-warning text-warning"
                                        : ""
                                    }
                                  >
                                    {submission.status}
                                  </Badge>
                                ) : (
                                  <Badge variant="secondary">Not submitted</Badge>
                                )}
                              </TableCell>
                              <TableCell className="text-right font-semibold">
                                {submission?.grade !== undefined ? submission.grade : "—"}
                              </TableCell>
                              <TableCell className="text-right text-muted-foreground">
                                {assignment.points}
                              </TableCell>
                              <TableCell className="text-muted-foreground text-sm max-w-[200px] truncate">
                                {submission?.feedback || "—"}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                )}

                {/* Quizzes */}
                {cg.attempts.length > 0 && (
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base flex items-center gap-2">
                        <FileQuestion className="h-4 w-4" /> Quizzes
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Quiz</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Score</TableHead>
                            <TableHead className="text-right">Max Score</TableHead>
                            <TableHead className="text-right">Percentage</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {cg.attempts.map(({ quiz, attempt }) => (
                            <TableRow key={quiz.id}>
                              <TableCell className="font-medium">{quiz.title}</TableCell>
                              <TableCell>
                                {attempt ? (
                                  <Badge
                                    variant="outline"
                                    className={
                                      attempt.status === "completed"
                                        ? "border-success text-success"
                                        : "border-warning text-warning"
                                    }
                                  >
                                    {attempt.status}
                                  </Badge>
                                ) : (
                                  <Badge variant="secondary">Not attempted</Badge>
                                )}
                              </TableCell>
                              <TableCell className="text-right font-semibold">
                                {attempt?.score !== undefined ? attempt.score : "—"}
                              </TableCell>
                              <TableCell className="text-right text-muted-foreground">
                                {attempt?.maxScore || quiz.questions.reduce((s, q) => s + q.points, 0)}
                              </TableCell>
                              <TableCell className="text-right">
                                {attempt?.score !== undefined && attempt.maxScore
                                  ? `${Math.round((attempt.score / attempt.maxScore) * 100)}%`
                                  : "—"}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>
            ))}
          </Tabs>
        )}
      </div>
    </DashboardLayout>
  );
}

function getLetterGrade(percentage: number): string {
  if (percentage >= 90) return "A+";
  if (percentage >= 80) return "A";
  if (percentage >= 75) return "B+";
  if (percentage >= 70) return "B";
  if (percentage >= 65) return "C+";
  if (percentage >= 60) return "C";
  if (percentage >= 55) return "D+";
  if (percentage >= 50) return "D";
  return "F";
}
