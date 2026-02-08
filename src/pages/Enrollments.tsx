import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { CourseCard } from "@/components/courses/CourseCard";
import { useCourses } from "@/contexts/CourseContext";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, BookOpen, Clock, CheckCircle2, TrendingUp } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { useAssignments } from "@/contexts/AssignmentContext";

export default function Enrollments() {
  const { getMyEnrolledCourses, unenrollFromCourse, isLoading } = useCourses();
  const { getModulesByCourse } = useAssignments();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [unenrollingId, setUnenrollingId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState("all");

  const enrolledCourses = getMyEnrolledCourses();

  const filteredCourses = enrolledCourses.filter((course) => {
    const matchesSearch =
      course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      course.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      course.lecturerName.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (statusFilter === "all") return matchesSearch;
    if (statusFilter === "active") return matchesSearch && course.enrollment?.status === "active";
    if (statusFilter === "completed") return matchesSearch && course.enrollment?.status === "completed";
    return matchesSearch;
  });

  const handleUnenroll = async (courseId: string) => {
    setUnenrollingId(courseId);
    try {
      await unenrollFromCourse(courseId);
      toast({
        title: "Unenrolled",
        description: "You have been removed from the course.",
      });
    } catch (error) {
      toast({
        title: "Failed to unenroll",
        description: "Please try again.",
        variant: "destructive",
      });
    } finally {
      setUnenrollingId(null);
    }
  };

  // Stats
  const totalCourses = enrolledCourses.length;
  const activeCourses = enrolledCourses.filter((c) => c.enrollment?.status === "active").length;
  const totalLessons = enrolledCourses.reduce((sum, c) => {
    const mods = getModulesByCourse(c.id);
    return sum + mods.reduce((s, m) => s + m.lessons.length, 0);
  }, 0);
  const completedLessons = enrolledCourses.reduce((sum, c) => {
    const mods = getModulesByCourse(c.id);
    return sum + mods.reduce((s, m) => s + m.lessons.filter((l) => l.isCompleted).length, 0);
  }, 0);
  const overallProgress = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">My Enrollments</h1>
            <p className="text-muted-foreground">
              Track your progress across enrolled courses
            </p>
          </div>
          <Button onClick={() => navigate("/courses")}>
            <BookOpen className="h-4 w-4 mr-2" />
            Browse Courses
          </Button>
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <BookOpen className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{totalCourses}</p>
                  <p className="text-sm text-muted-foreground">Enrolled</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-success/10">
                  <Clock className="h-5 w-5 text-success" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{activeCourses}</p>
                  <p className="text-sm text-muted-foreground">Active</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-accent/10">
                  <CheckCircle2 className="h-5 w-5 text-accent" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{completedLessons}/{totalLessons}</p>
                  <p className="text-sm text-muted-foreground">Lessons Done</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-warning/10">
                  <TrendingUp className="h-5 w-5 text-warning" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{overallProgress}%</p>
                  <p className="text-sm text-muted-foreground">Overall</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search & Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search enrolled courses..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Tabs value={statusFilter} onValueChange={setStatusFilter}>
            <TabsList>
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="active">Active</TabsTrigger>
              <TabsTrigger value="completed">Completed</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Course Grid */}
        {isLoading ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-64 rounded-lg bg-muted animate-pulse" />
            ))}
          </div>
        ) : filteredCourses.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="font-semibold mb-1">No enrolled courses</h3>
              <p className="text-sm text-muted-foreground mb-4">
                {searchQuery
                  ? "No courses match your search"
                  : "Browse available courses and enroll to start learning"}
              </p>
              {searchQuery ? (
                <Button variant="outline" onClick={() => setSearchQuery("")}>
                  Clear search
                </Button>
              ) : (
                <Button onClick={() => navigate("/courses")}>Browse Courses</Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredCourses.map((course) => (
              <CourseCard
                key={course.id}
                course={course}
                onUnenroll={handleUnenroll}
                isLoading={unenrollingId === course.id}
              />
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
