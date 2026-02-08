import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Course, CourseWithEnrollment } from "@/types/course";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { BookOpen, Users, Clock, CheckCircle2, MoreVertical, Pencil, Trash2, Eye } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useAcademic } from "@/contexts/AcademicContext";
import { EditCourseDialog } from "./EditCourseDialog";
import { DeleteCourseDialog } from "./DeleteCourseDialog";

interface CourseCardProps {
  course: CourseWithEnrollment | Course;
  onEnroll?: (courseId: string) => void;
  onUnenroll?: (courseId: string) => void;
  isLoading?: boolean;
}

export function CourseCard({
  course,
  onEnroll,
  onUnenroll,
  isLoading,
}: CourseCardProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { faculties, levels, periods } = useAcademic();
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  
  const isEnrolled = "isEnrolled" in course ? course.isEnrolled : false;
  const isLecturer = user?.role === "lecturer" || user?.role === "admin";
  const isOwnCourse = course.lecturerId === user?.id;

  // Resolve academic metadata
  const faculty = faculties.find((f) => f.id === course.facultyId);
  const dept = faculty?.departments.find((d) => d.id === course.departmentId);
  const level = levels.find((l) => l.value === course.levelValue);
  const period = periods.find((p) => p.id === course.academicPeriodId);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "published":
        return <Badge variant="default" className="bg-success text-success-foreground">Published</Badge>;
      case "draft":
        return <Badge variant="secondary">Draft</Badge>;
      case "archived":
        return <Badge variant="outline">Archived</Badge>;
      default:
        return null;
    }
  };

  const handleView = () => {
    navigate(`/courses/${course.id}`);
  };

  return (
    <>
      <Card className="flex flex-col h-full hover:shadow-lg transition-shadow">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="outline" className="text-xs font-mono">
                {course.code}
              </Badge>
              {getStatusBadge(course.status)}
            </div>
            {isOwnCourse && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={handleView}>
                    <Eye className="h-4 w-4 mr-2" />
                    View Details
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setEditOpen(true)}>
                    <Pencil className="h-4 w-4 mr-2" />
                    Edit Course
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={() => setDeleteOpen(true)}
                    className="text-destructive focus:text-destructive"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Course
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
          <CardTitle className="text-lg mt-2 line-clamp-2">{course.title}</CardTitle>
          <CardDescription className="text-sm text-muted-foreground">
            by {course.lecturerName}
          </CardDescription>
          <div className="flex flex-wrap gap-1.5 mt-1.5">
            {faculty && <Badge variant="secondary" className="text-[10px] px-1.5">{faculty.code}</Badge>}
            {dept && <Badge variant="secondary" className="text-[10px] px-1.5">{dept.name}</Badge>}
            {level && <Badge variant="secondary" className="text-[10px] px-1.5">{level.name}</Badge>}
            {period && <Badge variant="secondary" className="text-[10px] px-1.5">{period.name}</Badge>}
            {!faculty && !dept && !level && !period && (
              <Badge variant="secondary" className="text-[10px] px-1.5 text-muted-foreground">No metadata</Badge>
            )}
          </div>
        </CardHeader>
        
        <CardContent className="flex-1">
          <p className="text-sm text-muted-foreground line-clamp-3 mb-4">
            {course.description}
          </p>
          
          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Users className="h-4 w-4" />
              <span>
                {course.enrolledCount}
                {course.maxEnrollment && `/${course.maxEnrollment}`}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              <span>
                {new Date(course.updatedAt).toLocaleDateString()}
              </span>
            </div>
          </div>
        </CardContent>

        <CardFooter className="pt-3 border-t gap-2">
          {isOwnCourse ? (
            <>
              <Button variant="outline" className="flex-1" onClick={handleView}>
                <BookOpen className="h-4 w-4 mr-2" />
                View
              </Button>
              <Button className="flex-1" onClick={() => setEditOpen(true)}>
                Edit
              </Button>
            </>
          ) : isEnrolled ? (
            <>
              <Button variant="outline" className="flex-1" onClick={handleView}>
                <BookOpen className="h-4 w-4 mr-2" />
                Continue
              </Button>
              {onUnenroll && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onUnenroll(course.id)}
                  disabled={isLoading}
                >
                  Unenroll
                </Button>
              )}
            </>
          ) : (
            <>
              <Button variant="outline" className="flex-1" onClick={handleView}>
                Details
              </Button>
              {!isLecturer && onEnroll && (
                <Button className="flex-1" onClick={() => onEnroll(course.id)} disabled={isLoading}>
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Enroll
                </Button>
              )}
            </>
          )}
        </CardFooter>
      </Card>

      {/* Edit Dialog */}
      <EditCourseDialog
        course={course}
        open={editOpen}
        onOpenChange={setEditOpen}
      />

      {/* Delete Dialog */}
      <DeleteCourseDialog
        course={course}
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
      />
    </>
  );
}
