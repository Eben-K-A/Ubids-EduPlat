import { useState } from "react";
import { useCourses } from "@/contexts/CourseContext";
import { useAssignments } from "@/contexts/AssignmentContext";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Archive, Copy, RotateCcw, FileText, FileQuestion } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ArchiveReuseProps {
  courseId: string;
  isOwner: boolean;
}

export function ArchiveReuse({ courseId, isOwner }: ArchiveReuseProps) {
  const { courses, updateCourse, getMyCourses } = useCourses();
  const { getAssignmentsByCourse, getQuizzesByCourse, createAssignment, createQuiz } = useAssignments();
  const { user } = useAuth();
  const { toast } = useToast();
  const [reuseOpen, setReuseOpen] = useState(false);
  const [sourceId, setSourceId] = useState<string>("");
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const course = courses.find((c) => c.id === courseId);
  const myCourses = getMyCourses().filter((c) => c.id !== courseId);
  const sourceAssignments = sourceId ? getAssignmentsByCourse(sourceId) : [];
  const sourceQuizzes = sourceId ? getQuizzesByCourse(sourceId) : [];

  if (!isOwner) return null;

  const handleArchive = async () => {
    if (!course) return;
    const newStatus = course.status === "archived" ? "draft" : "archived";
    await updateCourse(courseId, { status: newStatus as "draft" | "archived" });
    toast({
      title: newStatus === "archived" ? "Course archived" : "Course restored",
      description: newStatus === "archived"
        ? "Students can no longer access this course"
        : "Course is now in draft mode",
    });
  };

  const handleReuse = async () => {
    if (selectedItems.length === 0) return;
    setIsProcessing(true);

    try {
      for (const itemId of selectedItems) {
        // Check if it's an assignment
        const assignment = sourceAssignments.find((a) => a.id === itemId);
        if (assignment) {
          await createAssignment({
            courseId,
            title: `${assignment.title} (Copy)`,
            description: assignment.description,
            dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 1 week from now
            points: assignment.points,
            status: "draft",
          });
          continue;
        }

        // Check if it's a quiz
        const quiz = sourceQuizzes.find((q) => q.id === itemId);
        if (quiz) {
          await createQuiz({
            courseId,
            title: `${quiz.title} (Copy)`,
            description: quiz.description,
            timeLimit: quiz.timeLimit,
            questions: quiz.questions.map((q) => ({ ...q, id: `q-${Date.now()}-${Math.random()}` })),
            status: "draft",
          });
        }
      }

      toast({
        title: "Items copied",
        description: `${selectedItems.length} item(s) copied to this course as drafts`,
      });
      setReuseOpen(false);
      setSelectedItems([]);
      setSourceId("");
    } catch {
      toast({ title: "Failed to copy items", variant: "destructive" });
    }
    setIsProcessing(false);
  };

  const toggleItem = (id: string) => {
    setSelectedItems((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  return (
    <div className="flex gap-2 flex-wrap">
      {/* Archive/Restore */}
      <Button
        variant="outline"
        size="sm"
        onClick={handleArchive}
      >
        {course?.status === "archived" ? (
          <>
            <RotateCcw className="h-4 w-4 mr-2" />
            Restore Course
          </>
        ) : (
          <>
            <Archive className="h-4 w-4 mr-2" />
            Archive Course
          </>
        )}
      </Button>

      {/* Reuse from another course */}
      <Dialog open={reuseOpen} onOpenChange={setReuseOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm">
            <Copy className="h-4 w-4 mr-2" />
            Reuse Post
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Reuse from Another Course</DialogTitle>
            <DialogDescription>
              Copy assignments and quizzes from one of your other courses
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Source Course</Label>
              <Select value={sourceId} onValueChange={(v) => { setSourceId(v); setSelectedItems([]); }}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a course" />
                </SelectTrigger>
                <SelectContent>
                  {myCourses.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.code} - {c.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {sourceId && (
              <div className="space-y-3">
                {sourceAssignments.length > 0 && (
                  <div>
                    <Label className="text-xs text-muted-foreground mb-2 block">Assignments</Label>
                    {sourceAssignments.map((a) => (
                      <div key={a.id} className="flex items-center gap-3 py-2 px-2 rounded hover:bg-muted/50">
                        <Checkbox
                          checked={selectedItems.includes(a.id)}
                          onCheckedChange={() => toggleItem(a.id)}
                        />
                        <FileText className="h-4 w-4 text-primary" />
                        <div className="flex-1">
                          <p className="text-sm font-medium">{a.title}</p>
                          <p className="text-xs text-muted-foreground">{a.points} pts</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {sourceQuizzes.length > 0 && (
                  <div>
                    <Label className="text-xs text-muted-foreground mb-2 block">Quizzes</Label>
                    {sourceQuizzes.map((q) => (
                      <div key={q.id} className="flex items-center gap-3 py-2 px-2 rounded hover:bg-muted/50">
                        <Checkbox
                          checked={selectedItems.includes(q.id)}
                          onCheckedChange={() => toggleItem(q.id)}
                        />
                        <FileQuestion className="h-4 w-4 text-warning" />
                        <div className="flex-1">
                          <p className="text-sm font-medium">{q.title}</p>
                          <p className="text-xs text-muted-foreground">{q.questions.length} questions</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {sourceAssignments.length === 0 && sourceQuizzes.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No assignments or quizzes in this course
                  </p>
                )}
              </div>
            )}

            {sourceId && (sourceAssignments.length > 0 || sourceQuizzes.length > 0) && (
              <div className="flex justify-end gap-2">
                <Button variant="ghost" onClick={() => { setReuseOpen(false); setSelectedItems([]); }}>
                  Cancel
                </Button>
                <Button onClick={handleReuse} disabled={selectedItems.length === 0 || isProcessing}>
                  {isProcessing ? "Copying..." : `Copy ${selectedItems.length} Item(s)`}
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
