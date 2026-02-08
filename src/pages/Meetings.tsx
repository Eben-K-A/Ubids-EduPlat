import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Video,
  Plus,
  Calendar,
  Clock,
  Users,
  Link as LinkIcon,
  Copy,
  ExternalLink,
  Play,
  Settings,
  Radio,
  Shield,
  Repeat,
  Download,
  Search,
  ChevronRight,
  Mic,
  MonitorUp,
  Lock,
  Globe,
} from "lucide-react";
import { format, addDays, addHours } from "date-fns";
import { toast } from "sonner";

const mockUpcomingMeetings = [
  {
    id: "1",
    title: "CS101 Office Hours",
    description: "Weekly office hours for Introduction to Computer Science",
    startTime: addHours(new Date(), 2),
    duration: 60,
    participants: 12,
    maxParticipants: 50,
    host: "Dr. Sarah Johnson",
    meetingLink: "https://meet.example.com/cs101-office",
    isRecurring: true,
    recurringPattern: "Weekly",
    hasWaitingRoom: true,
    isPasswordProtected: true,
    meetingCode: "ABC-DEFG-HIJ",
  },
  {
    id: "2",
    title: "Project Discussion - Group A",
    description: "Discuss final project requirements and timeline",
    startTime: addDays(new Date(), 1),
    duration: 45,
    participants: 5,
    maxParticipants: 10,
    host: "You",
    meetingLink: "https://meet.example.com/project-a",
    isRecurring: false,
    recurringPattern: null,
    hasWaitingRoom: false,
    isPasswordProtected: false,
    meetingCode: "KLM-NOPQ-RST",
  },
  {
    id: "3",
    title: "Advanced Algorithms Review",
    description: "Review session for upcoming midterm",
    startTime: addDays(new Date(), 2),
    duration: 90,
    participants: 28,
    maxParticipants: 100,
    host: "Prof. Michael Chen",
    meetingLink: "https://meet.example.com/algo-review",
    isRecurring: false,
    recurringPattern: null,
    hasWaitingRoom: true,
    isPasswordProtected: true,
    meetingCode: "UVW-XYZA-BCD",
  },
];

const mockPastMeetings = [
  {
    id: "4",
    title: "Data Structures Lab",
    description: "Weekly lab session",
    startTime: addDays(new Date(), -1),
    duration: 120,
    participants: 25,
    host: "Dr. Sarah Johnson",
    recordingUrl: "https://example.com/recording/4",
    recordingDuration: "1:58:32",
  },
  {
    id: "5",
    title: "Study Group Session",
    description: "Exam preparation with classmates",
    startTime: addDays(new Date(), -3),
    duration: 60,
    participants: 6,
    host: "You",
    recordingUrl: null,
    recordingDuration: null,
  },
  {
    id: "6",
    title: "CS201 Lecture Recap",
    description: "Review of graph algorithms lecture",
    startTime: addDays(new Date(), -5),
    duration: 45,
    participants: 18,
    host: "Prof. Michael Chen",
    recordingUrl: "https://example.com/recording/6",
    recordingDuration: "0:42:15",
  },
];

export default function Meetings() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [createOpen, setCreateOpen] = useState(false);
  const [joinOpen, setJoinOpen] = useState(false);
  const [joinCode, setJoinCode] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [isRecurring, setIsRecurring] = useState(false);
  const [enableWaitingRoom, setEnableWaitingRoom] = useState(false);
  const [enablePassword, setEnablePassword] = useState(false);
  const isLecturer = user?.role === "lecturer" || user?.role === "admin";

  const personalMeetingId = "PMI-" + (user?.id?.slice(0, 3) || "USR") + "-MEET-001";

  const copyMeetingLink = (link: string) => {
    navigator.clipboard.writeText(link);
    toast.success("Meeting link copied!");
  };

  const handleJoinWithCode = () => {
    if (!joinCode.trim()) return;
    toast.success("Joining meeting...");
    setJoinOpen(false);
    navigate(`/meetings/room/${joinCode.replace(/\s/g, "")}`);
  };

  const filteredUpcoming = mockUpcomingMeetings.filter(
    (m) => m.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Meetings</h1>
            <p className="text-muted-foreground">
              Schedule, join, and manage video meetings
            </p>
          </div>
          <div className="flex gap-2">
            <Dialog open={joinOpen} onOpenChange={setJoinOpen}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <LinkIcon className="h-4 w-4 mr-2" />
                  Join
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Join a Meeting</DialogTitle>
                  <DialogDescription>Enter the meeting code or link to join</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Meeting Code</Label>
                    <Input
                      placeholder="e.g., ABC-DEFG-HIJ"
                      value={joinCode}
                      onChange={(e) => setJoinCode(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter") handleJoinWithCode(); }}
                    />
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2">
                      <Mic className="h-4 w-4 text-muted-foreground" />
                      <Label className="text-sm">Mic on</Label>
                      <Switch defaultChecked />
                    </div>
                    <div className="flex items-center gap-2">
                      <Video className="h-4 w-4 text-muted-foreground" />
                      <Label className="text-sm">Video on</Label>
                      <Switch defaultChecked />
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setJoinOpen(false)}>Cancel</Button>
                  <Button onClick={handleJoinWithCode} disabled={!joinCode.trim()}>Join Meeting</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <Dialog open={createOpen} onOpenChange={setCreateOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Schedule Meeting
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle>Schedule a Meeting</DialogTitle>
                  <DialogDescription>Create a new video meeting</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
                  <div className="space-y-2">
                    <Label>Meeting Title</Label>
                    <Input placeholder="e.g., Office Hours" />
                  </div>
                  <div className="space-y-2">
                    <Label>Description</Label>
                    <Textarea placeholder="What's this meeting about?" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Date</Label>
                      <Input type="date" />
                    </div>
                    <div className="space-y-2">
                      <Label>Time</Label>
                      <Input type="time" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Duration</Label>
                      <Select defaultValue="60">
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="15">15 minutes</SelectItem>
                          <SelectItem value="30">30 minutes</SelectItem>
                          <SelectItem value="45">45 minutes</SelectItem>
                          <SelectItem value="60">1 hour</SelectItem>
                          <SelectItem value="90">1.5 hours</SelectItem>
                          <SelectItem value="120">2 hours</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Max Participants</Label>
                      <Select defaultValue="50">
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="10">10</SelectItem>
                          <SelectItem value="25">25</SelectItem>
                          <SelectItem value="50">50</SelectItem>
                          <SelectItem value="100">100</SelectItem>
                          <SelectItem value="250">250</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Meeting Options */}
                  <div className="space-y-3 p-3 rounded-lg bg-muted/50">
                    <p className="text-sm font-medium">Meeting Options</p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Repeat className="h-4 w-4 text-muted-foreground" />
                        <Label className="text-sm">Recurring meeting</Label>
                      </div>
                      <Switch checked={isRecurring} onCheckedChange={setIsRecurring} />
                    </div>
                    {isRecurring && (
                      <Select defaultValue="weekly">
                        <SelectTrigger className="ml-6">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="daily">Daily</SelectItem>
                          <SelectItem value="weekly">Weekly</SelectItem>
                          <SelectItem value="biweekly">Bi-weekly</SelectItem>
                          <SelectItem value="monthly">Monthly</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Shield className="h-4 w-4 text-muted-foreground" />
                        <Label className="text-sm">Waiting room</Label>
                      </div>
                      <Switch checked={enableWaitingRoom} onCheckedChange={setEnableWaitingRoom} />
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Lock className="h-4 w-4 text-muted-foreground" />
                        <Label className="text-sm">Password protected</Label>
                      </div>
                      <Switch checked={enablePassword} onCheckedChange={setEnablePassword} />
                    </div>
                    {enablePassword && (
                      <Input placeholder="Meeting password" className="ml-6" />
                    )}
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
                  <Button onClick={() => { toast.success("Meeting scheduled!"); setCreateOpen(false); }}>
                    Schedule
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card
            className="cursor-pointer hover:shadow-md transition-all border-primary/20 hover:border-primary/50 group"
            onClick={() => navigate("/meetings/room/instant-" + Date.now())}
          >
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-full bg-primary/10 group-hover:bg-primary/20 transition-colors">
                  <Video className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold">Start Instant Meeting</h3>
                  <p className="text-sm text-muted-foreground">Create a meeting right now</p>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground ml-auto group-hover:translate-x-1 transition-transform" />
              </div>
            </CardContent>
          </Card>

          <Card
            className="cursor-pointer hover:shadow-md transition-all group"
            onClick={() => setJoinOpen(true)}
          >
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-full bg-accent/10 group-hover:bg-accent/20 transition-colors">
                  <LinkIcon className="h-6 w-6 text-accent" />
                </div>
                <div>
                  <h3 className="font-semibold">Join with Code</h3>
                  <p className="text-sm text-muted-foreground">Enter a meeting code to join</p>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground ml-auto group-hover:translate-x-1 transition-transform" />
              </div>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-md transition-all group" onClick={() => {
            navigator.clipboard.writeText(personalMeetingId);
            toast.success("Personal Meeting ID copied!");
          }}>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-full bg-success/10 group-hover:bg-success/20 transition-colors">
                  <Globe className="h-6 w-6 text-success" />
                </div>
                <div>
                  <h3 className="font-semibold">Personal Meeting</h3>
                  <p className="text-sm text-muted-foreground font-mono text-xs">{personalMeetingId}</p>
                </div>
                <Copy className="h-4 w-4 text-muted-foreground ml-auto" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search meetings..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Meetings Tabs */}
        <Tabs defaultValue="upcoming">
          <TabsList>
            <TabsTrigger value="upcoming">
              <Calendar className="h-4 w-4 mr-2" />
              Upcoming ({filteredUpcoming.length})
            </TabsTrigger>
            <TabsTrigger value="past">
              <Clock className="h-4 w-4 mr-2" />
              Past Meetings
            </TabsTrigger>
            <TabsTrigger value="recordings">
              <Radio className="h-4 w-4 mr-2" />
              Recordings
            </TabsTrigger>
          </TabsList>

          <TabsContent value="upcoming" className="space-y-4 mt-4">
            {filteredUpcoming.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Video className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No upcoming meetings</p>
                </CardContent>
              </Card>
            ) : (
              filteredUpcoming.map((meeting) => (
                <Card key={meeting.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <CardTitle className="text-lg">{meeting.title}</CardTitle>
                          {meeting.isRecurring && (
                            <Badge variant="outline" className="text-[10px]">
                              <Repeat className="h-3 w-3 mr-1" />
                              {meeting.recurringPattern}
                            </Badge>
                          )}
                        </div>
                        <CardDescription>{meeting.description}</CardDescription>
                      </div>
                      <div className="flex items-center gap-2">
                        {meeting.hasWaitingRoom && (
                          <Badge variant="outline" className="text-[10px]">
                            <Shield className="h-3 w-3 mr-1" />
                            Waiting Room
                          </Badge>
                        )}
                        {meeting.isPasswordProtected && (
                          <Badge variant="outline" className="text-[10px]">
                            <Lock className="h-3 w-3 mr-1" />
                            Protected
                          </Badge>
                        )}
                        {meeting.host === "You" && (
                          <Badge variant="outline">Host</Badge>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mb-4">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {format(meeting.startTime, "EEE, MMM d")}
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {format(meeting.startTime, "h:mm a")} ({meeting.duration} min)
                      </div>
                      <div className="flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        {meeting.participants}/{meeting.maxParticipants}
                      </div>
                      <div className="flex items-center gap-1 font-mono text-xs">
                        <LinkIcon className="h-3 w-3" />
                        {meeting.meetingCode}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button onClick={() => navigate(`/meetings/room/${meeting.id}`)}>
                        <Play className="h-4 w-4 mr-2" />
                        {meeting.host === "You" ? "Start" : "Join"} Meeting
                      </Button>
                      <Button variant="outline" size="icon" onClick={() => copyMeetingLink(meeting.meetingCode)}>
                        <Copy className="h-4 w-4" />
                      </Button>
                      {meeting.host === "You" && (
                        <Button variant="outline" size="icon">
                          <Settings className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          <TabsContent value="past" className="space-y-4 mt-4">
            {mockPastMeetings.map((meeting) => (
              <Card key={meeting.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{meeting.title}</CardTitle>
                      <CardDescription>{meeting.description}</CardDescription>
                    </div>
                    <Badge variant="secondary">Ended</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mb-4">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {format(meeting.startTime, "EEE, MMM d, yyyy")}
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      {meeting.duration} min
                    </div>
                    <div className="flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      {meeting.participants} attended
                    </div>
                  </div>
                  {meeting.recordingUrl ? (
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm">
                        <Play className="h-4 w-4 mr-2" />
                        Watch Recording
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Download className="h-4 w-4 mr-2" />
                        Download
                      </Button>
                      <span className="text-xs text-muted-foreground">{meeting.recordingDuration}</span>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No recording available</p>
                  )}
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="recordings" className="space-y-4 mt-4">
            {mockPastMeetings.filter((m) => m.recordingUrl).map((meeting) => (
              <Card key={meeting.id}>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-lg bg-primary/10">
                      <Radio className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold">{meeting.title}</h3>
                      <p className="text-sm text-muted-foreground">
                        {format(meeting.startTime, "MMM d, yyyy")} · {meeting.recordingDuration}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm">
                        <Play className="h-4 w-4 mr-2" />
                        Play
                      </Button>
                      <Button variant="ghost" size="icon">
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
