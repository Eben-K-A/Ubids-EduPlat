import { useState, useRef } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Brain,
  Sparkles,
  FileSearch,
  BookOpen,
  Lightbulb,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Send,
  TrendingUp,
  Zap,
  GraduationCap,
  Star,
  FileText,
  PenTool,
  Calendar,
  Layers,
  RotateCcw,
  Copy,
  ThumbsUp,
  ThumbsDown,
  Wand2,
  FlipHorizontal,
  BookMarked,
  ListChecks,
  Clock,
  Target,
  ChevronRight,
  Download,
} from "lucide-react";
import { toast } from "sonner";

interface FlashCard {
  id: string;
  front: string;
  back: string;
  isFlipped: boolean;
  difficulty: "easy" | "medium" | "hard";
}

interface StudyPlanItem {
  id: string;
  day: string;
  topic: string;
  duration: string;
  resources: string[];
  completed: boolean;
}

export default function AIServices() {
  const { user } = useAuth();
  const isLecturer = user?.role === "lecturer" || user?.role === "admin";

  // AI Grading
  const [gradingText, setGradingText] = useState("");
  const [isGrading, setIsGrading] = useState(false);
  const [gradingResult, setGradingResult] = useState<null | {
    score: number;
    feedback: string;
    strengths: string[];
    improvements: string[];
  }>(null);

  // Plagiarism
  const [plagiarismText, setPlagiarismText] = useState("");
  const [isChecking, setIsChecking] = useState(false);
  const [plagiarismResult, setPlagiarismResult] = useState<null | {
    score: number;
    sources: { url: string; match: number }[];
  }>(null);

  // AI Tutor
  const [chatMessages, setChatMessages] = useState<{ role: "user" | "ai"; content: string }[]>([
    { role: "ai", content: "Hi! I'm your AI learning assistant. I can help you understand course concepts, solve problems, and prepare for exams. What would you like to learn about?" },
  ]);
  const [chatInput, setChatInput] = useState("");
  const [isChatting, setIsChatting] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState("general");

  // Writing Assistant
  const [writingInput, setWritingInput] = useState("");
  const [writingOutput, setWritingOutput] = useState("");
  const [isWriting, setIsWriting] = useState(false);
  const [writingMode, setWritingMode] = useState<"essay" | "summary" | "paraphrase" | "grammar">("essay");

  // Flashcards
  const [flashcardTopic, setFlashcardTopic] = useState("");
  const [isGeneratingCards, setIsGeneratingCards] = useState(false);
  const [flashcards, setFlashcards] = useState<FlashCard[]>([]);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);

  // Study Plan
  const [studyGoal, setStudyGoal] = useState("");
  const [isGeneratingPlan, setIsGeneratingPlan] = useState(false);
  const [studyPlan, setStudyPlan] = useState<StudyPlanItem[]>([]);

  // Content Summarizer
  const [summaryInput, setSummaryInput] = useState("");
  const [summaryOutput, setSummaryOutput] = useState("");
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [summaryLength, setSummaryLength] = useState<"brief" | "detailed">("brief");

  const mockGrade = async () => {
    setIsGrading(true);
    await new Promise((r) => setTimeout(r, 2000));
    setGradingResult({
      score: 82,
      feedback: "Good understanding of core concepts with room for improvement in code organization and documentation.",
      strengths: [
        "Correct implementation of the algorithm",
        "Good use of variable naming conventions",
        "Proper error handling in key sections",
      ],
      improvements: [
        "Add inline comments for complex logic",
        "Consider edge cases for empty inputs",
        "Could optimize the nested loop for better time complexity",
      ],
    });
    setIsGrading(false);
    toast.success("AI grading complete!");
  };

  const mockPlagiarismCheck = async () => {
    setIsChecking(true);
    await new Promise((r) => setTimeout(r, 2500));
    setPlagiarismResult({
      score: 12,
      sources: [
        { url: "stackoverflow.com/questions/12345", match: 8 },
        { url: "geeksforgeeks.org/binary-search", match: 4 },
      ],
    });
    setIsChecking(false);
    toast.success("Plagiarism check complete!");
  };

  const handleChat = async () => {
    if (!chatInput.trim()) return;
    const userMsg = chatInput;
    setChatMessages((prev) => [...prev, { role: "user", content: userMsg }]);
    setChatInput("");
    setIsChatting(true);
    await new Promise((r) => setTimeout(r, 1500));

    const responses: Record<string, string> = {
      recursion: "**Recursion** is when a function calls itself to break down a problem into smaller sub-problems.\n\n🔑 **Key Components:**\n1. **Base case** — stops the recursion\n2. **Recursive case** — calls itself with simpler input\n\n📝 **Example:**\n```\nfactorial(n) = n × factorial(n-1)\nfactorial(0) = 1  ← base case\n```\n\nWant me to walk through a specific recursive problem?",
      algorithm: "An **algorithm** is a step-by-step procedure for solving a problem efficiently.\n\n📊 **Categories:**\n- **Sorting**: QuickSort, MergeSort, HeapSort\n- **Searching**: Binary Search, BFS, DFS\n- **Dynamic Programming**: Memoization, Tabulation\n- **Greedy**: Optimal substructure problems\n\nWhich category would you like to explore?",
      "binary tree": "A **Binary Tree** is a hierarchical data structure where each node has at most 2 children.\n\n🌳 **Types:**\n- **BST** — left < root < right\n- **AVL** — self-balancing BST\n- **Heap** — complete binary tree\n\n**Traversals:** In-order, Pre-order, Post-order, Level-order\n\nShall I explain any specific operation?",
      sql: "**SQL** (Structured Query Language) is used to manage relational databases.\n\n📋 **Key Operations:**\n- `SELECT` — query data\n- `JOIN` — combine tables\n- `GROUP BY` — aggregate data\n- `INDEX` — optimize queries\n\n💡 **JOIN Types:**\n- INNER JOIN — matching rows only\n- LEFT JOIN — all from left + matches\n- RIGHT JOIN — all from right + matches\n- FULL JOIN — all rows from both",
    };

    const matchedKey = Object.keys(responses).find((k) => userMsg.toLowerCase().includes(k));
    const aiResponse = matchedKey
      ? responses[matchedKey]
      : `Great question about "${userMsg.slice(0, 30)}..."!\n\nBased on your course materials, here's what I can share:\n\nThis topic is fundamental in computer science. I'd recommend:\n1. 📖 Reviewing the relevant module in your course\n2. 💻 Practicing with hands-on exercises\n3. 🎥 Watching the supplementary lecture recordings\n\nWould you like me to explain any specific aspect in more detail?`;

    setChatMessages((prev) => [...prev, { role: "ai", content: aiResponse }]);
    setIsChatting(false);
  };

  const handleWriting = async () => {
    if (!writingInput.trim()) return;
    setIsWriting(true);
    await new Promise((r) => setTimeout(r, 2000));
    const outputs: Record<string, string> = {
      essay: `# ${writingInput.slice(0, 50)}\n\n## Introduction\nThe topic of ${writingInput.slice(0, 30)} is fundamental to understanding modern computing paradigms. This essay explores the key concepts, implications, and future directions in this field.\n\n## Main Body\n\n### Key Concepts\nThe core principles underlying this topic can be broken down into several interconnected components. First, we must consider the theoretical foundations that have been established through decades of research...\n\n### Analysis\nWhen examining this from a practical perspective, we observe that implementation details significantly impact real-world outcomes. The interplay between theory and practice remains a central theme...\n\n## Conclusion\nIn summary, this topic represents a critical area of study that continues to evolve. Future research should focus on addressing the identified gaps and exploring novel approaches to existing challenges.`,
      summary: `**Summary of: "${writingInput.slice(0, 40)}..."**\n\n• The main argument centers on the fundamental principles of the subject matter\n• Key supporting evidence includes empirical data and theoretical frameworks\n• Three major themes emerge: conceptual foundations, practical applications, and future implications\n• The conclusion emphasizes the need for continued research and innovation`,
      paraphrase: `Here is a paraphrased version:\n\n"${writingInput.split(" ").map((w, i) => {
        const synonyms: Record<string, string> = { the: "this", is: "represents", and: "as well as", for: "intended for" };
        return synonyms[w.toLowerCase()] || w;
      }).join(" ")}"`,
      grammar: `**Grammar Check Results:**\n\n✅ Overall Score: 92/100\n\n**Suggestions:**\n1. Consider using active voice instead of passive voice in paragraph 2\n2. The comma before "which" should be removed (restrictive clause)\n3. "affect" should be "effect" in the third sentence\n\n**Corrected Text:**\n${writingInput}`,
    };
    setWritingOutput(outputs[writingMode] || outputs.essay);
    setIsWriting(false);
    toast.success("Content generated!");
  };

  const generateFlashcards = async () => {
    if (!flashcardTopic.trim()) return;
    setIsGeneratingCards(true);
    await new Promise((r) => setTimeout(r, 2000));
    const cards: FlashCard[] = [
      { id: "f1", front: `What is a ${flashcardTopic}?`, back: `A ${flashcardTopic} is a fundamental concept in computer science that involves organizing and manipulating data efficiently.`, isFlipped: false, difficulty: "easy" },
      { id: "f2", front: `What is the time complexity of searching in a ${flashcardTopic}?`, back: `The average case is O(log n) for balanced structures, and O(n) for worst case in unbalanced structures.`, isFlipped: false, difficulty: "medium" },
      { id: "f3", front: `Name 3 real-world applications of ${flashcardTopic}`, back: `1. Database indexing\n2. File system organization\n3. Network routing algorithms`, isFlipped: false, difficulty: "easy" },
      { id: "f4", front: `How does insertion work in a ${flashcardTopic}?`, back: `Insertion involves finding the correct position based on the ordering property, then creating a new node and adjusting pointers/references accordingly.`, isFlipped: false, difficulty: "medium" },
      { id: "f5", front: `Compare ${flashcardTopic} with alternative data structures`, back: `Arrays: O(1) access but O(n) insert\nLinked Lists: O(1) insert but O(n) search\n${flashcardTopic}: Balanced trade-offs with O(log n) for most operations`, isFlipped: false, difficulty: "hard" },
      { id: "f6", front: `What are the key properties of a ${flashcardTopic}?`, back: `1. Hierarchical structure\n2. Parent-child relationships\n3. Recursive definition\n4. Height and depth properties`, isFlipped: false, difficulty: "easy" },
    ];
    setFlashcards(cards);
    setCurrentCardIndex(0);
    setIsGeneratingCards(false);
    toast.success(`${cards.length} flashcards generated!`);
  };

  const flipCard = (index: number) => {
    setFlashcards((prev) => prev.map((c, i) => i === index ? { ...c, isFlipped: !c.isFlipped } : c));
  };

  const generateStudyPlan = async () => {
    if (!studyGoal.trim()) return;
    setIsGeneratingPlan(true);
    await new Promise((r) => setTimeout(r, 2000));
    const plan: StudyPlanItem[] = [
      { id: "sp1", day: "Day 1 (Mon)", topic: "Fundamentals Review", duration: "2 hours", resources: ["Textbook Ch. 1-3", "Lecture Notes Week 1"], completed: false },
      { id: "sp2", day: "Day 2 (Tue)", topic: "Core Concepts Deep Dive", duration: "2.5 hours", resources: ["Practice Problems Set 1", "Video: Advanced Concepts"], completed: false },
      { id: "sp3", day: "Day 3 (Wed)", topic: "Problem Solving Practice", duration: "3 hours", resources: ["LeetCode Medium Problems", "Past Exam Questions"], completed: false },
      { id: "sp4", day: "Day 4 (Thu)", topic: "Weak Areas Focus", duration: "2 hours", resources: ["AI Tutor Session", "Supplementary Reading"], completed: false },
      { id: "sp5", day: "Day 5 (Fri)", topic: "Mock Exam & Review", duration: "3 hours", resources: ["Full Practice Exam", "Error Analysis"], completed: false },
      { id: "sp6", day: "Day 6 (Sat)", topic: "Revision & Rest", duration: "1.5 hours", resources: ["Flashcard Review", "Key Formula Sheet"], completed: false },
      { id: "sp7", day: "Day 7 (Sun)", topic: "Final Review & Confidence Building", duration: "2 hours", resources: ["Summary Notes", "Quick Quiz Self-Test"], completed: false },
    ];
    setStudyPlan(plan);
    setIsGeneratingPlan(false);
    toast.success("Study plan generated!");
  };

  const handleSummarize = async () => {
    if (!summaryInput.trim()) return;
    setIsSummarizing(true);
    await new Promise((r) => setTimeout(r, 2000));
    if (summaryLength === "brief") {
      setSummaryOutput(`**Brief Summary:**\n\nThe text discusses the core principles of ${summaryInput.slice(0, 30)}... The main points include:\n\n• **Point 1:** Fundamental concepts and their theoretical underpinnings\n• **Point 2:** Practical applications and real-world implications\n• **Point 3:** Current challenges and future research directions\n\n📊 **Key Statistics:** ${summaryInput.split(" ").length} words → ${Math.ceil(summaryInput.split(" ").length * 0.3)} word summary (70% reduction)`);
    } else {
      setSummaryOutput(`**Detailed Summary:**\n\n### Overview\nThe content explores ${summaryInput.slice(0, 50)}... providing comprehensive coverage of the subject matter.\n\n### Main Arguments\n1. **Theoretical Foundation:** The author establishes a strong base by referencing established frameworks and prior research in the field.\n2. **Methodology:** A systematic approach is taken to analyze the key variables and their interactions.\n3. **Findings:** The evidence supports the main hypothesis while acknowledging limitations.\n\n### Key Takeaways\n- The topic remains relevant in modern contexts\n- Interdisciplinary connections strengthen the analysis\n- Future work should address identified gaps\n\n### Critical Analysis\nWhile the arguments are well-structured, additional empirical evidence would strengthen the conclusions.\n\n📊 **Stats:** ${summaryInput.split(" ").length} words analyzed`);
    }
    setIsSummarizing(false);
    toast.success("Summary generated!");
  };

  const toggleStudyPlanItem = (id: string) => {
    setStudyPlan((prev) => prev.map((item) => item.id === id ? { ...item, completed: !item.completed } : item));
  };

  const recommendedCourses = [
    { title: "Advanced Algorithms", match: 95, reason: "Based on your CS101 performance", difficulty: "Intermediate" },
    { title: "Machine Learning Basics", match: 88, reason: "Trending in your field", difficulty: "Beginner" },
    { title: "Software Engineering", match: 82, reason: "Complements your current courses", difficulty: "Intermediate" },
    { title: "Cloud Computing", match: 78, reason: "High industry demand", difficulty: "Advanced" },
    { title: "Cybersecurity Fundamentals", match: 75, reason: "Growing career opportunity", difficulty: "Beginner" },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Brain className="h-8 w-8 text-primary" />
            AI Services
          </h1>
          <p className="text-muted-foreground">
            AI-powered tools for learning, writing, and academic excellence
          </p>
        </div>

        <Tabs defaultValue={isLecturer ? "grading" : "tutor"}>
          <TabsList className="flex-wrap h-auto gap-1">
            {isLecturer && (
              <>
                <TabsTrigger value="grading">
                  <Sparkles className="h-4 w-4 mr-1" /> AI Grading
                </TabsTrigger>
                <TabsTrigger value="plagiarism">
                  <FileSearch className="h-4 w-4 mr-1" /> Plagiarism
                </TabsTrigger>
              </>
            )}
            <TabsTrigger value="tutor">
              <Lightbulb className="h-4 w-4 mr-1" /> AI Tutor
            </TabsTrigger>
            <TabsTrigger value="writing">
              <PenTool className="h-4 w-4 mr-1" /> Writing
            </TabsTrigger>
            <TabsTrigger value="flashcards">
              <FlipHorizontal className="h-4 w-4 mr-1" /> Flashcards
            </TabsTrigger>
            <TabsTrigger value="studyplan">
              <Calendar className="h-4 w-4 mr-1" /> Study Plan
            </TabsTrigger>
            <TabsTrigger value="summarizer">
              <BookMarked className="h-4 w-4 mr-1" /> Summarizer
            </TabsTrigger>
            <TabsTrigger value="recommendations">
              <TrendingUp className="h-4 w-4 mr-1" /> Recommendations
            </TabsTrigger>
          </TabsList>

          {/* AI Grading */}
          {isLecturer && (
            <TabsContent value="grading" className="space-y-4 mt-4">
              <div className="grid gap-6 lg:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Sparkles className="h-5 w-5 text-primary" /> AI-Assisted Grading
                    </CardTitle>
                    <CardDescription>Paste a student submission to get AI grading suggestions</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Select>
                      <SelectTrigger><SelectValue placeholder="Select assignment" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="a1">Hello World Program</SelectItem>
                        <SelectItem value="a2">Variables Exercise</SelectItem>
                      </SelectContent>
                    </Select>
                    <Textarea placeholder="Paste the student's submission here..." value={gradingText} onChange={(e) => setGradingText(e.target.value)} className="min-h-[200px] font-mono text-sm" />
                    <Button onClick={mockGrade} disabled={isGrading || !gradingText.trim()} className="w-full">
                      {isGrading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Analyzing...</> : <><Sparkles className="h-4 w-4 mr-2" /> Grade with AI</>}
                    </Button>
                  </CardContent>
                </Card>
                {gradingResult && (
                  <Card>
                    <CardHeader>
                      <CardTitle>AI Grading Result</CardTitle>
                      <CardDescription>Review and adjust before finalizing</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center gap-4">
                        <div className="text-4xl font-bold text-primary">{gradingResult.score}</div>
                        <div className="text-sm text-muted-foreground">/ 100 points</div>
                      </div>
                      <p className="text-sm">{gradingResult.feedback}</p>
                      <div>
                        <p className="text-sm font-medium mb-2 flex items-center gap-1"><CheckCircle2 className="h-4 w-4 text-success" /> Strengths</p>
                        <ul className="space-y-1">{gradingResult.strengths.map((s, i) => <li key={i} className="text-sm text-muted-foreground flex items-start gap-2"><span className="text-success mt-1">•</span> {s}</li>)}</ul>
                      </div>
                      <div>
                        <p className="text-sm font-medium mb-2 flex items-center gap-1"><AlertTriangle className="h-4 w-4 text-warning" /> Areas for Improvement</p>
                        <ul className="space-y-1">{gradingResult.improvements.map((s, i) => <li key={i} className="text-sm text-muted-foreground flex items-start gap-2"><span className="text-warning mt-1">•</span> {s}</li>)}</ul>
                      </div>
                      <Button className="w-full" variant="outline">Apply to Submission</Button>
                    </CardContent>
                  </Card>
                )}
              </div>
            </TabsContent>
          )}

          {/* Plagiarism Check */}
          {isLecturer && (
            <TabsContent value="plagiarism" className="space-y-4 mt-4">
              <div className="grid gap-6 lg:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2"><FileSearch className="h-5 w-5 text-primary" /> Plagiarism Detection</CardTitle>
                    <CardDescription>Check student submissions for potential plagiarism</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Textarea placeholder="Paste text to check for plagiarism..." value={plagiarismText} onChange={(e) => setPlagiarismText(e.target.value)} className="min-h-[200px]" />
                    <Button onClick={mockPlagiarismCheck} disabled={isChecking || !plagiarismText.trim()} className="w-full">
                      {isChecking ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Scanning...</> : <><FileSearch className="h-4 w-4 mr-2" /> Check for Plagiarism</>}
                    </Button>
                  </CardContent>
                </Card>
                {plagiarismResult && (
                  <Card>
                    <CardHeader><CardTitle>Plagiarism Report</CardTitle></CardHeader>
                    <CardContent className="space-y-4">
                      <div className="text-center p-6">
                        <div className={`text-5xl font-bold mb-2 ${plagiarismResult.score < 20 ? "text-success" : plagiarismResult.score < 50 ? "text-warning" : "text-destructive"}`}>{plagiarismResult.score}%</div>
                        <p className="text-sm text-muted-foreground">Similarity Score</p>
                        <Badge variant={plagiarismResult.score < 20 ? "default" : "destructive"} className="mt-2">{plagiarismResult.score < 20 ? "Low Risk" : plagiarismResult.score < 50 ? "Medium Risk" : "High Risk"}</Badge>
                      </div>
                      <div>
                        <p className="text-sm font-medium mb-2">Matched Sources</p>
                        {plagiarismResult.sources.map((source, i) => (
                          <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-muted mb-1">
                            <span className="text-sm truncate flex-1">{source.url}</span>
                            <Badge variant="outline">{source.match}%</Badge>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </TabsContent>
          )}

          {/* AI Tutor */}
          <TabsContent value="tutor" className="mt-4">
            <Card className="h-[600px] flex flex-col">
              <CardHeader className="pb-3 border-b">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2"><Lightbulb className="h-5 w-5 text-primary" /> AI Learning Assistant</CardTitle>
                    <CardDescription>Ask questions about your course material</CardDescription>
                  </div>
                  <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                    <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="general">All Subjects</SelectItem>
                      <SelectItem value="cs">Computer Science</SelectItem>
                      <SelectItem value="math">Mathematics</SelectItem>
                      <SelectItem value="physics">Physics</SelectItem>
                      <SelectItem value="writing">Academic Writing</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {/* Quick Prompts */}
                <div className="flex gap-2 mt-2 overflow-x-auto pb-1">
                  {["Explain recursion", "What is Big O?", "SQL JOIN types", "Binary trees"].map((prompt) => (
                    <Button key={prompt} variant="outline" size="sm" className="text-xs flex-shrink-0 h-7" onClick={() => { setChatInput(prompt); }}>
                      {prompt}
                    </Button>
                  ))}
                </div>
              </CardHeader>
              <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
                {chatMessages.map((msg, i) => (
                  <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[80%] p-3 rounded-lg text-sm ${msg.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
                      <p className="whitespace-pre-wrap">{msg.content}</p>
                      {msg.role === "ai" && (
                        <div className="flex items-center gap-1 mt-2 pt-2 border-t border-border/50">
                          <Button variant="ghost" size="sm" className="h-6 w-6 p-0"><ThumbsUp className="h-3 w-3" /></Button>
                          <Button variant="ghost" size="sm" className="h-6 w-6 p-0"><ThumbsDown className="h-3 w-3" /></Button>
                          <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => { navigator.clipboard.writeText(msg.content); toast.success("Copied!"); }}><Copy className="h-3 w-3" /></Button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                {isChatting && (
                  <div className="flex justify-start">
                    <div className="bg-muted p-3 rounded-lg flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span className="text-sm text-muted-foreground">Thinking...</span>
                    </div>
                  </div>
                )}
              </CardContent>
              <div className="p-4 border-t">
                <div className="flex gap-2">
                  <Textarea
                    placeholder="Ask about any course topic..."
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    className="min-h-[44px] max-h-[100px] resize-none"
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleChat(); }
                    }}
                  />
                  <Button onClick={handleChat} disabled={!chatInput.trim() || isChatting}>
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </Card>
          </TabsContent>

          {/* Writing Assistant */}
          <TabsContent value="writing" className="mt-4">
            <div className="grid gap-6 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><PenTool className="h-5 w-5 text-primary" /> Writing Assistant</CardTitle>
                  <CardDescription>Generate, improve, and check your academic writing</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex gap-2">
                    {(["essay", "summary", "paraphrase", "grammar"] as const).map((mode) => (
                      <Button key={mode} variant={writingMode === mode ? "default" : "outline"} size="sm" className="capitalize text-xs" onClick={() => setWritingMode(mode)}>
                        {mode}
                      </Button>
                    ))}
                  </div>
                  <Textarea
                    placeholder={writingMode === "essay" ? "Enter your topic or thesis..." : writingMode === "grammar" ? "Paste your text to check..." : "Paste your text here..."}
                    value={writingInput}
                    onChange={(e) => setWritingInput(e.target.value)}
                    className="min-h-[200px]"
                  />
                  <Button onClick={handleWriting} disabled={isWriting || !writingInput.trim()} className="w-full">
                    {isWriting ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Generating...</> : <><Wand2 className="h-4 w-4 mr-2" /> Generate</>}
                  </Button>
                </CardContent>
              </Card>
              {writingOutput && (
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle>Result</CardTitle>
                      <Button variant="ghost" size="sm" onClick={() => { navigator.clipboard.writeText(writingOutput); toast.success("Copied!"); }}>
                        <Copy className="h-4 w-4 mr-1" /> Copy
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-[350px]">
                      <p className="text-sm whitespace-pre-wrap">{writingOutput}</p>
                    </ScrollArea>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* Flashcards */}
          <TabsContent value="flashcards" className="mt-4">
            <div className="space-y-6">
              {flashcards.length === 0 ? (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2"><FlipHorizontal className="h-5 w-5 text-primary" /> AI Flashcard Generator</CardTitle>
                    <CardDescription>Enter a topic and AI will generate study flashcards</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex gap-2">
                      <Input
                        placeholder="e.g., Binary Search Trees, SQL Joins, Sorting Algorithms..."
                        value={flashcardTopic}
                        onChange={(e) => setFlashcardTopic(e.target.value)}
                        onKeyDown={(e) => { if (e.key === "Enter") generateFlashcards(); }}
                      />
                      <Button onClick={generateFlashcards} disabled={isGeneratingCards || !flashcardTopic.trim()}>
                        {isGeneratingCards ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                      </Button>
                    </div>
                    <div className="text-center py-12">
                      <FlipHorizontal className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                      <p className="text-muted-foreground">Enter a topic to generate flashcards</p>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <>
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-xl font-semibold">{flashcardTopic} Flashcards</h2>
                      <p className="text-sm text-muted-foreground">{currentCardIndex + 1} of {flashcards.length}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => { setFlashcards([]); setFlashcardTopic(""); }}>
                        <RotateCcw className="h-4 w-4 mr-1" /> New Topic
                      </Button>
                    </div>
                  </div>
                  {/* Card Display */}
                  <Card
                    className="min-h-[300px] cursor-pointer hover:shadow-lg transition-all"
                    onClick={() => flipCard(currentCardIndex)}
                  >
                    <CardContent className="flex items-center justify-center h-full p-8 min-h-[300px]">
                      <div className="text-center max-w-lg">
                        <Badge variant="outline" className="mb-4">
                          {flashcards[currentCardIndex].isFlipped ? "Answer" : "Question"} · {flashcards[currentCardIndex].difficulty}
                        </Badge>
                        <p className="text-lg whitespace-pre-wrap">
                          {flashcards[currentCardIndex].isFlipped
                            ? flashcards[currentCardIndex].back
                            : flashcards[currentCardIndex].front}
                        </p>
                        {!flashcards[currentCardIndex].isFlipped && (
                          <p className="text-xs text-muted-foreground mt-4">Click to reveal answer</p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                  {/* Navigation */}
                  <div className="flex items-center justify-center gap-4">
                    <Button variant="outline" disabled={currentCardIndex === 0} onClick={() => setCurrentCardIndex((i) => i - 1)}>Previous</Button>
                    <div className="flex gap-1">
                      {flashcards.map((_, i) => (
                        <button key={i} className={`w-2.5 h-2.5 rounded-full transition-colors ${i === currentCardIndex ? "bg-primary" : "bg-muted"}`} onClick={() => setCurrentCardIndex(i)} />
                      ))}
                    </div>
                    <Button variant="outline" disabled={currentCardIndex === flashcards.length - 1} onClick={() => setCurrentCardIndex((i) => i + 1)}>Next</Button>
                  </div>
                </>
              )}
            </div>
          </TabsContent>

          {/* Study Plan */}
          <TabsContent value="studyplan" className="mt-4">
            <div className="space-y-6">
              {studyPlan.length === 0 ? (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Calendar className="h-5 w-5 text-primary" /> AI Study Plan Generator</CardTitle>
                    <CardDescription>Get a personalized 7-day study plan for any exam or topic</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Input placeholder="e.g., CS101 Midterm, Data Structures Final..." value={studyGoal} onChange={(e) => setStudyGoal(e.target.value)} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Exam Date</label>
                        <Input type="date" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Daily Study Hours</label>
                        <Select defaultValue="2">
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="1">1 hour</SelectItem>
                            <SelectItem value="2">2 hours</SelectItem>
                            <SelectItem value="3">3 hours</SelectItem>
                            <SelectItem value="4">4+ hours</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <Button onClick={generateStudyPlan} disabled={isGeneratingPlan || !studyGoal.trim()} className="w-full">
                      {isGeneratingPlan ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Generating Plan...</> : <><Calendar className="h-4 w-4 mr-2" /> Generate Study Plan</>}
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <>
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-xl font-semibold">Study Plan: {studyGoal}</h2>
                      <p className="text-sm text-muted-foreground">
                        {studyPlan.filter((s) => s.completed).length} of {studyPlan.length} days completed
                      </p>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => setStudyPlan([])}>
                      <RotateCcw className="h-4 w-4 mr-1" /> New Plan
                    </Button>
                  </div>
                  <Progress value={(studyPlan.filter((s) => s.completed).length / studyPlan.length) * 100} className="h-2" />
                  <div className="space-y-3">
                    {studyPlan.map((item) => (
                      <Card key={item.id} className={`transition-all ${item.completed ? "opacity-60" : ""}`}>
                        <CardContent className="pt-4">
                          <div className="flex items-start gap-4">
                            <button
                              onClick={() => toggleStudyPlanItem(item.id)}
                              className={`mt-0.5 w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                                item.completed ? "bg-success border-success text-success-foreground" : "border-muted-foreground/30"
                              }`}
                            >
                              {item.completed && <CheckCircle2 className="h-4 w-4" />}
                            </button>
                            <div className="flex-1">
                              <div className="flex items-center justify-between">
                                <h3 className={`font-medium ${item.completed ? "line-through" : ""}`}>{item.day}</h3>
                                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                  <Clock className="h-3 w-3" /> {item.duration}
                                </div>
                              </div>
                              <p className="text-sm text-muted-foreground mt-0.5">{item.topic}</p>
                              <div className="flex flex-wrap gap-1 mt-2">
                                {item.resources.map((r, i) => (
                                  <Badge key={i} variant="secondary" className="text-[10px]">{r}</Badge>
                                ))}
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </>
              )}
            </div>
          </TabsContent>

          {/* Content Summarizer */}
          <TabsContent value="summarizer" className="mt-4">
            <div className="grid gap-6 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><BookMarked className="h-5 w-5 text-primary" /> Content Summarizer</CardTitle>
                  <CardDescription>Paste lecture notes, articles, or textbook content to get a summary</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex gap-2">
                    <Button variant={summaryLength === "brief" ? "default" : "outline"} size="sm" className="text-xs" onClick={() => setSummaryLength("brief")}>Brief</Button>
                    <Button variant={summaryLength === "detailed" ? "default" : "outline"} size="sm" className="text-xs" onClick={() => setSummaryLength("detailed")}>Detailed</Button>
                  </div>
                  <Textarea placeholder="Paste your content here..." value={summaryInput} onChange={(e) => setSummaryInput(e.target.value)} className="min-h-[250px]" />
                  <Button onClick={handleSummarize} disabled={isSummarizing || !summaryInput.trim()} className="w-full">
                    {isSummarizing ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Summarizing...</> : <><BookMarked className="h-4 w-4 mr-2" /> Summarize</>}
                  </Button>
                </CardContent>
              </Card>
              {summaryOutput && (
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle>Summary</CardTitle>
                      <Button variant="ghost" size="sm" onClick={() => { navigator.clipboard.writeText(summaryOutput); toast.success("Copied!"); }}>
                        <Copy className="h-4 w-4 mr-1" /> Copy
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-[350px]">
                      <p className="text-sm whitespace-pre-wrap">{summaryOutput}</p>
                    </ScrollArea>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* Recommendations */}
          <TabsContent value="recommendations" className="space-y-4 mt-4">
            <div className="grid gap-6 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><GraduationCap className="h-5 w-5 text-primary" /> Course Recommendations</CardTitle>
                  <CardDescription>Personalized suggestions based on your learning path</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {recommendedCourses.map((course, i) => (
                    <div key={i} className="flex items-center gap-4 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <BookOpen className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-sm">{course.title}</p>
                        <p className="text-xs text-muted-foreground">{course.reason}</p>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center gap-1">
                          <Star className="h-4 w-4 text-warning fill-warning" />
                          <span className="text-sm font-medium">{course.match}%</span>
                        </div>
                        <Badge variant="outline" className="text-[10px] mt-1">{course.difficulty}</Badge>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><Zap className="h-5 w-5 text-warning" /> Learning Insights</CardTitle>
                  <CardDescription>AI-generated analysis of your learning patterns</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    {[
                      { name: "Problem Solving", value: 85 },
                      { name: "Code Quality", value: 72 },
                      { name: "Time Management", value: 90 },
                      { name: "Collaboration", value: 78 },
                      { name: "Research Skills", value: 83 },
                    ].map((skill) => (
                      <div key={skill.name}>
                        <div className="flex justify-between text-sm mb-1">
                          <span>{skill.name}</span>
                          <span className="font-medium">{skill.value}%</span>
                        </div>
                        <Progress value={skill.value} className="h-2" />
                      </div>
                    ))}
                  </div>
                  <div className="p-3 rounded-lg bg-primary/5 border border-primary/10">
                    <p className="text-sm font-medium flex items-center gap-1 mb-1">
                      <Lightbulb className="h-4 w-4 text-primary" /> AI Tip
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Your problem-solving skills are strong! Focus on improving code documentation and comments to boost your Code Quality score. Try the Writing Assistant to practice technical documentation.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
