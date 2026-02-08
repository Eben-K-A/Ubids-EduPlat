import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
  MessageSquare,
  Plus,
  ThumbsUp,
  Pin,
  Search,
  Users,
  Clock,
  MessageCircle,
  Award,
  ArrowUp,
} from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { toast } from "sonner";

interface Discussion {
  id: string;
  title: string;
  content: string;
  courseId: string;
  courseName: string;
  author: string;
  authorRole: string;
  createdAt: Date;
  replies: number;
  upvotes: number;
  isPinned: boolean;
  tags: string[];
  lastActivity: Date;
}

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

const mockDiscussions: Discussion[] = [
  {
    id: "d1",
    title: "Help with recursion assignment",
    content: "I'm struggling with the recursive Fibonacci implementation. Can someone explain the base cases?",
    courseId: "course-1",
    courseName: "CS101",
    author: "Jane Doe",
    authorRole: "student",
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
    replies: 5,
    upvotes: 12,
    isPinned: false,
    tags: ["help", "recursion"],
    lastActivity: new Date(Date.now() - 30 * 60 * 1000),
  },
  {
    id: "d2",
    title: "📌 Midterm Exam Study Guide",
    content: "Here's a comprehensive study guide for the upcoming midterm. Please review chapters 1-5.",
    courseId: "course-1",
    courseName: "CS101",
    author: "Prof. John Lecturer",
    authorRole: "lecturer",
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
    replies: 18,
    upvotes: 32,
    isPinned: true,
    tags: ["announcement", "exam"],
    lastActivity: new Date(Date.now() - 60 * 60 * 1000),
  },
  {
    id: "d3",
    title: "Best practices for CSS Grid vs Flexbox?",
    content: "When should we use Grid vs Flexbox? I find myself always defaulting to Flexbox.",
    courseId: "course-2",
    courseName: "WEB201",
    author: "Alex Chen",
    authorRole: "student",
    createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000),
    replies: 8,
    upvotes: 15,
    isPinned: false,
    tags: ["css", "discussion"],
    lastActivity: new Date(Date.now() - 2 * 60 * 60 * 1000),
  },
  {
    id: "d4",
    title: "SQL JOIN types - visual explanation needed",
    content: "Can someone share a visual representation of different JOIN types? The textbook explanation isn't clicking.",
    courseId: "course-3",
    courseName: "DB301",
    author: "Sam Wilson",
    authorRole: "student",
    createdAt: new Date(Date.now() - 48 * 60 * 60 * 1000),
    replies: 3,
    upvotes: 7,
    isPinned: false,
    tags: ["sql", "help"],
    lastActivity: new Date(Date.now() - 12 * 60 * 60 * 1000),
  },
];

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
  const [discussions, setDiscussions] = useState(mockDiscussions);

  const filteredDiscussions = discussions
    .filter((d) => d.title.toLowerCase().includes(searchQuery.toLowerCase()))
    .sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      return b.lastActivity.getTime() - a.lastActivity.getTime();
    });

  const handleCreatePost = () => {
    toast.success("Discussion posted! (Mock)");
    setCreateOpen(false);
  };

  const handleUpvote = (id: string) => {
    setDiscussions((prev) =>
      prev.map((d) => (d.id === id ? { ...d, upvotes: d.upvotes + 1 } : d))
    );
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Collaboration</h1>
            <p className="text-muted-foreground">
              Discuss topics, work on group projects, and collaborate with peers
            </p>
          </div>
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                New Discussion
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Start a Discussion</DialogTitle>
                <DialogDescription>Ask a question or share something with your class</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Course</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select course" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="course-1">CS101</SelectItem>
                      <SelectItem value="course-2">WEB201</SelectItem>
                      <SelectItem value="course-3">DB301</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Title</Label>
                  <Input placeholder="What's your question or topic?" />
                </div>
                <div className="space-y-2">
                  <Label>Content</Label>
                  <Textarea placeholder="Describe your question or topic in detail..." className="min-h-[120px]" />
                </div>
                <div className="space-y-2">
                  <Label>Tags</Label>
                  <Input placeholder="e.g., help, discussion, announcement (comma-separated)" />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
                <Button onClick={handleCreatePost}>Post</Button>
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
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search discussions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>

            <div className="space-y-3">
              {filteredDiscussions.map((discussion) => (
                <Card key={discussion.id} className="hover:shadow-md transition-shadow cursor-pointer">
                  <CardContent className="p-4">
                    <div className="flex gap-4">
                      {/* Votes */}
                      <div className="flex flex-col items-center gap-1 min-w-[48px]">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleUpvote(discussion.id)}
                        >
                          <ArrowUp className="h-4 w-4" />
                        </Button>
                        <span className="text-sm font-semibold">{discussion.upvotes}</span>
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
                          <Badge variant="outline" className="text-xs">{discussion.courseName}</Badge>
                          {discussion.tags.map((tag) => (
                            <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>
                          ))}
                          <span className="text-xs text-muted-foreground ml-auto flex items-center gap-1">
                            <Avatar className="h-4 w-4">
                              <AvatarFallback className="text-[8px]">
                                {discussion.author.split(" ").map((n) => n[0]).join("")}
                              </AvatarFallback>
                            </Avatar>
                            {discussion.author}
                          </span>
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <MessageCircle className="h-3 w-3" />
                            {discussion.replies}
                          </span>
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {formatDistanceToNow(discussion.lastActivity, { addSuffix: true })}
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
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
      </div>
    </DashboardLayout>
  );
}
