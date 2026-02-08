import { useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAssignments } from "@/contexts/AssignmentContext";
import { useCourses } from "@/contexts/CourseContext";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2 } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

const questionSchema = z.object({
  question: z.string().min(1, "Question is required"),
  type: z.enum(["multiple-choice", "true-false", "short-answer"]),
  options: z.array(z.string()).optional(),
  correctAnswer: z.union([z.string(), z.number()]),
  points: z.coerce.number().min(1),
});

const formSchema = z.object({
  courseId: z.string().min(1, "Please select a course"),
  title: z.string().min(3, "Title must be at least 3 characters").max(100),
  description: z.string().min(10, "Description must be at least 10 characters").max(500),
  timeLimit: z.coerce.number().min(1).optional(),
  status: z.enum(["draft", "published"]),
  questions: z.array(questionSchema).min(1, "Add at least one question"),
});

type FormData = z.infer<typeof formSchema>;

export function CreateQuizDialog() {
  const { user } = useAuth();
  const { createQuiz } = useAssignments();
  const { courses } = useCourses();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const myCourses = courses.filter((c) => c.lecturerId === user?.id);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      timeLimit: 30,
      status: "draft",
      questions: [
        {
          question: "",
          type: "multiple-choice",
          options: ["", "", "", ""],
          correctAnswer: 0,
          points: 10,
        },
      ],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "questions",
  });

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    try {
      const questionsWithIds = data.questions.map((q, index) => ({
        id: `q-${Date.now()}-${index}`,
        question: q.question,
        type: q.type,
        options: q.type === "true-false" ? ["True", "False"] : q.options,
        correctAnswer: q.correctAnswer,
        points: q.points,
      }));

      await createQuiz({
        courseId: data.courseId,
        title: data.title,
        description: data.description,
        timeLimit: data.timeLimit,
        questions: questionsWithIds,
        status: data.status as "draft" | "published" | "closed",
      });

      toast({
        title: "Quiz created",
        description: "Your quiz has been created successfully.",
      });
      form.reset();
      setOpen(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create quiz. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const addQuestion = () => {
    append({
      question: "",
      type: "multiple-choice",
      options: ["", "", "", ""],
      correctAnswer: 0,
      points: 10,
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Create Quiz
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Create Quiz</DialogTitle>
          <DialogDescription>
            Create a new quiz with auto-grading questions.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <ScrollArea className="h-[60vh] pr-4">
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="courseId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Course</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a course" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {myCourses.map((course) => (
                              <SelectItem key={course.id} value={course.id}>
                                {course.code} - {course.title}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="timeLimit"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Time Limit (minutes)</FormLabel>
                        <FormControl>
                          <Input type="number" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Title</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Midterm Quiz" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Brief description of the quiz..."
                          className="resize-none"
                          rows={2}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="draft">Draft</SelectItem>
                          <SelectItem value="published">Published</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Questions */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">Questions</h3>
                    <Button type="button" variant="outline" size="sm" onClick={addQuestion}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Question
                    </Button>
                  </div>

                  {fields.map((field, index) => (
                    <Card key={field.id}>
                      <CardHeader className="py-3">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-sm">Question {index + 1}</CardTitle>
                          {fields.length > 1 && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => remove(index)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          )}
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <FormField
                          control={form.control}
                          name={`questions.${index}.question`}
                          render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <Input placeholder="Enter question" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <div className="grid grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name={`questions.${index}.type`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-xs">Type</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value}>
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="multiple-choice">Multiple Choice</SelectItem>
                                    <SelectItem value="true-false">True/False</SelectItem>
                                    <SelectItem value="short-answer">Short Answer</SelectItem>
                                  </SelectContent>
                                </Select>
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name={`questions.${index}.points`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-xs">Points</FormLabel>
                                <FormControl>
                                  <Input type="number" {...field} />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                        </div>

                        {form.watch(`questions.${index}.type`) === "multiple-choice" && (
                          <div className="space-y-2">
                            <FormLabel className="text-xs">Options (mark correct answer)</FormLabel>
                            {[0, 1, 2, 3].map((optIndex) => (
                              <div key={optIndex} className="flex items-center gap-2">
                                <input
                                  type="radio"
                                  name={`correct-${index}`}
                                  checked={form.watch(`questions.${index}.correctAnswer`) === optIndex}
                                  onChange={() => form.setValue(`questions.${index}.correctAnswer`, optIndex)}
                                  className="h-4 w-4"
                                />
                                <FormField
                                  control={form.control}
                                  name={`questions.${index}.options.${optIndex}`}
                                  render={({ field }) => (
                                    <Input
                                      placeholder={`Option ${optIndex + 1}`}
                                      {...field}
                                      className="flex-1"
                                    />
                                  )}
                                />
                              </div>
                            ))}
                          </div>
                        )}

                        {form.watch(`questions.${index}.type`) === "true-false" && (
                          <FormField
                            control={form.control}
                            name={`questions.${index}.correctAnswer`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-xs">Correct Answer</FormLabel>
                                <Select
                                  onValueChange={(val) => field.onChange(parseInt(val))}
                                  value={String(field.value)}
                                >
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="0">True</SelectItem>
                                    <SelectItem value="1">False</SelectItem>
                                  </SelectContent>
                                </Select>
                              </FormItem>
                            )}
                          />
                        )}

                        {form.watch(`questions.${index}.type`) === "short-answer" && (
                          <FormField
                            control={form.control}
                            name={`questions.${index}.correctAnswer`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-xs">Correct Answer</FormLabel>
                                <FormControl>
                                  <Input
                                    placeholder="Enter correct answer"
                                    {...field}
                                    value={String(field.value)}
                                    onChange={(e) => field.onChange(e.target.value)}
                                  />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </ScrollArea>
            <div className="flex justify-end gap-3 pt-4 border-t mt-4">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Creating..." : "Create Quiz"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
