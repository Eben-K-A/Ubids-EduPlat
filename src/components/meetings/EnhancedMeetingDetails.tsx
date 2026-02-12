import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import {
  Calendar,
  Clock,
  Users,
  Wifi,
  Zap,
  Eye,
  Mic,
  Copy,
  Share2,
  Settings,
  Shield,
} from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";

interface EnhancedMeetingDetailsProps {
  title: string;
  description?: string;
  meetingCode: string;
  hostName: string;
  startTime: string;
  duration: number;
  participantCount: number;
  recordingEnabled: boolean;
  waitingRoomMode: string;
  passwordProtected: boolean;
  elapsedTime?: number;
  connectionQuality?: "excellent" | "good" | "fair" | "poor";
  bandwidth?: number; // in Mbps
  onCopyLink?: () => void;
  onShareLink?: () => void;
}

export function EnhancedMeetingDetails({
  title,
  description,
  meetingCode,
  hostName,
  startTime,
  duration,
  participantCount,
  recordingEnabled,
  waitingRoomMode,
  passwordProtected,
  elapsedTime = 0,
  connectionQuality = "excellent",
  bandwidth = 0,
  onCopyLink,
  onShareLink,
}: EnhancedMeetingDetailsProps) {
  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`;
    }
    return `${minutes}m ${secs}s`;
  };

  const getQualityColor = (quality: string) => {
    switch (quality) {
      case "excellent":
        return "text-green-400";
      case "good":
        return "text-blue-400";
      case "fair":
        return "text-yellow-400";
      case "poor":
        return "text-red-400";
      default:
        return "text-gray-400";
    }
  };

  return (
    <ScrollArea className="h-full">
      <div className="p-4 space-y-4">
        {/* Meeting Title */}
        <div>
          <h2 className="text-base font-bold text-white break-words">{title}</h2>
          {description && (
            <p className="text-xs text-white/60 mt-1 line-clamp-2">{description}</p>
          )}
        </div>

        {/* Quick Actions */}
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="secondary"
            className="flex-1 text-xs"
            onClick={onCopyLink}
          >
            <Copy className="h-3 w-3 mr-1" /> Copy Link
          </Button>
          <Button
            size="sm"
            variant="secondary"
            className="flex-1 text-xs"
            onClick={onShareLink}
          >
            <Share2 className="h-3 w-3 mr-1" /> Share
          </Button>
        </div>

        {/* Meeting Code */}
        <Card className="bg-white/5 border-white/10">
          <CardContent className="p-3">
            <p className="text-xs text-white/50 mb-1">Meeting Code</p>
            <p className="text-sm font-mono text-white break-all">{meetingCode}</p>
          </CardContent>
        </Card>

        {/* Meeting Info Grid */}
        <div className="grid grid-cols-2 gap-2">
          <Card className="bg-white/5 border-white/10">
            <CardContent className="p-3">
              <p className="text-xs text-white/50 mb-1">Host</p>
              <p className="text-sm text-white truncate">{hostName}</p>
            </CardContent>
          </Card>

          <Card className="bg-white/5 border-white/10">
            <CardContent className="p-3">
              <p className="text-xs text-white/50 mb-1">Participants</p>
              <div className="flex items-center gap-1">
                <Users className="h-4 w-4 text-blue-400" />
                <p className="text-sm text-white">{participantCount}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/5 border-white/10">
            <CardContent className="p-3">
              <p className="text-xs text-white/50 mb-1">Duration</p>
              <p className="text-sm text-white">{duration}m</p>
            </CardContent>
          </Card>

          <Card className="bg-white/5 border-white/10">
            <CardContent className="p-3">
              <p className="text-xs text-white/50 mb-1">Elapsed</p>
              <p className="text-sm text-white">{formatDuration(elapsedTime)}</p>
            </CardContent>
          </Card>
        </div>

        {/* Time Information */}
        <Card className="bg-white/5 border-white/10">
          <CardContent className="p-3 space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="h-4 w-4 text-white/50" />
              <div>
                <p className="text-xs text-white/50">Start Time</p>
                <p className="text-sm text-white">{format(new Date(startTime), "MMM d, yyyy h:mm a")}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Clock className="h-4 w-4 text-white/50" />
              <div>
                <p className="text-xs text-white/50">Started</p>
                <p className="text-sm text-white">{formatDistanceToNow(new Date(startTime), { addSuffix: true })}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Meeting Settings */}
        <Card className="bg-white/5 border-white/10">
          <CardContent className="p-3 space-y-2">
            <p className="text-xs text-white/50 font-semibold mb-2">Meeting Settings</p>
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-white/70 flex items-center gap-1">
                  <Settings className="h-3 w-3" /> Recording
                </span>
                <Badge variant={recordingEnabled ? "default" : "secondary"} className="text-[10px]">
                  {recordingEnabled ? "Enabled" : "Disabled"}
                </Badge>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-white/70 flex items-center gap-1">
                  <Shield className="h-3 w-3" /> Waiting Room
                </span>
                <Badge variant={waitingRoomMode !== "auto" ? "default" : "secondary"} className="text-[10px]">
                  {waitingRoomMode === "auto" ? "Off" : "On"}
                </Badge>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-white/70 flex items-center gap-1">
                  <Zap className="h-3 w-3" /> Password
                </span>
                <Badge variant={passwordProtected ? "default" : "secondary"} className="text-[10px]">
                  {passwordProtected ? "Protected" : "Open"}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Connection Quality */}
        <Card className="bg-white/5 border-white/10">
          <CardContent className="p-3 space-y-2">
            <p className="text-xs text-white/50 font-semibold mb-2">Connection Quality</p>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-white/70 flex items-center gap-1">
                  <Wifi className="h-3 w-3" /> Signal
                </span>
                <span className={`font-semibold capitalize ${getQualityColor(connectionQuality)}`}>
                  {connectionQuality}
                </span>
              </div>
              {bandwidth > 0 && (
                <div className="flex items-center justify-between text-xs">
                  <span className="text-white/70">Bandwidth</span>
                  <span className="text-white">{bandwidth.toFixed(1)} Mbps</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </ScrollArea>
  );
}
