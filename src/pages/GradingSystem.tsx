import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Switch } from "@/components/ui/switch";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  CheckCircle2, Clock, Users, FileText, Search, Brain,
  Upload, Settings, Play, Award, Filter, Download, Wand2,
} from "lucide-react";
import { toast } from "sonner";

interface GradingTask {
  id: string;
  type: "quiz" | "exam" | "assignment";
  title: string;
  courseCode: string;
  totalStudents: number;
  gradedCount: number;
  dueDate: string;
  status: "pending" | "in-progress" | "completed";
  gradingMethod?: "auto-ai" | "auto-scheme" | "manual";
}

const gradingTasks: GradingTask[] = [
  { id: "gt-1", type: "exam", title: "CS101 Final Exam", courseCode: "CS101", totalStudents: 85, gradedCount: 0, dueDate: "2026-02-10", status: "pending" },
  { id: "gt-2", type: "quiz", title: "CS201 Quiz 3", courseCode: "CS201", totalStudents: 64, gradedCount: 64, dueDate: "2026-02-05", status: "completed", gradingMethod: "auto-ai" },
  { id: "gt-3", type: "assignment", title: "CS150 Project Submission", courseCode: "CS150", totalStudents: 72, gradedCount: 30, dueDate: "2026-02-08", status: "in-progress", gradingMethod: "manual" },
  { id: "gt-4", type: "quiz", title: "CS301 Midterm Quiz", courseCode: "CS301", totalStudents: 48, gradedCount: 48, dueDate: "2026-02-03", status: "completed", gradingMethod: "auto-scheme" },
  { id: "gt-5", type: "exam", title: "CS350 Midterm Exam", courseCode: "CS350", totalStudents: 38, gradedCount: 12, dueDate: "2026-02-12", status: "in-progress", gradingMethod: "auto-ai" },
];

interface StudentSubmission {
  id: string;
  studentName: string;
  submittedAt: string;
  score: number | null;
  maxScore: number;
  status: "graded" | "pending" | "in-review";
  answer?: string;
}

const mockSubmissions: StudentSubmission[] = [
  { id: "sub-1", studentName: "Alice Chen", submittedAt: "2026-02-07 14:30", score: null, maxScore: 100, status: "pending", answer: "Binary search trees provide O(log n) search..." },
  { id: "sub-2", studentName: "Bob Williams", submittedAt: "2026-02-07 14:25", score: null, maxScore: 100, status: "pending", answer: "A BST is a data structure where..." },
  { id: "sub-3", studentName: "Carol Davis", submittedAt: "2026-02-07 14:20", score: 92, maxScore: 100, status: "graded" },
  { id: "sub-4", studentName: "David Lee", submittedAt: "2026-02-07 14:15", score: 78, maxScore: 100, status: "graded" },
  { id: "sub-5", studentName: "Emma Garcia", submittedAt: "2026-02-07 14:10", score: null, maxScore: 100, status: "pending" },
];

export default function GradingSystem() {
  const { user } = useAuth();
  const [selectedTask, setSelectedTask] = useState<GradingTask | null>(null);
  const [gradingDialogOpen, setGradingDialogOpen] = useState(false);
  const [gradingMethod, setGradingMethod] = useState<string>("auto-ai");
  const [markingScheme, setMarkingScheme] = useState("");
  const [autoSchedule, setAutoSchedule] = useState(false);
  const [scheduleTime, setScheduleTime] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");

  const filteredTasks = gradingTasks.filter((t) => {
    const matchesSearch = !searchQuery || t.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = typeFilter === "all" || t.type === typeFilter;
    return matchesSearch && matchesType;
  });

  const startGrading = (task: GradingTask) => {
    setSelectedTask(task);
    setGradingDialogOpen(true);
  };

  const handleGrade = () => {
    toast.success(
      gradingMethod === "auto-ai"
        ? "AI grading started! Results will be available shortly."
        : gradingMethod === "auto-scheme"
        ? "Auto-grading with marking scheme started!"
        : "Manual grading mode activated."
    );
    setGradingDialogOpen(false);
  };

  const pendingCount = gradingTasks.filter((t) => t.status === "pending").length;
  const inProgressCount = gradingTasks.filter((t) => t.status === "in-progress").length;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Grading System</h1>
          <p className="text-muted-foreground">Mark and grade student quizzes, exams, and assignments</p>
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-warning/10"><Clock className="h-5 w-5 text-warning" /></div>
                <div>
                  <p className="text-2xl font-bold">{pendingCount}</p>
                  <p className="text-xs text-muted-foreground">Pending</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-primary/10"><Play className="h-5 w-5 text-primary" /></div>
                <div>
                  <p className="text-2xl font-bold">{inProgressCount}</p>
                  <p className="text-xs text-muted-foreground">In Progress</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-success/10"><CheckCircle2 className="h-5 w-5 text-success" /></div>
                <div>
                  <p className="text-2xl font-bold">{gradingTasks.filter((t) => t.status === "completed").length}</p>
                  <p className="text-xs text-muted-foreground">Completed</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-accent/10"><Users className="h-5 w-5 text-accent" /></div>
                <div>
                  <p className="text-2xl font-bold">{gradingTasks.reduce((s, t) => s + t.totalStudents, 0)}</p>
                  <p className="text-xs text-muted-foreground">Total Submissions</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search tasks..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10" />
          </div>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-full sm:w-40">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="quiz">Quizzes</SelectItem>
              <SelectItem value="exam">Exams</SelectItem>
              <SelectItem value="assignment">Assignments</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Grading Tasks */}
        <div className="space-y-4">
          {filteredTasks.map((task) => (
            <Card key={task.id} className={task.status === "completed" ? "opacity-60" : ""}>
              <CardContent className="pt-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className={`p-2.5 rounded-xl ${
                      task.type === "exam" ? "bg-destructive/10" :
                      task.type === "quiz" ? "bg-primary/10" : "bg-accent/10"
                    }`}>
                      {task.type === "exam" ? <Award className="h-5 w-5 text-destructive" /> :
                       task.type === "quiz" ? <FileText className="h-5 w-5 text-primary" /> :
                       <Upload className="h-5 w-5 text-accent" />}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold">{task.title}</h3>
                        <Badge variant="outline" className="font-mono text-xs">{task.courseCode}</Badge>
                        <Badge variant={task.status === "completed" ? "default" : task.status === "in-progress" ? "secondary" : "outline"} className="capitalize text-xs">
                          {task.status}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1"><Users className="h-3 w-3" /> {task.gradedCount}/{task.totalStudents} graded</span>
                        <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> Due: {task.dueDate}</span>
                        {task.gradingMethod && (
                          <Badge variant="secondary" className="text-[10px]">
                            {task.gradingMethod === "auto-ai" ? "🤖 AI" : task.gradingMethod === "auto-scheme" ? "📋 Scheme" : "✍️ Manual"}
                          </Badge>
                        )}
                      </div>
                      {task.status !== "completed" && task.totalStudents > 0 && (
                        <div className="mt-2 max-w-xs">
                          <div className="flex justify-between text-[10px] text-muted-foreground mb-0.5">
                            <span>Progress</span>
                            <span>{Math.round((task.gradedCount / task.totalStudents) * 100)}%</span>
                          </div>
                          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                            <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${(task.gradedCount / task.totalStudents) * 100}%` }} />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  {task.status !== "completed" && (
                    <div className="flex items-center gap-2 shrink-0">
                      <Button size="sm" onClick={() => startGrading(task)}>
                        <Settings className="h-4 w-4 mr-1" />
                        {task.status === "in-progress" ? "Continue" : "Start"} Grading
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Grading Method Dialog */}
        <Dialog open={gradingDialogOpen} onOpenChange={setGradingDialogOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Configure Grading — {selectedTask?.title}</DialogTitle>
              <DialogDescription>
                Choose how to grade {selectedTask?.totalStudents} student submissions
              </DialogDescription>
            </DialogHeader>
            <Tabs value={gradingMethod} onValueChange={setGradingMethod} className="mt-2">
              <TabsList className="w-full">
                <TabsTrigger value="auto-ai" className="flex-1 gap-1">
                  <Brain className="h-3.5 w-3.5" />
                  AI Grading
                </TabsTrigger>
                <TabsTrigger value="auto-scheme" className="flex-1 gap-1">
                  <Wand2 className="h-3.5 w-3.5" />
                  Marking Scheme
                </TabsTrigger>
                <TabsTrigger value="manual" className="flex-1 gap-1">
                  <FileText className="h-3.5 w-3.5" />
                  Manual
                </TabsTrigger>
              </TabsList>

              <TabsContent value="auto-ai" className="space-y-4 mt-4">
                <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
                  <h4 className="font-semibold text-sm mb-1 flex items-center gap-2">
                    <Brain className="h-4 w-4 text-primary" />
                    AI-Powered Grading
                  </h4>
                  <p className="text-xs text-muted-foreground">
                    AI will analyze student answers, compare them against expected responses, and assign scores with detailed feedback.
                  </p>
                </div>
                <div className="space-y-2">
                  <Label>Marking Scheme / Rubric (Optional)</Label>
                  <Textarea
                    placeholder="Provide a rubric or marking guide for the AI to follow..."
                    value={markingScheme}
                    onChange={(e) => setMarkingScheme(e.target.value)}
                    rows={4}
                  />
                  <p className="text-xs text-muted-foreground">The AI will use this as a guide. If empty, it will use general best practices.</p>
                </div>
              </TabsContent>

              <TabsContent value="auto-scheme" className="space-y-4 mt-4">
                <div className="p-4 rounded-lg bg-accent/5 border border-accent/20">
                  <h4 className="font-semibold text-sm mb-1 flex items-center gap-2">
                    <Wand2 className="h-4 w-4 text-accent" />
                    Auto-Grade with Marking Scheme
                  </h4>
                  <p className="text-xs text-muted-foreground">
                    Provide a structured marking scheme and the system will grade all submissions automatically based on your criteria.
                  </p>
                </div>
                <div className="space-y-2">
                  <Label>Marking Scheme (Required)</Label>
                  <Textarea
                    placeholder={"Q1: Expected answer — \"Binary search tree\" (5 marks)\nQ2: Must mention O(log n) complexity (3 marks)\nQ3: Full explanation required (10 marks)"}
                    value={markingScheme}
                    onChange={(e) => setMarkingScheme(e.target.value)}
                    rows={6}
                    className="font-mono text-xs"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Or upload marking scheme file</Label>
                  <Input type="file" accept=".pdf,.docx,.txt,.csv" />
                </div>
              </TabsContent>

              <TabsContent value="manual" className="space-y-4 mt-4">
                <div className="p-4 rounded-lg bg-muted border">
                  <h4 className="font-semibold text-sm mb-1 flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Manual Grading
                  </h4>
                  <p className="text-xs text-muted-foreground">
                    Grade each submission individually. You can provide a marking scheme for reference while grading.
                  </p>
                </div>
                <div className="space-y-2">
                  <Label>Reference Marking Scheme (Optional)</Label>
                  <Textarea
                    placeholder="Add marking scheme for your reference..."
                    value={markingScheme}
                    onChange={(e) => setMarkingScheme(e.target.value)}
                    rows={4}
                  />
                </div>
              </TabsContent>
            </Tabs>

            {/* Schedule auto-grading */}
            <div className="flex items-center justify-between rounded-lg border p-3 mt-2">
              <div>
                <Label className="text-sm font-medium">Schedule Auto-Grading</Label>
                <p className="text-xs text-muted-foreground">Automatically grade at a specific time</p>
              </div>
              <Switch checked={autoSchedule} onCheckedChange={setAutoSchedule} />
            </div>
            {autoSchedule && (
              <Input type="datetime-local" value={scheduleTime} onChange={(e) => setScheduleTime(e.target.value)} />
            )}

            <DialogFooter>
              <Button variant="outline" onClick={() => setGradingDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleGrade}>
                {gradingMethod === "manual" ? "Open Grading View" : "Start Auto-Grading"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}