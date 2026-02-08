import { useState } from "react";
import { useAcademic } from "@/contexts/AcademicContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Plus, Pencil, Trash2, Building2, FolderTree } from "lucide-react";
import { toast } from "sonner";
import { FileUploadDialog } from "./FileUploadDialog";
import type { Faculty } from "@/types/academic";

export function FacultyTab() {
  const { faculties, createFaculty, updateFaculty, deleteFaculty } = useAcademic();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Faculty | null>(null);
  const [editing, setEditing] = useState<Faculty | null>(null);
  const [form, setForm] = useState({ name: "", code: "", dean: "" });

  const openCreate = () => {
    setEditing(null);
    setForm({ name: "", code: "", dean: "" });
    setDialogOpen(true);
  };

  const openEdit = (f: Faculty) => {
    setEditing(f);
    setForm({ name: f.name, code: f.code, dean: f.dean });
    setDialogOpen(true);
  };

  const handleSave = () => {
    if (!form.name.trim() || !form.code.trim()) {
      toast.error("Name and code are required");
      return;
    }
    if (editing) {
      updateFaculty(editing.id, form);
      toast.success("Faculty updated");
    } else {
      createFaculty(form);
      toast.success("Faculty created");
    }
    setDialogOpen(false);
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    deleteFaculty(deleteTarget.id);
    toast.success("Faculty deleted");
    setDeleteTarget(null);
  };

  const handleCsvImport = (rows: Record<string, string>[]) => {
    rows.forEach((row) => {
      const name = row.name || row.facultyname || "";
      const code = row.code || row.facultycode || "";
      const dean = row.dean || "";
      if (name && code) {
        createFaculty({ name, code, dean });
      }
    });
  };

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Faculties ({faculties.length})</CardTitle>
          <div className="flex items-center gap-2">
            <FileUploadDialog
              entityName="Faculty"
              fields={[
                { name: "Name", required: true },
                { name: "Code", required: true },
                { name: "Dean", required: false },
              ]}
              onImport={handleCsvImport}
            />
            <Button onClick={openCreate} size="sm">
              <Plus className="h-4 w-4 mr-2" /> Add Faculty
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Code</TableHead>
                <TableHead>Dean</TableHead>
                <TableHead className="text-center">
                  <Building2 className="h-4 w-4 inline mr-1" />Depts
                </TableHead>
                <TableHead className="text-center">
                  <FolderTree className="h-4 w-4 inline mr-1" />Programs
                </TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {faculties.map((f) => (
                <TableRow key={f.id}>
                  <TableCell className="font-medium">{f.name}</TableCell>
                  <TableCell>{f.code}</TableCell>
                  <TableCell>{f.dean}</TableCell>
                  <TableCell className="text-center">{f.departments.length}</TableCell>
                  <TableCell className="text-center">
                    {f.departments.reduce((sum, d) => sum + d.programs.length, 0)}
                  </TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button variant="ghost" size="icon" onClick={() => openEdit(f)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => setDeleteTarget(f)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {faculties.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                    No faculties yet. Click "Add Faculty" or upload a CSV.
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
            <DialogTitle>{editing ? "Edit Faculty" : "Create Faculty"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="fac-name">Faculty Name</Label>
              <Input id="fac-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Faculty of Computing" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="fac-code">Code</Label>
              <Input id="fac-code" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} placeholder="e.g. FCIT" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="fac-dean">Dean</Label>
              <Input id="fac-dean" value={form.dean} onChange={(e) => setForm({ ...form, dean: e.target.value })} placeholder="e.g. Prof. James Okonkwo" />
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
            <AlertDialogTitle>Delete Faculty</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete "{deleteTarget?.name}" and all its departments and programs. This action cannot be undone.
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
