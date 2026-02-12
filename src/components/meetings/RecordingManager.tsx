import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Play,
  Download,
  Share2,
  Trash2,
  Copy,
  Clock,
  FileText,
  Zap,
  Search,
  Filter,
  MoreVertical,
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Recording {
  id: string;
  meetingTitle: string;
  meetingCode: string;
  recordingUrl?: string;
  startedAt: string;
  stoppedAt?: string;
  duration?: number;
  status: "recording" | "processing" | "completed" | "failed";
  transcription?: {
    id: string;
    status: "pending" | "processing" | "completed" | "failed";
    text?: string;
    confidence?: number;
    language?: string;
  };
  fileSize?: number;
}

interface RecordingManagerProps {
  recordings: Recording[];
  isLoading?: boolean;
  onDelete?: (recordingId: string) => Promise<void>;
  onDownload?: (recordingId: string) => void;
  onShare?: (recordingId: string) => void;
  onRequestTranscription?: (recordingId: string) => Promise<void>;
}

export function RecordingManager({
  recordings,
  isLoading = false,
  onDelete,
  onDownload,
  onShare,
  onRequestTranscription,
}: RecordingManagerProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRecording, setSelectedRecording] = useState<Recording | null>(null);
  const [showTranscription, setShowTranscription] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>("all");

  const filteredRecordings = recordings.filter((rec) => {
    const matchesSearch =
      rec.meetingTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rec.meetingCode.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus === "all" || rec.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const handleDelete = async (recordingId: string) => {
    if (!window.confirm("Are you sure you want to delete this recording?")) return;
    try {
      await onDelete?.(recordingId);
      toast.success("Recording deleted");
    } catch (err) {
      toast.error("Failed to delete recording");
    }
  };

  const handleRequestTranscription = async (recordingId: string) => {
    try {
      await onRequestTranscription?.(recordingId);
      toast.success("Transcription request sent");
    } catch (err) {
      toast.error("Failed to request transcription");
    }
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return "N/A";
    const gb = bytes / (1024 * 1024 * 1024);
    if (gb > 1) return `${gb.toFixed(2)} GB`;
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(2)} MB`;
  };

  const formatDuration = (seconds?: number) => {
    if (!seconds) return "N/A";
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`;
    }
    return `${minutes}m ${secs}s`;
  };

  return (
    <div className="space-y-4">
      {/* Search and Filter */}
      <div className="flex gap-2 flex-col sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search recordings..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <DropdownMenu>
          <Button variant="outline" asChild>
            <DropdownMenuTrigger>
              <Filter className="h-4 w-4 mr-2" /> Filter
            </DropdownMenuTrigger>
          </Button>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setFilterStatus("all")}>
              All
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setFilterStatus("completed")}>
              Completed
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setFilterStatus("processing")}>
              Processing
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setFilterStatus("failed")}>
              Failed
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Recordings List */}
      {filteredRecordings.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              {searchQuery ? "No recordings found matching your search" : "No recordings available"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {filteredRecordings.map((recording) => (
            <Card key={recording.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <h3 className="font-semibold truncate">{recording.meetingTitle}</h3>
                      <Badge
                        variant={
                          recording.status === "completed"
                            ? "default"
                            : recording.status === "failed"
                              ? "destructive"
                              : "secondary"
                        }
                        className="text-xs flex-shrink-0"
                      >
                        {recording.status === "recording" && (
                          <>
                            <Zap className="h-3 w-3 mr-1" /> Recording
                          </>
                        )}
                        {recording.status === "processing" && (
                          <>
                            <Zap className="h-3 w-3 mr-1 animate-spin" /> Processing
                          </>
                        )}
                        {recording.status === "completed" && "Completed"}
                        {recording.status === "failed" && "Failed"}
                      </Badge>
                      {recording.transcription?.status === "completed" && (
                        <Badge variant="outline" className="text-xs flex-shrink-0">
                          <FileText className="h-3 w-3 mr-1" /> Transcribed
                        </Badge>
                      )}
                    </div>

                    <div className="text-sm text-muted-foreground space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span>{recording.meetingCode}</span>
                        <span>•</span>
                        <span>{format(new Date(recording.startedAt), "MMM d, yyyy h:mm a")}</span>
                      </div>
                      {recording.stoppedAt && (
                        <div className="flex items-center gap-2">
                          <Clock className="h-3 w-3" />
                          {formatDuration(recording.duration)}
                          {recording.fileSize && (
                            <>
                              <span>•</span>
                              <span>{formatFileSize(recording.fileSize)}</span>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {recording.status === "completed" && recording.recordingUrl && (
                        <>
                          <DropdownMenuItem
                            onClick={() => {
                              setSelectedRecording(recording);
                              setShowTranscription(false);
                            }}
                          >
                            <Play className="h-4 w-4 mr-2" /> Play
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => onDownload?.(recording.id)}>
                            <Download className="h-4 w-4 mr-2" /> Download
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => onShare?.(recording.id)}>
                            <Share2 className="h-4 w-4 mr-2" /> Share
                          </DropdownMenuItem>
                        </>
                      )}

                      {recording.transcription ? (
                        <DropdownMenuItem
                          onClick={() => {
                            setSelectedRecording(recording);
                            setShowTranscription(true);
                          }}
                        >
                          <FileText className="h-4 w-4 mr-2" />
                          View Transcription
                        </DropdownMenuItem>
                      ) : (
                        recording.status === "completed" && (
                          <DropdownMenuItem
                            onClick={() => handleRequestTranscription(recording.id)}
                          >
                            <FileText className="h-4 w-4 mr-2" /> Request Transcription
                          </DropdownMenuItem>
                        )
                      )}

                      <DropdownMenuItem onClick={() => handleDelete(recording.id)} className="text-destructive">
                        <Trash2 className="h-4 w-4 mr-2" /> Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                {/* Transcription Preview */}
                {recording.transcription?.status === "completed" && recording.transcription.text && (
                  <div className="mt-3 p-2 bg-muted/50 rounded text-sm text-muted-foreground line-clamp-2">
                    {recording.transcription.text}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Video Player Dialog */}
      <Dialog open={!!selectedRecording && !showTranscription} onOpenChange={() => setSelectedRecording(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{selectedRecording?.meetingTitle}</DialogTitle>
          </DialogHeader>
          {selectedRecording?.recordingUrl && (
            <div className="aspect-video bg-black rounded-lg overflow-hidden">
              <video
                src={selectedRecording.recordingUrl}
                controls
                className="w-full h-full"
              />
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Transcription Dialog */}
      <Dialog open={!!selectedRecording && showTranscription} onOpenChange={() => setSelectedRecording(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>{selectedRecording?.meetingTitle} - Transcription</DialogTitle>
            {selectedRecording?.transcription && (
              <DialogDescription>
                Confidence: {(selectedRecording.transcription.confidence || 0 * 100).toFixed(0)}% •
                Language: {selectedRecording.transcription.language || "Unknown"}
              </DialogDescription>
            )}
          </DialogHeader>

          {selectedRecording?.transcription?.status === "completed" ? (
            <>
              <ScrollArea className="flex-1 p-4 border rounded-lg bg-muted/50">
                <p className="text-sm leading-relaxed whitespace-pre-wrap">
                  {selectedRecording.transcription.text}
                </p>
              </ScrollArea>
              <div className="flex gap-2 justify-end">
                <Button
                  variant="outline"
                  onClick={() => {
                    navigator.clipboard.writeText(selectedRecording.transcription?.text || "");
                    toast.success("Transcription copied to clipboard");
                  }}
                >
                  <Copy className="h-4 w-4 mr-2" /> Copy
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    const element = document.createElement("a");
                    element.setAttribute("href", "data:text/plain;charset=utf-8," + encodeURIComponent(selectedRecording.transcription?.text || ""));
                    element.setAttribute("download", `${selectedRecording.meetingTitle}-transcription.txt`);
                    element.style.display = "none";
                    document.body.appendChild(element);
                    element.click();
                    document.body.removeChild(element);
                    toast.success("Transcription downloaded");
                  }}
                >
                  <Download className="h-4 w-4 mr-2" /> Download
                </Button>
              </div>
            </>
          ) : selectedRecording?.transcription?.status === "processing" ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <Zap className="h-12 w-12 mx-auto text-muted-foreground mb-4 animate-spin" />
                <p className="text-muted-foreground">Transcription is being generated...</p>
              </div>
            </div>
          ) : selectedRecording?.transcription?.status === "failed" ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <FileText className="h-12 w-12 mx-auto text-destructive mb-4" />
                <p className="text-muted-foreground">Failed to transcribe this recording</p>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
