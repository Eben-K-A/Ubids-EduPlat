import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { Eye, MessageSquare, Hand, Zap, TrendingUp } from "lucide-react";

interface ParticipantMetrics {
  identity: string;
  name: string;
  joinTime: number;
  videoOnTime: number;
  audioOnTime: number;
  handRaises: number;
  messagesCount: number;
  engagementScore: number;
}

interface MeetingAnalyticsProps {
  participants: ParticipantMetrics[];
  elapsedSeconds: number;
}

export function MeetingAnalytics({ participants, elapsedSeconds }: MeetingAnalyticsProps) {
  const [timelineData, setTimelineData] = useState<Array<{ time: string; participants: number }>>([]);

  const totalEngagement = participants.reduce((sum, p) => sum + p.engagementScore, 0);
  const avgEngagement = participants.length > 0 ? Math.round(totalEngagement / participants.length) : 0;
  const mostActive = participants.length > 0
    ? participants.reduce((max, p) => (p.engagementScore > max.engagementScore ? p : max))
    : null;

  // Calculate engagement breakdown
  const engagementBreakdown = [
    { name: "Video", value: Math.round((participants.filter(p => p.videoOnTime > 0).length / Math.max(participants.length, 1)) * 100) },
    { name: "Audio", value: Math.round((participants.filter(p => p.audioOnTime > 0).length / Math.max(participants.length, 1)) * 100) },
    { name: "Chat Active", value: Math.round((participants.filter(p => p.messagesCount > 0).length / Math.max(participants.length, 1)) * 100) },
  ];

  const colors = ["#3b82f6", "#10b981", "#f59e0b"];

  // Create bar chart data for participant comparison
  const participantComparison = participants.slice(0, 8).map(p => ({
    name: p.name.substring(0, 8),
    engagement: p.engagementScore,
    messages: p.messagesCount,
    handRaises: p.handRaises,
  }));

  return (
    <div className="w-full h-full overflow-y-auto bg-[hsl(222,47%,8%)] p-4 space-y-4">
      <div className="sticky top-0 bg-[hsl(222,47%,8%)] pb-2 border-b border-white/10">
        <h3 className="text-sm font-semibold text-white">Meeting Analytics</h3>
        <p className="text-xs text-white/50 mt-1">Real-time engagement metrics</p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-2">
        <Card className="bg-white/5 border-white/10">
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-white/50">Avg Engagement</p>
                <p className="text-lg font-bold text-white">{avgEngagement}%</p>
              </div>
              <Zap className="h-5 w-5 text-yellow-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/5 border-white/10">
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-white/50">Participants</p>
                <p className="text-lg font-bold text-white">{participants.length}</p>
              </div>
              <Eye className="h-5 w-5 text-blue-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Most Active */}
      {mostActive && (
        <Card className="bg-white/5 border-white/10">
          <CardContent className="p-3">
            <p className="text-xs text-white/50 mb-2">Most Active</p>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-white">{mostActive.name}</p>
                <p className="text-xs text-white/60">{mostActive.messagesCount} messages • {mostActive.handRaises} hand raises</p>
              </div>
              <Badge className="bg-green-600/20 text-green-400 border-green-500/30">
                {mostActive.engagementScore}%
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Engagement Breakdown */}
      <Card className="bg-white/5 border-white/10">
        <CardContent className="p-3">
          <p className="text-xs text-white/50 mb-3">Engagement Mix</p>
          <div className="space-y-2">
            {engagementBreakdown.map((item, idx) => (
              <div key={item.name}>
                <div className="flex justify-between mb-1">
                  <span className="text-xs text-white/70">{item.name}</span>
                  <span className="text-xs font-semibold text-white">{item.value}%</span>
                </div>
                <Progress value={item.value} className="h-1.5 bg-white/10" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Participant Engagement Scores */}
      {participants.length > 0 && (
        <Card className="bg-white/5 border-white/10">
          <CardContent className="p-3">
            <p className="text-xs text-white/50 mb-3">Participant Scores</p>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {participants.map(p => (
                <div key={p.identity} className="text-xs">
                  <div className="flex justify-between mb-1">
                    <span className="text-white/80 truncate">{p.name}</span>
                    <span className="text-white font-semibold">{p.engagementScore}%</span>
                  </div>
                  <Progress 
                    value={p.engagementScore} 
                    className="h-1 bg-white/10"
                  />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
