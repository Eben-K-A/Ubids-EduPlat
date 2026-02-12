import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  TrendingUp,
  Users,
  Clock,
  Video,
  MessageSquare,
  Activity,
  BarChart3,
  Calendar,
  Award,
} from "lucide-react";
import { format, subDays } from "date-fns";

interface MeetingStats {
  totalMeetings: number;
  totalParticipants: number;
  averageDuration: number;
  totalMinutes: number;
}

interface MeetingHistoryItem {
  id: string;
  title: string;
  date: string;
  duration: number;
  participantCount: number;
  host: string;
  recorded: boolean;
}

interface MeetingsDashboardProps {
  stats?: MeetingStats;
  history?: MeetingHistoryItem[];
}

export function MeetingsDashboard({ stats, history }: MeetingsDashboardProps) {
  const [chartData, setChartData] = useState<Array<{ date: string; meetings: number; minutes: number }>>([]);
  const [participantData, setParticipantData] = useState<Array<{ name: string; value: number }>>([]);

  // Generate mock chart data
  useEffect(() => {
    const data = [];
    for (let i = 6; i >= 0; i--) {
      const date = subDays(new Date(), i);
      data.push({
        date: format(date, "MMM d"),
        meetings: Math.floor(Math.random() * 5) + 1,
        minutes: Math.floor(Math.random() * 120) + 30,
      });
    }
    setChartData(data);
  }, []);

  // Generate participant distribution data
  useEffect(() => {
    setParticipantData([
      { name: "1-5", value: 35 },
      { name: "6-10", value: 25 },
      { name: "11-20", value: 20 },
      { name: "20+", value: 20 },
    ]);
  }, []);

  const colors = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444"];

  const defaultStats = {
    totalMeetings: history?.length || 0,
    totalParticipants: history?.reduce((sum, m) => sum + m.participantCount, 0) || 0,
    averageDuration: history && history.length > 0
      ? Math.round(history.reduce((sum, m) => sum + m.duration, 0) / history.length)
      : 0,
    totalMinutes: history?.reduce((sum, m) => sum + m.duration, 0) || 0,
  };

  const displayStats = stats || defaultStats;

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Meetings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end justify-between">
              <div className="text-2xl font-bold">{displayStats.totalMeetings}</div>
              <Video className="h-5 w-5 text-blue-500/50" />
            </div>
            <p className="text-xs text-muted-foreground mt-2">This month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Participants</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end justify-between">
              <div className="text-2xl font-bold">{displayStats.totalParticipants}</div>
              <Users className="h-5 w-5 text-green-500/50" />
            </div>
            <p className="text-xs text-muted-foreground mt-2">Across all meetings</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Avg Duration</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end justify-between">
              <div className="text-2xl font-bold">{displayStats.averageDuration}m</div>
              <Clock className="h-5 w-5 text-amber-500/50" />
            </div>
            <p className="text-xs text-muted-foreground mt-2">Per meeting</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Minutes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end justify-between">
              <div className="text-2xl font-bold">{Math.round(displayStats.totalMinutes / 60)}h</div>
              <Activity className="h-5 w-5 text-purple-500/50" />
            </div>
            <p className="text-xs text-muted-foreground mt-2">Meeting time</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts and Analytics */}
      <Tabs defaultValue="trends" className="space-y-4">
        <TabsList>
          <TabsTrigger value="trends">
            <TrendingUp className="h-4 w-4 mr-2" /> Trends
          </TabsTrigger>
          <TabsTrigger value="distribution">
            <BarChart3 className="h-4 w-4 mr-2" /> Distribution
          </TabsTrigger>
          <TabsTrigger value="history">
            <Calendar className="h-4 w-4 mr-2" /> History
          </TabsTrigger>
        </TabsList>

        {/* Trends Tab */}
        <TabsContent value="trends">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Meeting Activity Trends</CardTitle>
              <CardDescription>Last 7 days of meeting activity</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" />
                    <YAxis stroke="hsl(var(--muted-foreground))" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="meetings"
                      stroke="#3b82f6"
                      strokeWidth={2}
                      dot={{ fill: "#3b82f6", r: 4 }}
                      activeDot={{ r: 6 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="minutes"
                      stroke="#10b981"
                      strokeWidth={2}
                      dot={{ fill: "#10b981", r: 4 }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Distribution Tab */}
        <TabsContent value="distribution">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Participant Size Distribution</CardTitle>
                <CardDescription>Breakdown of meetings by participant count</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={participantData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, value }) => `${name}: ${value}%`}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {participantData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={colors[index]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Meeting Duration Breakdown</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Short (0-15 min)</span>
                    <span className="font-semibold">35%</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div className="bg-blue-500 h-2 rounded-full" style={{ width: "35%" }} />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Medium (15-45 min)</span>
                    <span className="font-semibold">45%</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div className="bg-green-500 h-2 rounded-full" style={{ width: "45%" }} />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Long (45+ min)</span>
                    <span className="font-semibold">20%</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div className="bg-amber-500 h-2 rounded-full" style={{ width: "20%" }} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Meeting History</CardTitle>
              <CardDescription>Your recent meetings and recordings</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {history && history.length > 0 ? (
                  history.slice(0, 10).map((meeting) => (
                    <div
                      key={meeting.id}
                      className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex-1">
                        <p className="font-semibold">{meeting.title}</p>
                        <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          {format(new Date(meeting.date), "MMM d, yyyy h:mm a")}
                          <span>•</span>
                          <Clock className="h-3 w-3" />
                          {meeting.duration}m
                          <span>•</span>
                          <Users className="h-3 w-3" />
                          {meeting.participantCount} participants
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {meeting.recorded && (
                          <Badge variant="secondary" className="text-xs">
                            <Video className="h-3 w-3 mr-1" /> Recorded
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground/50 mb-2" />
                    <p className="text-muted-foreground">No meeting history available</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Top Performers */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Meeting Insights</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-start gap-3">
              <Award className="h-5 w-5 text-amber-500 mt-1" />
              <div>
                <p className="font-semibold text-sm">Most Active Host</p>
                <p className="text-sm text-muted-foreground mt-1">You have hosted 5 meetings this month</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Users className="h-5 w-5 text-green-500 mt-1" />
              <div>
                <p className="font-semibold text-sm">Peak Attendance</p>
                <p className="text-sm text-muted-foreground mt-1">Average of 8 participants per meeting</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <TrendingUp className="h-5 w-5 text-blue-500 mt-1" />
              <div>
                <p className="font-semibold text-sm">Meeting Growth</p>
                <p className="text-sm text-muted-foreground mt-1">20% increase in meetings this month</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
