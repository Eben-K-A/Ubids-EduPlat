import { useState, useRef } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useAuth } from "@/contexts/AuthContext";
import { useFiles, useUploadFile, useDeleteFile } from "@/hooks/useApi";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Progress } from "@/components/ui/progress";
import {
  Search,
  Upload,
  FolderOpen,
  FileText,
  Image,
  Video,
  File,
  MoreVertical,
  Download,
  Trash2,
  Share2,
  Eye,
  Loader2,
  List,
  Grid3X3,
  Clock,
  FileArchive,
  FileCode,
} from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import { CourseFile } from "@/types";

export default function FileManagement() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("list");
  const [uploadOpen, setUploadOpen] = useState(false);
  const [selectedCourseId, setSelectedCourseId] = useState<string | "all">("all");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: files = [], isLoading } = useFiles(selectedCourseId === "all" ? undefined : selectedCourseId);
  const { mutate: uploadFile, isPending: isUploading } = useUploadFile();
  const { mutate: deleteFile } = useDeleteFile();

  const isLecturer = user?.role === "lecturer" || user?.role === "admin";

  const handleUpload = () => {
    const file = fileInputRef.current?.files?.[0];
    if (!file) return;

    uploadFile({
      file,
      courseId: selectedCourseId === "all" ? undefined : selectedCourseId
    }, {
      onSuccess: () => {
        toast.success("File uploaded successfully");
        setUploadOpen(false);
        if (fileInputRef.current) fileInputRef.current.value = "";
      },
      onError: () => toast.error("Failed to upload file")
    });
  };

  const handleDelete = (fileId: string) => {
    if (confirm("Are you sure you want to delete this file?")) {
      deleteFile(fileId, {
        onSuccess: () => toast.success("File deleted"),
        onError: () => toast.error("Failed to delete file")
      });
    }
  };

  const filteredFiles = files.filter((file: CourseFile) =>
    file.filename.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalStorage = files.reduce((sum: number, f: CourseFile) => sum + f.size, 0);
  const maxStorage = 1024 * 1024 * 1024; // 1GB limit (mock)
  const storagePercent = (totalStorage / maxStorage) * 100;

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const getFileIcon = (mimetype: string) => {
    if (mimetype.startsWith("image/")) return <Image className="h-5 w-5 text-purple-500" />;
    if (mimetype.includes("pdf")) return <FileText className="h-5 w-5 text-red-500" />;
    if (mimetype.includes("video")) return <Video className="h-5 w-5 text-blue-500" />;
    if (mimetype.includes("zip") || mimetype.includes("rar")) return <FileArchive className="h-5 w-5 text-yellow-500" />;
    if (mimetype.includes("code") || mimetype.includes("javascript") || mimetype.includes("html")) return <FileCode className="h-5 w-5 text-green-500" />;
    return <File className="h-5 w-5 text-gray-500" />;
  };

  const handleDownload = (path: string, filename: string) => {
    const link = document.createElement('a');
    link.href = `http://localhost:4000/uploads/${path}`;
    link.download = filename;
    link.target = "_blank";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">File Management</h1>
            <p className="text-muted-foreground">
              Upload, organize, and share course materials
            </p>
          </div>
          <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
            <DialogTrigger asChild>
              <Button>
                <Upload className="h-4 w-4 mr-2" />
                Upload File
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Upload File</DialogTitle>
                <DialogDescription>
                  Upload a file to your personal storage or a specific course.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div
                  className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 transition-colors"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files?.[0]) handleUpload();
                    }}
                  />
                  {isUploading ? (
                    <Loader2 className="h-10 w-10 mx-auto animate-spin text-primary mb-3" />
                  ) : (
                    <Upload className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
                  )}
                  <p className="font-medium">
                    {isUploading ? "Uploading..." : "Click to select file"}
                  </p>
                </div>

                {isLecturer && (
                  <div className="space-y-2">
                    <Label>Course (Optional)</Label>
                    <Select
                      value={selectedCourseId}
                      onValueChange={setSelectedCourseId}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a course" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">General / Personal</SelectItem>
                        {/* Ideally fetch courses here, but for now we simplify */}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Storage Overview */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-primary/10">
                <FolderOpen className="h-6 w-6 text-primary" />
              </div>
              <div className="flex-1">
                <div className="flex justify-between text-sm mb-1">
                  <span className="font-medium">Storage Used</span>
                  <span className="text-muted-foreground">
                    {formatFileSize(totalStorage)} / {formatFileSize(maxStorage)}
                  </span>
                </div>
                <Progress value={storagePercent} className="h-2" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Filters & Search */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search files..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="flex border rounded-md">
            <Button
              variant={viewMode === "list" ? "secondary" : "ghost"}
              size="icon"
              className="h-9 w-9 rounded-r-none"
              onClick={() => setViewMode("list")}
            >
              <List className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === "grid" ? "secondary" : "ghost"}
              size="icon"
              className="h-9 w-9 rounded-l-none"
              onClick={() => setViewMode("grid")}
            >
              <Grid3X3 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* File List */}
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : filteredFiles.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <FolderOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="font-semibold mb-1">No files found</h3>
              <p className="text-sm text-muted-foreground">
                Upload your first file to get started
              </p>
            </CardContent>
          </Card>
        ) : viewMode === "list" ? (
          <Card>
            <CardContent className="p-0">
              <div className="divide-y">
                {filteredFiles.map((file: CourseFile) => (
                  <div key={file.id} className="flex items-center gap-4 p-4 hover:bg-muted/50 transition-colors">
                    <div className="p-2 rounded-lg bg-muted">{getFileIcon(file.mimetype)}</div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{file.filename}</p>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                        <span>{formatFileSize(file.size)}</span>
                        {file.courseId && (
                          <Badge variant="outline" className="text-xs h-5">
                            Course Related
                          </Badge>
                        )}
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatDistanceToNow(new Date(file.createdAt), { addSuffix: true })}
                        </span>
                        <span>by {file.uploaderName}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleDownload(file.path, file.filename)}>
                            <Download className="h-4 w-4 mr-2" />
                            Download
                          </DropdownMenuItem>
                          {(user?.id === file.uploadedBy || user?.role === 'admin') && (
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => handleDelete(file.id)}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {filteredFiles.map((file: CourseFile) => (
              <Card key={file.id} className="hover:shadow-md transition-shadow cursor-pointer group">
                <CardContent className="pt-6">
                  <div className="flex flex-col items-center text-center">
                    <div className="p-4 rounded-xl bg-muted mb-3 group-hover:bg-primary/10 transition-colors">
                      {getFileIcon(file.mimetype)}
                    </div>
                    <p className="font-medium text-sm truncate w-full" title={file.filename}>{file.filename}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatFileSize(file.size)}
                    </p>
                    <div className="flex items-center gap-2 mt-3">
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleDownload(file.path, file.filename)}>
                        <Download className="h-3.5 w-3.5" />
                      </Button>
                      {(user?.id === file.uploadedBy || user?.role === 'admin') && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-destructive"
                          onClick={() => handleDelete(file.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

