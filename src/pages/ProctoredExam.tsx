import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAssignments } from "@/contexts/AssignmentContext";
import { useCourses } from "@/contexts/CourseContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Clock, ChevronLeft, ChevronRight, CheckCircle2, XCircle,
  AlertTriangle, Shield, Camera, Eye, MonitorX, Maximize,
} from "lucide-react";
import { QuizAnswer } from "@/types/assignment";
import { toast } from "sonner";

// Activity log for proctoring
interface ActivityLog {
  id: string;
  type: "tab-switch" | "copy-attempt" | "screenshot-attempt" | "fullscreen-exit" | "right-click" | "devtools";
  timestamp: Date;
  details: string;
}

export default function ProctoredExam() {
  const { quizId } = useParams<{ quizId: string }>();
  const navigate = useNavigate();
  const { quizzes, startQuizAttempt, submitQuizAttempt, getQuizAttempt } = useAssignments();
  const { courses } = useCourses();

  const quiz = quizzes.find((q) => q.id === quizId);
  const course = courses.find((c) => c.id === quiz?.courseId);
  const existingAttempt = quiz ? getQuizAttempt(quiz.id) : null;

  const [examStarted, setExamStarted] = useState(false);
  const [currentAttempt, setCurrentAttempt] = useState(existingAttempt);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string | number>>({});
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const [showConfirmSubmit, setShowConfirmSubmit] = useState(false);
  const [showResults, setShowResults] = useState(existingAttempt?.status === "completed");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [violations, setViolations] = useState(0);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const maxViolations = 5;

  const addLog = useCallback((type: ActivityLog["type"], details: string) => {
    setActivityLogs((prev) => [
      { id: Date.now().toString(), type, timestamp: new Date(), details },
      ...prev,
    ]);
    setViolations((prev) => {
      const next = prev + 1;
      if (next >= maxViolations) {
        toast.error("Maximum violations reached. Your exam will be submitted automatically.", { duration: 5000 });
      }
      return next;
    });
    toast.warning(`⚠️ Violation detected: ${details}`, { duration: 3000 });
  }, []);

  // Start camera for proctoring
  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 320, height: 240, facingMode: "user" },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setCameraActive(true);
    } catch {
      setCameraError(true);
      toast.error("Camera access is required for proctored exams.");
    }
  }, []);

  // Stop camera
  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setCameraActive(false);
  }, []);

  // Request fullscreen
  const enterFullscreen = useCallback(async () => {
    try {
      await document.documentElement.requestFullscreen();
    } catch {
      toast.error("Fullscreen mode is required for this exam.");
    }
  }, []);

  // Anti-cheating event handlers
  useEffect(() => {
    if (!examStarted || showResults) return;

    // Prevent copy/paste/cut
    const preventCopy = (e: Event) => {
      e.preventDefault();
      addLog("copy-attempt", "Attempted to copy/paste content");
    };

    // Prevent right-click
    const preventContextMenu = (e: Event) => {
      e.preventDefault();
      addLog("right-click", "Attempted to open context menu");
    };

    // Detect tab/window switch
    const handleVisibilityChange = () => {
      if (document.hidden) {
        addLog("tab-switch", "Switched away from exam tab");
      }
    };

    // Detect window blur
    const handleBlur = () => {
      addLog("tab-switch", "Window lost focus");
    };

    // Detect fullscreen exit
    const handleFullscreenChange = () => {
      if (!document.fullscreenElement && examStarted) {
        addLog("fullscreen-exit", "Exited fullscreen mode");
        enterFullscreen();
      }
    };

    // Detect keyboard shortcuts (PrintScreen, devtools, etc.)
    const handleKeyDown = (e: KeyboardEvent) => {
      // Block PrintScreen
      if (e.key === "PrintScreen") {
        e.preventDefault();
        addLog("screenshot-attempt", "Attempted to take screenshot");
      }
      // Block Ctrl+Shift+I / F12 (devtools)
      if ((e.ctrlKey && e.shiftKey && e.key === "I") || e.key === "F12") {
        e.preventDefault();
        addLog("devtools", "Attempted to open developer tools");
      }
      // Block Ctrl+C, Ctrl+V, Ctrl+A
      if (e.ctrlKey && ["c", "v", "a", "x", "u", "s", "p"].includes(e.key.toLowerCase())) {
        e.preventDefault();
        addLog("copy-attempt", `Attempted keyboard shortcut: Ctrl+${e.key.toUpperCase()}`);
      }
    };

    document.addEventListener("copy", preventCopy);
    document.addEventListener("paste", preventCopy);
    document.addEventListener("cut", preventCopy);
    document.addEventListener("contextmenu", preventContextMenu);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("blur", handleBlur);
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("copy", preventCopy);
      document.removeEventListener("paste", preventCopy);
      document.removeEventListener("cut", preventCopy);
      document.removeEventListener("contextmenu", preventContextMenu);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("blur", handleBlur);
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [examStarted, showResults, addLog, enterFullscreen]);

  // Auto-submit on max violations
  useEffect(() => {
    if (violations >= maxViolations && examStarted && !showResults) {
      handleSubmit();
    }
  }, [violations]);

  // Start exam
  const handleStartExam = async () => {
    if (!quiz) return;
    await startCamera();
    await enterFullscreen();

    if (!existingAttempt) {
      const attempt = await startQuizAttempt(quiz.id);
      setCurrentAttempt(attempt);
      if (quiz.timeLimit) setTimeRemaining(quiz.timeLimit * 60);
    } else if (existingAttempt.status === "in-progress") {
      setCurrentAttempt(existingAttempt);
      if (quiz.timeLimit) {
        const elapsed = Math.floor((Date.now() - new Date(existingAttempt.startedAt).getTime()) / 1000);
        setTimeRemaining(Math.max(0, quiz.timeLimit * 60 - elapsed));
      }
    }
    setExamStarted(true);
  };

  // Timer
  useEffect(() => {
    if (timeRemaining === null || showResults) return;
    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev === null || prev <= 0) {
          clearInterval(timer);
          handleSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [timeRemaining, showResults]);

  const handleSubmit = useCallback(async () => {
    if (!currentAttempt || !quiz || isSubmitting) return;
    setIsSubmitting(true);

    const quizAnswers: QuizAnswer[] = quiz.questions.map((q) => ({
      questionId: q.id,
      answer: answers[q.id] ?? "",
    }));

    try {
      const result = await submitQuizAttempt(currentAttempt.id, quizAnswers);
      setCurrentAttempt(result);
      setShowResults(true);
      stopCamera();
      if (document.fullscreenElement) document.exitFullscreen();
      toast.success("Exam submitted successfully!");
    } catch {
      toast.error("Failed to submit exam");
    } finally {
      setIsSubmitting(false);
    }
  }, [currentAttempt, quiz, answers, submitQuizAttempt, isSubmitting, stopCamera]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  if (!quiz) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="max-w-md w-full">
          <CardContent className="py-12 text-center">
            <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Exam not found</h2>
            <Button onClick={() => navigate("/quizzes")}>Back to Quiz & Exam</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Pre-exam screen
  if (!examStarted && !showResults) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-xl w-full">
          <CardHeader className="text-center">
            <div className="mx-auto p-4 rounded-full bg-destructive/10 mb-4">
              <Shield className="h-10 w-10 text-destructive" />
            </div>
            <CardTitle className="text-2xl">Proctored Exam</CardTitle>
            <p className="text-muted-foreground mt-2">{quiz.title}</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 rounded-lg bg-destructive/5 border border-destructive/20">
              <h3 className="font-semibold text-sm mb-2 text-destructive">⚠️ Exam Rules</h3>
              <ul className="text-xs text-muted-foreground space-y-1.5">
                <li>• Your camera will be active throughout the exam for monitoring</li>
                <li>• The exam will enter fullscreen mode — do not exit</li>
                <li>• Copy, paste, and text selection are disabled</li>
                <li>• Switching tabs or windows will be recorded as violations</li>
                <li>• Screenshots and developer tools are blocked</li>
                <li>• After {maxViolations} violations, your exam will be auto-submitted</li>
                <li>• Right-clicking is disabled during the exam</li>
              </ul>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="p-3 rounded-lg bg-muted">
                <p className="text-muted-foreground text-xs">Questions</p>
                <p className="font-semibold">{quiz.questions.length}</p>
              </div>
              <div className="p-3 rounded-lg bg-muted">
                <p className="text-muted-foreground text-xs">Time Limit</p>
                <p className="font-semibold">{quiz.timeLimit ? `${quiz.timeLimit} minutes` : "No limit"}</p>
              </div>
              <div className="p-3 rounded-lg bg-muted">
                <p className="text-muted-foreground text-xs">Total Points</p>
                <p className="font-semibold">{quiz.questions.reduce((s, q) => s + q.points, 0)}</p>
              </div>
              <div className="p-3 rounded-lg bg-muted">
                <p className="text-muted-foreground text-xs">Course</p>
                <p className="font-semibold">{course?.code || "—"}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg border">
              <Camera className="h-5 w-5 text-muted-foreground" />
              <div className="flex-1">
                <p className="text-sm font-medium">Camera access required</p>
                <p className="text-xs text-muted-foreground">Your browser will ask for camera permission</p>
              </div>
            </div>
            <Button className="w-full" size="lg" onClick={handleStartExam}>
              <Shield className="h-4 w-4 mr-2" />
              Start Proctored Exam
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Results screen
  if (showResults && currentAttempt) {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="max-w-3xl mx-auto space-y-6">
          <Card className="border-t-4 border-t-primary">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">Exam Complete!</CardTitle>
              <p className="text-muted-foreground">{quiz.title}</p>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <div className="inline-flex items-center justify-center w-32 h-32 rounded-full bg-primary/10 mb-4">
                <div className="text-center">
                  <p className="text-3xl font-bold text-primary">{currentAttempt.score}</p>
                  <p className="text-sm text-muted-foreground">/ {currentAttempt.maxScore}</p>
                </div>
              </div>
              <p className="text-lg font-medium">
                {Math.round((currentAttempt.score! / currentAttempt.maxScore) * 100)}% Score
              </p>
              <div className="flex justify-center gap-4">
                <Badge variant="outline"><CheckCircle2 className="h-3 w-3 mr-1 text-success" />{currentAttempt.answers.filter((a) => a.isCorrect).length} Correct</Badge>
                <Badge variant="outline"><XCircle className="h-3 w-3 mr-1 text-destructive" />{currentAttempt.answers.filter((a) => !a.isCorrect).length} Incorrect</Badge>
              </div>
              {violations > 0 && (
                <div className="p-3 rounded-lg bg-warning/10 border border-warning/20 mt-4">
                  <p className="text-sm font-medium text-warning">{violations} violation(s) recorded during this exam</p>
                </div>
              )}
            </CardContent>
          </Card>
          <Button onClick={() => navigate("/quizzes")} className="w-full">Back to Quiz & Exam</Button>
        </div>
      </div>
    );
  }

  // Active exam
  const currentQuestion = quiz.questions[currentQuestionIndex];
  const answeredCount = Object.keys(answers).length;
  const progress = (answeredCount / quiz.questions.length) * 100;

  return (
    <div
      className="min-h-screen bg-background select-none"
      style={{ userSelect: "none", WebkitUserSelect: "none" }}
      onDragStart={(e) => e.preventDefault()}
    >
      {/* Proctoring Header */}
      <div className="sticky top-0 z-50 bg-card border-b px-4 py-2">
        <div className="flex items-center justify-between max-w-5xl mx-auto">
          <div className="flex items-center gap-3">
            <Shield className="h-5 w-5 text-destructive" />
            <div>
              <p className="font-semibold text-sm">{quiz.title}</p>
              <p className="text-xs text-muted-foreground">{course?.code} — Proctored</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {/* Camera feed */}
            <div className="relative w-24 h-18 rounded-lg overflow-hidden border-2 border-destructive/30 bg-black">
              <video
                ref={videoRef}
                autoPlay
                muted
                playsInline
                className="w-full h-full object-cover"
              />
              {cameraActive && (
                <div className="absolute top-1 right-1 w-2 h-2 rounded-full bg-destructive animate-pulse" />
              )}
              {cameraError && (
                <div className="absolute inset-0 flex items-center justify-center bg-destructive/20">
                  <Camera className="h-4 w-4 text-destructive" />
                </div>
              )}
            </div>
            {/* Violations */}
            <div className={`px-3 py-1.5 rounded-lg text-xs font-medium ${
              violations > 0 ? "bg-destructive/10 text-destructive" : "bg-success/10 text-success"
            }`}>
              {violations}/{maxViolations} violations
            </div>
            {/* Timer */}
            {timeRemaining !== null && (
              <div className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
                timeRemaining < 60 ? "bg-destructive/10 text-destructive" :
                timeRemaining < 300 ? "bg-warning/10 text-warning" : "bg-muted"
              }`}>
                <Clock className="h-4 w-4" />
                <span className="font-mono font-bold">{formatTime(timeRemaining)}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto p-6 space-y-6">
        {/* Progress */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Progress</span>
            <span>{answeredCount} of {quiz.questions.length} answered</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Question Nav */}
        <div className="flex flex-wrap gap-2">
          {quiz.questions.map((q, idx) => (
            <Button
              key={q.id}
              variant={currentQuestionIndex === idx ? "default" : answers[q.id] !== undefined ? "secondary" : "outline"}
              size="sm"
              className="w-10 h-10"
              onClick={() => setCurrentQuestionIndex(idx)}
            >
              {idx + 1}
            </Button>
          ))}
        </div>

        {/* Question */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <Badge variant="outline">Question {currentQuestionIndex + 1} of {quiz.questions.length}</Badge>
              <Badge>{currentQuestion.points} points</Badge>
            </div>
            <CardTitle className="text-lg mt-4">{currentQuestion.question}</CardTitle>
          </CardHeader>
          <CardContent>
            {currentQuestion.type === "multiple-choice" && (
              <RadioGroup
                value={String(answers[currentQuestion.id] ?? "")}
                onValueChange={(value) => setAnswers((prev) => ({ ...prev, [currentQuestion.id]: parseInt(value) }))}
              >
                <div className="space-y-3">
                  {currentQuestion.options?.map((option, idx) => (
                    <div key={idx} className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-muted/50 cursor-pointer">
                      <RadioGroupItem value={String(idx)} id={`opt-${idx}`} />
                      <Label htmlFor={`opt-${idx}`} className="flex-1 cursor-pointer">{option}</Label>
                    </div>
                  ))}
                </div>
              </RadioGroup>
            )}
            {currentQuestion.type === "true-false" && (
              <RadioGroup
                value={String(answers[currentQuestion.id] ?? "")}
                onValueChange={(value) => setAnswers((prev) => ({ ...prev, [currentQuestion.id]: parseInt(value) }))}
              >
                <div className="space-y-3">
                  {["True", "False"].map((option, idx) => (
                    <div key={idx} className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-muted/50 cursor-pointer">
                      <RadioGroupItem value={String(idx)} id={`tf-${idx}`} />
                      <Label htmlFor={`tf-${idx}`} className="flex-1 cursor-pointer">{option}</Label>
                    </div>
                  ))}
                </div>
              </RadioGroup>
            )}
            {currentQuestion.type === "short-answer" && (
              <Input
                placeholder="Type your answer here..."
                value={String(answers[currentQuestion.id] ?? "")}
                onChange={(e) => setAnswers((prev) => ({ ...prev, [currentQuestion.id]: e.target.value }))}
                className="max-w-md"
                onPaste={(e) => e.preventDefault()}
              />
            )}
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <Button variant="outline" onClick={() => setCurrentQuestionIndex((p) => Math.max(0, p - 1))} disabled={currentQuestionIndex === 0}>
            <ChevronLeft className="h-4 w-4 mr-1" /> Previous
          </Button>
          <div className="flex gap-2">
            {currentQuestionIndex < quiz.questions.length - 1 ? (
              <Button onClick={() => setCurrentQuestionIndex((p) => Math.min(quiz.questions.length - 1, p + 1))}>
                Next <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            ) : (
              <Button onClick={() => setShowConfirmSubmit(true)}>Submit Exam</Button>
            )}
          </div>
        </div>
      </div>

      {/* Submit Confirmation */}
      <AlertDialog open={showConfirmSubmit} onOpenChange={setShowConfirmSubmit}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Submit Exam?</AlertDialogTitle>
            <AlertDialogDescription>
              You have answered {answeredCount} of {quiz.questions.length} questions.
              {answeredCount < quiz.questions.length && (
                <span className="block mt-2 text-warning font-medium">
                  ⚠️ You have {quiz.questions.length - answeredCount} unanswered questions.
                </span>
              )}
              {violations > 0 && (
                <span className="block mt-2 text-destructive font-medium">
                  {violations} violation(s) have been recorded.
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Continue Exam</AlertDialogCancel>
            <AlertDialogAction onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? "Submitting..." : "Submit Exam"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}