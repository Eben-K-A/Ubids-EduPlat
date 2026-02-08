import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Upload, FileSpreadsheet, AlertCircle, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

interface CsvField {
  name: string;
  required: boolean;
}

interface CsvUploadDialogProps {
  entityName: string; // e.g. "Faculty", "Department"
  fields: CsvField[];
  onImport: (rows: Record<string, string>[]) => void;
  trigger?: React.ReactNode;
}

function parseCsv(text: string): Record<string, string>[] {
  const lines = text.trim().split("\n").map((l) => l.trim()).filter(Boolean);
  if (lines.length < 2) return [];
  const headers = lines[0].split(",").map((h) => h.trim().toLowerCase().replace(/\s+/g, ""));
  return lines.slice(1).map((line) => {
    const values = line.split(",").map((v) => v.trim());
    const row: Record<string, string> = {};
    headers.forEach((h, i) => {
      row[h] = values[i] || "";
    });
    return row;
  });
}

export function CsvUploadDialog({ entityName, fields, onImport, trigger }: CsvUploadDialogProps) {
  const [open, setOpen] = useState(false);
  const [preview, setPreview] = useState<Record<string, string>[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    setPreview(null);

    if (!file.name.endsWith(".csv")) {
      setError("Please upload a CSV file.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const text = evt.target?.result as string;
        const rows = parseCsv(text);
        if (rows.length === 0) {
          setError("CSV is empty or has no data rows.");
          return;
        }
        // Validate required fields
        const missingFields = fields
          .filter((f) => f.required)
          .filter((f) => !Object.keys(rows[0]).includes(f.name.toLowerCase().replace(/\s+/g, "")));
        if (missingFields.length > 0) {
          setError(`Missing required columns: ${missingFields.map((f) => f.name).join(", ")}`);
          return;
        }
        setPreview(rows);
      } catch {
        setError("Failed to parse CSV file.");
      }
    };
    reader.readAsText(file);
  };

  const handleImport = () => {
    if (!preview) return;
    onImport(preview);
    toast.success(`${preview.length} ${entityName.toLowerCase()}(s) imported`);
    setOpen(false);
    setPreview(null);
    setError(null);
    if (fileRef.current) fileRef.current.value = "";
  };

  const csvTemplate = fields.map((f) => f.name).join(",");

  return (
    <>
      {trigger ? (
        <div onClick={() => setOpen(true)}>{trigger}</div>
      ) : (
        <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
          <Upload className="h-4 w-4 mr-2" /> Upload CSV
        </Button>
      )}

      <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) { setPreview(null); setError(null); } }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Import {entityName}s from CSV</DialogTitle>
            <DialogDescription>
              Upload a CSV file to bulk-import {entityName.toLowerCase()}s. The file should have the following columns.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Template */}
            <div className="p-3 rounded-lg bg-muted/50 border">
              <p className="text-xs font-medium text-muted-foreground mb-1">Required CSV format:</p>
              <code className="text-xs break-all">{csvTemplate}</code>
              <div className="mt-2 flex flex-wrap gap-1">
                {fields.map((f) => (
                  <span key={f.name} className={`text-[10px] px-1.5 py-0.5 rounded ${f.required ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>
                    {f.name}{f.required ? " *" : ""}
                  </span>
                ))}
              </div>
            </div>

            {/* File input */}
            <div className="flex items-center gap-3">
              <FileSpreadsheet className="h-8 w-8 text-muted-foreground flex-shrink-0" />
              <input
                ref={fileRef}
                type="file"
                accept=".csv"
                onChange={handleFile}
                className="flex-1 text-sm file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-primary file:text-primary-foreground hover:file:bg-primary/90 cursor-pointer"
              />
            </div>

            {/* Error */}
            {error && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                {error}
              </div>
            )}

            {/* Preview */}
            {preview && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-success">
                  <CheckCircle2 className="h-4 w-4" />
                  {preview.length} row(s) ready to import
                </div>
                <div className="max-h-40 overflow-auto border rounded-lg">
                  <table className="w-full text-xs">
                    <thead className="bg-muted sticky top-0">
                      <tr>
                        {Object.keys(preview[0]).map((key) => (
                          <th key={key} className="px-2 py-1.5 text-left font-medium">{key}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {preview.slice(0, 5).map((row, i) => (
                        <tr key={i} className="border-t">
                          {Object.values(row).map((val, j) => (
                            <td key={j} className="px-2 py-1 truncate max-w-[150px]">{val}</td>
                          ))}
                        </tr>
                      ))}
                      {preview.length > 5 && (
                        <tr className="border-t">
                          <td colSpan={Object.keys(preview[0]).length} className="px-2 py-1 text-center text-muted-foreground">
                            ... and {preview.length - 5} more rows
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={handleImport} disabled={!preview}>
              Import {preview ? `${preview.length} ${entityName}(s)` : entityName + "s"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
