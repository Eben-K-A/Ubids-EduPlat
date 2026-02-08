import { useState } from "react";
import { useClassroom } from "@/contexts/ClassroomContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Plus, X, FolderTree, GripVertical } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface TopicManagerProps {
  courseId: string;
  isOwner: boolean;
}

export function TopicManager({ courseId, isOwner }: TopicManagerProps) {
  const { getTopicsByCourse, createTopic, deleteTopic } = useClassroom();
  const { toast } = useToast();
  const [newTopic, setNewTopic] = useState("");
  const [showInput, setShowInput] = useState(false);

  const topics = getTopicsByCourse(courseId);

  const handleCreate = async () => {
    if (!newTopic.trim()) return;
    try {
      await createTopic(courseId, newTopic.trim());
      setNewTopic("");
      setShowInput(false);
      toast({ title: "Topic created" });
    } catch {
      toast({ title: "Failed to create topic", variant: "destructive" });
    }
  };

  const handleDelete = async (id: string) => {
    await deleteTopic(id);
    toast({ title: "Topic removed" });
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <FolderTree className="h-4 w-4" />
            Topics
          </CardTitle>
          {isOwner && (
            <Button variant="ghost" size="sm" onClick={() => setShowInput(!showInput)}>
              <Plus className="h-3 w-3 mr-1" />
              Add
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {showInput && (
          <div className="flex gap-2">
            <Input
              placeholder="Topic name..."
              value={newTopic}
              onChange={(e) => setNewTopic(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCreate()}
              autoFocus
              className="h-8 text-sm"
            />
            <Button size="sm" className="h-8" onClick={handleCreate} disabled={!newTopic.trim()}>
              Add
            </Button>
            <Button variant="ghost" size="sm" className="h-8" onClick={() => { setShowInput(false); setNewTopic(""); }}>
              <X className="h-3 w-3" />
            </Button>
          </div>
        )}
        {topics.length === 0 ? (
          <p className="text-xs text-muted-foreground py-2">
            {isOwner ? "Create topics to organize your classwork" : "No topics yet"}
          </p>
        ) : (
          topics.map((topic) => (
            <div key={topic.id} className="flex items-center justify-between px-2 py-1.5 rounded-md hover:bg-muted/50 group">
              <div className="flex items-center gap-2">
                <GripVertical className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100" />
                <Badge variant="secondary" className="text-xs">{topic.name}</Badge>
              </div>
              {isOwner && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 opacity-0 group-hover:opacity-100"
                  onClick={() => handleDelete(topic.id)}
                >
                  <X className="h-3 w-3" />
                </Button>
              )}
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
