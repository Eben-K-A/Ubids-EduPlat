import { useState } from "react";
import { useClassroom } from "@/contexts/ClassroomContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import { Plus, FileText, Link2, Video, File, MoreVertical, Trash2, ExternalLink, FolderOpen } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";

interface MaterialsListProps {
  courseId: string;
  isOwner: boolean;
}

export function MaterialsList({ courseId, isOwner }: MaterialsListProps) {
  const { getMaterialsByCourse, getTopicsByCourse, addMaterial, deleteMaterial } = useClassroom();
  const { toast } = useToast();
  const [addOpen, setAddOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [url, setUrl] = useState("");
  const [type, setType] = useState<"link" | "file" | "video" | "document">("link");
  const [topicId, setTopicId] = useState<string>("");

  const materials = getMaterialsByCourse(courseId);
  const topics = getTopicsByCourse(courseId);

  const handleAdd = async () => {
    if (!title.trim() || !url.trim()) return;
    try {
      await addMaterial({
        courseId,
        topicId: topicId || undefined,
        title: title.trim(),
        description: description.trim() || undefined,
        type,
        url: url.trim(),
      });
      toast({ title: "Material added" });
      setAddOpen(false);
      resetForm();
    } catch {
      toast({ title: "Failed to add material", variant: "destructive" });
    }
  };

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setUrl("");
    setType("link");
    setTopicId("");
  };

  const getTypeIcon = (t: string) => {
    switch (t) {
      case "link": return <Link2 className="h-4 w-4" />;
      case "video": return <Video className="h-4 w-4" />;
      case "document": return <FileText className="h-4 w-4" />;
      default: return <File className="h-4 w-4" />;
    }
  };

  const getTypeBadge = (t: string) => {
    const variants: Record<string, string> = {
      link: "bg-accent/10 text-accent",
      video: "bg-destructive/10 text-destructive",
      document: "bg-primary/10 text-primary",
      file: "bg-warning/10 text-warning",
    };
    return variants[t] || variants.file;
  };

  // Group materials by topic
  const ungrouped = materials.filter((m) => !m.topicId);
  const grouped = topics.map((topic) => ({
    topic,
    items: materials.filter((m) => m.topicId === topic.id),
  })).filter((g) => g.items.length > 0);

  const renderMaterialItem = (mat: typeof materials[0]) => (
    <div key={mat.id} className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors group">
      <div className={`p-2 rounded-md ${getTypeBadge(mat.type)}`}>
        {getTypeIcon(mat.type)}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="font-medium text-sm truncate">{mat.title}</p>
          <Badge variant="outline" className="text-[10px] shrink-0">{mat.type}</Badge>
        </div>
        {mat.description && (
          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{mat.description}</p>
        )}
        <p className="text-[10px] text-muted-foreground mt-1">
          Added by {mat.createdByName} • {format(new Date(mat.createdAt), "MMM d, yyyy")}
        </p>
      </div>
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button variant="ghost" size="icon" className="h-7 w-7" asChild>
          <a href={mat.url} target="_blank" rel="noopener noreferrer">
            <ExternalLink className="h-3 w-3" />
          </a>
        </Button>
        {isOwner && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-7 w-7">
                <MoreVertical className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={() => { deleteMaterial(mat.id); toast({ title: "Material removed" }); }}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </div>
  );

  return (
    <div className="space-y-4">
      {isOwner && (
        <div className="flex justify-end">
          <Dialog open={addOpen} onOpenChange={setAddOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Material
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Class Material</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Title</Label>
                  <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Course Syllabus" />
                </div>
                <div className="space-y-2">
                  <Label>Description (optional)</Label>
                  <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Brief description..." rows={2} />
                </div>
                <div className="space-y-2">
                  <Label>Type</Label>
                  <Select value={type} onValueChange={(v) => setType(v as typeof type)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="link">Link</SelectItem>
                      <SelectItem value="document">Document</SelectItem>
                      <SelectItem value="video">Video</SelectItem>
                      <SelectItem value="file">File</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>URL</Label>
                  <Input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://..." />
                </div>
                {topics.length > 0 && (
                  <div className="space-y-2">
                    <Label>Topic (optional)</Label>
                    <Select value={topicId} onValueChange={setTopicId}>
                      <SelectTrigger><SelectValue placeholder="No topic" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">No topic</SelectItem>
                        {topics.map((t) => (
                          <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                <div className="flex justify-end gap-2">
                  <Button variant="ghost" onClick={() => { setAddOpen(false); resetForm(); }}>Cancel</Button>
                  <Button onClick={handleAdd} disabled={!title.trim() || !url.trim()}>Add</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      )}

      {materials.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <FolderOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No materials yet</p>
            {isOwner && <p className="text-sm text-muted-foreground mt-1">Add resources, links, and documents for your class</p>}
          </CardContent>
        </Card>
      ) : (
        <>
          {grouped.map(({ topic, items }) => (
            <Card key={topic.id}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <FolderOpen className="h-4 w-4 text-primary" />
                  {topic.name}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-1">
                {items.map(renderMaterialItem)}
              </CardContent>
            </Card>
          ))}
          {ungrouped.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">General Materials</CardTitle>
              </CardHeader>
              <CardContent className="space-y-1">
                {ungrouped.map(renderMaterialItem)}
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
