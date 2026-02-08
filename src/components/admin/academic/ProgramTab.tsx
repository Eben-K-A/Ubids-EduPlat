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
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { FileUploadDialog } from "./FileUploadDialog";
import type { Program } from "@/types/academic";

const levelOptions = [
  { value: "undergraduate", label: "Undergraduate" },
  { value: "postgraduate", label: "Postgraduate" },
  { value: "doctoral", label: "Doctoral" },
] as const;

export function ProgramTab() {
  const { getAllDepartments, getAllPrograms, createProgram, updateProgram, deleteProgram } = useAcademic();
  const departments = getAllDepartments();
  const programs = getAllPrograms();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<(Program & { departmentName: string; facultyName: string }) | null>(null);
  const [editing, setEditing] = useState<(Program & { departmentName: string; facultyName: string }) | null>(null);
  const [form, setForm] = useState({
    name: "", code: "", departmentId: "", level: "undergraduate" as Program["level"], duration: 4, totalCredits: 160,
  });

  const openCreate = () => {
    setEditing(null);
    setForm({ name: "", code: "", departmentId: departments[0]?.id || "", level: "undergraduate", duration: 4, totalCredits: 160 });
    setDialogOpen(true);
  };

  const openEdit = (p: Program & { departmentName: string; facultyName: string }) => {
    setEditing(p);
    setForm({ name: p.name, code: p.code, departmentId: p.departmentId, level: p.level, duration: p.duration, totalCredits: p.totalCredits });
    setDialogOpen(true);
  };

  const handleSave = () => {
    if (!form.name.trim() || !form.code.trim() || !form.departmentId) {
      toast.error("Name, code, and department are required");
      return;
    }
    if (editing) {
      updateProgram(editing.id, form);
      toast.success("Program updated");
    } else {
      createProgram(form);
      toast.success("Program created");
    }
    setDialogOpen(false);
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    deleteProgram(deleteTarget.id);
    toast.success("Program deleted");
    setDeleteTarget(null);
  };

  const handleCsvImport = (rows: Record<string, string>[]) => {
    rows.forEach((row) => {
      const name = row.name || row.programname || "";
      const code = row.code || row.programcode || "";
      const deptCode = row.departmentcode || row.department || "";
      const level = (row.level || "undergraduate").toLowerCase() as Program["level"];
      const duration = parseInt(row.duration || "4") || 4;
      const totalCredits = parseInt(row.totalcredits || row.credits || "160") || 160;
      const dept = departments.find((d) => d.code.toLowerCase() === deptCode.toLowerCase() || d.name.toLowerCase() === deptCode.toLowerCase());
      if (name && code && dept) {
        createProgram({ name, code, departmentId: dept.id, level, duration, totalCredits });
      }
    });
  };

  const levelBadge = (level: Program["level"]) => {
    const variants: Record<string, string> = {
      undergraduate: "bg-primary/10 text-primary",
      postgraduate: "bg-accent/10 text-accent-foreground",
      doctoral: "bg-warning/10 text-warning",
    };
    return <Badge className={variants[level]}>{level}</Badge>;
  };

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Programs ({programs.length})</CardTitle>
          <div className="flex items-center gap-2">
            <FileUploadDialog
              entityName="Program"
              fields={[
                { name: "Name", required: true },
                { name: "Code", required: true },
                { name: "DepartmentCode", required: true },
                { name: "Level", required: false },
                { name: "Duration", required: false },
                { name: "TotalCredits", required: false },
              ]}
              onImport={handleCsvImport}
            />
            <Button onClick={openCreate} size="sm" disabled={departments.length === 0}>
              <Plus className="h-4 w-4 mr-2" /> Add Program
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Code</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Level</TableHead>
                <TableHead className="text-center">Duration</TableHead>
                <TableHead className="text-center">Credits</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {programs.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="font-medium">{p.name}</TableCell>
                  <TableCell>{p.code}</TableCell>
                  <TableCell className="text-muted-foreground">{p.departmentName}</TableCell>
                  <TableCell>{levelBadge(p.level)}</TableCell>
                  <TableCell className="text-center">{p.duration} yrs</TableCell>
                  <TableCell className="text-center">{p.totalCredits}</TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button variant="ghost" size="icon" onClick={() => openEdit(p)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => setDeleteTarget(p)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {programs.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                    No programs yet. Create a department first, then add programs.
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
            <DialogTitle>{editing ? "Edit Program" : "Create Program"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Department</Label>
              <Select value={form.departmentId} onValueChange={(v) => setForm({ ...form, departmentId: v })}>
                <SelectTrigger><SelectValue placeholder="Select department" /></SelectTrigger>
                <SelectContent>
                  {departments.map((d) => (
                    <SelectItem key={d.id} value={d.id}>{d.name} ({d.facultyName})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="prog-name">Program Name</Label>
              <Input id="prog-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. BSc Computer Science" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="prog-code">Code</Label>
              <Input id="prog-code" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} placeholder="e.g. BSC-CS" />
            </div>
            <div className="space-y-2">
              <Label>Level</Label>
              <Select value={form.level} onValueChange={(v) => setForm({ ...form, level: v as Program["level"] })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {levelOptions.map((o) => (
                    <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="prog-dur">Duration (years)</Label>
                <Input id="prog-dur" type="number" min={1} max={10} value={form.duration} onChange={(e) => setForm({ ...form, duration: parseInt(e.target.value) || 1 })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="prog-credits">Total Credits</Label>
                <Input id="prog-credits" type="number" min={1} value={form.totalCredits} onChange={(e) => setForm({ ...form, totalCredits: parseInt(e.target.value) || 0 })} />
              </div>
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
            <AlertDialogTitle>Delete Program</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete "{deleteTarget?.name}". This action cannot be undone.
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
