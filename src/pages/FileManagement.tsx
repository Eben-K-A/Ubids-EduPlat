import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  Plus,
  HardDrive,
  Clock,
  Grid3X3,
  List,
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

interface FileItem {
  id: string;
  name: string;
  type: "pdf" | "image" | "video" | "document" | "other";
  size: number;
  courseId?: string;
  courseName?: string;
  uploadedBy: string;
  uploadedAt: Date;
  shared: boolean;
  folder: string;
}

const mockFiles: FileItem[] = [
  {
    id: "f1",
    name: "CS101_Lecture_Notes_Week1.pdf",
    type: "pdf",
    size: 2400000,
    courseId: "course-1",
    courseName: "CS101",
    uploadedBy: "Prof. John Lecturer",
    uploadedAt: new Date("2024-02-01"),
    shared: true,
    folder: "Course Materials",
  },
  {
    id: "f2",
    name: "Assignment1_Solution.pdf",
    type: "pdf",
    size: 850000,
    courseId: "course-1",
    courseName: "CS101",
    uploadedBy: "Jane Doe",
    uploadedAt: new Date("2024-02-15"),
    shared: false,
    folder: "Submissions",
  },
  {
    id: "f3",
    name: "Database_ER_Diagram.png",
    type: "image",
    size: 1200000,
    courseId: "course-3",
    courseName: "DB301",
    uploadedBy: "Dr. Jane Smith",
    uploadedAt: new Date("2024-01-25"),
    shared: true,
    folder: "Course Materials",
  },
  {
    id: "f4",
    name: "Web_Dev_Tutorial.mp4",
    type: "video",
    size: 45000000,
    courseId: "course-2",
    courseName: "WEB201",
    uploadedBy: "Prof. John Lecturer",
    uploadedAt: new Date("2024-02-10"),
    shared: true,
    folder: "Course Materials",
  },
  {
    id: "f5",
    name: "Project_Proposal.docx",
    type: "document",
    size: 350000,
    courseId: "course-1",
    courseName: "CS101",
    uploadedBy: "Jane Doe",
    uploadedAt: new Date("2024-02-20"),
    shared: false,
    folder: "My Files",
  },
  {
    id: "f6",
    name: "Research_Paper_Draft.pdf",
    type: "pdf",
    size: 1800000,
    uploadedBy: "Jane Doe",
    uploadedAt: new Date("2024-02-22"),
    shared: false,
    folder: "My Files",
  },
];

const formatFileSize = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
};

const getFileIcon = (type: string) => {
  switch (type) {
    case "pdf":
      return <FileText className="h-5 w-5 text-destructive" />;
    case "image":
      return <Image className="h-5 w-5 text-accent" />;
    case "video":
      return <Video className="h-5 w-5 text-primary" />;
    case "document":
      return <FileText className="h-5 w-5 text-primary" />;
    default:
      return <File className="h-5 w-5 text-muted-foreground" />;
  }
};

export default function FileManagement() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("list");
  const [uploadOpen, setUploadOpen] = useState(false);
  const [selectedFolder, setSelectedFolder] = useState("all");
  const [files, setFiles] = useState<FileItem[]>(mockFiles);

  const isLecturer = user?.role === "lecturer" || user?.role === "admin";

  const folders = ["all", "Course Materials", "Submissions", "My Files"];

  const filteredFiles = files.filter((file) => {
    const matchesSearch = file.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFolder = selectedFolder === "all" || file.folder === selectedFolder;
    return matchesSearch && matchesFolder;
  });

  const totalStorage = files.reduce((sum, f) => sum + f.size, 0);
  const maxStorage = 1024 * 1024 * 1024; // 1GB mock limit
  const storagePercent = (totalStorage / maxStorage) * 100;

  const handleUpload = () => {
    const newFile: FileItem = {
      id: `f-${Date.now()}`,
      name: "New_Upload.pdf",
      type: "pdf",
      size: 500000,
      uploadedBy: `${user?.firstName} ${user?.lastName}`,
      uploadedAt: new Date(),
      shared: false,
      folder: "My Files",
    };
    setFiles((prev) => [newFile, ...prev]);
    toast.success("File uploaded successfully! (Mock)");
    setUploadOpen(false);
  };

  const handleDelete = (fileId: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== fileId));
    toast.success("File deleted");
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
                  Upload a file to your course materials or personal storage
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 transition-colors">
                  <Upload className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
                  <p className="font-medium">Drop files here or click to browse</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    PDF, DOCX, PPTX, Images, Videos (max 50MB)
                  </p>
                </div>
                <div className="space-y-2">
                  <Label>Folder</Label>
                  <Select defaultValue="My Files">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="My Files">My Files</SelectItem>
                      <SelectItem value="Course Materials">Course Materials</SelectItem>
                      <SelectItem value="Submissions">Submissions</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {isLecturer && (
                  <div className="space-y-2">
                    <Label>Course (Optional)</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a course" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="course-1">CS101</SelectItem>
                        <SelectItem value="course-2">WEB201</SelectItem>
                        <SelectItem value="course-3">DB301</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setUploadOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleUpload}>Upload</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Storage Overview */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-primary/10">
                <HardDrive className="h-6 w-6 text-primary" />
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
          <div className="flex gap-2">
            <Tabs value={selectedFolder} onValueChange={setSelectedFolder}>
              <TabsList>
                {folders.map((folder) => (
                  <TabsTrigger key={folder} value={folder} className="text-xs">
                    {folder === "all" ? "All" : folder}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
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
        </div>

        {/* File List / Grid */}
        {filteredFiles.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <FolderOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="font-semibold mb-1">No files found</h3>
              <p className="text-sm text-muted-foreground">
                {searchQuery ? "Try a different search" : "Upload your first file to get started"}
              </p>
            </CardContent>
          </Card>
        ) : viewMode === "list" ? (
          <Card>
            <CardContent className="p-0">
              <div className="divide-y">
                {filteredFiles.map((file) => (
                  <div key={file.id} className="flex items-center gap-4 p-4 hover:bg-muted/50 transition-colors">
                    <div className="p-2 rounded-lg bg-muted">{getFileIcon(file.type)}</div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{file.name}</p>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                        <span>{formatFileSize(file.size)}</span>
                        {file.courseName && (
                          <Badge variant="outline" className="text-xs h-5">
                            {file.courseName}
                          </Badge>
                        )}
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {format(file.uploadedAt, "MMM d, yyyy")}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {file.shared && (
                        <Badge variant="secondary" className="text-xs">
                          Shared
                        </Badge>
                      )}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>
                            <Eye className="h-4 w-4 mr-2" />
                            Preview
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Download className="h-4 w-4 mr-2" />
                            Download
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Share2 className="h-4 w-4 mr-2" />
                            Share
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => handleDelete(file.id)}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
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
            {filteredFiles.map((file) => (
              <Card key={file.id} className="hover:shadow-md transition-shadow cursor-pointer group">
                <CardContent className="pt-6">
                  <div className="flex flex-col items-center text-center">
                    <div className="p-4 rounded-xl bg-muted mb-3 group-hover:bg-primary/10 transition-colors">
                      {getFileIcon(file.type)}
                    </div>
                    <p className="font-medium text-sm truncate w-full">{file.name}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatFileSize(file.size)}
                    </p>
                    <div className="flex items-center gap-2 mt-3">
                      <Button variant="ghost" size="icon" className="h-7 w-7">
                        <Download className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7">
                        <Share2 className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-destructive"
                        onClick={() => handleDelete(file.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
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
