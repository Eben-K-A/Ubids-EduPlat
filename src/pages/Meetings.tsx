import { useEffect, useMemo, useState } from "react";
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
    Play,
    Settings,
    Radio,
    Shield,
    Repeat,
    Search,
    ChevronRight,
    Mic,
    Lock,
    Globe,
    X,
    Download,
    Trash2,
  } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { meetingsApi } from "@/services/api";

interface Meeting {
  id: string;
  title: string;
  description?: string;
  startTime: string;
  duration: number;
  hostName: string;
  meetingCode: string;
  isRecurring: boolean;
  recurringPattern?: string | null;
  hasWaitingRoom: boolean;
  isPasswordProtected: boolean;
}

export default function Meetings() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [createOpen, setCreateOpen] = useState(false);
  const [joinOpen, setJoinOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [joinCode, setJoinCode] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [isRecurring, setIsRecurring] = useState(false);
  const [enableWaitingRoom, setEnableWaitingRoom] = useState(false);
  const [enablePassword, setEnablePassword] = useState(false);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newDate, setNewDate] = useState("");
  const [newTime, setNewTime] = useState("");
  const [newDuration, setNewDuration] = useState("60");
  const [waitingRoomMode, setWaitingRoomMode] = useState("auto");
  const [recordingEnabled, setRecordingEnabled] = useState(false);
  const [recordings, setRecordings] = useState<Array<any>>([]);
  const [editingMeeting, setEditingMeeting] = useState<Meeting | null>(null);
  const [meetingPassword, setMeetingPassword] = useState("");
  const [joinPassword, setJoinPassword] = useState("");
  const [personalMeeting, setPersonalMeeting] = useState<any>(null);
  const apiBase = useMemo(() => {
    const env = import.meta.env.VITE_API_URL as string | undefined;
    return env ? env.replace(/\/api\/v1\/?$/, "") : window.location.origin;
  }, []);
  const currentName = `${user?.firstName ?? ""} ${user?.lastName ?? ""}`.trim();

  const meetingLinkFor = (code: string) => `${window.location.origin}/meetings/room/${code}`;

  const copyMeetingLink = (code: string) => {
    navigator.clipboard.writeText(meetingLinkFor(code));
    toast.success("Meeting link copied!");
  };

  const handleJoinWithCode = () => {
    if (!joinCode.trim()) {
      toast.error("Please enter a meeting code");
      return;
    }
    const trimmed = joinCode.trim();
    const match = trimmed.match(/\/meetings\/room\/([^/?#]+)/);
    const code = match ? match[1] : trimmed.replace(/\s/g, "");

    if (!code) {
      toast.error("Invalid meeting code format");
      return;
    }

    toast.info("Joining meeting...");
    setJoinOpen(false);
    navigate(`/meetings/room/${code}?password=${encodeURIComponent(joinPassword)}`);
    setJoinPassword("");
  };

  const filteredMeetings = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return meetings.filter((m) => m.title.toLowerCase().includes(q) || (m.description || "").toLowerCase().includes(q));
  }, [meetings, searchQuery]);

  const now = new Date();
  const upcomingMeetings = filteredMeetings.filter((m) => new Date(m.startTime) >= now);
  const pastMeetings = filteredMeetings.filter((m) => new Date(m.startTime) < now);

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      try {
        setIsLoading(true);
        const res = await meetingsApi.list();
        if (isMounted) setMeetings(res.data || []);

        // Load personal meeting
        try {
          const personalRes = await meetingsApi.getPersonalMeeting();
          if (isMounted) setPersonalMeeting(personalRes.data);
        } catch (err) {
          // Personal meeting loading is not critical
          console.error("Failed to load personal meeting", err);
        }
      } catch (err) {
        toast.error("Failed to load meetings");
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };
    load();
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    const loadRecordings = async () => {
      if (meetings.length === 0) {
        setRecordings([]);
        return;
      }
      const all: any[] = [];
      for (const m of meetings) {
        try {
          const res = await meetingsApi.listRecordings(m.id);
          (res.data || []).forEach((r: any) =>
            all.push({
              ...r,
              meetingTitle: m.title,
              meetingCode: m.meetingCode,
            })
          );
        } catch {
          // ignore individual failures
        }
      }
      if (!cancelled) setRecordings(all);
    };
    loadRecordings();
    return () => {
      cancelled = true;
    };
  }, [meetings]);

  const handleScheduleMeeting = async () => {
    if (!newTitle.trim() || !newDate || !newTime) {
      toast.error("Please fill in title, date, and time");
      return;
    }
    const startTime = new Date(`${newDate}T${newTime}`);
    if (Number.isNaN(startTime.getTime())) {
      toast.error("Invalid date or time format");
      return;
    }

    if (enablePassword && !meetingPassword.trim()) {
      toast.error("Please enter a password for the meeting");
      return;
    }

    try {
      const res = await meetingsApi.create({
        title: newTitle.trim(),
        description: newDescription.trim() || null,
        startTime: startTime.toISOString(),
        duration: Number(newDuration),
        waitingRoomMode,
        isRecurring,
        recurringPattern: isRecurring ? "Weekly" : null,
        hasWaitingRoom: enableWaitingRoom,
        isPasswordProtected: enablePassword,
        recordingEnabled,
        password: enablePassword ? meetingPassword : null,
      });
      const meeting = res.data as Meeting;
      setMeetings((prev) => [...prev, meeting].sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()));
      setCreateOpen(false);
      resetForm();
      copyMeetingLink(meeting.meetingCode);
      toast.success("Meeting scheduled successfully! Link copied to clipboard.");
    } catch (err: any) {
      const errorMsg = err?.data?.message || err?.message || "Failed to schedule meeting";
      toast.error(errorMsg);
    }
  };

  const handleInstantMeeting = async () => {
    const now = new Date();
    try {
      const res = await meetingsApi.create({
        title: "Instant Meeting",
        description: "Instant meeting",
        startTime: now.toISOString(),
        duration: 60,
        waitingRoomMode,
        isRecurring: false,
        recurringPattern: null,
        hasWaitingRoom: enableWaitingRoom,
        isPasswordProtected: false,
        recordingEnabled,
      });
      const meeting = res.data as Meeting;
      setMeetings((prev) => [...prev, meeting].sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()));
      navigate(`/meetings/room/${meeting.meetingCode}`);
    } catch (err) {
      toast.error("Failed to start instant meeting");
    }
  };

  const openEditDialog = (meeting: Meeting) => {
    setEditingMeeting(meeting);
    setNewTitle(meeting.title);
    setNewDescription(meeting.description || "");
    const startDate = new Date(meeting.startTime);
    setNewDate(startDate.toISOString().split('T')[0]);
    setNewTime(startDate.toTimeString().slice(0, 5));
    setNewDuration(String(meeting.duration));
    setEnableWaitingRoom(meeting.hasWaitingRoom);
    setEnablePassword(meeting.isPasswordProtected);
    setIsRecurring(meeting.isRecurring);
    setEditOpen(true);
  };

  const handleEditMeeting = async () => {
    if (!editingMeeting || !newTitle.trim() || !newDate || !newTime) {
      toast.error("Please fill in title, date, and time");
      return;
    }
    const startTime = new Date(`${newDate}T${newTime}`);
    if (Number.isNaN(startTime.getTime())) {
      toast.error("Invalid date or time format");
      return;
    }

    if (enablePassword && !meetingPassword.trim()) {
      toast.error("Please enter a password for the meeting");
      return;
    }

    try {
      const res = await meetingsApi.update(editingMeeting.id, {
        title: newTitle.trim(),
        description: newDescription.trim() || null,
        startTime: startTime.toISOString(),
        duration: Number(newDuration),
        waitingRoomMode,
        isRecurring,
        recurringPattern: isRecurring ? "Weekly" : null,
        hasWaitingRoom: enableWaitingRoom,
        isPasswordProtected: enablePassword,
        recordingEnabled,
        password: enablePassword ? meetingPassword : null,
      });
      const updated = res.data as Meeting;
      setMeetings((prev) => prev.map((m) => m.id === updated.id ? updated : m).sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()));
      setEditOpen(false);
      setEditingMeeting(null);
      resetForm();
      toast.success("Meeting updated successfully");
    } catch (err: any) {
      const errorMsg = err?.data?.message || err?.message || "Failed to update meeting";
      toast.error(errorMsg);
    }
  };

  const handleDeleteMeeting = async (meetingId: string) => {
    if (!window.confirm("Are you sure you want to delete this meeting?")) return;
    try {
      await meetingsApi.delete(meetingId);
      setMeetings((prev) => prev.filter((m) => m.id !== meetingId));
      toast.success("Meeting deleted");
    } catch (err) {
      toast.error("Failed to delete meeting");
    }
  };

  const handleDeleteRecording = async (recordingId: string, meetingId: string) => {
    if (!window.confirm("Are you sure you want to delete this recording?")) return;
    try {
      await meetingsApi.deleteRecording(meetingId, recordingId);
      setRecordings((prev) => prev.filter((r) => r.id !== recordingId));
      toast.success("Recording deleted");
    } catch (err) {
      toast.error("Failed to delete recording");
    }
  };

  const resetForm = () => {
    setNewTitle("");
    setNewDescription("");
    setNewDate("");
    setNewTime("");
    setNewDuration("60");
    setIsRecurring(false);
    setEnableWaitingRoom(false);
    setEnablePassword(false);
    setWaitingRoomMode("auto");
    setRecordingEnabled(false);
    setMeetingPassword("");
  };

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
                  <div className="space-y-2">
                    <Label>Password (if required)</Label>
                    <Input
                      type="password"
                      placeholder="Enter meeting password if needed"
                      value={joinPassword}
                      onChange={(e) => setJoinPassword(e.target.value)}
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
                    <Input
                      placeholder="e.g., Office Hours"
                      value={newTitle}
                      onChange={(e) => setNewTitle(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Description</Label>
                    <Textarea
                      placeholder="What's this meeting about?"
                      value={newDescription}
                      onChange={(e) => setNewDescription(e.target.value)}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Date</Label>
                      <Input type="date" value={newDate} onChange={(e) => setNewDate(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label>Time</Label>
                      <Input type="time" value={newTime} onChange={(e) => setNewTime(e.target.value)} />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Duration</Label>
                      <Select value={newDuration} onValueChange={setNewDuration}>
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
                    <div className="space-y-2">
                      <Label className="text-sm">Waiting room mode</Label>
                      <Select value={waitingRoomMode} onValueChange={setWaitingRoomMode}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="host-approve">Host approves everyone</SelectItem>
                          <SelectItem value="auth-auto">Auto-admit authenticated users</SelectItem>
                          <SelectItem value="auto">Auto-admit everyone</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
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
                      <Input
                        type="password"
                        placeholder="Meeting password"
                        className="ml-6"
                        value={meetingPassword}
                        onChange={(e) => setMeetingPassword(e.target.value)}
                      />
                    )}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Radio className="h-4 w-4 text-muted-foreground" />
                        <Label className="text-sm">Enable recording</Label>
                      </div>
                      <Switch checked={recordingEnabled} onCheckedChange={setRecordingEnabled} />
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
                  <Button onClick={handleScheduleMeeting}>
                    Schedule
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <Dialog open={editOpen} onOpenChange={setEditOpen}>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle>Edit Meeting</DialogTitle>
                  <DialogDescription>Update meeting details</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
                  <div className="space-y-2">
                    <Label>Meeting Title</Label>
                    <Input
                      placeholder="e.g., Office Hours"
                      value={newTitle}
                      onChange={(e) => setNewTitle(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Description</Label>
                    <Textarea
                      placeholder="What's this meeting about?"
                      value={newDescription}
                      onChange={(e) => setNewDescription(e.target.value)}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Date</Label>
                      <Input type="date" value={newDate} onChange={(e) => setNewDate(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label>Time</Label>
                      <Input type="time" value={newTime} onChange={(e) => setNewTime(e.target.value)} />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Duration</Label>
                      <Select value={newDuration} onValueChange={setNewDuration}>
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
                    <div className="space-y-2">
                      <Label className="text-sm">Waiting room mode</Label>
                      <Select value={waitingRoomMode} onValueChange={setWaitingRoomMode}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="host-approve">Host approves everyone</SelectItem>
                          <SelectItem value="auth-auto">Auto-admit authenticated users</SelectItem>
                          <SelectItem value="auto">Auto-admit everyone</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Repeat className="h-4 w-4 text-muted-foreground" />
                        <Label className="text-sm">Recurring meeting</Label>
                      </div>
                      <Switch checked={isRecurring} onCheckedChange={setIsRecurring} />
                    </div>
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
                      <Input
                        type="password"
                        placeholder="Meeting password"
                        className="ml-6"
                        value={meetingPassword}
                        onChange={(e) => setMeetingPassword(e.target.value)}
                      />
                    )}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Radio className="h-4 w-4 text-muted-foreground" />
                        <Label className="text-sm">Enable recording</Label>
                      </div>
                      <Switch checked={recordingEnabled} onCheckedChange={setRecordingEnabled} />
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => { setEditOpen(false); setEditingMeeting(null); }}>Cancel</Button>
                  <Button onClick={handleEditMeeting}>
                    Update Meeting
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
            onClick={handleInstantMeeting}
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

          <Card className="cursor-pointer hover:shadow-md transition-all group">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-full bg-success/10 group-hover:bg-success/20 transition-colors">
                  <Globe className="h-6 w-6 text-success" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold">Personal Meeting</h3>
                  <p className="text-sm text-muted-foreground font-mono text-xs">
                    {personalMeeting?.personalMeetingCode || "Loading..."}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      navigator.clipboard.writeText(personalMeeting?.personalMeetingCode || "");
                      toast.success("Personal Meeting ID copied!");
                    }}
                    className="p-1 hover:bg-muted rounded"
                  >
                    <Copy className="h-4 w-4 text-muted-foreground" />
                  </button>
                  <button
                    onClick={() => personalMeeting && navigate(`/meetings/room/${personalMeeting.meetingCode}`)}
                    disabled={!personalMeeting}
                    className="p-1 hover:bg-muted rounded disabled:opacity-50"
                  >
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </button>
                </div>
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
              Upcoming ({upcomingMeetings.length})
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
            {isLoading ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <p className="text-muted-foreground">Loading meetings...</p>
                </CardContent>
              </Card>
            ) : upcomingMeetings.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Video className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No upcoming meetings</p>
                </CardContent>
              </Card>
            ) : (
              upcomingMeetings.map((meeting) => (
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
                        {meeting.hostName === currentName && (
                          <Badge variant="outline">Host</Badge>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mb-4">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {format(new Date(meeting.startTime), "EEE, MMM d")}
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {format(new Date(meeting.startTime), "h:mm a")} ({meeting.duration} min)
                      </div>
                      <div className="flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        {meeting.hostName}
                      </div>
                      <div className="flex items-center gap-1 font-mono text-xs">
                        <LinkIcon className="h-3 w-3" />
                        {meeting.meetingCode}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button onClick={() => navigate(`/meetings/room/${meeting.meetingCode}`)}>
                        <Play className="h-4 w-4 mr-2" />
                        {meeting.hostName === currentName ? "Start" : "Join"} Meeting
                      </Button>
                      <Button variant="outline" size="icon" onClick={() => copyMeetingLink(meeting.meetingCode)}>
                        <Copy className="h-4 w-4" />
                      </Button>
                      {meeting.hostName === currentName && (
                        <>
                          <Button variant="outline" size="icon" onClick={() => openEditDialog(meeting)}>
                            <Settings className="h-4 w-4" />
                          </Button>
                          <Button variant="outline" size="icon" onClick={() => handleDeleteMeeting(meeting.id)}>
                            <X className="h-4 w-4 text-destructive" />
                          </Button>
                        </>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          <TabsContent value="past" className="space-y-4 mt-4">
            {pastMeetings.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <p className="text-muted-foreground">No past meetings</p>
                </CardContent>
              </Card>
            ) : pastMeetings.map((meeting) => (
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
                      {format(new Date(meeting.startTime), "EEE, MMM d, yyyy")}
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      {meeting.duration} min
                    </div>
                    <div className="flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      {meeting.hostName}
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">Recording not available</p>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="recordings" className="space-y-4 mt-4">
            {recordings.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Radio className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No recordings yet.</p>
                  <p className="text-sm text-muted-foreground mt-2">Start a recording during a meeting to see it here.</p>
                </CardContent>
              </Card>
            ) : (
              recordings.map((rec) => {
                const url = rec.recordingUrl?.startsWith("http")
                  ? rec.recordingUrl
                  : rec.recordingUrl
                    ? `${apiBase}${rec.recordingUrl}`
                    : null;
                const isRecording = rec.status === "recording";
                const isCompleted = rec.status === "completed";
                return (
                  <Card key={rec.id} className={isRecording ? "border-yellow-500/50 bg-yellow-500/5" : ""}>
                    <CardContent className="pt-6">
                      <div className="flex flex-col gap-3">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-4 flex-1">
                            <div className={`p-3 rounded-lg flex-shrink-0 ${isRecording ? "bg-yellow-500/20" : "bg-primary/10"}`}>
                              <Radio className={`h-5 w-5 ${isRecording ? "text-yellow-500 animate-pulse" : "text-primary"}`} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <h3 className="font-semibold truncate">{rec.meetingTitle}</h3>
                                {isRecording && (
                                  <Badge className="text-xs bg-yellow-600 hover:bg-yellow-700 animate-pulse flex-shrink-0">
                                    Recording
                                  </Badge>
                                )}
                                {isCompleted && (
                                  <Badge className="text-xs bg-green-600 hover:bg-green-700 flex-shrink-0">
                                    Completed
                                  </Badge>
                                )}
                              </div>
                              <div className="text-sm text-muted-foreground mt-1 space-y-1">
                                <p>{rec.meetingCode} · {rec.startedAt ? format(new Date(rec.startedAt), "MMM d, yyyy h:mm a") : "Just started"}</p>
                                {rec.stoppedAt && (
                                  <p className="text-xs">Duration: {Math.round((new Date(rec.stoppedAt).getTime() - new Date(rec.startedAt).getTime()) / 60000)} minutes</p>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center justify-end gap-2">
                          {url ? (
                            <Button asChild variant="outline" size="sm">
                              <a href={url} target="_blank" rel="noreferrer">
                                <Play className="h-4 w-4 mr-2" />
                                Play
                              </a>
                            </Button>
                          ) : isRecording ? (
                            <span className="text-xs text-yellow-600 font-medium">Recording in progress...</span>
                          ) : (
                            <span className="text-xs text-muted-foreground">Processing...</span>
                          )}
                          {isCompleted && (
                            <>
                              {url && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  asChild
                                >
                                  <a href={url} download>
                                    <Download className="h-4 w-4 mr-2" />
                                    Download
                                  </a>
                                </Button>
                              )}
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDeleteRecording(rec.id, rec.meetingId)}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
