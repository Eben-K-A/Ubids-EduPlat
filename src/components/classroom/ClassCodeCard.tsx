import { useState } from "react";
import { useClassroom } from "@/contexts/ClassroomContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Copy, RefreshCw, Link2, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ClassCodeCardProps {
  courseId: string;
  isOwner: boolean;
}

export function ClassCodeCard({ courseId, isOwner }: ClassCodeCardProps) {
  const { getClassCode, generateClassCode, disableClassCode } = useClassroom();
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  const invite = getClassCode(courseId);

  const handleGenerate = async () => {
    await generateClassCode(courseId);
    toast({ title: "Class code generated" });
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast({ title: "Copied to clipboard" });
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDisable = async () => {
    await disableClassCode(courseId);
    toast({ title: "Class code disabled" });
  };

  if (!invite && !isOwner) return null;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <Link2 className="h-4 w-4" />
          Class Code
        </CardTitle>
      </CardHeader>
      <CardContent>
        {invite ? (
          <div className="space-y-3">
            <div className="flex items-center justify-center">
              <Badge
                variant="outline"
                className="text-2xl font-mono tracking-[0.3em] px-6 py-2 border-2 border-primary/30"
              >
                {invite.code.toUpperCase()}
              </Badge>
            </div>
            <div className="flex gap-2 justify-center">
              <Button variant="outline" size="sm" onClick={() => handleCopy(invite.code.toUpperCase())}>
                {copied ? <Check className="h-3 w-3 mr-1" /> : <Copy className="h-3 w-3 mr-1" />}
                {copied ? "Copied" : "Copy Code"}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  handleCopy(`${window.location.origin}/join-class?code=${invite.code}`)
                }
              >
                <Link2 className="h-3 w-3 mr-1" />
                Copy Link
              </Button>
            </div>
            {isOwner && (
              <div className="flex gap-2 justify-center">
                <Button variant="ghost" size="sm" className="text-xs" onClick={handleDisable}>
                  Disable Code
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs"
                  onClick={async () => {
                    await disableClassCode(courseId);
                    await generateClassCode(courseId);
                    toast({ title: "New code generated" });
                  }}
                >
                  <RefreshCw className="h-3 w-3 mr-1" />
                  Reset
                </Button>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center space-y-2">
            <p className="text-sm text-muted-foreground">No class code generated yet</p>
            {isOwner && (
              <Button size="sm" onClick={handleGenerate}>
                Generate Code
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
