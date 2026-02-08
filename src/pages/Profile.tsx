import { useState } from "react";
import { Navigate } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useAuth } from "@/contexts/AuthContext";
import { useCourses } from "@/contexts/CourseContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  BookOpen,
  Trophy,
  Clock,
  Star,
  TrendingUp,
  Calendar,
  Award,
  Target,
  Flame,
  CheckCircle2,
  FileText,
  MessageSquare,
  Edit,
  GraduationCap,
} from "lucide-react";

// Mock enrolled courses with grades
const enrolledCourses = [
  { id: "1", name: "Introduction to Computer Science", code: "CS101", grade: "A", score: 92, progress: 85, semester: "Fall 2025" },
  { id: "2", name: "Data Structures & Algorithms", code: "CS201", grade: "A-", score: 88, progress: 72, semester: "Fall 2025" },
  { id: "3", name: "Web Development Fundamentals", code: "CS150", grade: "B+", score: 85, progress: 95, semester: "Fall 2025" },
  { id: "4", name: "Calculus II", code: "MATH201", grade: "A", score: 94, progress: 60, semester: "Fall 2025" },
  { id: "5", name: "Digital Logic Design", code: "EE101", grade: "B", score: 82, progress: 100, semester: "Spring 2025" },
];

// Mock achievements
const achievements = [
  { id: "1", title: "First Steps", description: "Complete your first course", icon: Trophy, earned: true, date: "Jan 2025", color: "text-warning" },
  { id: "2", title: "Quiz Master", description: "Score 100% on 5 quizzes", icon: Star, earned: true, date: "Feb 2025", color: "text-primary" },
  { id: "3", title: "Bookworm", description: "Complete 50 lessons", icon: BookOpen, earned: true, date: "Mar 2025", color: "text-accent" },
  { id: "4", title: "On Fire", description: "7-day learning streak", icon: Flame, earned: true, date: "Apr 2025", color: "text-destructive" },
  { id: "5", title: "Dean's List", description: "Maintain 3.5+ GPA", icon: Award, earned: true, date: "May 2025", color: "text-success" },
  { id: "6", title: "Perfectionist", description: "Score 100% on 10 assignments", icon: Target, earned: false, date: null, color: "text-muted-foreground" },
  { id: "7", title: "Social Learner", description: "Post 20 discussion replies", icon: MessageSquare, earned: false, date: null, color: "text-muted-foreground" },
  { id: "8", title: "Marathon Runner", description: "30-day learning streak", icon: Flame, earned: false, date: null, color: "text-muted-foreground" },
];

// Mock activity timeline
const activityTimeline = [
  { id: "1", type: "quiz", title: "Scored 95% on CS101 Quiz 5", time: "2 hours ago", icon: Star },
  { id: "2", type: "assignment", title: "Submitted Assignment: Binary Trees", time: "5 hours ago", icon: FileText },
  { id: "3", type: "lesson", title: "Completed Lesson: Graph Traversal", time: "Yesterday", icon: CheckCircle2 },
  { id: "4", type: "achievement", title: "Earned 'On Fire' badge – 7-day streak!", time: "Yesterday", icon: Trophy },
  { id: "5", type: "discussion", title: "Replied in CS201 Discussion Forum", time: "2 days ago", icon: MessageSquare },
  { id: "6", type: "grade", title: "Received grade A on MATH201 Midterm", time: "3 days ago", icon: GraduationCap },
  { id: "7", type: "lesson", title: "Completed Lesson: Sorting Algorithms", time: "4 days ago", icon: CheckCircle2 },
  { id: "8", type: "quiz", title: "Scored 88% on CS201 Quiz 3", time: "5 days ago", icon: Star },
  { id: "9", type: "assignment", title: "Submitted Assignment: Linked Lists", time: "1 week ago", icon: FileText },
  { id: "10", type: "lesson", title: "Completed Lesson: Hash Tables", time: "1 week ago", icon: CheckCircle2 },
];

function getActivityColor(type: string) {
  switch (type) {
    case "quiz": return "bg-primary/10 text-primary";
    case "assignment": return "bg-accent/10 text-accent";
    case "lesson": return "bg-success/10 text-success";
    case "achievement": return "bg-warning/10 text-warning";
    case "discussion": return "bg-secondary text-secondary-foreground";
    case "grade": return "bg-primary/10 text-primary";
    default: return "bg-muted text-muted-foreground";
  }
}

export default function Profile() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("courses");

  // Redirect lecturers to their dedicated profile
  if (user?.role === "lecturer") {
    return <Navigate to="/lecturer-profile" replace />;
  }

  const gpa = (enrolledCourses.reduce((sum, c) => sum + c.score, 0) / enrolledCourses.length / 25).toFixed(2);
  const totalCredits = enrolledCourses.length * 3;
  const completedCourses = enrolledCourses.filter((c) => c.progress === 100).length;
  const currentStreak = 7;
  const earnedAchievements = achievements.filter((a) => a.earned).length;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Profile Header */}
        <Card className="overflow-hidden">
          <div className="h-28 gradient-primary" />
          <CardContent className="relative pt-0 pb-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4 -mt-12">
              <Avatar className="h-24 w-24 border-4 border-card shadow-lg">
                <AvatarFallback className="text-2xl bg-primary text-primary-foreground">
                  {user?.firstName?.[0]}{user?.lastName?.[0]}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                  <div>
                    <h1 className="text-2xl font-bold">{user?.firstName} {user?.lastName}</h1>
                    <p className="text-muted-foreground">{user?.email}</p>
                  </div>
                  <Badge variant="secondary" className="w-fit capitalize">{user?.role}</Badge>
                </div>
              </div>
              <Button variant="outline" size="sm" className="gap-1.5">
                <Edit className="h-3.5 w-3.5" />
                Edit Profile
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <div className="mx-auto w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mb-2">
                <TrendingUp className="h-5 w-5 text-primary" />
              </div>
              <p className="text-2xl font-bold">{gpa}</p>
              <p className="text-xs text-muted-foreground">GPA</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="mx-auto w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center mb-2">
                <BookOpen className="h-5 w-5 text-accent" />
              </div>
              <p className="text-2xl font-bold">{enrolledCourses.length}</p>
              <p className="text-xs text-muted-foreground">Enrolled</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="mx-auto w-10 h-10 rounded-full bg-success/10 flex items-center justify-center mb-2">
                <CheckCircle2 className="h-5 w-5 text-success" />
              </div>
              <p className="text-2xl font-bold">{completedCourses}</p>
              <p className="text-xs text-muted-foreground">Completed</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="mx-auto w-10 h-10 rounded-full bg-warning/10 flex items-center justify-center mb-2">
                <Flame className="h-5 w-5 text-warning" />
              </div>
              <p className="text-2xl font-bold">{currentStreak}</p>
              <p className="text-xs text-muted-foreground">Day Streak</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="mx-auto w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mb-2">
                <Trophy className="h-5 w-5 text-primary" />
              </div>
              <p className="text-2xl font-bold">{earnedAchievements}</p>
              <p className="text-xs text-muted-foreground">Achievements</p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs Section */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="courses">Courses & Grades</TabsTrigger>
            <TabsTrigger value="achievements">Achievements</TabsTrigger>
            <TabsTrigger value="activity">Activity Timeline</TabsTrigger>
          </TabsList>

          <TabsContent value="courses" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Enrolled Courses</CardTitle>
                <CardDescription>Your current and completed courses with grades</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {enrolledCourses.map((course) => (
                    <div key={course.id} className="flex items-center gap-4 p-4 rounded-lg border">
                      <div className="h-12 w-12 rounded-lg gradient-primary flex items-center justify-center flex-shrink-0">
                        <BookOpen className="h-6 w-6 text-primary-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <div>
                            <p className="font-medium truncate">{course.name}</p>
                            <p className="text-xs text-muted-foreground">{course.code} • {course.semester}</p>
                          </div>
                          <div className="flex items-center gap-3 flex-shrink-0">
                            <div className="text-right">
                              <Badge
                                variant={course.grade.startsWith("A") ? "default" : "secondary"}
                                className="text-sm font-bold"
                              >
                                {course.grade}
                              </Badge>
                              <p className="text-xs text-muted-foreground mt-1">{course.score}%</p>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                          <Progress value={course.progress} className="h-1.5 flex-1" />
                          <span className="text-xs text-muted-foreground w-8">{course.progress}%</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="achievements" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Achievements</CardTitle>
                <CardDescription>{earnedAchievements} of {achievements.length} earned</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {achievements.map((achievement) => (
                    <div
                      key={achievement.id}
                      className={`p-4 rounded-lg border text-center transition-all ${
                        achievement.earned
                          ? "bg-card hover:shadow-md"
                          : "bg-muted/50 opacity-60"
                      }`}
                    >
                      <div
                        className={`mx-auto w-14 h-14 rounded-full flex items-center justify-center mb-3 ${
                          achievement.earned ? "bg-primary/10" : "bg-muted"
                        }`}
                      >
                        <achievement.icon className={`h-7 w-7 ${achievement.color}`} />
                      </div>
                      <p className="font-semibold text-sm">{achievement.title}</p>
                      <p className="text-xs text-muted-foreground mt-1">{achievement.description}</p>
                      {achievement.earned && achievement.date && (
                        <Badge variant="outline" className="mt-2 text-[10px]">
                          {achievement.date}
                        </Badge>
                      )}
                      {!achievement.earned && (
                        <Badge variant="outline" className="mt-2 text-[10px]">
                          Locked
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="activity" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Activity Timeline</CardTitle>
                <CardDescription>Your recent learning activity</CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[500px]">
                  <div className="relative">
                    {/* Timeline line */}
                    <div className="absolute left-5 top-0 bottom-0 w-px bg-border" />

                    <div className="space-y-6">
                      {activityTimeline.map((activity) => (
                        <div key={activity.id} className="flex gap-4 relative">
                          <div
                            className={`relative z-10 w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${getActivityColor(activity.type)}`}
                          >
                            <activity.icon className="h-4 w-4" />
                          </div>
                          <div className="flex-1 pt-1">
                            <p className="text-sm font-medium">{activity.title}</p>
                            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                              <Clock className="h-3 w-3" />
                              {activity.time}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
