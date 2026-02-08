import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useClassroom } from "@/contexts/ClassroomContext";
import { useCourses } from "@/contexts/CourseContext";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { UserPlus, BookOpen, Users, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function JoinClass() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { findCourseByCode } = useClassroom();
  const { courses, enrollInCourse, enrollments } = useCourses();
  const { toast } = useToast();

  const codeFromUrl = searchParams.get("code") || "";
  const [code, setCode] = useState(codeFromUrl);
  const [error, setError] = useState("");
  const [isJoining, setIsJoining] = useState(false);
  const [foundCourse, setFoundCourse] = useState<typeof courses[0] | null>(null);

  useEffect(() => {
    if (code.trim()) {
      const courseId = findCourseByCode(code);
      if (courseId) {
        const course = courses.find((c) => c.id === courseId);
        setFoundCourse(course || null);
        setError("");
      } else {
        setFoundCourse(null);
      }
    } else {
      setFoundCourse(null);
    }
  }, [code, findCourseByCode, courses]);

  const handleJoin = async () => {
    if (!foundCourse) {
      setError("Invalid class code");
      return;
    }

    if (foundCourse.lecturerId === user?.id) {
      setError("You are the instructor of this class");
      return;
    }

    const alreadyEnrolled = enrollments.some(
      (e) => e.courseId === foundCourse.id && e.studentId === user?.id
    );
    if (alreadyEnrolled) {
      setError("You are already enrolled in this class");
      return;
    }

    setIsJoining(true);
    try {
      await enrollInCourse(foundCourse.id);
      toast({
        title: "Joined class!",
        description: `You are now enrolled in ${foundCourse.title}`,
      });
      navigate(`/courses/${foundCourse.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to join class");
    }
    setIsJoining(false);
  };

  return (
    <DashboardLayout>
      <div className="max-w-lg mx-auto space-y-6">
        <Button variant="ghost" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>

        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto p-3 rounded-full bg-primary/10 w-fit mb-2">
              <UserPlus className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="text-2xl">Join a Class</CardTitle>
            <CardDescription>
              Enter the class code from your instructor
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="join-code">Class Code</Label>
              <Input
                id="join-code"
                placeholder="e.g. abc123"
                value={code}
                onChange={(e) => { setCode(e.target.value); setError(""); }}
                onKeyDown={(e) => e.key === "Enter" && foundCourse && handleJoin()}
                className="font-mono text-center text-xl tracking-[0.3em] uppercase h-14"
                maxLength={10}
                autoFocus
              />
              {error && <p className="text-sm text-destructive text-center">{error}</p>}
            </div>

            {foundCourse && (
              <Card className="bg-muted/50">
                <CardContent className="pt-4">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <BookOpen className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="font-mono text-xs">{foundCourse.code}</Badge>
                      </div>
                      <p className="font-semibold mt-1">{foundCourse.title}</p>
                      <p className="text-sm text-muted-foreground">by {foundCourse.lecturerName}</p>
                      <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                        <Users className="h-3 w-3" />
                        {foundCourse.enrolledCount} students enrolled
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            <Button
              className="w-full"
              size="lg"
              onClick={handleJoin}
              disabled={!foundCourse || isJoining}
            >
              {isJoining ? "Joining..." : "Join Class"}
            </Button>

            <p className="text-xs text-muted-foreground text-center">
              Contact your instructor if you don't have a class code.
            </p>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
