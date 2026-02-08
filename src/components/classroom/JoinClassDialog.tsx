import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useClassroom } from "@/contexts/ClassroomContext";
import { useCourses } from "@/contexts/CourseContext";
import { useAuth } from "@/contexts/AuthContext";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UserPlus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface JoinClassDialogProps {
  children?: React.ReactNode;
  defaultCode?: string;
}

export function JoinClassDialog({ children, defaultCode }: JoinClassDialogProps) {
  const { findCourseByCode } = useClassroom();
  const { courses, enrollInCourse, enrollments } = useCourses();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [open, setOpen] = useState(!!defaultCode);
  const [code, setCode] = useState(defaultCode || "");
  const [isJoining, setIsJoining] = useState(false);
  const [error, setError] = useState("");

  const handleJoin = async () => {
    setError("");
    if (!code.trim()) {
      setError("Please enter a class code");
      return;
    }

    const courseId = findCourseByCode(code);
    if (!courseId) {
      setError("Invalid class code. Check the code and try again.");
      return;
    }

    const course = courses.find((c) => c.id === courseId);
    if (!course) {
      setError("Course not found");
      return;
    }

    if (course.lecturerId === user?.id) {
      setError("You are the instructor of this class");
      return;
    }

    const alreadyEnrolled = enrollments.some(
      (e) => e.courseId === courseId && e.studentId === user?.id
    );
    if (alreadyEnrolled) {
      setError("You are already enrolled in this class");
      return;
    }

    setIsJoining(true);
    try {
      await enrollInCourse(courseId);
      toast({
        title: "Joined class!",
        description: `You are now enrolled in ${course.title}`,
      });
      setOpen(false);
      setCode("");
      navigate(`/courses/${courseId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to join class");
    }
    setIsJoining(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button variant="outline" size="sm">
            <UserPlus className="h-4 w-4 mr-2" />
            Join Class
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Join a Class</DialogTitle>
          <DialogDescription>
            Enter the class code provided by your instructor to join the class.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="class-code">Class Code</Label>
            <Input
              id="class-code"
              placeholder="e.g. abc123"
              value={code}
              onChange={(e) => { setCode(e.target.value); setError(""); }}
              onKeyDown={(e) => e.key === "Enter" && handleJoin()}
              className="font-mono text-center text-lg tracking-widest uppercase"
              maxLength={10}
              autoFocus
            />
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>
          <p className="text-xs text-muted-foreground">
            Ask your instructor for the class code, then enter it here. Codes are not case-sensitive.
          </p>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleJoin} disabled={!code.trim() || isJoining}>
              {isJoining ? "Joining..." : "Join"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
