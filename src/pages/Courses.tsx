import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { CourseCard } from "@/components/courses/CourseCard";
import { CreateCourseDialog } from "@/components/courses/CreateCourseDialog";
import { JoinClassDialog } from "@/components/classroom/JoinClassDialog";
import { useCourses } from "@/contexts/CourseContext";
import { useAuth } from "@/contexts/AuthContext";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, SlidersHorizontal } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function Courses() {
  const { user } = useAuth();
  const { getCoursesWithEnrollment, enrollInCourse, unenrollFromCourse, isLoading } = useCourses();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [enrollingId, setEnrollingId] = useState<string | null>(null);

  const isLecturer = user?.role === "lecturer" || user?.role === "admin";
  const courses = getCoursesWithEnrollment();

  const filteredCourses = courses.filter((course) => {
    const matchesSearch =
      course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      course.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      course.lecturerName.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      statusFilter === "all" || course.status === statusFilter;

    // Only show published courses to students (unless it's their own)
    const isVisible =
      isLecturer || course.status === "published" || course.lecturerId === user?.id;

    return matchesSearch && matchesStatus && isVisible;
  });

  const handleEnroll = async (courseId: string) => {
    setEnrollingId(courseId);
    try {
      await enrollInCourse(courseId);
      toast({
        title: "Enrolled successfully",
        description: "You have been enrolled in the course.",
      });
    } catch (error) {
      toast({
        title: "Enrollment failed",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
    } finally {
      setEnrollingId(null);
    }
  };

  const handleUnenroll = async (courseId: string) => {
    setEnrollingId(courseId);
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
      setEnrollingId(null);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Courses</h1>
            <p className="text-muted-foreground">
              {isLecturer
                ? "Browse all courses or create your own"
                : "Discover and enroll in courses"}
            </p>
          </div>
          <div className="flex gap-2">
            {!isLecturer && <JoinClassDialog />}
            {isLecturer && <CreateCourseDialog />}
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search courses..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SlidersHorizontal className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Courses</SelectItem>
              <SelectItem value="published">Published</SelectItem>
              {isLecturer && <SelectItem value="draft">Drafts</SelectItem>}
              {isLecturer && <SelectItem value="archived">Archived</SelectItem>}
            </SelectContent>
          </Select>
        </div>

        {/* Course Grid */}
        {isLoading ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-64 rounded-lg bg-muted animate-pulse" />
            ))}
          </div>
        ) : filteredCourses.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No courses found</p>
            {searchQuery && (
              <Button
                variant="link"
                onClick={() => setSearchQuery("")}
                className="mt-2"
              >
                Clear search
              </Button>
            )}
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredCourses.map((course) => (
              <CourseCard
                key={course.id}
                course={course}
                onEnroll={handleEnroll}
                onUnenroll={handleUnenroll}
                isLoading={enrollingId === course.id}
              />
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
