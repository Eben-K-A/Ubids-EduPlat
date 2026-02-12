import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useAuth } from "@/contexts/AuthContext";
import { usePosts, useCreatePost, useToggleLike, useCourses, usePost, useAddComment } from "@/hooks/useApi";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  MessageSquare,
  Plus,
  ThumbsUp,
  Pin,
  Search,
  Users,
  Clock,
  MessageCircle,
  ArrowUp,
  Loader2,
  ArrowRight
} from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import { Post, Comment } from "@/types";

interface GroupProject {
  id: string;
  title: string;
  courseId: string;
  courseName: string;
  members: { name: string; role: string }[];
  progress: number;
  dueDate: Date;
  status: "in-progress" | "submitted" | "graded";
  tasks: { id: string; title: string; assignee: string; done: boolean }[];
}

const mockGroupProjects: GroupProject[] = [
  {
    id: "gp1",
    title: "E-Commerce Website",
    courseId: "course-2",
    courseName: "WEB201",
    members: [
      { name: "Jane Doe", role: "Team Lead" },
      { name: "Alex Chen", role: "Frontend" },
      { name: "Sam Wilson", role: "Backend" },
      { name: "Emily Park", role: "Design" },
    ],
    progress: 65,
    dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
    status: "in-progress",
    tasks: [
      { id: "t1", title: "Design homepage mockup", assignee: "Emily Park", done: true },
      { id: "t2", title: "Set up project repository", assignee: "Alex Chen", done: true },
      { id: "t3", title: "Implement product listing page", assignee: "Alex Chen", done: true },
      { id: "t4", title: "Build REST API endpoints", assignee: "Sam Wilson", done: false },
      { id: "t5", title: "Implement shopping cart", assignee: "Jane Doe", done: false },
      { id: "t6", title: "Write unit tests", assignee: "Sam Wilson", done: false },
    ],
  },
  {
    id: "gp2",
    title: "Database Design for Hospital System",
    courseId: "course-3",
    courseName: "DB301",
    members: [
      { name: "Jane Doe", role: "DB Architect" },
      { name: "Mike Johnson", role: "Documentation" },
      { name: "Lisa Wang", role: "Testing" },
    ],
    progress: 40,
    dueDate: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000),
    status: "in-progress",
    tasks: [
      { id: "t7", title: "Requirements analysis", assignee: "Jane Doe", done: true },
      { id: "t8", title: "ER diagram design", assignee: "Jane Doe", done: true },
      { id: "t9", title: "Normalization to 3NF", assignee: "Mike Johnson", done: false },
      { id: "t10", title: "SQL schema implementation", assignee: "Lisa Wang", done: false },
      { id: "t11", title: "Test data generation", assignee: "Lisa Wang", done: false },
    ],
  },
];

export default function Discussions() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<string | undefined>(undefined);

  // Form State
  const [newPostTitle, setNewPostTitle] = useState("");
  const [newPostContent, setNewPostContent] = useState("");
  const [newPostCourseId, setNewPostCourseId] = useState<string | undefined>(undefined);

  // Post Details State
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  const [commentContent, setCommentContent] = useState("");

  // API Hooks
  const { data: posts = [], isLoading, refetch } = usePosts(selectedCourse);
  const { mutate: createPost, isPending: isCreating } = useCreatePost();
  const { mutate: toggleLike } = useToggleLike();
  const { data: courses = [] } = useCourses(); // For course selection
  const { data: selectedPost, isLoading: isLoadingPost } = usePost(selectedPostId || "");
  const { mutate: addComment, isPending: isAddingComment } = useAddComment();

  const filteredDiscussions = posts
    .filter((d) => d.title.toLowerCase().includes(searchQuery.toLowerCase()))
    .sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

  const handleCreatePost = () => {
    if (!newPostTitle || !newPostContent) {
      toast.error("Please fill in all required fields");
      return;
    }

    createPost(
      { title: newPostTitle, content: newPostContent, courseId: newPostCourseId },
      {
        onSuccess: () => {
          toast.success("Discussion posted successfully!");
          setCreateOpen(false);
          setNewPostTitle("");
          setNewPostContent("");
          setNewPostCourseId(undefined);
          refetch();
        },
        onError: () => {
          toast.error("Failed to post discussion");
        },
      }
    );
  };

  const handleUpvote = (id: string) => {
    toggleLike(id);
  };

  const handleAddComment = () => {
    if (!selectedPostId || !commentContent.trim()) return;

    addComment({ postId: selectedPostId, content: commentContent }, {
      onSuccess: () => {
        toast.success("Comment added!");
        setCommentContent("");
      },
      onError: () => {
        toast.error("Failed to add comment");
      }
    });
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Collaboration</h1>
            <p className="text-muted-foreground">
              Discuss topics, ask questions, and collaborate with your peers
            </p>
          </div>
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                New Discussion
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[525px]">
              <DialogHeader>
                <DialogTitle>Start a Discussion</DialogTitle>
                <DialogDescription>Ask a question or share something with your class</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Course (Optional)</Label>
                  <Select onValueChange={setNewPostCourseId} value={newPostCourseId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select course (or General)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="general">General Discussion</SelectItem>
                      {courses.map(course => (
                        <SelectItem key={course.id} value={course.id}>{course.title}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    placeholder="What's your question or topic?"
                    value={newPostTitle}
                    onChange={(e) => setNewPostTitle(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="content">Content</Label>
                  <Textarea
                    id="content"
                    placeholder="Describe your question or topic in detail..."
                    className="min-h-[120px]"
                    value={newPostContent}
                    onChange={(e) => setNewPostContent(e.target.value)}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
                <Button onClick={handleCreatePost} disabled={isCreating}>
                  {isCreating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Post
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <Tabs defaultValue="discussions">
          <TabsList>
            <TabsTrigger value="discussions">
              <MessageSquare className="h-4 w-4 mr-2" />
              Discussions
            </TabsTrigger>
            <TabsTrigger value="groups">
              <Users className="h-4 w-4 mr-2" />
              Group Projects
            </TabsTrigger>
          </TabsList>

          <TabsContent value="discussions" className="space-y-4 mt-4">
            <div className="flex gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search discussions..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select
                value={selectedCourse || "all"}
                onValueChange={(val) => setSelectedCourse(val === "all" ? undefined : val)}
              >
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Filter by Course" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Courses</SelectItem>
                  {courses.map(course => (
                    <SelectItem key={course.id} value={course.id}>{course.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {isLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : filteredDiscussions.length === 0 ? (
              <div className="text-center py-10 text-muted-foreground">
                No discussions found. Be the first to start one!
              </div>
            ) : (
              <div className="space-y-3">
                {filteredDiscussions.map((discussion) => (
                  <Card
                    key={discussion.id}
                    className="hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => setSelectedPostId(discussion.id)}
                  >
                    <CardContent className="p-4">
                      <div className="flex gap-4">
                        {/* Votes */}
                        <div className="flex flex-col items-center gap-1 min-w-[48px]">
                          <Button
                            variant={discussion.isLiked ? "default" : "ghost"}
                            size="icon"
                            className="h-8 w-8"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleUpvote(discussion.id);
                            }}
                          >
                            <ArrowUp className="h-4 w-4" />
                          </Button>
                          <span className="text-sm font-semibold">{discussion.likeCount}</span>
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-start gap-2 mb-1">
                            {discussion.isPinned && <Pin className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />}
                            <h3 className="font-semibold text-sm">{discussion.title}</h3>
                          </div>
                          <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                            {discussion.content}
                          </p>
                          <div className="flex flex-wrap items-center gap-2">
                            {discussion.courseId && (
                              <Badge variant="outline" className="text-xs">
                                {courses.find(c => c.id === discussion.courseId)?.title || "Course"}
                              </Badge>
                            )}
                            <span className="text-xs text-muted-foreground ml-auto flex items-center gap-1">
                              <Avatar className="h-4 w-4">
                                <AvatarImage src={discussion.author.avatar} />
                                <AvatarFallback className="text-[8px]">
                                  {discussion.author.name.split(" ").map((n) => n[0]).join("")}
                                </AvatarFallback>
                              </Avatar>
                              {discussion.author.name}
                            </span>
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <MessageCircle className="h-3 w-3" />
                              {discussion.commentCount || 0}
                            </span>
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {formatDistanceToNow(new Date(discussion.createdAt), { addSuffix: true })}
                            </span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="groups" className="space-y-4 mt-4">
            {mockGroupProjects.map((project) => (
              <Card key={project.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{project.title}</CardTitle>
                      <CardDescription>
                        {project.courseName} · Due {format(project.dueDate, "MMM d, yyyy")}
                      </CardDescription>
                    </div>
                    <Badge variant={project.status === "submitted" ? "default" : "secondary"}>
                      {project.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Progress */}
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-muted-foreground">Progress</span>
                      <span className="font-medium">{project.progress}%</span>
                    </div>
                    <div className="h-2 rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full rounded-full bg-primary transition-all"
                        style={{ width: `${project.progress}%` }}
                      />
                    </div>
                  </div>

                  {/* Members */}
                  <div>
                    <p className="text-sm font-medium mb-2">Team Members</p>
                    <div className="flex flex-wrap gap-2">
                      {project.members.map((member) => (
                        <div key={member.name} className="flex items-center gap-2 px-2 py-1 rounded-md bg-muted text-sm">
                          <Avatar className="h-5 w-5">
                            <AvatarFallback className="text-[8px]">
                              {member.name.split(" ").map((n) => n[0]).join("")}
                            </AvatarFallback>
                          </Avatar>
                          <span>{member.name}</span>
                          <Badge variant="outline" className="text-[10px] h-4">{member.role}</Badge>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Tasks */}
                  <div>
                    <p className="text-sm font-medium mb-2">
                      Tasks ({project.tasks.filter((t) => t.done).length}/{project.tasks.length})
                    </p>
                    <div className="space-y-1">
                      {project.tasks.map((task) => (
                        <div key={task.id} className="flex items-center gap-2 text-sm">
                          <div className={`h-4 w-4 rounded border flex items-center justify-center ${task.done ? "bg-primary border-primary" : "border-muted-foreground/30"}`}>
                            {task.done && <span className="text-primary-foreground text-[10px]">✓</span>}
                          </div>
                          <span className={task.done ? "line-through text-muted-foreground" : ""}>
                            {task.title}
                          </span>
                          <span className="text-xs text-muted-foreground ml-auto">{task.assignee}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>
        </Tabs>

        {/* Post Details Dialog */}
        <Dialog open={!!selectedPostId} onOpenChange={(open) => !open && setSelectedPostId(null)}>
          <DialogContent className="sm:max-w-[700px] h-[80vh] flex flex-col p-0 gap-0">
            {selectedPost ? (
              <>
                <DialogHeader className="p-6 pb-2">
                  <div className="flex items-start gap-4">
                    <div className="flex-1">
                      <DialogTitle className="text-xl mb-2">{selectedPost.title}</DialogTitle>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Avatar className="h-6 w-6">
                          <AvatarImage src={selectedPost.author.avatar} />
                          <AvatarFallback>{selectedPost.author.name?.charAt(0) || "?"}</AvatarFallback>
                        </Avatar>
                        <span>{selectedPost.author.name}</span>
                        <span>•</span>
                        <span>{formatDistanceToNow(new Date(selectedPost.createdAt), { addSuffix: true })}</span>
                      </div>
                    </div>
                    {selectedPost.courseId && <Badge variant="outline">{courses.find(c => c.id === selectedPost.courseId)?.title}</Badge>}
                  </div>
                </DialogHeader>

                <ScrollArea className="flex-1 p-6 pt-2">
                  <div className="text-sm leading-relaxed whitespace-pre-wrap mb-6">
                    {selectedPost.content}
                  </div>

                  <Separator className="my-4" />

                  <h3 className="font-semibold mb-4 flex items-center gap-2">
                    <MessageCircle className="h-4 w-4" />
                    Comments ({selectedPost.comments?.length || 0})
                  </h3>

                  <div className="space-y-4">
                    {selectedPost.comments?.map((comment) => (
                      <div key={comment.id} className="flex gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={comment.author.avatar} />
                          <AvatarFallback>{comment.author.name?.charAt(0) || "?"}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 bg-muted/50 rounded-lg p-3">
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-medium text-xs">{comment.author.name}</span>
                            <span className="text-xs text-muted-foreground">{formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}</span>
                          </div>
                          <p className="text-sm">{comment.content}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>

                <div className="p-4 border-t bg-background mt-auto">
                  <div className="flex gap-2">
                    <Textarea
                      placeholder="Write a comment..."
                      value={commentContent}
                      onChange={(e) => setCommentContent(e.target.value)}
                      className="min-h-[40px] resize-none"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleAddComment();
                        }
                      }}
                    />
                    <Button size="icon" onClick={handleAddComment} disabled={isAddingComment || !commentContent.trim()}>
                      {isAddingComment ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
