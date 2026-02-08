import { useState } from "react";
import { useClassroom } from "@/contexts/ClassroomContext";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Pin, MoreVertical, Trash2, Send, MessageCircle } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";

interface ClassStreamProps {
  courseId: string;
  isOwner: boolean;
}

export function ClassStream({ courseId, isOwner }: ClassStreamProps) {
  const { user } = useAuth();
  const { getAnnouncementsByCourse, createAnnouncement, deleteAnnouncement, togglePinAnnouncement, addComment, deleteComment } = useClassroom();
  const { toast } = useToast();
  const [newPost, setNewPost] = useState("");
  const [isPosting, setIsPosting] = useState(false);
  const [showCompose, setShowCompose] = useState(false);
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});
  const [expandedComments, setExpandedComments] = useState<Record<string, boolean>>({});

  const announcements = getAnnouncementsByCourse(courseId);

  const handlePost = async () => {
    if (!newPost.trim()) return;
    setIsPosting(true);
    try {
      await createAnnouncement(courseId, newPost.trim());
      setNewPost("");
      setShowCompose(false);
      toast({ title: "Posted to class stream" });
    } catch {
      toast({ title: "Failed to post", variant: "destructive" });
    }
    setIsPosting(false);
  };

  const handleComment = async (announcementId: string) => {
    const content = commentInputs[announcementId]?.trim();
    if (!content) return;
    try {
      await addComment(announcementId, content);
      setCommentInputs((prev) => ({ ...prev, [announcementId]: "" }));
    } catch {
      toast({ title: "Failed to comment", variant: "destructive" });
    }
  };

  const getInitials = (name: string) =>
    name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);

  return (
    <div className="space-y-4">
      {/* Compose */}
      {!showCompose ? (
        <Card
          className="cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => setShowCompose(true)}
        >
          <CardContent className="py-4 flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarFallback className="bg-primary/10 text-primary text-sm">
                {user ? getInitials(`${user.firstName} ${user.lastName}`) : "?"}
              </AvatarFallback>
            </Avatar>
            <span className="text-muted-foreground">
              Announce something to your class...
            </span>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="pt-4 space-y-3">
            <Textarea
              placeholder="Share with your class..."
              value={newPost}
              onChange={(e) => setNewPost(e.target.value)}
              rows={3}
              autoFocus
            />
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => { setShowCompose(false); setNewPost(""); }}>
                Cancel
              </Button>
              <Button onClick={handlePost} disabled={!newPost.trim() || isPosting}>
                <Send className="h-4 w-4 mr-2" />
                Post
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Posts */}
      {announcements.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <MessageCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No announcements yet. Start the conversation!</p>
          </CardContent>
        </Card>
      ) : (
        announcements.map((ann) => (
          <Card key={ann.id} className={ann.isPinned ? "border-primary/30 bg-primary/5" : ""}>
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-primary/10 text-primary text-sm">
                      {getInitials(ann.authorName)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm">{ann.authorName}</span>
                      {ann.isPinned && (
                        <Badge variant="outline" className="text-[10px] gap-1">
                          <Pin className="h-3 w-3" /> Pinned
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(ann.createdAt), "MMM d, yyyy 'at' h:mm a")}
                    </p>
                  </div>
                </div>
                {(isOwner || ann.authorId === user?.id) && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {isOwner && (
                        <DropdownMenuItem onClick={() => togglePinAnnouncement(ann.id)}>
                          <Pin className="h-4 w-4 mr-2" />
                          {ann.isPinned ? "Unpin" : "Pin to top"}
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem
                        onClick={() => deleteAnnouncement(ann.id)}
                        className="text-destructive focus:text-destructive"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm whitespace-pre-wrap">{ann.content}</p>

              {/* Comments section */}
              <div className="border-t pt-3 space-y-2">
                {ann.comments.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs text-muted-foreground"
                    onClick={() => setExpandedComments((prev) => ({ ...prev, [ann.id]: !prev[ann.id] }))}
                  >
                    <MessageCircle className="h-3 w-3 mr-1" />
                    {ann.comments.length} comment{ann.comments.length !== 1 ? "s" : ""}
                  </Button>
                )}

                {expandedComments[ann.id] &&
                  ann.comments.map((comment) => (
                    <div key={comment.id} className="flex items-start gap-2 pl-2">
                      <Avatar className="h-7 w-7">
                        <AvatarFallback className="bg-muted text-muted-foreground text-[10px]">
                          {getInitials(comment.authorName)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 bg-muted/50 rounded-lg p-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-medium">{comment.authorName}</span>
                          <div className="flex items-center gap-1">
                            <span className="text-[10px] text-muted-foreground">
                              {format(new Date(comment.createdAt), "MMM d")}
                            </span>
                            {(isOwner || comment.authorId === user?.id) && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-5 w-5"
                                onClick={() => deleteComment(ann.id, comment.id)}
                              >
                                <Trash2 className="h-3 w-3 text-muted-foreground" />
                              </Button>
                            )}
                          </div>
                        </div>
                        <p className="text-xs mt-0.5">{comment.content}</p>
                      </div>
                    </div>
                  ))}

                {/* Add comment input */}
                <div className="flex items-center gap-2 pl-2">
                  <Avatar className="h-7 w-7">
                    <AvatarFallback className="bg-primary/10 text-primary text-[10px]">
                      {user ? getInitials(`${user.firstName} ${user.lastName}`) : "?"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 flex gap-1">
                    <Input
                      placeholder="Add a class comment..."
                      className="h-8 text-xs"
                      value={commentInputs[ann.id] || ""}
                      onChange={(e) => setCommentInputs((prev) => ({ ...prev, [ann.id]: e.target.value }))}
                      onKeyDown={(e) => e.key === "Enter" && handleComment(ann.id)}
                    />
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 shrink-0"
                      onClick={() => handleComment(ann.id)}
                      disabled={!commentInputs[ann.id]?.trim()}
                    >
                      <Send className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}
