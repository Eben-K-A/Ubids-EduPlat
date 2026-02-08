import { useState } from "react";
import { useAcademic } from "@/contexts/AcademicContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Plus, Pencil, Trash2, FolderTree } from "lucide-react";
import { toast } from "sonner";
import { FileUploadDialog } from "./FileUploadDialog";
import type { Department } from "@/types/academic";

export function DepartmentTab() {
  const { faculties, getAllDepartments, createDepartment, updateDepartment, deleteDepartment } = useAcademic();
  const departments = getAllDepartments();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<(Department & { facultyName: string }) | null>(null);
  const [editing, setEditing] = useState<(Department & { facultyName: string }) | null>(null);
  const [form, setForm] = useState({ name: "", code: "", head: "", facultyId: "" });

  const openCreate = () => {
    setEditing(null);
    setForm({ name: "", code: "", head: "", facultyId: faculties[0]?.id || "" });
    setDialogOpen(true);
  };

  const openEdit = (d: Department & { facultyName: string }) => {
    setEditing(d);
    setForm({ name: d.name, code: d.code, head: d.head, facultyId: d.facultyId });
    setDialogOpen(true);
  };

  const handleSave = () => {
    if (!form.name.trim() || !form.code.trim() || !form.facultyId) {
      toast.error("Name, code, and faculty are required");
      return;
    }
    if (editing) {
      updateDepartment(editing.id, { name: form.name, code: form.code, head: form.head, facultyId: form.facultyId });
      toast.success("Department updated");
    } else {
      createDepartment({ name: form.name, code: form.code, head: form.head, facultyId: form.facultyId });
      toast.success("Department created");
    }
    setDialogOpen(false);
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    deleteDepartment(deleteTarget.id);
    toast.success("Department deleted");
    setDeleteTarget(null);
  };

  const handleCsvImport = (rows: Record<string, string>[]) => {
    rows.forEach((row) => {
      const name = row.name || row.departmentname || "";
      const code = row.code || row.departmentcode || "";
      const head = row.head || row.headofdepartment || "";
      const facultyCode = row.facultycode || row.faculty || "";
      const faculty = faculties.find((f) => f.code.toLowerCase() === facultyCode.toLowerCase() || f.name.toLowerCase() === facultyCode.toLowerCase());
      if (name && code && faculty) {
        createDepartment({ name, code, head, facultyId: faculty.id });
      }
    });
  };

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Departments ({departments.length})</CardTitle>
          <div className="flex items-center gap-2">
            <FileUploadDialog
              entityName="Department"
              fields={[
                { name: "Name", required: true },
                { name: "Code", required: true },
                { name: "FacultyCode", required: true },
                { name: "Head", required: false },
              ]}
              onImport={handleCsvImport}
            />
            <Button onClick={openCreate} size="sm" disabled={faculties.length === 0}>
              <Plus className="h-4 w-4 mr-2" /> Add Department
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Code</TableHead>
                <TableHead>Faculty</TableHead>
                <TableHead>Head</TableHead>
                <TableHead className="text-center">
                  <FolderTree className="h-4 w-4 inline mr-1" />Programs
                </TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {departments.map((d) => (
                <TableRow key={d.id}>
                  <TableCell className="font-medium">{d.name}</TableCell>
                  <TableCell>{d.code}</TableCell>
                  <TableCell className="text-muted-foreground">{d.facultyName}</TableCell>
                  <TableCell>{d.head}</TableCell>
                  <TableCell className="text-center">{d.programs.length}</TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button variant="ghost" size="icon" onClick={() => openEdit(d)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => setDeleteTarget(d)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {departments.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                    No departments yet. Create a faculty first, then add departments.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Department" : "Create Department"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Faculty</Label>
              <Select value={form.facultyId} onValueChange={(v) => setForm({ ...form, facultyId: v })}>
                <SelectTrigger><SelectValue placeholder="Select faculty" /></SelectTrigger>
                <SelectContent>
                  {faculties.map((f) => (
                    <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="dept-name">Department Name</Label>
              <Input id="dept-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Computer Science" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dept-code">Code</Label>
              <Input id="dept-code" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} placeholder="e.g. CS" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dept-head">Head of Department</Label>
              <Input id="dept-head" value={form.head} onChange={(e) => setForm({ ...form, head: e.target.value })} placeholder="e.g. Dr. Sarah Johnson" />
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
            <AlertDialogTitle>Delete Department</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete "{deleteTarget?.name}" and all its programs. This action cannot be undone.
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
