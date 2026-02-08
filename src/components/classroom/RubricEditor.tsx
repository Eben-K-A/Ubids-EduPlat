import { useState } from "react";
import { useClassroom } from "@/contexts/ClassroomContext";
import { Rubric, RubricCriterion, RubricLevel } from "@/types/classroom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Plus, Trash2, ClipboardCheck, GripVertical } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface RubricEditorProps {
  courseId: string;
  isOwner: boolean;
}

const defaultLevels: Omit<RubricLevel, "id">[] = [
  { label: "Excellent", description: "", points: 0 },
  { label: "Good", description: "", points: 0 },
  { label: "Fair", description: "", points: 0 },
  { label: "Poor", description: "", points: 0 },
];

export function RubricEditor({ courseId, isOwner }: RubricEditorProps) {
  const { getRubricsByCourse, createRubric, deleteRubric } = useClassroom();
  const { toast } = useToast();
  const [createOpen, setCreateOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [criteria, setCriteria] = useState<Omit<RubricCriterion, "id">[]>([]);
  const [viewRubric, setViewRubric] = useState<Rubric | null>(null);

  const rubrics = getRubricsByCourse(courseId);

  const addCriterion = () => {
    setCriteria((prev) => [
      ...prev,
      {
        title: "",
        description: "",
        maxPoints: 25,
        levels: defaultLevels.map((l, i) => ({
          ...l,
          id: `new-level-${Date.now()}-${i}`,
          points: Math.round(25 * ((4 - i) / 4)),
        })),
      },
    ]);
  };

  const updateCriterion = (index: number, updates: Partial<Omit<RubricCriterion, "id">>) => {
    setCriteria((prev) => prev.map((c, i) => (i === index ? { ...c, ...updates } : c)));
  };

  const updateLevel = (criterionIdx: number, levelIdx: number, updates: Partial<RubricLevel>) => {
    setCriteria((prev) =>
      prev.map((c, ci) =>
        ci === criterionIdx
          ? { ...c, levels: c.levels.map((l, li) => (li === levelIdx ? { ...l, ...updates } : l)) }
          : c
      )
    );
  };

  const removeCriterion = (index: number) => {
    setCriteria((prev) => prev.filter((_, i) => i !== index));
  };

  const handleCreate = async () => {
    if (!title.trim() || criteria.length === 0) return;
    try {
      await createRubric({
        courseId,
        title: title.trim(),
        criteria: criteria.map((c, i) => ({
          ...c,
          id: `crit-${Date.now()}-${i}`,
          levels: c.levels.map((l, j) => ({ ...l, id: `level-${Date.now()}-${i}-${j}` })),
        })),
      });
      toast({ title: "Rubric created" });
      setCreateOpen(false);
      resetForm();
    } catch {
      toast({ title: "Failed to create rubric", variant: "destructive" });
    }
  };

  const resetForm = () => {
    setTitle("");
    setCriteria([]);
  };

  const totalPoints = (r: Rubric | Omit<RubricCriterion, "id">[]) => {
    const crits = Array.isArray(r) ? r : r.criteria;
    return crits.reduce((sum, c) => sum + c.maxPoints, 0);
  };

  return (
    <div className="space-y-4">
      {isOwner && (
        <div className="flex justify-end">
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Create Rubric
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create Rubric</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Rubric Title</Label>
                  <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Essay Grading Rubric" />
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label>Criteria ({criteria.length})</Label>
                    <Badge variant="outline">{totalPoints(criteria)} total points</Badge>
                  </div>

                  {criteria.map((crit, ci) => (
                    <Card key={ci}>
                      <CardContent className="pt-4 space-y-3">
                        <div className="flex gap-2">
                          <Input
                            placeholder="Criterion title"
                            value={crit.title}
                            onChange={(e) => updateCriterion(ci, { title: e.target.value })}
                            className="flex-1"
                          />
                          <Input
                            type="number"
                            placeholder="Max pts"
                            value={crit.maxPoints}
                            onChange={(e) => {
                              const max = Number(e.target.value);
                              updateCriterion(ci, { maxPoints: max });
                              // Auto-distribute points
                              crit.levels.forEach((_, li) => {
                                updateLevel(ci, li, { points: Math.round(max * ((crit.levels.length - li) / crit.levels.length)) });
                              });
                            }}
                            className="w-24"
                          />
                          <Button variant="ghost" size="icon" onClick={() => removeCriterion(ci)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                        <Textarea
                          placeholder="Description..."
                          value={crit.description}
                          onChange={(e) => updateCriterion(ci, { description: e.target.value })}
                          rows={1}
                        />
                        <div className="grid grid-cols-2 gap-2">
                          {crit.levels.map((level, li) => (
                            <div key={li} className="border rounded-md p-2 space-y-1">
                              <div className="flex items-center justify-between">
                                <Input
                                  value={level.label}
                                  onChange={(e) => updateLevel(ci, li, { label: e.target.value })}
                                  className="h-6 text-xs font-medium border-0 p-0"
                                />
                                <Input
                                  type="number"
                                  value={level.points}
                                  onChange={(e) => updateLevel(ci, li, { points: Number(e.target.value) })}
                                  className="h-6 w-14 text-xs text-right border-0 p-0"
                                />
                              </div>
                              <Input
                                placeholder="Description..."
                                value={level.description}
                                onChange={(e) => updateLevel(ci, li, { description: e.target.value })}
                                className="h-6 text-[10px] border-0 p-0"
                              />
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  ))}

                  <Button variant="outline" size="sm" onClick={addCriterion} className="w-full">
                    <Plus className="h-3 w-3 mr-1" />
                    Add Criterion
                  </Button>
                </div>

                <div className="flex justify-end gap-2">
                  <Button variant="ghost" onClick={() => { setCreateOpen(false); resetForm(); }}>Cancel</Button>
                  <Button onClick={handleCreate} disabled={!title.trim() || criteria.length === 0}>
                    Create Rubric
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      )}

      {rubrics.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <ClipboardCheck className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No rubrics created yet</p>
          </CardContent>
        </Card>
      ) : (
        rubrics.map((rubric) => (
          <Card key={rubric.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-base">{rubric.title}</CardTitle>
                  <div className="flex gap-2 mt-1">
                    <Badge variant="outline" className="text-xs">{rubric.criteria.length} criteria</Badge>
                    <Badge variant="outline" className="text-xs">{totalPoints(rubric)} total points</Badge>
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="sm" onClick={() => setViewRubric(rubric)}>View</Button>
                  {isOwner && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => { deleteRubric(rubric.id); toast({ title: "Rubric deleted" }); }}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
          </Card>
        ))
      )}

      {/* View Rubric Dialog */}
      <Dialog open={!!viewRubric} onOpenChange={() => setViewRubric(null)}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{viewRubric?.title}</DialogTitle>
          </DialogHeader>
          {viewRubric && (
            <div className="space-y-4">
              {viewRubric.criteria.map((crit) => (
                <Card key={crit.id}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm">{crit.title}</CardTitle>
                      <Badge>{crit.maxPoints} pts</Badge>
                    </div>
                    {crit.description && (
                      <p className="text-xs text-muted-foreground">{crit.description}</p>
                    )}
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                      {crit.levels.map((level) => (
                        <div key={level.id} className="border rounded-md p-2 text-center">
                          <p className="text-xs font-semibold">{level.label}</p>
                          <p className="text-lg font-bold text-primary">{level.points}</p>
                          <p className="text-[10px] text-muted-foreground">{level.description}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
              <div className="text-right">
                <Badge variant="default" className="text-sm">
                  Total: {totalPoints(viewRubric)} points
                </Badge>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
