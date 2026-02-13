import { useState } from "react";
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
import { CreateAssignmentDialog } from "@/components/assignments/CreateAssignmentDialog";
import { SubmitAssignmentDialog } from "@/components/assignments/SubmitAssignmentDialog";
import { ViewSubmissionsDialog } from "@/components/assignments/ViewSubmissionsDialog";
import { Search, Calendar, FileText, CheckCircle2, AlertCircle, MessageSquare } from "lucide-react";
import { isPast, isFuture } from "date-fns";
import { safeFormatDate } from "@/lib/utils";

export default function Assignments() {
  const { user } = useAuth();
  const { assignments, getStudentSubmission } = useAssignments();
  const { courses, enrollments } = useCourses();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const isLecturer = user?.role === "lecturer" || user?.role === "admin";

  // Get assignments for courses the student is enrolled in, or all for lecturers
  const relevantAssignments = assignments.filter((assignment) => {
    if (isLecturer) {
      const course = courses.find((c) => c.id === assignment.courseId);
      return course?.lecturerId === user?.id;
    }
    return enrollments.some(
      (e) => e.courseId === assignment.courseId && e.studentId === user?.id
    );
  });

  const filteredAssignments = relevantAssignments.filter((assignment) => {
    const course = courses.find((c) => c.id === assignment.courseId);
    const matchesSearch =
      assignment.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      course?.title.toLowerCase().includes(searchQuery.toLowerCase());

    if (statusFilter === "all") return matchesSearch;
    if (statusFilter === "upcoming") return matchesSearch && isFuture(new Date(assignment.dueDate));
    if (statusFilter === "past") return matchesSearch && isPast(new Date(assignment.dueDate));
    return matchesSearch && assignment.status === statusFilter;
  });

  const getSubmissionStatus = (assignmentId: string) => {
    const submission = getStudentSubmission(assignmentId);
    if (!submission) return null;
    return submission;
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Assignments</h1>
            <p className="text-muted-foreground">
              {isLecturer
                ? "Manage and grade student assignments"
                : "View and submit your assignments"}
            </p>
          </div>
          {isLecturer && <CreateAssignmentDialog />}
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search assignments..."
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
              <SelectItem value="all">All Assignments</SelectItem>
              <SelectItem value="upcoming">Upcoming</SelectItem>
              <SelectItem value="past">Past Due</SelectItem>
              <SelectItem value="published">Published</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Assignments List */}
        {filteredAssignments.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No assignments found</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredAssignments.map((assignment) => {
              const course = courses.find((c) => c.id === assignment.courseId);
              const submission = !isLecturer ? getSubmissionStatus(assignment.id) : null;
              const isPastDue = isPast(new Date(assignment.dueDate));

              return (
                <Card key={assignment.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="font-mono text-xs">
                            {course?.code}
                          </Badge>
                          {isPastDue && !submission && (
                            <Badge variant="destructive" className="text-xs">
                              <AlertCircle className="h-3 w-3 mr-1" />
                              Past Due
                            </Badge>
                          )}
                          {submission?.status === "graded" && (
                            <Badge className="bg-success text-success-foreground text-xs">
                              <CheckCircle2 className="h-3 w-3 mr-1" />
                              Graded: {submission.grade}/{assignments.find(a => a.id === assignment.id)?.points}
                            </Badge>
                          )}
                          {submission?.status === "submitted" && (
                            <Badge variant="secondary" className="text-xs">
                              Submitted
                            </Badge>
                          )}
                        </div>
                        <CardTitle className="text-lg">{assignment.title}</CardTitle>
                        <CardDescription>{course?.title}</CardDescription>
                      </div>
                      <Badge variant={assignment.status === "published" ? "default" : "secondary"}>
                        {assignment.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                      {assignment.description}
                    </p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          Due: {safeFormatDate(assignment.dueDate, "MMM d, yyyy h:mm a")}
                        </div>
                        <div className="flex items-center gap-1">
                          <FileText className="h-4 w-4" />
                          {assignment.points} points
                        </div>
                      </div>
                      {!isLecturer && !submission && (
                        <SubmitAssignmentDialog assignment={assignment} />
                      )}
                      {!isLecturer && submission && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <CheckCircle2 className="h-4 w-4 text-success" />
                          Submitted
                          {submission.feedback && (
                            <Badge variant="outline" className="ml-2">
                              <MessageSquare className="h-3 w-3 mr-1" />
                              Feedback available
                            </Badge>
                          )}
                        </div>
                      )}
                      {isLecturer && (
                        <ViewSubmissionsDialog assignment={assignment} />
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
