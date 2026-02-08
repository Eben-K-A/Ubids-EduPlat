import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Clock, ChevronLeft, ChevronRight, CheckCircle2, XCircle, AlertTriangle } from "lucide-react";
import { QuizAnswer } from "@/types/assignment";
import { toast } from "sonner";

export default function QuizAttempt() {
  const { quizId } = useParams<{ quizId: string }>();
  const navigate = useNavigate();
  const { quizzes, startQuizAttempt, submitQuizAttempt, getQuizAttempt } = useAssignments();
  const { courses } = useCourses();

  const quiz = quizzes.find((q) => q.id === quizId);
  const course = courses.find((c) => c.id === quiz?.courseId);
  const existingAttempt = quiz ? getQuizAttempt(quiz.id) : null;

  const [currentAttempt, setCurrentAttempt] = useState(existingAttempt);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string | number>>({});
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const [showConfirmSubmit, setShowConfirmSubmit] = useState(false);
  const [showResults, setShowResults] = useState(existingAttempt?.status === "completed");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Start quiz attempt
  useEffect(() => {
    const initQuiz = async () => {
      if (quiz && !existingAttempt) {
        const attempt = await startQuizAttempt(quiz.id);
        setCurrentAttempt(attempt);
        if (quiz.timeLimit) {
          setTimeRemaining(quiz.timeLimit * 60);
        }
      } else if (existingAttempt?.status === "in-progress") {
        setCurrentAttempt(existingAttempt);
        // Restore time if there's a time limit
        if (quiz?.timeLimit) {
          const elapsed = Math.floor(
            (Date.now() - new Date(existingAttempt.startedAt).getTime()) / 1000
          );
          const remaining = quiz.timeLimit * 60 - elapsed;
          setTimeRemaining(Math.max(0, remaining));
        }
      } else if (existingAttempt?.status === "completed") {
        setShowResults(true);
        setCurrentAttempt(existingAttempt);
        // Restore answers from attempt
        const restoredAnswers: Record<string, string | number> = {};
        existingAttempt.answers.forEach((a) => {
          restoredAnswers[a.questionId] = a.answer;
        });
        setAnswers(restoredAnswers);
      }
    };
    initQuiz();
  }, [quiz, existingAttempt, startQuizAttempt]);

  // Timer countdown
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
      toast.success("Quiz submitted successfully!");
    } catch (error) {
      toast.error("Failed to submit quiz");
    } finally {
      setIsSubmitting(false);
    }
  }, [currentAttempt, quiz, answers, submitQuizAttempt, isSubmitting]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  if (!quiz) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center min-h-[400px]">
          <AlertTriangle className="h-12 w-12 text-muted-foreground mb-4" />
          <h2 className="text-xl font-semibold mb-2">Quiz not found</h2>
          <Button onClick={() => navigate("/quizzes")}>Back to Quizzes</Button>
        </div>
      </DashboardLayout>
    );
  }

  const currentQuestion = quiz.questions[currentQuestionIndex];
  const answeredCount = Object.keys(answers).length;
  const progress = (answeredCount / quiz.questions.length) * 100;

  if (showResults && currentAttempt) {
    return (
      <DashboardLayout>
        <div className="max-w-3xl mx-auto space-y-6">
          {/* Results Header */}
          <Card className="border-t-4 border-t-primary">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">Quiz Complete!</CardTitle>
              <p className="text-muted-foreground">{quiz.title}</p>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <div className="inline-flex items-center justify-center w-32 h-32 rounded-full bg-primary/10 mb-4">
                <div className="text-center">
                  <p className="text-3xl font-bold text-primary">
                    {currentAttempt.score}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    / {currentAttempt.maxScore}
                  </p>
                </div>
              </div>
              <p className="text-lg font-medium">
                {Math.round((currentAttempt.score! / currentAttempt.maxScore) * 100)}% Score
              </p>
              <div className="flex justify-center gap-4">
                <Badge variant="outline" className="text-sm">
                  <CheckCircle2 className="h-3 w-3 mr-1 text-success" />
                  {currentAttempt.answers.filter((a) => a.isCorrect).length} Correct
                </Badge>
                <Badge variant="outline" className="text-sm">
                  <XCircle className="h-3 w-3 mr-1 text-destructive" />
                  {currentAttempt.answers.filter((a) => !a.isCorrect).length} Incorrect
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Answer Review */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Review Answers</h3>
            {quiz.questions.map((question, idx) => {
              const answer = currentAttempt.answers.find(
                (a) => a.questionId === question.id
              );
              const isCorrect = answer?.isCorrect;

              return (
                <Card
                  key={question.id}
                  className={`border-l-4 ${
                    isCorrect ? "border-l-success" : "border-l-destructive"
                  }`}
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <p className="font-medium">
                        {idx + 1}. {question.question}
                      </p>
                      <Badge variant={isCorrect ? "default" : "destructive"}>
                        {answer?.pointsEarned}/{question.points} pts
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">Your answer:</span>
                      <span className={isCorrect ? "text-success" : "text-destructive"}>
                        {question.type === "multiple-choice" || question.type === "true-false"
                          ? question.options?.[answer?.answer as number] ?? "No answer"
                          : String(answer?.answer || "No answer")}
                      </span>
                    </div>
                    {!isCorrect && (
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">Correct answer:</span>
                        <span className="text-success font-medium">
                          {question.type === "multiple-choice" || question.type === "true-false"
                            ? question.options?.[question.correctAnswer as number]
                            : String(question.correctAnswer)}
                        </span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <Button onClick={() => navigate("/quizzes")} className="w-full">
            Back to Quizzes
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Quiz Header */}
        <Card>
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div>
                <Badge variant="outline">{course?.code}</Badge>
                <h1 className="text-xl font-semibold mt-1">{quiz.title}</h1>
              </div>
              {timeRemaining !== null && (
                <div
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
                    timeRemaining < 60
                      ? "bg-destructive/10 text-destructive"
                      : timeRemaining < 300
                      ? "bg-warning/10 text-warning"
                      : "bg-muted"
                  }`}
                >
                  <Clock className="h-5 w-5" />
                  <span className="text-lg font-mono font-bold">
                    {formatTime(timeRemaining)}
                  </span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Progress */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Progress</span>
            <span>
              {answeredCount} of {quiz.questions.length} answered
            </span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Question Navigation */}
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

        {/* Current Question */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <Badge variant="outline">
                Question {currentQuestionIndex + 1} of {quiz.questions.length}
              </Badge>
              <Badge>{currentQuestion.points} points</Badge>
            </div>
            <CardTitle className="text-lg mt-4">{currentQuestion.question}</CardTitle>
          </CardHeader>
          <CardContent>
            {currentQuestion.type === "multiple-choice" && (
              <RadioGroup
                value={String(answers[currentQuestion.id] ?? "")}
                onValueChange={(value) =>
                  setAnswers((prev) => ({ ...prev, [currentQuestion.id]: parseInt(value) }))
                }
              >
                <div className="space-y-3">
                  {currentQuestion.options?.map((option, idx) => (
                    <div
                      key={idx}
                      className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-muted/50 cursor-pointer"
                    >
                      <RadioGroupItem value={String(idx)} id={`option-${idx}`} />
                      <Label htmlFor={`option-${idx}`} className="flex-1 cursor-pointer">
                        {option}
                      </Label>
                    </div>
                  ))}
                </div>
              </RadioGroup>
            )}

            {currentQuestion.type === "true-false" && (
              <RadioGroup
                value={String(answers[currentQuestion.id] ?? "")}
                onValueChange={(value) =>
                  setAnswers((prev) => ({ ...prev, [currentQuestion.id]: parseInt(value) }))
                }
              >
                <div className="space-y-3">
                  {["True", "False"].map((option, idx) => (
                    <div
                      key={idx}
                      className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-muted/50 cursor-pointer"
                    >
                      <RadioGroupItem value={String(idx)} id={`tf-${idx}`} />
                      <Label htmlFor={`tf-${idx}`} className="flex-1 cursor-pointer">
                        {option}
                      </Label>
                    </div>
                  ))}
                </div>
              </RadioGroup>
            )}

            {currentQuestion.type === "short-answer" && (
              <Input
                placeholder="Type your answer here..."
                value={String(answers[currentQuestion.id] ?? "")}
                onChange={(e) =>
                  setAnswers((prev) => ({ ...prev, [currentQuestion.id]: e.target.value }))
                }
                className="max-w-md"
              />
            )}
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            onClick={() => setCurrentQuestionIndex((prev) => Math.max(0, prev - 1))}
            disabled={currentQuestionIndex === 0}
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Previous
          </Button>

          <div className="flex gap-2">
            {currentQuestionIndex < quiz.questions.length - 1 ? (
              <Button
                onClick={() =>
                  setCurrentQuestionIndex((prev) =>
                    Math.min(quiz.questions.length - 1, prev + 1)
                  )
                }
              >
                Next
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            ) : (
              <Button onClick={() => setShowConfirmSubmit(true)}>Submit Quiz</Button>
            )}
          </div>
        </div>

        {/* Submit Confirmation */}
        <AlertDialog open={showConfirmSubmit} onOpenChange={setShowConfirmSubmit}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Submit Quiz?</AlertDialogTitle>
              <AlertDialogDescription>
                You have answered {answeredCount} of {quiz.questions.length} questions.
                {answeredCount < quiz.questions.length && (
                  <span className="block mt-2 text-warning font-medium">
                    ⚠️ You have {quiz.questions.length - answeredCount} unanswered questions.
                  </span>
                )}
                Are you sure you want to submit?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Continue Quiz</AlertDialogCancel>
              <AlertDialogAction onClick={handleSubmit} disabled={isSubmitting}>
                {isSubmitting ? "Submitting..." : "Submit Quiz"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </DashboardLayout>
  );
}
