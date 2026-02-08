import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useAssignments } from "@/contexts/AssignmentContext";
import { Assignment } from "@/types/assignment";
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
import { Upload, FileText, Send } from "lucide-react";
import { toast } from "sonner";

const formSchema = z.object({
  content: z.string().min(10, "Submission must be at least 10 characters"),
  fileUrl: z.string().url().optional().or(z.literal("")),
});

type FormData = z.infer<typeof formSchema>;

interface SubmitAssignmentDialogProps {
  assignment: Assignment;
  children?: React.ReactNode;
}

export function SubmitAssignmentDialog({ assignment, children }: SubmitAssignmentDialogProps) {
  const [open, setOpen] = useState(false);
  const { submitAssignment } = useAssignments();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      content: "",
      fileUrl: "",
    },
  });

  const onSubmit = async (data: FormData) => {
    try {
      await submitAssignment(
        assignment.id,
        data.content,
        data.fileUrl || undefined
      );
      toast.success("Assignment submitted successfully!");
      setOpen(false);
      form.reset();
    } catch (error) {
      toast.error("Failed to submit assignment");
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button size="sm">
            <Send className="h-4 w-4 mr-2" />
            Submit
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Submit Assignment</DialogTitle>
          <DialogDescription>{assignment.title}</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="p-4 rounded-lg bg-muted/50 space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <FileText className="h-4 w-4" />
                <span className="font-medium">Assignment Details</span>
              </div>
              <p className="text-sm text-muted-foreground">{assignment.description}</p>
              <p className="text-sm">
                <span className="text-muted-foreground">Points: </span>
                <span className="font-medium">{assignment.points}</span>
              </p>
            </div>

            <FormField
              control={form.control}
              name="content"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Your Submission</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Write your answer or solution here..."
                      className="min-h-[150px]"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Provide a detailed response to the assignment
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="fileUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>File URL (Optional)</FormLabel>
                  <FormControl>
                    <div className="flex gap-2">
                      <div className="flex-1 relative">
                        <Upload className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="https://example.com/your-file.pdf"
                          className="pl-9"
                          {...field}
                        />
                      </div>
                    </div>
                  </FormControl>
                  <FormDescription>
                    Link to any supporting files (Google Drive, Dropbox, etc.)
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
                {form.formState.isSubmitting ? "Submitting..." : "Submit Assignment"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
