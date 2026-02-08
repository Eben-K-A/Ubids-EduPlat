import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  BookOpen, Users, Star, TrendingUp, Clock, Award,
  BarChart3, MessageSquare, CheckCircle2, Edit, GraduationCap,
  ThumbsUp, Eye, Calendar, FileText,
} from "lucide-react";

const teachingStats = {
  totalCourses: 8,
  activeCourses: 5,
  totalStudents: 342,
  avgRating: 4.7,
  totalReviews: 128,
  completionRate: 89,
  lessonsCreated: 156,
  assignmentsGraded: 478,
  yearsTeaching: 6,
  department: "Computer Science",
};

const publishedCourses = [
  { id: "1", title: "Introduction to Computer Science", code: "CS101", students: 85, rating: 4.8, reviews: 42, status: "active", modules: 12, lessons: 36, completionRate: 91 },
  { id: "2", title: "Data Structures & Algorithms", code: "CS201", students: 64, rating: 4.6, reviews: 28, status: "active", modules: 10, lessons: 30, completionRate: 78 },
  { id: "3", title: "Web Development Fundamentals", code: "CS150", students: 72, rating: 4.9, reviews: 35, status: "active", modules: 8, lessons: 24, completionRate: 94 },
  { id: "4", title: "Database Systems", code: "CS301", students: 48, rating: 4.5, reviews: 15, status: "active", modules: 9, lessons: 27, completionRate: 82 },
  { id: "5", title: "Operating Systems", code: "CS350", students: 38, rating: 4.4, reviews: 8, status: "active", modules: 11, lessons: 33, completionRate: 65 },
  { id: "6", title: "Software Engineering", code: "CS400", students: 35, rating: 4.7, reviews: 0, status: "draft", modules: 6, lessons: 18, completionRate: 0 },
];

const studentFeedback = [
  { id: "1", student: "Alice Chen", course: "CS101", rating: 5, comment: "Dr. Smith explains complex concepts in an incredibly accessible way. Best CS course I've taken!", date: "2 days ago" },
  { id: "2", student: "Bob Williams", course: "CS201", rating: 5, comment: "The assignments are challenging but fair. The feedback is always detailed and helpful.", date: "5 days ago" },
  { id: "3", student: "Carol Davis", course: "CS150", rating: 4, comment: "Great hands-on projects. Would appreciate more advanced topics in future modules.", date: "1 week ago" },
  { id: "4", student: "David Lee", course: "CS301", rating: 5, comment: "Excellent coverage of both relational and NoSQL databases. Very practical.", date: "1 week ago" },
  { id: "5", student: "Emma Garcia", course: "CS101", rating: 4, comment: "Well-structured course. The quizzes help reinforce learning effectively.", date: "2 weeks ago" },
  { id: "6", student: "Frank Miller", course: "CS201", rating: 5, comment: "The visualizations for tree and graph algorithms are outstanding!", date: "2 weeks ago" },
];

const activityTimeline = [
  { id: "1", type: "grade", title: "Graded 12 submissions for CS201 Assignment 4", time: "1 hour ago", icon: CheckCircle2 },
  { id: "2", type: "lesson", title: "Published new lesson: Advanced Graph Algorithms", time: "3 hours ago", icon: BookOpen },
  { id: "3", type: "feedback", title: "Replied to 5 student questions in CS101 forum", time: "Yesterday", icon: MessageSquare },
  { id: "4", type: "quiz", title: "Created Quiz 6 for CS150 — JavaScript Closures", time: "Yesterday", icon: FileText },
  { id: "5", type: "course", title: "Updated CS301 syllabus for Spring semester", time: "2 days ago", icon: Edit },
  { id: "6", type: "achievement", title: "Reached 4.7 average rating across all courses", time: "3 days ago", icon: Award },
  { id: "7", type: "grade", title: "Graded CS101 Midterm — 85 submissions", time: "4 days ago", icon: CheckCircle2 },
  { id: "8", type: "lesson", title: "Published Module 8: API Design Patterns in CS150", time: "5 days ago", icon: BookOpen },
];

function getActivityColor(type: string) {
  switch (type) {
    case "grade": return "bg-success/10 text-success";
    case "lesson": return "bg-primary/10 text-primary";
    case "feedback": return "bg-accent/10 text-accent";
    case "quiz": return "bg-warning/10 text-warning";
    case "course": return "bg-secondary text-secondary-foreground";
    case "achievement": return "bg-warning/10 text-warning";
    default: return "bg-muted text-muted-foreground";
  }
}

function renderStars(rating: number) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={`h-3.5 w-3.5 ${i < rating ? "text-warning fill-warning" : "text-muted-foreground/30"}`}
        />
      ))}
    </div>
  );
}

export default function LecturerProfile() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("courses");

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
                <p className="text-sm text-muted-foreground mt-1">
                  {teachingStats.department} · {teachingStats.yearsTeaching} years of teaching
                </p>
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
                <BookOpen className="h-5 w-5 text-primary" />
              </div>
              <p className="text-2xl font-bold">{teachingStats.activeCourses}</p>
              <p className="text-xs text-muted-foreground">Active Courses</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="mx-auto w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center mb-2">
                <Users className="h-5 w-5 text-accent" />
              </div>
              <p className="text-2xl font-bold">{teachingStats.totalStudents}</p>
              <p className="text-xs text-muted-foreground">Total Students</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="mx-auto w-10 h-10 rounded-full bg-warning/10 flex items-center justify-center mb-2">
                <Star className="h-5 w-5 text-warning" />
              </div>
              <p className="text-2xl font-bold">{teachingStats.avgRating}</p>
              <p className="text-xs text-muted-foreground">Avg Rating</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="mx-auto w-10 h-10 rounded-full bg-success/10 flex items-center justify-center mb-2">
                <TrendingUp className="h-5 w-5 text-success" />
              </div>
              <p className="text-2xl font-bold">{teachingStats.completionRate}%</p>
              <p className="text-xs text-muted-foreground">Completion Rate</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="mx-auto w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mb-2">
                <CheckCircle2 className="h-5 w-5 text-primary" />
              </div>
              <p className="text-2xl font-bold">{teachingStats.assignmentsGraded}</p>
              <p className="text-xs text-muted-foreground">Graded</p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs Section */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="courses">Published Courses</TabsTrigger>
            <TabsTrigger value="feedback">Student Feedback</TabsTrigger>
            <TabsTrigger value="activity">Activity Timeline</TabsTrigger>
          </TabsList>

          {/* Published Courses */}
          <TabsContent value="courses" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Published Courses</CardTitle>
                <CardDescription>{publishedCourses.length} courses · {teachingStats.lessonsCreated} total lessons</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {publishedCourses.map((course) => (
                    <div key={course.id} className="flex items-center gap-4 p-4 rounded-lg border">
                      <div className="h-12 w-12 rounded-lg gradient-primary flex items-center justify-center flex-shrink-0">
                        <BookOpen className="h-6 w-6 text-primary-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <div>
                            <p className="font-medium truncate">{course.title}</p>
                            <p className="text-xs text-muted-foreground">
                              {course.code} · {course.modules} modules · {course.lessons} lessons
                            </p>
                          </div>
                          <div className="flex items-center gap-3 flex-shrink-0">
                            <Badge variant={course.status === "active" ? "default" : "secondary"} className="capitalize">
                              {course.status}
                            </Badge>
                          </div>
                        </div>
                        <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground flex-wrap">
                          <span className="flex items-center gap-1">
                            <Users className="h-3 w-3" /> {course.students} students
                          </span>
                          <span className="flex items-center gap-1">
                            {renderStars(Math.round(course.rating))}
                            <span className="ml-1">{course.rating} ({course.reviews})</span>
                          </span>
                          {course.status === "active" && (
                            <span className="flex items-center gap-1">
                              <TrendingUp className="h-3 w-3" /> {course.completionRate}% completion
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Student Feedback */}
          <TabsContent value="feedback" className="mt-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">Student Feedback</CardTitle>
                    <CardDescription>{teachingStats.totalReviews} reviews · {teachingStats.avgRating} average rating</CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    {renderStars(Math.round(teachingStats.avgRating))}
                    <span className="text-lg font-bold">{teachingStats.avgRating}</span>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[500px]">
                  <div className="space-y-4">
                    {studentFeedback.map((fb) => (
                      <div key={fb.id} className="p-4 rounded-lg border">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8">
                              <AvatarFallback className="text-xs bg-primary/10 text-primary">
                                {fb.student.split(" ").map((n) => n[0]).join("")}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="text-sm font-medium">{fb.student}</p>
                              <p className="text-xs text-muted-foreground">{fb.course} · {fb.date}</p>
                            </div>
                          </div>
                          {renderStars(fb.rating)}
                        </div>
                        <p className="text-sm text-muted-foreground">{fb.comment}</p>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Activity Timeline */}
          <TabsContent value="activity" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Activity Timeline</CardTitle>
                <CardDescription>Your recent teaching activity</CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[500px]">
                  <div className="relative">
                    <div className="absolute left-5 top-0 bottom-0 w-px bg-border" />
                    <div className="space-y-6">
                      {activityTimeline.map((activity) => (
                        <div key={activity.id} className="flex gap-4 relative">
                          <div className={`relative z-10 w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${getActivityColor(activity.type)}`}>
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