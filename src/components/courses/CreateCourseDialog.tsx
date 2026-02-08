import { useState, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Plus, Loader2 } from "lucide-react";
import { useCourses } from "@/contexts/CourseContext";
import { useAcademic } from "@/contexts/AcademicContext";
import { useToast } from "@/hooks/use-toast";

const courseSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  code: z.string().min(2, "Course code is required").max(10, "Code too long"),
  maxEnrollment: z.coerce.number().min(1).max(1000).optional(),
  status: z.enum(["draft", "published"]),
  facultyId: z.string().optional(),
  departmentId: z.string().optional(),
  programId: z.string().optional(),
  levelValue: z.coerce.number().optional(),
  academicPeriodId: z.string().optional(),
});

type CourseFormData = z.infer<typeof courseSchema>;

interface CreateCourseDialogProps {
  children?: React.ReactNode;
}

export function CreateCourseDialog({ children }: CreateCourseDialogProps) {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { createCourse } = useCourses();
  const { faculties, getAllDepartments, getAllPrograms, levels, periods } = useAcademic();
  const { toast } = useToast();

  const form = useForm<CourseFormData>({
    resolver: zodResolver(courseSchema),
    defaultValues: {
      title: "",
      description: "",
      code: "",
      status: "draft",
      facultyId: "",
      departmentId: "",
      programId: "",
      levelValue: 0,
      academicPeriodId: "",
    },
  });

  const selectedFacultyId = form.watch("facultyId");
  const selectedDeptId = form.watch("departmentId");

  const filteredDepartments = useMemo(() => {
    if (!selectedFacultyId) return getAllDepartments();
    const fac = faculties.find((f) => f.id === selectedFacultyId);
    return fac ? fac.departments.map((d) => ({ ...d, facultyName: fac.name })) : [];
  }, [selectedFacultyId, faculties, getAllDepartments]);

  const filteredPrograms = useMemo(() => {
    if (!selectedDeptId) return getAllPrograms();
    const allDepts = getAllDepartments();
    const dept = allDepts.find((d) => d.id === selectedDeptId);
    if (!dept) return [];
    return dept.programs.map((p) => ({ ...p, departmentName: dept.name, facultyName: dept.facultyName }));
  }, [selectedDeptId, getAllDepartments, getAllPrograms]);

  const onSubmit = async (data: CourseFormData) => {
    setIsSubmitting(true);
    try {
      await createCourse({
        title: data.title,
        description: data.description,
        code: data.code.toUpperCase(),
        maxEnrollment: data.maxEnrollment,
        status: data.status,
        facultyId: data.facultyId || undefined,
        departmentId: data.departmentId || undefined,
        programId: data.programId || undefined,
        levelValue: data.levelValue || undefined,
        academicPeriodId: data.academicPeriodId || undefined,
      });
      
      toast({
        title: "Course created",
        description: `"${data.title}" has been created successfully.`,
      });
      
      form.reset();
      setOpen(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create course. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Create Course
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Course</DialogTitle>
          <DialogDescription>
            Fill in the details below to create a new course. Assign it to a faculty, department, and program.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Course Title</FormLabel>
                  <FormControl>
                    <Input placeholder="Introduction to Computer Science" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="code"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Course Code</FormLabel>
                  <FormControl>
                    <Input placeholder="CS101" className="uppercase" {...field} />
                  </FormControl>
                  <FormDescription>A unique identifier for the course</FormDescription>
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
                      placeholder="Describe what students will learn in this course..."
                      className="min-h-[80px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Academic Metadata Section */}
            <div className="border-t pt-4">
              <p className="text-sm font-medium mb-3 text-muted-foreground">Academic Metadata</p>
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="facultyId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Faculty</FormLabel>
                      <Select
                        onValueChange={(v) => {
                          field.onChange(v);
                          form.setValue("departmentId", "");
                          form.setValue("programId", "");
                        }}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select faculty" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {faculties.map((f) => (
                            <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="departmentId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Department</FormLabel>
                      <Select
                        onValueChange={(v) => {
                          field.onChange(v);
                          form.setValue("programId", "");
                        }}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select department" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {filteredDepartments.map((d) => (
                            <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="programId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Program</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select program" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {filteredPrograms.map((p) => (
                            <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="levelValue"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Level</FormLabel>
                      <Select onValueChange={(v) => field.onChange(parseInt(v))} value={field.value ? String(field.value) : ""}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select level" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {levels.map((l) => (
                            <SelectItem key={l.id} value={String(l.value)}>{l.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="mt-4">
                <FormField
                  control={form.control}
                  name="academicPeriodId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Academic Period</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select period" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {periods.map((p) => (
                            <SelectItem key={p.id} value={p.id}>{p.name} ({p.year})</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="maxEnrollment"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Max Enrollment</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="50" {...field} />
                    </FormControl>
                    <FormDescription>Leave empty for unlimited</FormDescription>
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
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
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
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Create Course
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
