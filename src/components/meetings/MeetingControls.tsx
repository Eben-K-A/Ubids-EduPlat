import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import {
  Settings,
  Eye,
  EyeOff,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Monitor,
  Bell,
  Clock,
  MoreVertical,
  Lock,
  Unlock,
  Zap,
  Timer,
} from "lucide-react";

interface MeetingControlsProps {
  isHost: boolean;
  isRecording: boolean;
  participantCount: number;
  onMuteAll?: () => void;
  onDisableCamerasAll?: () => void;
  onLockMeeting?: () => void;
  onUnlockMeeting?: () => void;
  onEnableWaitingRoom?: () => void;
  onEndMeeting?: () => void;
  meetingLocked?: boolean;
  meetingDuration?: number;
}

export function MeetingControls({
  isHost,
  isRecording,
  participantCount,
  onMuteAll,
  onDisableCamerasAll,
  onLockMeeting,
  onUnlockMeeting,
  onEnableWaitingRoom,
  onEndMeeting,
  meetingLocked,
  meetingDuration = 0,
}: MeetingControlsProps) {
  const [showConfirm, setShowConfirm] = useState(false);
  const [confirmAction, setConfirmAction] = useState<string | null>(null);

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m ${secs}s`;
  };

  const handleAction = (action: string) => {
    setConfirmAction(action);
    setShowConfirm(true);
  };

  const executeAction = () => {
    switch (confirmAction) {
      case "mute-all":
        onMuteAll?.();
        break;
      case "disable-cameras":
        onDisableCamerasAll?.();
        break;
      case "lock":
        onLockMeeting?.();
        break;
      case "end":
        onEndMeeting?.();
        break;
    }
    setShowConfirm(false);
    setConfirmAction(null);
  };

  if (!isHost) {
    return (
      <div className="flex items-center gap-2 text-sm">
        <div className="flex items-center gap-1 px-2 py-1 rounded bg-white/5 border border-white/10">
          <Users count={participantCount} />
          <span className="text-white/70">{participantCount}</span>
        </div>
        {isRecording && (
          <Badge variant="destructive" className="text-xs animate-pulse">
            Recording
          </Badge>
        )}
      </div>
    );
  }

  return (
    <>
      <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 border border-white/10">
        {/* Meeting Status Indicators */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 px-2 py-1 bg-white/10 rounded text-xs">
            <Users count={participantCount} />
            <span className="text-white/70">{participantCount}</span>
          </div>

          {meetingLocked && (
            <Badge variant="outline" className="text-xs bg-orange-600/20 text-orange-400 border-orange-500/30">
              <Lock className="h-3 w-3 mr-1" /> Locked
            </Badge>
          )}

          {isRecording && (
            <Badge variant="destructive" className="text-xs animate-pulse">
              Recording
            </Badge>
          )}

          {meetingDuration > 0 && (
            <div className="flex items-center gap-1 px-2 py-1 bg-white/10 rounded text-xs text-white/70">
              <Clock className="h-3 w-3" />
              <span>{formatDuration(meetingDuration)}</span>
            </div>
          )}
        </div>

        {/* Host Controls Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 text-white/70 hover:text-white"
            >
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>Host Controls</DropdownMenuLabel>
            <DropdownMenuSeparator />

            <DropdownMenuItem onClick={() => handleAction("mute-all")}>
              <Mic className="h-4 w-4 mr-2" />
              <span>Mute All Participants</span>
            </DropdownMenuItem>

            <DropdownMenuItem onClick={() => handleAction("disable-cameras")}>
              <Eye className="h-4 w-4 mr-2" />
              <span>Disable All Cameras</span>
            </DropdownMenuItem>

            <DropdownMenuSeparator />

            {meetingLocked ? (
              <DropdownMenuItem onClick={() => onUnlockMeeting?.()}>
                <Unlock className="h-4 w-4 mr-2" />
                <span>Unlock Meeting</span>
              </DropdownMenuItem>
            ) : (
              <DropdownMenuItem onClick={() => handleAction("lock")}>
                <Lock className="h-4 w-4 mr-2" />
                <span>Lock Meeting</span>
              </DropdownMenuItem>
            )}

            <DropdownMenuItem onClick={() => onEnableWaitingRoom?.()}>
              <Bell className="h-4 w-4 mr-2" />
              <span>Enable Waiting Room</span>
            </DropdownMenuItem>

            <DropdownMenuSeparator />

            <DropdownMenuItem onClick={() => handleAction("end")} className="text-destructive">
              <Zap className="h-4 w-4 mr-2" />
              <span>End Meeting for All</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Confirmation Dialog */}
      <Dialog open={showConfirm} onOpenChange={setShowConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Action</DialogTitle>
            <DialogDescription>
              {confirmAction === "mute-all" && "This will mute all participants' microphones."}
              {confirmAction === "disable-cameras" && "This will disable all participants' cameras."}
              {confirmAction === "lock" && "This will lock the meeting - new participants cannot join."}
              {confirmAction === "end" && "This will end the meeting for all participants. This action cannot be undone."}
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => setShowConfirm(false)}>
              Cancel
            </Button>
            <Button
              variant={confirmAction === "end" ? "destructive" : "default"}
              onClick={executeAction}
            >
              Confirm
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

// Helper component for user count
function Users({ count }: { count: number }) {
  return <Users count={count} className="h-4 w-4" />;
}
