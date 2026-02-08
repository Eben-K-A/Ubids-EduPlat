import { useState, useMemo } from "react";
import { useCourses } from "@/contexts/CourseContext";
import { useAcademic } from "@/contexts/AcademicContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, Trash2, Users } from "lucide-react";
import { toast } from "sonner";
import { FileUploadDialog } from "./FileUploadDialog";
import type { Course } from "@/types/course";

export function CourseTab() {
  const { courses, createCourse, updateCourse, deleteCourse } = useCourses();
  const { faculties, getAllDepartments, getAllPrograms, levels, periods } = useAcademic();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Course | null>(null);
  const [editing, setEditing] = useState<Course | null>(null);
  const [form, setForm] = useState({
    title: "",
    description: "",
    code: "",
    status: "draft" as Course["status"],
    maxEnrollment: 60,
    facultyId: "",
    departmentId: "",
    programId: "",
    levelValue: 0,
    academicPeriodId: "",
  });

  // Filtered departments and programs based on selection
  const filteredDepartments = useMemo(() => {
    if (!form.facultyId) return getAllDepartments();
    const fac = faculties.find((f) => f.id === form.facultyId);
    return fac ? fac.departments.map((d) => ({ ...d, facultyName: fac.name })) : [];
  }, [form.facultyId, faculties, getAllDepartments]);

  const filteredPrograms = useMemo(() => {
    if (!form.departmentId) return getAllPrograms();
    const allDepts = getAllDepartments();
    const dept = allDepts.find((d) => d.id === form.departmentId);
    if (!dept) return [];
    return dept.programs.map((p) => ({ ...p, departmentName: dept.name, facultyName: dept.facultyName }));
  }, [form.departmentId, getAllDepartments, getAllPrograms]);

  const openCreate = () => {
    setEditing(null);
    setForm({ title: "", description: "", code: "", status: "draft", maxEnrollment: 60, facultyId: "", departmentId: "", programId: "", levelValue: 0, academicPeriodId: "" });
    setDialogOpen(true);
  };

  const openEdit = (c: Course) => {
    setEditing(c);
    setForm({
      title: c.title,
      description: c.description,
      code: c.code,
      status: c.status,
      maxEnrollment: c.maxEnrollment || 60,
      facultyId: c.facultyId || "",
      departmentId: c.departmentId || "",
      programId: c.programId || "",
      levelValue: c.levelValue || 0,
      academicPeriodId: c.academicPeriodId || "",
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.title.trim() || !form.code.trim()) {
      toast.error("Title and code are required");
      return;
    }
    try {
      if (editing) {
        await updateCourse(editing.id, form);
        toast.success("Course updated");
      } else {
        await createCourse(form);
        toast.success("Course created");
      }
      setDialogOpen(false);
    } catch (err: any) {
      toast.error(err.message || "Failed to save course");
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteCourse(deleteTarget.id);
      toast.success("Course deleted");
      setDeleteTarget(null);
    } catch (err: any) {
      toast.error(err.message || "Failed to delete course");
    }
  };

  const handleCsvImport = async (rows: Record<string, string>[]) => {
    for (const row of rows) {
      const title = row.title || row.coursetitle || "";
      const code = row.code || row.coursecode || "";
      const description = row.description || "";
      const status = (row.status || "draft") as Course["status"];
      if (title && code) {
        try {
          await createCourse({ title, code, description, status, maxEnrollment: parseInt(row.maxenrollment || "60") || 60 });
        } catch { /* skip duplicates */ }
      }
    }
  };

  // Helper to resolve names
  const getFacultyName = (id?: string) => faculties.find((f) => f.id === id)?.code;
  const getDeptName = (id?: string) => getAllDepartments().find((d) => d.id === id)?.code;
  const getPeriodName = (id?: string) => periods.find((p) => p.id === id)?.name;

  const statusBadge = (status: Course["status"]) => {
    const variants: Record<string, string> = {
      published: "bg-success/10 text-success",
      draft: "bg-muted text-muted-foreground",
      archived: "bg-warning/10 text-warning",
    };
    return <Badge className={variants[status]}>{status}</Badge>;
  };

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Courses ({courses.length})</CardTitle>
          <div className="flex items-center gap-2">
            <FileUploadDialog
              entityName="Course"
              fields={[
                { name: "Title", required: true },
                { name: "Code", required: true },
                { name: "Description", required: false },
                { name: "Status", required: false },
                { name: "MaxEnrollment", required: false },
              ]}
              onImport={handleCsvImport}
            />
            <Button onClick={openCreate} size="sm">
              <Plus className="h-4 w-4 mr-2" /> Add Course
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Code</TableHead>
                <TableHead>Faculty</TableHead>
                <TableHead>Dept</TableHead>
                <TableHead>Level</TableHead>
                <TableHead>Period</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-center">
                  <Users className="h-4 w-4 inline mr-1" />Enrolled
                </TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {courses.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-medium max-w-[200px] truncate">{c.title}</TableCell>
                  <TableCell>{c.code}</TableCell>
                  <TableCell className="text-muted-foreground">{getFacultyName(c.facultyId) || "—"}</TableCell>
                  <TableCell className="text-muted-foreground">{getDeptName(c.departmentId) || "—"}</TableCell>
                  <TableCell>{c.levelValue ? `L${c.levelValue}` : "—"}</TableCell>
                  <TableCell className="text-muted-foreground text-xs">{getPeriodName(c.academicPeriodId) || "—"}</TableCell>
                  <TableCell>{statusBadge(c.status)}</TableCell>
                  <TableCell className="text-center">
                    {c.enrolledCount}/{c.maxEnrollment || "∞"}
                  </TableCell>
                  <TableCell className="text-right space-x-1">
                    <Button variant="ghost" size="icon" onClick={() => openEdit(c)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => setDeleteTarget(c)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {courses.length === 0 && (
                <TableRow>
                  <TableCell colSpan={9} className="text-center text-muted-foreground py-8">
                    No courses yet. Click "Add Course" or upload a CSV.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Course" : "Create Course"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="course-title">Course Title</Label>
                <Input id="course-title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. Introduction to CS" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="course-code">Code</Label>
                <Input id="course-code" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} placeholder="e.g. CS101" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="course-desc">Description</Label>
              <Textarea id="course-desc" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Course description..." rows={3} />
            </div>

            {/* Academic Metadata */}
            <div className="border-t pt-4">
              <p className="text-sm font-medium mb-3 text-muted-foreground">Academic Metadata</p>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Faculty</Label>
                  <Select value={form.facultyId} onValueChange={(v) => setForm({ ...form, facultyId: v, departmentId: "", programId: "" })}>
                    <SelectTrigger><SelectValue placeholder="Select faculty" /></SelectTrigger>
                    <SelectContent>
                      {faculties.map((f) => (
                        <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Department</Label>
                  <Select value={form.departmentId} onValueChange={(v) => setForm({ ...form, departmentId: v, programId: "" })}>
                    <SelectTrigger><SelectValue placeholder="Select department" /></SelectTrigger>
                    <SelectContent>
                      {filteredDepartments.map((d) => (
                        <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Program</Label>
                  <Select value={form.programId} onValueChange={(v) => setForm({ ...form, programId: v })}>
                    <SelectTrigger><SelectValue placeholder="Select program" /></SelectTrigger>
                    <SelectContent>
                      {filteredPrograms.map((p) => (
                        <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Level</Label>
                  <Select value={form.levelValue ? String(form.levelValue) : ""} onValueChange={(v) => setForm({ ...form, levelValue: parseInt(v) })}>
                    <SelectTrigger><SelectValue placeholder="Select level" /></SelectTrigger>
                    <SelectContent>
                      {levels.map((l) => (
                        <SelectItem key={l.id} value={String(l.value)}>{l.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 mt-4">
                <div className="space-y-2">
                  <Label>Academic Period</Label>
                  <Select value={form.academicPeriodId} onValueChange={(v) => setForm({ ...form, academicPeriodId: v })}>
                    <SelectTrigger><SelectValue placeholder="Select period" /></SelectTrigger>
                    <SelectContent>
                      {periods.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.name} ({p.year})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v as Course["status"] })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="published">Published</SelectItem>
                      <SelectItem value="archived">Archived</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="course-max">Max Enrollment</Label>
              <Input id="course-max" type="number" min={1} value={form.maxEnrollment} onChange={(e) => setForm({ ...form, maxEnrollment: parseInt(e.target.value) || 1 })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave}>{editing ? "Save Changes" : "Create"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Course</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete "{deleteTarget?.title}" and unenroll all students. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
