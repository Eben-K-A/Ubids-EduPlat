import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Upload, FileSpreadsheet, AlertCircle, CheckCircle2, Download, FileText, FileType } from "lucide-react";
import { toast } from "sonner";

interface FieldDef {
  name: string;
  required: boolean;
}

interface FileUploadDialogProps {
  entityName: string;
  fields: FieldDef[];
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

// Simple tab-delimited parser for Word docs (text content extracted)
function parseTabOrLineDelimited(text: string, fields: FieldDef[]): Record<string, string>[] {
  const lines = text.trim().split("\n").map((l) => l.trim()).filter(Boolean);
  if (lines.length < 2) return [];

  // Try to detect if first line is headers
  const firstLine = lines[0].toLowerCase().replace(/\s+/g, "");
  const fieldNames = fields.map((f) => f.name.toLowerCase().replace(/\s+/g, ""));
  const hasHeaders = fieldNames.some((fn) => firstLine.includes(fn));

  let headers: string[];
  let dataLines: string[];

  if (hasHeaders) {
    headers = lines[0].split(/\t|,/).map((h) => h.trim().toLowerCase().replace(/\s+/g, ""));
    dataLines = lines.slice(1);
  } else {
    headers = fieldNames;
    dataLines = lines;
  }

  return dataLines.map((line) => {
    const values = line.split(/\t|,/).map((v) => v.trim());
    const row: Record<string, string> = {};
    headers.forEach((h, i) => {
      row[h] = values[i] || "";
    });
    return row;
  });
}

function generateCsvTemplate(fields: FieldDef[]): string {
  const headers = fields.map((f) => f.name).join(",");
  const sample = fields.map((f) => {
    if (f.name.toLowerCase().includes("name")) return "Sample Name";
    if (f.name.toLowerCase().includes("code")) return "SAMPLE";
    if (f.name.toLowerCase().includes("dean") || f.name.toLowerCase().includes("head")) return "Dr. John Doe";
    if (f.name.toLowerCase().includes("level")) return "undergraduate";
    if (f.name.toLowerCase().includes("duration")) return "4";
    if (f.name.toLowerCase().includes("credit")) return "160";
    if (f.name.toLowerCase().includes("status")) return "draft";
    if (f.name.toLowerCase().includes("enrollment")) return "60";
    if (f.name.toLowerCase().includes("title")) return "Sample Title";
    if (f.name.toLowerCase().includes("description")) return "A description";
    if (f.name.toLowerCase().includes("faculty")) return "FCIT";
    if (f.name.toLowerCase().includes("department")) return "CS";
    return "value";
  }).join(",");
  return `${headers}\n${sample}`;
}

function downloadTemplate(fields: FieldDef[], entityName: string, format: "csv" | "txt") {
  const content = generateCsvTemplate(fields);
  const ext = format === "csv" ? "csv" : "txt";
  const mimeType = format === "csv" ? "text/csv" : "text/plain";
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${entityName.toLowerCase()}_template.${ext}`;
  a.click();
  URL.revokeObjectURL(url);
}

export function FileUploadDialog({ entityName, fields, onImport, trigger }: FileUploadDialogProps) {
  const [open, setOpen] = useState(false);
  const [preview, setPreview] = useState<Record<string, string>[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string>("");
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    setPreview(null);
    setFileName(file.name);

    const ext = file.name.split(".").pop()?.toLowerCase();
    const supportedExts = ["csv", "xlsx", "xls", "doc", "docx", "txt"];

    if (!ext || !supportedExts.includes(ext)) {
      setError(`Unsupported file type ".${ext}". Supported: CSV, Excel (.xlsx/.xls), Word (.doc/.docx), Text (.txt)`);
      return;
    }

    if (ext === "xlsx" || ext === "xls") {
      // Parse Excel files using basic approach
      const reader = new FileReader();
      reader.onload = (evt) => {
        try {
          const data = evt.target?.result as ArrayBuffer;
          const rows = parseExcelBasic(new Uint8Array(data), fields);
          if (rows.length === 0) {
            setError("File is empty or has no valid data rows. Please ensure the file follows the template format.");
            return;
          }
          validateAndSetPreview(rows);
        } catch {
          setError("Failed to parse Excel file. Please ensure it follows the template format with data in the first sheet.");
        }
      };
      reader.readAsArrayBuffer(file);
    } else {
      // CSV, TXT, DOC/DOCX as text
      const reader = new FileReader();
      reader.onload = (evt) => {
        try {
          const text = evt.target?.result as string;
          let rows: Record<string, string>[];

          if (ext === "csv") {
            rows = parseCsv(text);
          } else {
            rows = parseTabOrLineDelimited(text, fields);
          }

          if (rows.length === 0) {
            setError("File is empty or has no data rows.");
            return;
          }
          validateAndSetPreview(rows);
        } catch {
          setError("Failed to parse file.");
        }
      };
      reader.readAsText(file);
    }
  };

  // Simple Excel XML/CSV extraction from xlsx (zip-based)
  function parseExcelBasic(data: Uint8Array, fieldDefs: FieldDef[]): Record<string, string>[] {
    // Try to read as text first (some .xls are actually CSV/TSV)
    try {
      const text = new TextDecoder("utf-8", { fatal: true }).decode(data);
      // If it looks like CSV/TSV
      if (text.includes(",") || text.includes("\t")) {
        const rows = parseCsv(text);
        if (rows.length > 0) return rows;
        return parseTabOrLineDelimited(text, fieldDefs);
      }
    } catch {
      // Not valid UTF-8 text, likely binary Excel
    }

    // For actual binary xlsx/xls files, provide a helpful error
    setError(
      "Binary Excel files require conversion. Please save your Excel file as CSV (File → Save As → CSV) and upload the CSV version, or use the CSV/Text template."
    );
    return [];
  }

  const validateAndSetPreview = (rows: Record<string, string>[]) => {
    const missingFields = fields
      .filter((f) => f.required)
      .filter((f) => !Object.keys(rows[0]).includes(f.name.toLowerCase().replace(/\s+/g, "")));
    if (missingFields.length > 0) {
      setError(`Missing required columns: ${missingFields.map((f) => f.name).join(", ")}`);
      return;
    }
    setPreview(rows);
  };

  const handleImport = () => {
    if (!preview) return;
    onImport(preview);
    toast.success(`${preview.length} ${entityName.toLowerCase()}(s) imported`);
    setOpen(false);
    setPreview(null);
    setError(null);
    setFileName("");
    if (fileRef.current) fileRef.current.value = "";
  };

  return (
    <>
      {trigger ? (
        <div onClick={() => setOpen(true)}>{trigger}</div>
      ) : (
        <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
          <Upload className="h-4 w-4 mr-2" /> Upload {entityName}s
        </Button>
      )}

      <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) { setPreview(null); setError(null); setFileName(""); } }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Import {entityName}s</DialogTitle>
            <DialogDescription>
              Upload a file to bulk-import {entityName.toLowerCase()}s. Supported formats: CSV, Excel, Word, Text.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Template downloads */}
            <div className="p-3 rounded-lg bg-muted/50 border">
              <p className="text-xs font-medium text-muted-foreground mb-2">Download template:</p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs"
                  onClick={() => downloadTemplate(fields, entityName, "csv")}
                >
                  <FileSpreadsheet className="h-3.5 w-3.5 mr-1.5" />
                  CSV Template
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs"
                  onClick={() => downloadTemplate(fields, entityName, "txt")}
                >
                  <FileText className="h-3.5 w-3.5 mr-1.5" />
                  Text Template
                </Button>
              </div>
              <div className="mt-2 flex flex-wrap gap-1">
                {fields.map((f) => (
                  <span key={f.name} className={`text-[10px] px-1.5 py-0.5 rounded ${f.required ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>
                    {f.name}{f.required ? " *" : ""}
                  </span>
                ))}
              </div>
            </div>

            {/* Supported formats */}
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <FileType className="h-3.5 w-3.5" />
              Supported: .csv, .xlsx, .xls, .doc, .docx, .txt
            </div>

            {/* File input */}
            <div className="flex items-center gap-3">
              <FileSpreadsheet className="h-8 w-8 text-muted-foreground flex-shrink-0" />
              <input
                ref={fileRef}
                type="file"
                accept=".csv,.xlsx,.xls,.doc,.docx,.txt"
                onChange={handleFile}
                className="flex-1 text-sm file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-primary file:text-primary-foreground hover:file:bg-primary/90 cursor-pointer"
              />
            </div>

            {/* Error */}
            {error && (
              <div className="flex items-start gap-2 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
                <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {/* Preview */}
            {preview && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-success">
                  <CheckCircle2 className="h-4 w-4" />
                  {preview.length} row(s) ready to import from "{fileName}"
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
