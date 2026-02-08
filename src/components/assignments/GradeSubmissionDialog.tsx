import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useAssignments } from "@/contexts/AssignmentContext";
import { Assignment, AssignmentSubmission } from "@/types/assignment";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";
import { Award, ExternalLink, User, Calendar } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

interface GradeSubmissionDialogProps {
  submission: AssignmentSubmission;
  assignment: Assignment;
  children?: React.ReactNode;
}

export function GradeSubmissionDialog({
  submission,
  assignment,
  children,
}: GradeSubmissionDialogProps) {
  const [open, setOpen] = useState(false);
  const { gradeSubmission } = useAssignments();

  const formSchema = z.object({
    grade: z
      .number()
      .min(0, "Grade cannot be negative")
      .max(assignment.points, `Grade cannot exceed ${assignment.points}`),
    feedback: z.string().optional(),
  });

  type FormData = z.infer<typeof formSchema>;

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      grade: submission.grade ?? 0,
      feedback: submission.feedback ?? "",
    },
  });

  const onSubmit = async (data: FormData) => {
    try {
      await gradeSubmission(submission.id, data.grade, data.feedback);
      toast.success("Submission graded successfully!");
      setOpen(false);
    } catch (error) {
      toast.error("Failed to grade submission");
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button size="sm" variant="outline">
            <Award className="h-4 w-4 mr-2" />
            Grade
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Grade Submission</DialogTitle>
          <DialogDescription>{assignment.title}</DialogDescription>
        </DialogHeader>

        {/* Submission Info */}
        <div className="space-y-4">
          <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-medium">{submission.studentName}</p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Calendar className="h-3 w-3" />
                  {format(new Date(submission.submittedAt), "MMM d, yyyy h:mm a")}
                </div>
              </div>
            </div>
            <Badge variant={submission.status === "late" ? "destructive" : "secondary"}>
              {submission.status}
            </Badge>
          </div>

          {/* Submission Content */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Student's Submission</h4>
            <div className="p-4 rounded-lg border bg-card">
              <p className="text-sm whitespace-pre-wrap">{submission.content}</p>
            </div>
            {submission.fileUrl && (
              <Button variant="outline" size="sm" asChild>
                <a href={submission.fileUrl} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  View Attached File
                </a>
              </Button>
            )}
          </div>
        </div>

        {/* Grading Form */}
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="grade"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Grade</FormLabel>
                  <FormControl>
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        min={0}
                        max={assignment.points}
                        className="w-24"
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                      />
                      <span className="text-muted-foreground">/ {assignment.points} points</span>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="feedback"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Feedback (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Provide constructive feedback for the student..."
                      className="min-h-[100px]"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    This feedback will be visible to the student
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? "Saving..." : "Save Grade"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
