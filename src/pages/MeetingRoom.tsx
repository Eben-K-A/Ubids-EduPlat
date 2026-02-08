import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Video, Mic, MicOff, VideoOff,
  PhoneOff, MessageSquare, Hand, ScreenShare,
  Users, MoreHorizontal, Grid3X3, Maximize2,
  Settings, Shield, Clock, Copy,
  ThumbsUp, Heart, Laugh, PartyPopper,
  BarChart3, Palette, Captions, Radio,
  ChevronRight, X, Send, Pin,
  CircleDot, Square, Play, Pause,
  Volume2, VolumeX, MonitorUp, UserPlus,
  Lock, Globe, Sparkles, Image,
} from "lucide-react";
import { toast } from "sonner";

interface Participant {
  id: string;
  name: string;
  role: "Host" | "Co-Host" | "Student";
  isMuted: boolean;
  isVideoOn: boolean;
  isHandRaised: boolean;
  isPinned: boolean;
  isSpeaking: boolean;
}

interface ChatMessage {
  id: string;
  sender: string;
  content: string;
  time: string;
  isPrivate?: boolean;
  replyTo?: string;
}

interface PollOption {
  id: string;
  text: string;
  votes: number;
}

interface Poll {
  id: string;
  question: string;
  options: PollOption[];
  isActive: boolean;
  totalVotes: number;
}

interface Reaction {
  id: string;
  emoji: string;
  x: number;
  y: number;
}

const mockParticipants: Participant[] = [
  { id: "p1", name: "Dr. Sarah Johnson", role: "Host", isMuted: false, isVideoOn: true, isHandRaised: false, isPinned: false, isSpeaking: true },
  { id: "p2", name: "Alice Chen", role: "Student", isMuted: true, isVideoOn: true, isHandRaised: false, isPinned: false, isSpeaking: false },
  { id: "p3", name: "Bob Williams", role: "Student", isMuted: false, isVideoOn: false, isHandRaised: true, isPinned: false, isSpeaking: false },
  { id: "p4", name: "Carol Davis", role: "Student", isMuted: true, isVideoOn: true, isHandRaised: false, isPinned: false, isSpeaking: false },
  { id: "p5", name: "David Lee", role: "Student", isMuted: false, isVideoOn: true, isHandRaised: false, isPinned: false, isSpeaking: false },
  { id: "p6", name: "Emma Garcia", role: "Student", isMuted: true, isVideoOn: false, isHandRaised: false, isPinned: false, isSpeaking: false },
  { id: "p7", name: "Frank Miller", role: "Co-Host", isMuted: false, isVideoOn: true, isHandRaised: false, isPinned: false, isSpeaking: false },
  { id: "p8", name: "Grace Kim", role: "Student", isMuted: true, isVideoOn: true, isHandRaised: true, isPinned: false, isSpeaking: false },
];

const initialChatMessages: ChatMessage[] = [
  { id: "c1", sender: "Dr. Sarah Johnson", content: "Welcome everyone! Let's get started.", time: "10:00 AM" },
  { id: "c2", sender: "Alice Chen", content: "Hi professor! 👋", time: "10:01 AM" },
  { id: "c3", sender: "Bob Williams", content: "Can you explain binary trees again?", time: "10:02 AM" },
  { id: "c4", sender: "Dr. Sarah Johnson", content: "Sure! I'll cover that in today's session.", time: "10:03 AM" },
  { id: "c5", sender: "Carol Davis", content: "That would be helpful, thanks!", time: "10:04 AM" },
];

const mockPoll: Poll = {
  id: "poll1",
  question: "Which data structure should we review next?",
  options: [
    { id: "o1", text: "Binary Search Trees", votes: 8 },
    { id: "o2", text: "Hash Tables", votes: 5 },
    { id: "o3", text: "Graphs", votes: 12 },
    { id: "o4", text: "Heaps", votes: 3 },
  ],
  isActive: true,
  totalVotes: 28,
};

const virtualBackgrounds = [
  { id: "none", name: "None", color: "transparent" },
  { id: "blur", name: "Blur", color: "hsl(220, 14%, 80%)" },
  { id: "classroom", name: "Classroom", color: "hsl(30, 40%, 70%)" },
  { id: "library", name: "Library", color: "hsl(25, 30%, 50%)" },
  { id: "nature", name: "Nature", color: "hsl(142, 40%, 55%)" },
  { id: "space", name: "Space", color: "hsl(240, 60%, 20%)" },
];

export default function MeetingRoom() {
  const { user } = useAuth();
  const { meetingId } = useParams<{ meetingId: string }>();
  const navigate = useNavigate();

  // Controls
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [handRaised, setHandRaised] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [captionsOn, setCaptionsOn] = useState(false);

  // Panels
  const [rightPanel, setRightPanel] = useState<"none" | "chat" | "participants" | "polls" | "breakout">("none");
  const [viewMode, setViewMode] = useState<"gallery" | "speaker">("gallery");

  // Chat
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>(initialChatMessages);
  const [chatInput, setChatInput] = useState("");

  // Participants
  const [participants, setParticipants] = useState<Participant[]>(mockParticipants);

  // Polls
  const [poll, setPoll] = useState<Poll>(mockPoll);
  const [votedOption, setVotedOption] = useState<string | null>(null);

  // Reactions
  const [reactions, setReactions] = useState<Reaction[]>([]);

  // Timer
  const [elapsedTime, setElapsedTime] = useState(0);

  // Virtual background
  const [selectedBg, setSelectedBg] = useState("none");

  // Waiting room
  const [waitingRoom] = useState([
    { id: "w1", name: "Late Student" },
    { id: "w2", name: "Guest Speaker" },
  ]);

  // Timer
  useEffect(() => {
    const interval = setInterval(() => {
      setElapsedTime((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // Remove reactions after animation
  useEffect(() => {
    if (reactions.length > 0) {
      const timeout = setTimeout(() => {
        setReactions((prev) => prev.slice(1));
      }, 2000);
      return () => clearTimeout(timeout);
    }
  }, [reactions]);

  const leaveMeeting = () => {
    toast.info("You left the meeting");
    navigate("/meetings");
  };

  const sendChatMessage = () => {
    if (!chatInput.trim()) return;
    const msg: ChatMessage = {
      id: crypto.randomUUID(),
      sender: "You",
      content: chatInput.trim(),
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };
    setChatMessages((prev) => [...prev, msg]);
    setChatInput("");
  };

  const sendReaction = (emoji: string) => {
    const reaction: Reaction = {
      id: crypto.randomUUID(),
      emoji,
      x: 20 + Math.random() * 60,
      y: 60 + Math.random() * 20,
    };
    setReactions((prev) => [...prev, reaction]);
  };

  const togglePanel = (panel: typeof rightPanel) => {
    setRightPanel(rightPanel === panel ? "none" : panel);
  };

  const handleVote = (optionId: string) => {
    if (votedOption) return;
    setVotedOption(optionId);
    setPoll((prev) => ({
      ...prev,
      totalVotes: prev.totalVotes + 1,
      options: prev.options.map((o) =>
        o.id === optionId ? { ...o, votes: o.votes + 1 } : o
      ),
    }));
    toast.success("Vote submitted!");
  };

  const togglePinParticipant = (id: string) => {
    setParticipants((prev) =>
      prev.map((p) => (p.id === id ? { ...p, isPinned: !p.isPinned } : p))
    );
  };

  const handRaisedCount = participants.filter((p) => p.isHandRaised).length + (handRaised ? 1 : 0);
  const totalParticipants = participants.length + 1;

  const reactionEmojis = [
    { emoji: "👍", icon: ThumbsUp, label: "Thumbs up" },
    { emoji: "❤️", icon: Heart, label: "Heart" },
    { emoji: "😂", icon: Laugh, label: "Laugh" },
    { emoji: "🎉", icon: PartyPopper, label: "Party" },
    { emoji: "👏", icon: Sparkles, label: "Clap" },
  ];

  // Determine video grid layout
  const displayParticipants = viewMode === "speaker"
    ? participants.filter((p) => p.isSpeaking || p.isPinned).slice(0, 1)
    : participants;

  const gridCols = viewMode === "speaker"
    ? "grid-cols-1"
    : participants.length <= 2
    ? "grid-cols-1 lg:grid-cols-2"
    : participants.length <= 4
    ? "grid-cols-2"
    : participants.length <= 6
    ? "grid-cols-2 lg:grid-cols-3"
    : "grid-cols-3 lg:grid-cols-4";

  return (
    <div className="h-screen bg-[hsl(222,47%,6%)] text-white flex flex-col overflow-hidden">
      {/* Floating Reactions */}
      {reactions.map((r) => (
        <div
          key={r.id}
          className="fixed text-4xl pointer-events-none z-50 animate-bounce"
          style={{
            left: `${r.x}%`,
            top: `${r.y}%`,
            animation: "float-up 2s ease-out forwards",
          }}
        >
          {r.emoji}
        </div>
      ))}

      {/* Top Bar */}
      <div className="flex items-center justify-between px-4 py-2 bg-[hsl(222,47%,8%)] border-b border-white/10 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            {isRecording && (
              <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-destructive/20 border border-destructive/30">
                <div className="w-2 h-2 rounded-full bg-destructive animate-pulse" />
                <span className="text-[11px] font-medium text-destructive">REC</span>
              </div>
            )}
            <Badge variant="outline" className="border-white/20 text-white/70 text-[11px]">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse mr-1.5" />
              Live
            </Badge>
          </div>
          <div>
            <h2 className="font-semibold text-sm">CS101 Office Hours</h2>
            <div className="flex items-center gap-3 text-[11px] text-white/50">
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {formatTime(elapsedTime)}
              </span>
              <span className="flex items-center gap-1">
                <Users className="h-3 w-3" />
                {totalParticipants}
              </span>
              {handRaisedCount > 0 && (
                <span className="flex items-center gap-1 text-warning">
                  <Hand className="h-3 w-3" />
                  {handRaisedCount}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Meeting ID */}
          <Button
            variant="ghost"
            size="sm"
            className="text-white/60 hover:text-white text-xs gap-1"
            onClick={() => {
              navigator.clipboard.writeText(meetingId || "mtg-abc-defg-hij");
              toast.success("Meeting ID copied!");
            }}
          >
            <Lock className="h-3 w-3" />
            {meetingId?.slice(0, 8) || "mtg-abc"}
            <Copy className="h-3 w-3" />
          </Button>

          {/* View Toggle */}
          <div className="flex items-center bg-white/10 rounded-lg p-0.5">
            <Button
              variant="ghost"
              size="sm"
              className={`h-7 px-2 rounded-md ${viewMode === "gallery" ? "bg-white/20 text-white" : "text-white/50"}`}
              onClick={() => setViewMode("gallery")}
            >
              <Grid3X3 className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className={`h-7 px-2 rounded-md ${viewMode === "speaker" ? "bg-white/20 text-white" : "text-white/50"}`}
              onClick={() => setViewMode("speaker")}
            >
              <Maximize2 className="h-3.5 w-3.5" />
            </Button>
          </div>

          {/* Captions */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className={`h-8 w-8 p-0 ${captionsOn ? "text-primary" : "text-white/50"}`}
                onClick={() => { setCaptionsOn(!captionsOn); toast.info(captionsOn ? "Captions off" : "Captions on"); }}
              >
                <Captions className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">Captions</TooltipContent>
          </Tooltip>

          {/* Security */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-white/50">
                <Shield className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
              <DropdownMenuItem onClick={() => toast.info("Meeting locked")}>
                <Lock className="h-4 w-4 mr-2" /> Lock Meeting
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => togglePanel("breakout")}>
                <Grid3X3 className="h-4 w-4 mr-2" /> Breakout Rooms
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <Globe className="h-4 w-4 mr-2" /> Waiting Room ({waitingRoom.length})
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Video Grid */}
        <div className="flex-1 p-3 overflow-y-auto">
          {/* Speaker View - Large main + small strip */}
          {viewMode === "speaker" ? (
            <div className="flex flex-col h-full gap-2">
              {/* Main Speaker */}
              <div className="flex-1 relative rounded-xl bg-[hsl(222,40%,12%)] border border-white/10 flex items-center justify-center overflow-hidden">
                <Avatar className="h-28 w-28">
                  <AvatarFallback className="text-4xl bg-primary/20 text-primary">
                    {participants[0]?.name.split(" ").map((n) => n[0]).join("")}
                  </AvatarFallback>
                </Avatar>
                <div className="absolute bottom-3 left-3 flex items-center gap-2">
                  <span className="text-sm bg-black/60 px-3 py-1 rounded-full">{participants[0]?.name}</span>
                  <Badge className="text-[10px] bg-primary/80">Speaking</Badge>
                </div>
                {captionsOn && (
                  <div className="absolute bottom-12 left-1/2 -translate-x-1/2 bg-black/80 px-4 py-2 rounded-lg max-w-lg">
                    <p className="text-sm text-center">...and that's how binary search trees maintain their sorted property through rotations.</p>
                  </div>
                )}
              </div>
              {/* Thumbnail Strip */}
              <div className="flex gap-2 overflow-x-auto pb-1">
                {participants.slice(1).map((p) => (
                  <div
                    key={p.id}
                    className="relative rounded-lg bg-[hsl(222,40%,12%)] border border-white/10 flex items-center justify-center w-32 h-24 flex-shrink-0 cursor-pointer hover:border-primary/50 transition-colors"
                    onClick={() => togglePinParticipant(p.id)}
                  >
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="text-xs bg-white/10 text-white/60">
                        {p.name.split(" ").map((n) => n[0]).join("")}
                      </AvatarFallback>
                    </Avatar>
                    <span className="absolute bottom-1 left-1 text-[9px] bg-black/60 px-1.5 py-0.5 rounded-full truncate max-w-[90%]">
                      {p.name.split(" ")[0]}
                    </span>
                    {p.isMuted && <MicOff className="absolute top-1 right-1 h-3 w-3 text-destructive" />}
                  </div>
                ))}
                {/* Self */}
                <div className="relative rounded-lg bg-[hsl(222,40%,12%)] border-2 border-primary/40 flex items-center justify-center w-32 h-24 flex-shrink-0">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="text-xs bg-primary/30 text-primary-foreground">
                      {user?.firstName?.[0]}{user?.lastName?.[0]}
                    </AvatarFallback>
                  </Avatar>
                  <span className="absolute bottom-1 left-1 text-[9px] bg-black/60 px-1.5 py-0.5 rounded-full">You</span>
                </div>
              </div>
            </div>
          ) : (
            /* Gallery View */
            <div className={`grid ${gridCols} gap-2 h-full auto-rows-fr`}>
              {displayParticipants.map((p) => (
                <div
                  key={p.id}
                  className={`relative rounded-xl bg-[hsl(222,40%,12%)] border flex items-center justify-center min-h-[140px] overflow-hidden transition-all ${
                    p.isSpeaking ? "border-green-500/60 shadow-[0_0_12px_hsl(142,76%,36%,0.2)]" : p.isPinned ? "border-primary/50" : "border-white/10"
                  }`}
                >
                  {p.isVideoOn ? (
                    <div className="w-full h-full bg-gradient-to-br from-[hsl(222,40%,14%)] to-[hsl(222,40%,10%)] flex items-center justify-center">
                      <Avatar className="h-16 w-16">
                        <AvatarFallback className="text-xl bg-primary/20 text-primary">
                          {p.name.split(" ").map((n) => n[0]).join("")}
                        </AvatarFallback>
                      </Avatar>
                    </div>
                  ) : (
                    <Avatar className="h-16 w-16">
                      <AvatarFallback className="text-xl bg-white/10 text-white/60">
                        {p.name.split(" ").map((n) => n[0]).join("")}
                      </AvatarFallback>
                    </Avatar>
                  )}
                  <div className="absolute bottom-2 left-2 flex items-center gap-1.5">
                    <span className="text-[11px] bg-black/60 px-2 py-0.5 rounded-full">{p.name}</span>
                    {p.isMuted && <MicOff className="h-3 w-3 text-destructive" />}
                    {p.isHandRaised && <Hand className="h-3 w-3 text-warning" />}
                  </div>
                  {p.isSpeaking && (
                    <div className="absolute top-2 left-2">
                      <Volume2 className="h-3.5 w-3.5 text-green-400 animate-pulse" />
                    </div>
                  )}
                  {p.role === "Host" && (
                    <Badge className="absolute top-2 right-2 text-[9px] bg-primary/80">Host</Badge>
                  )}
                  {p.role === "Co-Host" && (
                    <Badge className="absolute top-2 right-2 text-[9px] bg-accent/80" variant="secondary">Co-Host</Badge>
                  )}
                  {p.isPinned && <Pin className="absolute top-2 right-2 h-3 w-3 text-primary" />}
                </div>
              ))}
              {/* Self view */}
              <div
                className="relative rounded-xl bg-[hsl(222,40%,12%)] border-2 border-primary/40 flex items-center justify-center min-h-[140px]"
                style={selectedBg !== "none" && selectedBg !== "blur" ? {
                  background: virtualBackgrounds.find((b) => b.id === selectedBg)?.color
                } : selectedBg === "blur" ? { backdropFilter: "blur(10px)" } : {}}
              >
                <Avatar className="h-16 w-16">
                  <AvatarFallback className="text-xl bg-primary/30 text-primary-foreground">
                    {user?.firstName?.[0]}{user?.lastName?.[0]}
                  </AvatarFallback>
                </Avatar>
                <div className="absolute bottom-2 left-2 flex items-center gap-1.5">
                  <span className="text-[11px] bg-black/60 px-2 py-0.5 rounded-full">You</span>
                  {isMuted && <MicOff className="h-3 w-3 text-destructive" />}
                  {handRaised && <Hand className="h-3 w-3 text-warning" />}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Panel */}
        {rightPanel !== "none" && (
          <div className="w-80 border-l border-white/10 bg-[hsl(222,47%,8%)] flex flex-col flex-shrink-0">
            <div className="flex items-center justify-between p-3 border-b border-white/10">
              <h3 className="font-semibold text-sm capitalize">{rightPanel === "breakout" ? "Breakout Rooms" : rightPanel}</h3>
              <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-white/50" onClick={() => setRightPanel("none")}>
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Chat Panel */}
            {rightPanel === "chat" && (
              <>
                <ScrollArea className="flex-1 p-3">
                  <div className="space-y-3">
                    {chatMessages.map((msg) => (
                      <div key={msg.id} className="group">
                        <div className="flex items-baseline gap-2">
                          <span className="text-xs font-medium text-primary">{msg.sender}</span>
                          <span className="text-[10px] text-white/40">{msg.time}</span>
                        </div>
                        <p className="text-xs text-white/70 mt-0.5">{msg.content}</p>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
                <div className="p-3 border-t border-white/10">
                  <div className="flex gap-2">
                    <Input
                      placeholder="Type a message..."
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter") sendChatMessage(); }}
                      className="bg-white/10 border-white/20 text-white placeholder:text-white/40 text-xs h-8"
                    />
                    <Button size="sm" className="h-8 w-8 p-0" onClick={sendChatMessage}>
                      <Send className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </>
            )}

            {/* Participants Panel */}
            {rightPanel === "participants" && (
              <ScrollArea className="flex-1 p-3">
                <div className="space-y-1">
                  {/* Waiting Room */}
                  {waitingRoom.length > 0 && (
                    <div className="mb-4">
                      <p className="text-[11px] font-medium text-white/50 uppercase mb-2">Waiting Room ({waitingRoom.length})</p>
                      {waitingRoom.map((w) => (
                        <div key={w.id} className="flex items-center justify-between py-2 px-2 rounded-lg hover:bg-white/5">
                          <div className="flex items-center gap-2">
                            <Avatar className="h-7 w-7">
                              <AvatarFallback className="text-[10px] bg-warning/20 text-warning">
                                {w.name.split(" ").map((n) => n[0]).join("")}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-xs">{w.name}</span>
                          </div>
                          <div className="flex gap-1">
                            <Button size="sm" className="h-6 text-[10px] px-2" onClick={() => toast.success(`${w.name} admitted`)}>
                              Admit
                            </Button>
                          </div>
                        </div>
                      ))}
                      <Separator className="bg-white/10 my-2" />
                    </div>
                  )}

                  {/* Hand Raised */}
                  {handRaisedCount > 0 && (
                    <div className="mb-3">
                      <p className="text-[11px] font-medium text-warning uppercase mb-2">
                        <Hand className="h-3 w-3 inline mr-1" />
                        Hand Raised ({handRaisedCount})
                      </p>
                      {participants.filter((p) => p.isHandRaised).map((p) => (
                        <div key={p.id} className="flex items-center justify-between py-1.5 px-2 rounded-lg hover:bg-white/5">
                          <div className="flex items-center gap-2">
                            <Avatar className="h-7 w-7">
                              <AvatarFallback className="text-[10px] bg-warning/20 text-warning">
                                {p.name.split(" ").map((n) => n[0]).join("")}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-xs">{p.name}</span>
                          </div>
                          <Hand className="h-3 w-3 text-warning" />
                        </div>
                      ))}
                      <Separator className="bg-white/10 my-2" />
                    </div>
                  )}

                  {/* All Participants */}
                  <p className="text-[11px] font-medium text-white/50 uppercase mb-2">In Meeting ({totalParticipants})</p>
                  {/* Self */}
                  <div className="flex items-center justify-between py-1.5 px-2 rounded-lg bg-primary/10">
                    <div className="flex items-center gap-2">
                      <Avatar className="h-7 w-7">
                        <AvatarFallback className="text-[10px] bg-primary/30 text-primary-foreground">
                          {user?.firstName?.[0]}{user?.lastName?.[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <span className="text-xs font-medium">You</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      {isMuted ? <MicOff className="h-3 w-3 text-destructive" /> : <Mic className="h-3 w-3 text-white/40" />}
                      {isVideoOn ? <Video className="h-3 w-3 text-white/40" /> : <VideoOff className="h-3 w-3 text-destructive" />}
                    </div>
                  </div>
                  {participants.map((p) => (
                    <div key={p.id} className="flex items-center justify-between py-1.5 px-2 rounded-lg hover:bg-white/5 group">
                      <div className="flex items-center gap-2">
                        <Avatar className="h-7 w-7">
                          <AvatarFallback className="text-[10px] bg-white/10 text-white/60">
                            {p.name.split(" ").map((n) => n[0]).join("")}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <span className="text-xs">{p.name}</span>
                          {p.role !== "Student" && (
                            <Badge className="ml-1.5 text-[8px] py-0 h-4" variant="secondary">{p.role}</Badge>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        {p.isMuted ? <MicOff className="h-3 w-3 text-destructive" /> : <Mic className="h-3 w-3 text-white/40" />}
                        {p.isVideoOn ? <Video className="h-3 w-3 text-white/40" /> : <VideoOff className="h-3 w-3 text-destructive" />}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}

            {/* Polls Panel */}
            {rightPanel === "polls" && (
              <ScrollArea className="flex-1 p-3">
                <div className="space-y-4">
                  {poll.isActive && (
                    <div className="p-3 rounded-lg bg-white/5 border border-white/10">
                      <div className="flex items-center gap-2 mb-3">
                        <BarChart3 className="h-4 w-4 text-primary" />
                        <p className="text-sm font-medium">{poll.question}</p>
                      </div>
                      <div className="space-y-2">
                        {poll.options.map((option) => {
                          const percentage = poll.totalVotes > 0
                            ? Math.round((option.votes / poll.totalVotes) * 100) : 0;
                          return (
                            <button
                              key={option.id}
                              onClick={() => handleVote(option.id)}
                              disabled={!!votedOption}
                              className={`w-full text-left p-2 rounded-lg border transition-all ${
                                votedOption === option.id
                                  ? "border-primary bg-primary/10"
                                  : votedOption
                                  ? "border-white/10 bg-white/5"
                                  : "border-white/10 hover:border-white/30 hover:bg-white/5"
                              }`}
                            >
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-xs">{option.text}</span>
                                {votedOption && <span className="text-[11px] text-white/50">{percentage}%</span>}
                              </div>
                              {votedOption && (
                                <div className="h-1 rounded-full bg-white/10 overflow-hidden">
                                  <div
                                    className="h-full rounded-full bg-primary transition-all"
                                    style={{ width: `${percentage}%` }}
                                  />
                                </div>
                              )}
                            </button>
                          );
                        })}
                      </div>
                      <p className="text-[10px] text-white/40 mt-2">{poll.totalVotes} votes</p>
                    </div>
                  )}
                  <Button variant="outline" size="sm" className="w-full text-xs border-white/20 text-white/70" onClick={() => toast.info("Create poll (mock)")}>
                    <BarChart3 className="h-3 w-3 mr-1" /> Create New Poll
                  </Button>
                </div>
              </ScrollArea>
            )}

            {/* Breakout Rooms */}
            {rightPanel === "breakout" && (
              <ScrollArea className="flex-1 p-3">
                <div className="space-y-3">
                  {["Room 1 - Group A", "Room 2 - Group B", "Room 3 - Group C"].map((room, i) => (
                    <div key={i} className="p-3 rounded-lg bg-white/5 border border-white/10">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-xs font-medium">{room}</p>
                        <Badge variant="outline" className="text-[9px] border-white/20">{2 + i} people</Badge>
                      </div>
                      <div className="flex -space-x-2">
                        {Array.from({ length: 2 + i }).map((_, j) => (
                          <Avatar key={j} className="h-6 w-6 border-2 border-[hsl(222,47%,8%)]">
                            <AvatarFallback className="text-[8px] bg-white/10">
                              {String.fromCharCode(65 + j + i * 3)}
                            </AvatarFallback>
                          </Avatar>
                        ))}
                      </div>
                    </div>
                  ))}
                  <Button variant="outline" size="sm" className="w-full text-xs border-white/20 text-white/70" onClick={() => toast.info("Breakout rooms created (mock)")}>
                    <Grid3X3 className="h-3 w-3 mr-1" /> Create Rooms
                  </Button>
                </div>
              </ScrollArea>
            )}
          </div>
        )}
      </div>

      {/* Bottom Controls */}
      <div className="flex items-center justify-between px-4 py-3 bg-[hsl(222,47%,8%)] border-t border-white/10 flex-shrink-0">
        {/* Left - Time & Meeting Info */}
        <div className="flex items-center gap-3 w-48">
          <span className="text-xs text-white/50 font-mono">{formatTime(elapsedTime)}</span>
        </div>

        {/* Center - Main Controls */}
        <div className="flex items-center gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={isMuted ? "destructive" : "secondary"}
                size="icon"
                className="rounded-full h-11 w-11"
                onClick={() => setIsMuted(!isMuted)}
              >
                {isMuted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top">{isMuted ? "Unmute" : "Mute"}</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={!isVideoOn ? "destructive" : "secondary"}
                size="icon"
                className="rounded-full h-11 w-11"
                onClick={() => setIsVideoOn(!isVideoOn)}
              >
                {isVideoOn ? <Video className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top">{isVideoOn ? "Stop Video" : "Start Video"}</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={isScreenSharing ? "default" : "secondary"}
                size="icon"
                className="rounded-full h-11 w-11"
                onClick={() => {
                  setIsScreenSharing(!isScreenSharing);
                  toast.info(isScreenSharing ? "Stopped sharing" : "Screen sharing started (mock)");
                }}
              >
                <ScreenShare className="h-5 w-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top">Share Screen</TooltipContent>
          </Tooltip>

          {/* Reactions */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="secondary" size="icon" className="rounded-full h-11 w-11">
                <Sparkles className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent side="top" className="flex gap-1 p-2 min-w-0">
              {reactionEmojis.map((r) => (
                <Button
                  key={r.emoji}
                  variant="ghost"
                  size="sm"
                  className="h-10 w-10 p-0 text-lg hover:scale-125 transition-transform"
                  onClick={() => sendReaction(r.emoji)}
                >
                  {r.emoji}
                </Button>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={handRaised ? "default" : "secondary"}
                size="icon"
                className="rounded-full h-11 w-11"
                onClick={() => {
                  setHandRaised(!handRaised);
                  toast.info(handRaised ? "Hand lowered" : "Hand raised");
                }}
              >
                <Hand className="h-5 w-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top">{handRaised ? "Lower Hand" : "Raise Hand"}</TooltipContent>
          </Tooltip>

          {/* Record */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={isRecording ? "destructive" : "secondary"}
                size="icon"
                className="rounded-full h-11 w-11"
                onClick={() => {
                  setIsRecording(!isRecording);
                  toast.info(isRecording ? "Recording stopped" : "Recording started (mock)");
                }}
              >
                <CircleDot className="h-5 w-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top">{isRecording ? "Stop Recording" : "Record"}</TooltipContent>
          </Tooltip>

          {/* More */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="secondary" size="icon" className="rounded-full h-11 w-11">
                <MoreHorizontal className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent side="top" align="center" className="w-48">
              <DropdownMenuItem onClick={() => togglePanel("polls")}>
                <BarChart3 className="h-4 w-4 mr-2" /> Polls
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => togglePanel("breakout")}>
                <Grid3X3 className="h-4 w-4 mr-2" /> Breakout Rooms
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => {
                const next = virtualBackgrounds[(virtualBackgrounds.findIndex((b) => b.id === selectedBg) + 1) % virtualBackgrounds.length];
                setSelectedBg(next.id);
                toast.info(`Background: ${next.name}`);
              }}>
                <Image className="h-4 w-4 mr-2" /> Virtual Background
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => toast.info("Whiteboard opened (mock)")}>
                <MonitorUp className="h-4 w-4 mr-2" /> Whiteboard
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => toast.info("Settings opened (mock)")}>
                <Settings className="h-4 w-4 mr-2" /> Settings
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <div className="w-px h-8 bg-white/20 mx-1" />

          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="destructive" size="icon" className="rounded-full h-11 w-11" onClick={leaveMeeting}>
                <PhoneOff className="h-5 w-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top">Leave Meeting</TooltipContent>
          </Tooltip>
        </div>

        {/* Right - Panel Toggles */}
        <div className="flex items-center gap-1 w-48 justify-end">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className={`h-9 w-9 p-0 rounded-lg ${rightPanel === "participants" ? "bg-white/20 text-white" : "text-white/50"}`}
                onClick={() => togglePanel("participants")}
              >
                <Users className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top">Participants</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className={`h-9 w-9 p-0 rounded-lg ${rightPanel === "chat" ? "bg-white/20 text-white" : "text-white/50"}`}
                onClick={() => togglePanel("chat")}
              >
                <MessageSquare className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top">Chat</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className={`h-9 w-9 p-0 rounded-lg ${rightPanel === "polls" ? "bg-white/20 text-white" : "text-white/50"}`}
                onClick={() => togglePanel("polls")}
              >
                <BarChart3 className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top">Polls</TooltipContent>
          </Tooltip>
        </div>
      </div>

      {/* Reaction Animation Styles */}
      <style>{`
        @keyframes float-up {
          0% { opacity: 1; transform: translateY(0) scale(1); }
          100% { opacity: 0; transform: translateY(-120px) scale(1.5); }
        }
      `}</style>
    </div>
  );
}
