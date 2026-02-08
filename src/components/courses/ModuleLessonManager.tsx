import { useState } from "react";
import { useAssignments } from "@/contexts/AssignmentContext";
import { CourseModule, Lesson } from "@/types/assignment";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Accordion, AccordionContent, AccordionItem, AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Plus, Pencil, Trash2, GripVertical, Video, FileText, BookOpen, FileQuestion,
  ArrowUp, ArrowDown,
} from "lucide-react";
import { toast } from "sonner";

interface ModuleLessonManagerProps {
  courseId: string;
}

const lessonTypeOptions = [
  { value: "text", label: "Text", icon: BookOpen },
  { value: "video", label: "Video", icon: Video },
  { value: "pdf", label: "PDF", icon: FileText },
  { value: "quiz", label: "Quiz", icon: FileQuestion },
] as const;

export function ModuleLessonManager({ courseId }: ModuleLessonManagerProps) {
  const {
    getModulesByCourse, createModule, updateModule, deleteModule,
    addLesson, updateLesson, deleteLesson,
  } = useAssignments();

  const modules = getModulesByCourse(courseId);

  // Module dialog state
  const [moduleDialogOpen, setModuleDialogOpen] = useState(false);
  const [editingModule, setEditingModule] = useState<CourseModule | null>(null);
  const [moduleForm, setModuleForm] = useState({ title: "", description: "" });

  // Lesson dialog state
  const [lessonDialogOpen, setLessonDialogOpen] = useState(false);
  const [editingLesson, setEditingLesson] = useState<{ lesson: Lesson; moduleId: string } | null>(null);
  const [targetModuleId, setTargetModuleId] = useState<string>("");
  const [lessonForm, setLessonForm] = useState({
    title: "", content: "", type: "text" as Lesson["type"], duration: 0, resourceUrl: "",
  });

  // Delete state
  const [deleteModuleTarget, setDeleteModuleTarget] = useState<CourseModule | null>(null);
  const [deleteLessonTarget, setDeleteLessonTarget] = useState<{ lesson: Lesson; moduleId: string } | null>(null);

  // Module CRUD
  const openCreateModule = () => {
    setEditingModule(null);
    setModuleForm({ title: "", description: "" });
    setModuleDialogOpen(true);
  };

  const openEditModule = (mod: CourseModule) => {
    setEditingModule(mod);
    setModuleForm({ title: mod.title, description: mod.description });
    setModuleDialogOpen(true);
  };

  const handleSaveModule = async () => {
    if (!moduleForm.title.trim()) {
      toast.error("Module title is required");
      return;
    }
    try {
      if (editingModule) {
        await updateModule(editingModule.id, moduleForm);
        toast.success("Module updated");
      } else {
        await createModule({
          courseId,
          title: moduleForm.title,
          description: moduleForm.description,
          order: modules.length + 1,
        });
        toast.success("Module created");
      }
      setModuleDialogOpen(false);
    } catch (err: any) {
      toast.error(err.message || "Failed to save module");
    }
  };

  const handleDeleteModule = async () => {
    if (!deleteModuleTarget) return;
    try {
      await deleteModule(deleteModuleTarget.id);
      toast.success("Module deleted");
      setDeleteModuleTarget(null);
    } catch (err: any) {
      toast.error(err.message || "Failed to delete module");
    }
  };

  const handleReorderModule = async (mod: CourseModule, direction: "up" | "down") => {
    const idx = modules.findIndex((m) => m.id === mod.id);
    const swapIdx = direction === "up" ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= modules.length) return;
    const other = modules[swapIdx];
    await updateModule(mod.id, { order: other.order });
    await updateModule(other.id, { order: mod.order });
  };

  // Lesson CRUD
  const openCreateLesson = (moduleId: string) => {
    setEditingLesson(null);
    setTargetModuleId(moduleId);
    setLessonForm({ title: "", content: "", type: "text", duration: 0, resourceUrl: "" });
    setLessonDialogOpen(true);
  };

  const openEditLesson = (lesson: Lesson, moduleId: string) => {
    setEditingLesson({ lesson, moduleId });
    setTargetModuleId(moduleId);
    setLessonForm({
      title: lesson.title,
      content: lesson.content,
      type: lesson.type,
      duration: lesson.duration || 0,
      resourceUrl: lesson.resourceUrl || "",
    });
    setLessonDialogOpen(true);
  };

  const handleSaveLesson = async () => {
    if (!lessonForm.title.trim()) {
      toast.error("Lesson title is required");
      return;
    }
    try {
      const mod = modules.find((m) => m.id === targetModuleId);
      if (editingLesson) {
        await updateLesson(editingLesson.moduleId, editingLesson.lesson.id, {
          title: lessonForm.title,
          content: lessonForm.content,
          type: lessonForm.type,
          duration: lessonForm.duration || undefined,
          resourceUrl: lessonForm.resourceUrl || undefined,
        });
        toast.success("Lesson updated");
      } else {
        await addLesson(targetModuleId, {
          title: lessonForm.title,
          content: lessonForm.content,
          type: lessonForm.type,
          duration: lessonForm.duration || undefined,
          order: (mod?.lessons.length || 0) + 1,
          resourceUrl: lessonForm.resourceUrl || undefined,
        });
        toast.success("Lesson added");
      }
      setLessonDialogOpen(false);
    } catch (err: any) {
      toast.error(err.message || "Failed to save lesson");
    }
  };

  const handleDeleteLesson = async () => {
    if (!deleteLessonTarget) return;
    try {
      await deleteLesson(deleteLessonTarget.moduleId, deleteLessonTarget.lesson.id);
      toast.success("Lesson deleted");
      setDeleteLessonTarget(null);
    } catch (err: any) {
      toast.error(err.message || "Failed to delete lesson");
    }
  };

  const getLessonIcon = (type: string) => {
    const opt = lessonTypeOptions.find((o) => o.value === type);
    if (!opt) return <BookOpen className="h-4 w-4" />;
    const Icon = opt.icon;
    return <Icon className="h-4 w-4" />;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Modules & Lessons</h3>
        <Button onClick={openCreateModule} size="sm">
          <Plus className="h-4 w-4 mr-2" /> Add Module
        </Button>
      </div>

      {modules.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center">
            <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-4">No modules yet. Create your first module to start adding content.</p>
            <Button variant="outline" onClick={openCreateModule}>
              <Plus className="h-4 w-4 mr-2" /> Add First Module
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Accordion type="multiple" className="space-y-3">
          {modules.map((mod, index) => (
            <AccordionItem key={mod.id} value={mod.id} className="border rounded-lg px-4">
              <AccordionTrigger className="hover:no-underline">
                <div className="flex items-center gap-3 flex-1 text-left">
                  <div className="flex flex-col gap-0.5">
                    <Button
                      variant="ghost" size="icon" className="h-5 w-5"
                      disabled={index === 0}
                      onClick={(e) => { e.stopPropagation(); handleReorderModule(mod, "up"); }}
                    >
                      <ArrowUp className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost" size="icon" className="h-5 w-5"
                      disabled={index === modules.length - 1}
                      onClick={(e) => { e.stopPropagation(); handleReorderModule(mod, "down"); }}
                    >
                      <ArrowDown className="h-3 w-3" />
                    </Button>
                  </div>
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-semibold text-sm">
                    {index + 1}
                  </div>
                  <div>
                    <h4 className="font-semibold">{mod.title}</h4>
                    <p className="text-sm text-muted-foreground">
                      {mod.lessons.length} lesson{mod.lessons.length !== 1 ? "s" : ""}
                    </p>
                  </div>
                </div>
              </AccordionTrigger>
              <div className="flex items-center gap-1 -mt-10 mr-10 justify-end relative z-10">
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEditModule(mod)}>
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setDeleteModuleTarget(mod)}>
                  <Trash2 className="h-3.5 w-3.5 text-destructive" />
                </Button>
              </div>
              <AccordionContent>
                <div className="space-y-2 ml-12 pt-2">
                  {mod.lessons.map((lesson) => (
                    <div
                      key={lesson.id}
                      className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors group"
                    >
                      <div className="p-2 rounded-md bg-muted">
                        {getLessonIcon(lesson.type)}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-sm">{lesson.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {lesson.type} {lesson.duration ? `· ${lesson.duration} min` : ""}
                        </p>
                      </div>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEditLesson(lesson, mod.id)}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setDeleteLessonTarget({ lesson, moduleId: mod.id })}>
                          <Trash2 className="h-3.5 w-3.5 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  <Button
                    variant="outline" size="sm" className="mt-2 w-full"
                    onClick={() => openCreateLesson(mod.id)}
                  >
                    <Plus className="h-4 w-4 mr-2" /> Add Lesson
                  </Button>
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      )}

      {/* Module Dialog */}
      <Dialog open={moduleDialogOpen} onOpenChange={setModuleDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingModule ? "Edit Module" : "Create Module"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Module Title</Label>
              <Input value={moduleForm.title} onChange={(e) => setModuleForm({ ...moduleForm, title: e.target.value })} placeholder="e.g. Getting Started" />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea value={moduleForm.description} onChange={(e) => setModuleForm({ ...moduleForm, description: e.target.value })} placeholder="What this module covers..." rows={3} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModuleDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveModule}>{editingModule ? "Save Changes" : "Create"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Lesson Dialog */}
      <Dialog open={lessonDialogOpen} onOpenChange={setLessonDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingLesson ? "Edit Lesson" : "Add Lesson"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Lesson Title</Label>
              <Input value={lessonForm.title} onChange={(e) => setLessonForm({ ...lessonForm, title: e.target.value })} placeholder="e.g. Introduction" />
            </div>
            <div className="space-y-2">
              <Label>Type</Label>
              <Select value={lessonForm.type} onValueChange={(v) => setLessonForm({ ...lessonForm, type: v as Lesson["type"] })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {lessonTypeOptions.map((o) => (
                    <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Content</Label>
              <Textarea value={lessonForm.content} onChange={(e) => setLessonForm({ ...lessonForm, content: e.target.value })} placeholder="Lesson content or instructions..." rows={3} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Duration (min)</Label>
                <Input type="number" min={0} value={lessonForm.duration} onChange={(e) => setLessonForm({ ...lessonForm, duration: parseInt(e.target.value) || 0 })} />
              </div>
              <div className="space-y-2">
                <Label>Resource URL</Label>
                <Input value={lessonForm.resourceUrl} onChange={(e) => setLessonForm({ ...lessonForm, resourceUrl: e.target.value })} placeholder="Optional link" />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setLessonDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveLesson}>{editingLesson ? "Save Changes" : "Add Lesson"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Module Confirm */}
      <AlertDialog open={!!deleteModuleTarget} onOpenChange={(open) => !open && setDeleteModuleTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Module</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete "{deleteModuleTarget?.title}" and all its lessons.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteModule} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Lesson Confirm */}
      <AlertDialog open={!!deleteLessonTarget} onOpenChange={(open) => !open && setDeleteLessonTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Lesson</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete "{deleteLessonTarget?.lesson.title}".
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteLesson} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
