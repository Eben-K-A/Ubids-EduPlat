import { useState } from "react";
import { useAssignments } from "@/contexts/AssignmentContext";
import { Assignment } from "@/types/assignment";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { GradeSubmissionDialog } from "./GradeSubmissionDialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Users, CheckCircle2, Clock, AlertCircle } from "lucide-react";
import { format } from "date-fns";

interface ViewSubmissionsDialogProps {
  assignment: Assignment;
  children?: React.ReactNode;
}

export function ViewSubmissionsDialog({ assignment, children }: ViewSubmissionsDialogProps) {
  const [open, setOpen] = useState(false);
  const { getSubmissionsByAssignment } = useAssignments();
  const submissions = getSubmissionsByAssignment(assignment.id);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "graded":
        return <CheckCircle2 className="h-4 w-4 text-success" />;
      case "late":
        return <AlertCircle className="h-4 w-4 text-destructive" />;
      default:
        return <Clock className="h-4 w-4 text-warning" />;
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button size="sm" variant="outline">
            <Users className="h-4 w-4 mr-2" />
            Submissions ({submissions.length})
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[800px] max-h-[85vh]">
        <DialogHeader>
          <DialogTitle>Submissions</DialogTitle>
          <DialogDescription>{assignment.title}</DialogDescription>
        </DialogHeader>

        <div className="flex items-center gap-4 p-3 rounded-lg bg-muted/50">
          <div className="text-center">
            <p className="text-2xl font-bold">{submissions.length}</p>
            <p className="text-xs text-muted-foreground">Total</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-success">
              {submissions.filter((s) => s.status === "graded").length}
            </p>
            <p className="text-xs text-muted-foreground">Graded</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-warning">
              {submissions.filter((s) => s.status === "submitted").length}
            </p>
            <p className="text-xs text-muted-foreground">Pending</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-destructive">
              {submissions.filter((s) => s.status === "late").length}
            </p>
            <p className="text-xs text-muted-foreground">Late</p>
          </div>
        </div>

        {submissions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12">
            <Users className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No submissions yet</p>
          </div>
        ) : (
          <ScrollArea className="h-[400px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>Submitted</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Grade</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {submissions.map((submission) => (
                  <TableRow key={submission.id}>
                    <TableCell className="font-medium">{submission.studentName}</TableCell>
                    <TableCell>
                      {format(new Date(submission.submittedAt), "MMM d, h:mm a")}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(submission.status)}
                        <Badge
                          variant={
                            submission.status === "graded"
                              ? "default"
                              : submission.status === "late"
                              ? "destructive"
                              : "secondary"
                          }
                        >
                          {submission.status}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      {submission.grade !== undefined ? (
                        <span className="font-medium">
                          {submission.grade}/{assignment.points}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <GradeSubmissionDialog submission={submission} assignment={assignment} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        )}
      </DialogContent>
    </Dialog>
  );
}
