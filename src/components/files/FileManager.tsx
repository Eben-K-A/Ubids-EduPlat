import { useState, useRef } from "react";
import { useFiles, useUploadFile, useDeleteFile } from "@/hooks/useApi";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table";
import {
    FileText,
    Upload,
    Trash2,
    Download,
    File,
    FileImage,
    FileCode,
    FileArchive,
    Loader2
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { formatDistanceToNow } from "date-fns";

interface FileManagerProps {
    courseId?: string;
    title?: string;
    description?: string;
}

export function FileManager({ courseId, title = "Course Materials", description = "Manage files and resources for this course." }: FileManagerProps) {
    const { user } = useAuth();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isUploading, setIsUploading] = useState(false);

    const { data: files = [], isLoading } = useFiles(courseId);
    const { mutate: uploadFile } = useUploadFile();
    const { mutate: deleteFile } = useDeleteFile();

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsUploading(true);
        uploadFile(
            { file, courseId },
            {
                onSuccess: () => {
                    toast.success("File uploaded successfully");
                    setIsUploading(false);
                    if (fileInputRef.current) fileInputRef.current.value = "";
                },
                onError: () => {
                    toast.error("Failed to upload file");
                    setIsUploading(false);
                },
            }
        );
    };

    const handleDelete = (id: string) => {
        if (confirm("Are you sure you want to delete this file?")) {
            deleteFile(id, {
                onSuccess: () => toast.success("File deleted"),
                onError: () => toast.error("Failed to delete file"),
            });
        }
    };

    const getFileIcon = (mimetype: string) => {
        if (mimetype.startsWith("image/")) return <FileImage className="h-4 w-4 text-purple-500" />;
        if (mimetype.includes("pdf")) return <FileText className="h-4 w-4 text-red-500" />;
        if (mimetype.includes("zip") || mimetype.includes("rar")) return <FileArchive className="h-4 w-4 text-yellow-500" />;
        if (mimetype.includes("code") || mimetype.includes("javascript") || mimetype.includes("html")) return <FileCode className="h-4 w-4 text-blue-500" />;
        return <File className="h-4 w-4 text-gray-500" />;
    };

    const formatFileSize = (bytes: number) => {
        if (bytes === 0) return "0 B";
        const k = 1024;
        const sizes = ["B", "KB", "MB", "GB", "TB"];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
    };

    const handleDownload = (path: string, filename: string) => {
        // Create a temporary link to download
        const link = document.createElement('a');
        link.href = `http://localhost:4000/uploads/${path}`; // Use env var in production
        link.download = filename;
        link.target = "_blank";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle>{title}</CardTitle>
                    <CardDescription>{description}</CardDescription>
                </div>
                <div>
                    <input
                        type="file"
                        ref={fileInputRef}
                        className="hidden"
                        onChange={handleFileChange}
                    />
                    <Button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isUploading}
                    >
                        {isUploading ? (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                            <Upload className="h-4 w-4 mr-2" />
                        )}
                        Upload File
                    </Button>
                </div>
            </CardHeader>
            <CardContent>
                {isLoading ? (
                    <div className="flex justify-center py-8">
                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                ) : files.length === 0 ? (
                    <div className="text-center py-10 text-muted-foreground border-2 border-dashed rounded-lg">
                        <File className="h-10 w-10 mx-auto mb-2 opacity-20" />
                        <p>No files uploaded yet.</p>
                    </div>
                ) : (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Name</TableHead>
                                <TableHead>Size</TableHead>
                                <TableHead>Uploaded By</TableHead>
                                <TableHead>Date</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {files.map((file: any) => (
                                <TableRow key={file.id}>
                                    <TableCell className="font-medium flex items-center gap-2">
                                        {getFileIcon(file.mimetype)}
                                        {file.filename}
                                    </TableCell>
                                    <TableCell>{formatFileSize(file.size)}</TableCell>
                                    <TableCell>{file.uploaderName}</TableCell>
                                    <TableCell title={format(new Date(file.createdAt), "PPpp")}>
                                        {formatDistanceToNow(new Date(file.createdAt), { addSuffix: true })}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-2">
                                            <Button variant="ghost" size="icon" onClick={() => handleDownload(file.path, file.filename)}>
                                                <Download className="h-4 w-4" />
                                            </Button>
                                            {(user?.id === file.uploadedBy || user?.role === 'admin') && (
                                                <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDelete(file.id)}>
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            )}
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                )}
            </CardContent>
        </Card>
    );
}
