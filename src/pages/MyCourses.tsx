import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { CourseCard } from "@/components/courses/CourseCard";
import { CreateCourseDialog } from "@/components/courses/CreateCourseDialog";
import { useCourses } from "@/contexts/CourseContext";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, BookOpen, FileEdit, Archive } from "lucide-react";

export default function MyCourses() {
  const { getMyCourses, isLoading } = useCourses();
  const [searchQuery, setSearchQuery] = useState("");

  const myCourses = getMyCourses();

  const filteredCourses = myCourses.filter(
    (course) =>
      course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      course.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const publishedCourses = filteredCourses.filter((c) => c.status === "published");
  const draftCourses = filteredCourses.filter((c) => c.status === "draft");
  const archivedCourses = filteredCourses.filter((c) => c.status === "archived");

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">My Courses</h1>
            <p className="text-muted-foreground">
              Manage the courses you've created
            </p>
          </div>
          <CreateCourseDialog />
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search your courses..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Tabs */}
        <Tabs defaultValue="published" className="space-y-4">
          <TabsList>
            <TabsTrigger value="published" className="gap-2">
              <BookOpen className="h-4 w-4" />
              Published ({publishedCourses.length})
            </TabsTrigger>
            <TabsTrigger value="draft" className="gap-2">
              <FileEdit className="h-4 w-4" />
              Drafts ({draftCourses.length})
            </TabsTrigger>
            <TabsTrigger value="archived" className="gap-2">
              <Archive className="h-4 w-4" />
              Archived ({archivedCourses.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="published">
            {isLoading ? (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-64 rounded-lg bg-muted animate-pulse" />
                ))}
              </div>
            ) : publishedCourses.length === 0 ? (
              <div className="text-center py-12 border rounded-lg">
                <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="font-semibold mb-1">No published courses</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Create a course and publish it to make it visible to students.
                </p>
                <CreateCourseDialog />
              </div>
            ) : (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {publishedCourses.map((course) => (
                  <CourseCard
                    key={course.id}
                    course={{ ...course, isEnrolled: false }}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="draft">
            {draftCourses.length === 0 ? (
              <div className="text-center py-12 border rounded-lg">
                <FileEdit className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="font-semibold mb-1">No draft courses</h3>
                <p className="text-sm text-muted-foreground">
                  Save a course as draft to continue editing later.
                </p>
              </div>
            ) : (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {draftCourses.map((course) => (
                  <CourseCard
                    key={course.id}
                    course={{ ...course, isEnrolled: false }}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="archived">
            {archivedCourses.length === 0 ? (
              <div className="text-center py-12 border rounded-lg">
                <Archive className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="font-semibold mb-1">No archived courses</h3>
                <p className="text-sm text-muted-foreground">
                  Archive courses that are no longer active.
                </p>
              </div>
            ) : (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {archivedCourses.map((course) => (
                  <CourseCard
                    key={course.id}
                    course={{ ...course, isEnrolled: false }}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
