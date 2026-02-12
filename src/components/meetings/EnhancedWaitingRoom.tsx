import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertCircle,
  Check,
  X,
  Clock,
  User,
  Shield,
  Bell,
  Users,
  TrendingUp,
  Eye,
} from "lucide-react";
import { toast } from "sonner";

interface WaitingParticipant {
  id: string;
  name: string;
  email?: string;
  joinedAt: Date;
  userAgent?: string;
}

interface EnhancedWaitingRoomProps {
  participants: WaitingParticipant[];
  isHost: boolean;
  onApprove: (participantId: string) => Promise<void>;
  onDeny: (participantId: string) => Promise<void>;
  onApproveAll?: () => Promise<void>;
  onDenyAll?: () => Promise<void>;
  onSettings?: () => void;
  mode?: "host-approve" | "auth-auto" | "auto";
}

export function EnhancedWaitingRoom({
  participants,
  isHost,
  onApprove,
  onDeny,
  onApproveAll,
  onDenyAll,
  onSettings,
  mode = "host-approve",
}: EnhancedWaitingRoomProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedParticipant, setSelectedParticipant] = useState<WaitingParticipant | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [notificationSettings, setNotificationSettings] = useState({
    soundAlert: true,
    desktopNotif: true,
    autoApprove: false,
  });

  const filteredParticipants = participants.filter((p) =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleApprove = async (id: string) => {
    setIsProcessing(true);
    try {
      await onApprove(id);
      toast.success("Participant approved");
    } catch (err) {
      toast.error("Failed to approve participant");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDeny = async (id: string) => {
    setIsProcessing(true);
    try {
      await onDeny(id);
      toast.success("Participant denied");
    } catch (err) {
      toast.error("Failed to deny participant");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleApproveAll = async () => {
    if (!window.confirm(`Approve all ${filteredParticipants.length} waiting participants?`)) return;
    setIsProcessing(true);
    try {
      await onApproveAll?.();
      toast.success("All participants approved");
    } catch (err) {
      toast.error("Failed to approve all participants");
    } finally {
      setIsProcessing(false);
    }
  };

  const getWaitTimeMinutes = (joinedAt: Date) => {
    const now = new Date();
    return Math.floor((now.getTime() - joinedAt.getTime()) / (1000 * 60));
  };

  if (!isHost || participants.length === 0) {
    return null;
  }

  return (
    <div className="h-full flex flex-col bg-[hsl(222,47%,8%)]">
      {/* Header */}
      <div className="p-4 border-b border-white/10">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-white flex items-center gap-2">
            <Bell className="h-4 w-4 text-yellow-400" /> Waiting Room
            <Badge className="bg-yellow-600/20 text-yellow-400 border-yellow-500/30">
              {participants.length}
            </Badge>
          </h3>
          <Button
            size="sm"
            variant="ghost"
            onClick={onSettings}
            className="h-8 w-8 p-0"
          >
            <Shield className="h-4 w-4" />
          </Button>
        </div>

        {/* Search */}
        <Input
          placeholder="Search by name or email..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="bg-white/5 border-white/10 text-white placeholder:text-white/50"
        />
      </div>

      {/* Mode Indicator */}
      {mode !== "host-approve" && (
        <div className="px-4 pt-3 pb-2">
          <div className="text-xs bg-blue-600/20 text-blue-300 border border-blue-500/30 rounded px-2 py-1 flex items-center gap-1">
            <Eye className="h-3 w-3" />
            <span>Auto-admit mode enabled</span>
          </div>
        </div>
      )}

      {/* Bulk Actions */}
      {filteredParticipants.length > 1 && mode === "host-approve" && (
        <div className="px-4 py-2 flex gap-2 border-b border-white/10">
          <Button
            size="sm"
            variant="secondary"
            onClick={handleApproveAll}
            disabled={isProcessing}
            className="flex-1 text-xs"
          >
            <Check className="h-3 w-3 mr-1" /> Approve All
          </Button>
          <Button
            size="sm"
            variant="destructive"
            onClick={onDenyAll}
            disabled={isProcessing}
            className="flex-1 text-xs"
          >
            <X className="h-3 w-3 mr-1" /> Deny All
          </Button>
        </div>
      )}

      {/* Participants List */}
      <ScrollArea className="flex-1 p-3 space-y-2">
        {filteredParticipants.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <Users className="h-8 w-8 mx-auto text-white/30 mb-2" />
              <p className="text-xs text-white/50">No waiting participants</p>
            </div>
          </div>
        ) : (
          filteredParticipants.map((participant) => (
            <Card
              key={participant.id}
              className="bg-white/5 border-white/10 hover:border-white/20 transition-colors cursor-pointer group"
              onClick={() => setSelectedParticipant(participant)}
            >
              <CardContent className="p-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <User className="h-4 w-4 text-white/50 flex-shrink-0" />
                      <p className="text-sm font-semibold text-white truncate">
                        {participant.name}
                      </p>
                      <Badge
                        variant="outline"
                        className="text-[10px] flex-shrink-0 bg-blue-600/20 text-blue-300 border-blue-500/30"
                      >
                        <Clock className="h-2 w-2 mr-1" />
                        {getWaitTimeMinutes(participant.joinedAt)}m
                      </Badge>
                    </div>
                    {participant.email && (
                      <p className="text-xs text-white/60 truncate ml-6">{participant.email}</p>
                    )}
                  </div>

                  {mode === "host-approve" && (
                    <div className="flex gap-1 flex-shrink-0">
                      <Button
                        size="icon"
                        variant="secondary"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleApprove(participant.id);
                        }}
                        disabled={isProcessing}
                        className="h-8 w-8 bg-green-600/20 hover:bg-green-600/30 text-green-400 border-green-500/30"
                      >
                        <Check className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="destructive"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeny(participant.id);
                        }}
                        disabled={isProcessing}
                        className="h-8 w-8"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </ScrollArea>

      {/* Participant Details Dialog */}
      <Dialog open={!!selectedParticipant} onOpenChange={() => setSelectedParticipant(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedParticipant?.name}</DialogTitle>
            <DialogDescription>Waiting participant details</DialogDescription>
          </DialogHeader>

          {selectedParticipant && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-xs text-white/70">Name</Label>
                <p className="text-sm">{selectedParticipant.name}</p>
              </div>

              {selectedParticipant.email && (
                <div className="space-y-2">
                  <Label className="text-xs text-white/70">Email</Label>
                  <p className="text-sm">{selectedParticipant.email}</p>
                </div>
              )}

              <div className="space-y-2">
                <Label className="text-xs text-white/70">Waiting Since</Label>
                <p className="text-sm">
                  {selectedParticipant.joinedAt.toLocaleTimeString()} (
                  {getWaitTimeMinutes(selectedParticipant.joinedAt)} minutes ago)
                </p>
              </div>

              {selectedParticipant.userAgent && (
                <div className="space-y-2">
                  <Label className="text-xs text-white/70">Device</Label>
                  <p className="text-xs text-white/60 break-words">{selectedParticipant.userAgent}</p>
                </div>
              )}

              {mode === "host-approve" && (
                <div className="flex gap-2 pt-4">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => {
                      handleDeny(selectedParticipant.id);
                      setSelectedParticipant(null);
                    }}
                  >
                    Deny
                  </Button>
                  <Button
                    className="flex-1 bg-green-600 hover:bg-green-700"
                    onClick={() => {
                      handleApprove(selectedParticipant.id);
                      setSelectedParticipant(null);
                    }}
                  >
                    Approve
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
