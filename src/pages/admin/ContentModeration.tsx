import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  AlertTriangle, CheckCircle, XCircle, MessageSquare, BookOpen,
  FileText, Flag, Eye, Clock, Shield,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface FlaggedItem {
  id: string;
  type: "course" | "discussion" | "assignment" | "message";
  title: string;
  reportedBy: string;
  reason: string;
  createdAt: string;
  status: "pending" | "reviewed" | "resolved";
  severity: "low" | "medium" | "high";
  author: string;
}

const flaggedItems: FlaggedItem[] = [
  { id: "1", type: "course", title: "Intro to Machine Learning", reportedBy: "Jane Doe", reason: "Contains plagiarized content in Module 3", createdAt: "2 hours ago", status: "pending", severity: "high", author: "Dr. Unknown" },
  { id: "2", type: "discussion", title: "Is homework necessary?", reportedBy: "Michael Brown", reason: "Off-topic and inflammatory language", createdAt: "5 hours ago", status: "pending", severity: "medium", author: "Student123" },
  { id: "3", type: "assignment", title: "Final Project Guidelines", reportedBy: "Emily Taylor", reason: "Misleading instructions causing confusion", createdAt: "1 day ago", status: "reviewed", severity: "low", author: "Prof. Wilson" },
  { id: "4", type: "message", title: "Private message report", reportedBy: "Anna Martinez", reason: "Harassment and inappropriate content", createdAt: "1 day ago", status: "pending", severity: "high", author: "User456" },
  { id: "5", type: "course", title: "Advanced Statistics", reportedBy: "System", reason: "Course materials require review — uploaded content flagged", createdAt: "2 days ago", status: "resolved", severity: "medium", author: "Dr. Garcia" },
];

const pendingCourses = [
  { id: "c1", title: "Quantum Computing Basics", author: "Dr. Alan Park", submittedAt: "3 hours ago", modules: 8, lessons: 24 },
  { id: "c2", title: "Creative Writing Workshop", author: "Prof. Lisa Monroe", submittedAt: "1 day ago", modules: 5, lessons: 15 },
  { id: "c3", title: "Environmental Science 101", author: "Dr. Mark Rivers", submittedAt: "2 days ago", modules: 10, lessons: 32 },
];

export default function ContentModeration() {
  const [items, setItems] = useState(flaggedItems);
  const { toast } = useToast();

  const handleResolve = (id: string, action: "approve" | "reject") => {
    setItems((prev) =>
      prev.map((item) => item.id === id ? { ...item, status: "resolved" as const } : item)
    );
    toast({
      title: action === "approve" ? "Content approved" : "Content removed",
      description: `The flagged item has been ${action === "approve" ? "approved" : "removed"}.`,
    });
  };

  const handleCourseAction = (id: string, action: "approve" | "reject") => {
    toast({
      title: action === "approve" ? "Course approved" : "Course rejected",
      description: `The course has been ${action === "approve" ? "published" : "sent back for revision"}.`,
    });
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "course": return <BookOpen className="h-4 w-4" />;
      case "discussion": return <MessageSquare className="h-4 w-4" />;
      case "assignment": return <FileText className="h-4 w-4" />;
      case "message": return <MessageSquare className="h-4 w-4" />;
      default: return <Flag className="h-4 w-4" />;
    }
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case "high": return <Badge className="bg-destructive/10 text-destructive border-destructive/30">High</Badge>;
      case "medium": return <Badge className="bg-warning/10 text-warning border-warning/30">Medium</Badge>;
      case "low": return <Badge className="bg-muted text-muted-foreground">Low</Badge>;
      default: return null;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending": return <Badge className="bg-warning/10 text-warning border-warning/30">Pending</Badge>;
      case "reviewed": return <Badge className="bg-primary/10 text-primary border-primary/30">Reviewed</Badge>;
      case "resolved": return <Badge className="bg-success/10 text-success border-success/30">Resolved</Badge>;
      default: return null;
    }
  };

  const pendingCount = items.filter((i) => i.status === "pending").length;
  const highSeverity = items.filter((i) => i.severity === "high" && i.status !== "resolved").length;

  return (
    <DashboardLayout>
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Content Moderation</h1>
        <p className="text-muted-foreground">Review flagged content and approve course submissions</p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4 mb-8">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-warning/10"><Flag className="h-5 w-5 text-warning" /></div>
              <div>
                <p className="text-2xl font-bold">{pendingCount}</p>
                <p className="text-xs text-muted-foreground">Pending Reviews</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-destructive/10"><AlertTriangle className="h-5 w-5 text-destructive" /></div>
              <div>
                <p className="text-2xl font-bold">{highSeverity}</p>
                <p className="text-xs text-muted-foreground">High Severity</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-primary/10"><BookOpen className="h-5 w-5 text-primary" /></div>
              <div>
                <p className="text-2xl font-bold">{pendingCourses.length}</p>
                <p className="text-xs text-muted-foreground">Courses Pending</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-success/10"><Shield className="h-5 w-5 text-success" /></div>
              <div>
                <p className="text-2xl font-bold">{items.filter((i) => i.status === "resolved").length}</p>
                <p className="text-xs text-muted-foreground">Resolved</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="flagged" className="space-y-6">
        <TabsList>
          <TabsTrigger value="flagged">
            Flagged Content
            {pendingCount > 0 && (
              <Badge variant="destructive" className="ml-2 h-5 px-1.5 text-xs">{pendingCount}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="courses">
            Course Approvals
            <Badge variant="outline" className="ml-2 h-5 px-1.5 text-xs">{pendingCourses.length}</Badge>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="flagged">
          <div className="space-y-4">
            {items.map((item) => (
              <Card key={item.id} className={item.status === "resolved" ? "opacity-60" : ""}>
                <CardContent className="pt-6">
                  <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <div className={`p-2.5 rounded-xl ${
                        item.severity === "high" ? "bg-destructive/10" :
                        item.severity === "medium" ? "bg-warning/10" : "bg-muted"
                      }`}>
                        {getTypeIcon(item.type)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <h3 className="font-semibold">{item.title}</h3>
                          {getSeverityBadge(item.severity)}
                          {getStatusBadge(item.status)}
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">{item.reason}</p>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1"><Flag className="h-3 w-3" /> Reported by {item.reportedBy}</span>
                          <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {item.createdAt}</span>
                          <span>Author: {item.author}</span>
                        </div>
                      </div>
                    </div>
                    {item.status !== "resolved" && (
                      <div className="flex items-center gap-2 shrink-0">
                        <Button variant="outline" size="sm" onClick={() => handleResolve(item.id, "approve")}>
                          <CheckCircle className="h-4 w-4 mr-1" /> Approve
                        </Button>
                        <Button variant="destructive" size="sm" onClick={() => handleResolve(item.id, "reject")}>
                          <XCircle className="h-4 w-4 mr-1" /> Remove
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="courses">
          <div className="space-y-4">
            {pendingCourses.map((course) => (
              <Card key={course.id}>
                <CardContent className="pt-6">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="p-2.5 rounded-xl bg-primary/10">
                        <BookOpen className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold">{course.title}</h3>
                        <p className="text-sm text-muted-foreground">
                          by {course.author} · {course.modules} modules · {course.lessons} lessons
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">Submitted {course.submittedAt}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Button variant="outline" size="sm">
                        <Eye className="h-4 w-4 mr-1" /> Preview
                      </Button>
                      <Button size="sm" onClick={() => handleCourseAction(course.id, "approve")}>
                        <CheckCircle className="h-4 w-4 mr-1" /> Approve
                      </Button>
                      <Button variant="destructive" size="sm" onClick={() => handleCourseAction(course.id, "reject")}>
                        <XCircle className="h-4 w-4 mr-1" /> Reject
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  );
}