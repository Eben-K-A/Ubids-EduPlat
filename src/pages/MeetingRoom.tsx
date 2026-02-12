import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { meetingsApi } from "@/services/api";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Lock, Copy, Users, Check, X, CircleDot, MessageSquare, Users2, Hand, Smile, Info, Calendar, Clock, TrendingUp } from "lucide-react";
import { format } from "date-fns";
import {
  LiveKitRoom,
  GridLayout,
  ParticipantTile,
  RoomAudioRenderer,
  ControlBar,
  useTracks,
  useChat,
  useParticipants,
  useLocalParticipant,
  useRoomContext,
  useDataChannel,
} from "@livekit/components-react";
import { DataPacket_Kind, Track } from "livekit-client";
import { LogOut } from "lucide-react";
import { MeetingAnalytics } from "@/components/meetings/MeetingAnalytics";
import { MeetingLayoutSelector, type LayoutMode } from "@/components/meetings/MeetingLayoutSelector";
import { BreakoutRooms } from "@/components/meetings/BreakoutRooms";
import { MeetingControls } from "@/components/meetings/MeetingControls";
import { EnhancedMeetingDetails } from "@/components/meetings/EnhancedMeetingDetails";
import { EnhancedWaitingRoom } from "@/components/meetings/EnhancedWaitingRoom";

interface Meeting {
  id: string;
  title: string;
  description?: string;
  startTime: string;
  duration: number;
  hostName: string;
  hostId?: string | null;
  meetingCode: string;
  waitingRoomMode: "host-approve" | "auth-auto" | "auto";
  recordingEnabled: boolean;
  isPasswordProtected?: boolean;
}

interface VideoGridProps {
  layout: LayoutMode;
}

function VideoGrid({ layout }: VideoGridProps) {
  const tracks = useTracks(
    [Track.Source.Camera, Track.Source.ScreenShare],
    { onlySubscribed: false }
  );

  // Custom grid layouts based on selected mode
  const getGridStyle = () => {
    switch (layout) {
      case "spotlight":
        return "grid-cols-4";
      case "speaker":
        return "grid-cols-1";
      case "sidebar":
        return "grid-cols-3";
      case "focus":
        return "grid-cols-2";
      default: // grid
        return "grid-auto-fit";
    }
  };

  return (
    <GridLayout tracks={tracks} className="h-full w-full">
      <ParticipantTile />
    </GridLayout>
  );
}

type Reaction = {
  id: string;
  emoji: string;
  x: number;
  y: number;
};

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

function RoomUI({
  isHost,
  isRecording,
  meeting,
  startTime,
}: {
  isHost: boolean;
  isRecording?: boolean;
  meeting?: Meeting;
  startTime?: Date;
}) {
  const { send, chatMessages } = useChat();
  const participants = useParticipants();
  const { localParticipant } = useLocalParticipant();
  const room = useRoomContext();
  const [panel, setPanel] = useState<"chat" | "participants" | "analytics" | "details" | "none">("chat");
  const [message, setMessage] = useState("");
  const [handRaised, setHandRaised] = useState(false);
  const [raisedMap, setRaisedMap] = useState<Record<string, boolean>>({});
  const [reactions, setReactions] = useState<Reaction[]>([]);
  const [layout, setLayout] = useState<LayoutMode>("grid");
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [participantMetrics, setParticipantMetrics] = useState<ParticipantMetrics[]>([]);
  const [meetingLocked, setMeetingLocked] = useState(false);

  // Track elapsed time
  useEffect(() => {
    const timer = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Update participant metrics periodically
  useEffect(() => {
    const updateMetrics = () => {
      const metrics = participants.map((p) => ({
        identity: p.identity,
        name: p.name || p.identity,
        joinTime: 0,
        videoOnTime: p.videoTrackPublished ? elapsedSeconds : 0,
        audioOnTime: p.audioTrackPublished ? elapsedSeconds : 0,
        handRaises: raisedMap[p.identity] ? 1 : 0,
        messagesCount: chatMessages.filter((m) => m.sender?.identity === p.identity).length,
        engagementScore: calculateEngagementScore(p, chatMessages, raisedMap),
      }));
      setParticipantMetrics(metrics);
    };
    updateMetrics();
  }, [participants, chatMessages, raisedMap, elapsedSeconds]);

  const calculateEngagementScore = (
    participant: any,
    messages: any[],
    raised: Record<string, boolean>
  ): number => {
    let score = 0;
    if (participant.videoTrackPublished) score += 30;
    if (participant.audioTrackPublished) score += 20;
    if (messages.filter((m) => m.sender?.identity === participant.identity).length > 0) score += 20;
    if (raised[participant.identity]) score += 30;
    return Math.min(100, score);
  };

  useDataChannel("events", (msg) => {
    try {
      const data = JSON.parse(new TextDecoder().decode(msg.payload));
      if (data.type === "hand") {
        setRaisedMap((prev) => ({ ...prev, [data.identity]: data.raised }));
      }
      if (data.type === "reaction") {
        setReactions((prev) => [
          ...prev,
          {
            id: crypto.randomUUID(),
            emoji: data.emoji,
            x: 20 + Math.random() * 60,
            y: 60 + Math.random() * 20,
          },
        ]);
      }
      if (data.type === "control" && data.targetIdentity === localParticipant.identity) {
        if (data.action === "mute") {
          localParticipant.setMicrophoneEnabled(false);
          toast.info("Host muted your microphone");
        }
        if (data.action === "cameraOff") {
          localParticipant.setCameraEnabled(false);
          toast.info("Host turned off your camera");
        }
      }
    } catch {
      // ignore
    }
  });

  useEffect(() => {
    if (reactions.length === 0) return;
    const t = setTimeout(() => {
      setReactions((prev) => prev.slice(1));
    }, 2000);
    return () => clearTimeout(t);
  }, [reactions]);

  const publishEvent = (payload: any) => {
    room.localParticipant.publishData(
      new TextEncoder().encode(JSON.stringify(payload)),
      DataPacket_Kind.RELIABLE,
      { topic: "events" }
    );
  };

  const sendMessage = () => {
    if (!message.trim()) return;
    send(message.trim());
    setMessage("");
  };

  const toggleHand = () => {
    const next = !handRaised;
    setHandRaised(next);
    publishEvent({ type: "hand", identity: localParticipant.identity, raised: next });
  };

  const sendReaction = (emoji: string) => {
    publishEvent({ type: "reaction", emoji });
  };

  const hostControl = (targetIdentity: string, action: "mute" | "cameraOff") => {
    if (!isHost) return;
    publishEvent({ type: "control", targetIdentity, action });
  };

  return (
    <div className="h-full flex flex-col">
      {/* Top Control Bar */}
      <div className="border-b border-white/10 bg-[hsl(222,47%,8%)] px-3 py-2 flex items-center justify-between">
        <div className="flex items-center gap-3 flex-1">
          <MeetingLayoutSelector currentLayout={layout} onLayoutChange={setLayout} />
        </div>
        <div className="flex items-center gap-2">
          <MeetingControls
            isHost={isHost}
            isRecording={isRecording || false}
            participantCount={participants.length}
            meetingLocked={meetingLocked}
            meetingDuration={elapsedSeconds}
          />
        </div>
      </div>

      {/* Recording indicator */}
      {isRecording && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-40 animate-pulse">
          <div className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg shadow-lg">
            <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
            <span className="text-sm font-medium">Recording in progress</span>
          </div>
        </div>
      )}

      {/* Floating reactions */}
      {reactions.map((r) => (
        <div
          key={r.id}
          className="fixed text-4xl pointer-events-none z-50"
          style={{
            left: `${r.x}%`,
            top: `${r.y}%`,
            animation: "float-up 2s ease-out forwards",
          }}
        >
          {r.emoji}
        </div>
      ))}

      <div className="flex-1 flex overflow-hidden">
        <div className="flex-1 flex flex-col">
          <div className="flex-1 overflow-hidden">
            <VideoGrid layout={layout} />
          </div>
          <div className="border-t border-white/10 bg-[hsl(222,47%,8%)] flex items-center justify-between px-3 py-2">
            <ControlBar />
            <div className="flex items-center gap-2">
              <Button variant={handRaised ? "default" : "secondary"} size="sm" onClick={toggleHand}>
                <Hand className="h-4 w-4 mr-2" /> {handRaised ? "Lower Hand" : "Raise Hand"}
              </Button>
              <Button variant="secondary" size="sm" onClick={() => sendReaction("👏")}>
                <Smile className="h-4 w-4 mr-2" /> React
              </Button>
            </div>
          </div>
          <RoomAudioRenderer />
        </div>

        {/* Side Panels */}
        <div className="w-80 border-l border-white/10 bg-[hsl(222,47%,8%)] flex flex-col">
          <div className="flex items-center gap-1 p-2 border-b border-white/10 overflow-x-auto">
            <Button
              size="sm"
              variant={panel === "chat" ? "default" : "ghost"}
              onClick={() => setPanel("chat")}
              className="text-xs gap-1 flex-shrink-0"
            >
              <MessageSquare className="h-4 w-4" />
              <span className="hidden sm:inline">Chat</span>
            </Button>
            <Button
              size="sm"
              variant={panel === "participants" ? "default" : "ghost"}
              onClick={() => setPanel("participants")}
              className="text-xs gap-1 flex-shrink-0"
            >
              <Users2 className="h-4 w-4" />
              <span className="hidden sm:inline">People</span>
            </Button>
            {isHost && (
              <Button
                size="sm"
                variant={panel === "analytics" ? "default" : "ghost"}
                onClick={() => setPanel("analytics")}
                className="text-xs gap-1 flex-shrink-0"
              >
                <TrendingUp className="h-4 w-4" />
                <span className="hidden sm:inline">Analytics</span>
              </Button>
            )}
            <Button
              size="sm"
              variant={panel === "details" ? "default" : "ghost"}
              onClick={() => setPanel("details")}
              className="text-xs gap-1 flex-shrink-0"
            >
              <Info className="h-4 w-4" />
              <span className="hidden sm:inline">Details</span>
            </Button>
            {panel !== "none" && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setPanel("none")}
                className="text-xs ml-auto"
              >
                Hide
              </Button>
            )}
          </div>

          {panel === "chat" && (
            <div className="flex-1 flex flex-col overflow-hidden">
              <ScrollArea className="flex-1 p-3 space-y-3">
                {chatMessages.map((m) => (
                  <div key={m.id} className="text-sm">
                    <div className="text-white/60 text-xs">{m.sender?.name ?? "Guest"}</div>
                    <div className="text-white">{m.message}</div>
                  </div>
                ))}
              </ScrollArea>
              <div className="p-3 border-t border-white/10 flex gap-2">
                <Input
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Type a message..."
                  onKeyDown={(e) => { if (e.key === "Enter") sendMessage(); }}
                />
                <Button onClick={sendMessage} size="sm">Send</Button>
              </div>
            </div>
          )}

          {panel === "participants" && (
            <ScrollArea className="flex-1 p-3 space-y-2">
              {participants.map((p) => (
                <div key={p.identity} className="flex items-center justify-between text-sm p-2 rounded hover:bg-white/5">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <span className="truncate text-white">{p.name || p.identity}</span>
                    {raisedMap[p.identity] && <Hand className="h-4 w-4 text-yellow-400 flex-shrink-0" />}
                  </div>
                  {isHost && p.identity !== localParticipant.identity && (
                    <div className="flex gap-1 flex-shrink-0">
                      <Button size="icon" variant="secondary" onClick={() => hostControl(p.identity, "mute")} className="h-7 w-7">
                        <span className="text-xs">M</span>
                      </Button>
                      <Button size="icon" variant="secondary" onClick={() => hostControl(p.identity, "cameraOff")} className="h-7 w-7">
                        <span className="text-xs">C</span>
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </ScrollArea>
          )}

          {panel === "analytics" && isHost && (
            <MeetingAnalytics
              participants={participantMetrics}
              elapsedSeconds={elapsedSeconds}
            />
          )}

          {panel === "details" && meeting && (
            <EnhancedMeetingDetails
              title={meeting.title}
              description={meeting.description}
              meetingCode={meeting.meetingCode}
              hostName={meeting.hostName}
              startTime={meeting.startTime}
              duration={meeting.duration}
              participantCount={participants.length}
              recordingEnabled={meeting.recordingEnabled}
              waitingRoomMode={meeting.waitingRoomMode}
              passwordProtected={meeting.isPasswordProtected || false}
              elapsedTime={elapsedSeconds}
            />
          )}
        </div>
      </div>
    </div>
  );
}

export default function MeetingRoom() {
  const { meetingId } = useParams<{ meetingId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [meeting, setMeeting] = useState<Meeting | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [joinState, setJoinState] = useState<"loading" | "waiting" | "joined" | "error" | "denied" | "password-required">("loading");
  const [pending, setPending] = useState<Array<{ id: string; name: string }>>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingId, setRecordingId] = useState<string | null>(null);
  const [passwordInput, setPasswordInput] = useState("");
  const [showDetails, setShowDetails] = useState(false);
  const [roomStartTime, setRoomStartTime] = useState<Date | undefined>(undefined);

  const displayName = useMemo(() => {
    if (user?.firstName) return `${user.firstName} ${user.lastName ?? ""}`.trim();
    return `Guest-${(meetingId || "").slice(0, 4)}`;
  }, [user, meetingId]);

  const isHost = Boolean(meeting?.hostId && user?.id && meeting.hostId === user.id) || user?.role === "admin";

  const livekitUrl = import.meta.env.VITE_LIVEKIT_URL as string | undefined;

  useEffect(() => {
    const loadMeeting = async () => {
      if (!meetingId) return;
      try {
        const res = await meetingsApi.getById(meetingId);
        setMeeting(res.data || null);
      } catch {
        toast.error("Meeting not found");
        setJoinState("error");
      }
    };
    loadMeeting();
  }, [meetingId]);

  useEffect(() => {
    if (!meetingId) return;
    let poll: number | undefined;

    const join = async () => {
      try {
        const urlParams = new URLSearchParams(window.location.search);
        const passwordFromUrl = urlParams.get('password') || '';

        const joinData: any = { name: displayName };
        if (passwordFromUrl) {
          joinData.password = passwordFromUrl;
        } else if (passwordInput) {
          joinData.password = passwordInput;
        }

        const res = await meetingsApi.join(meetingId, joinData);
        const responseData = res.data || res;

        if (responseData.status === "joined") {
          const tokenValue = responseData.token;
          if (!tokenValue) {
            toast.error("Invalid LiveKit token from server");
            setJoinState("error");
            return;
          }
          setToken(tokenValue);
          setRoomStartTime(new Date());
          setJoinState("joined");
          return;
        }
        if (responseData.status === "waiting") {
          setJoinState("waiting");
          poll = window.setInterval(async () => {
            try {
              const statusRes = await meetingsApi.waitingStatus(meetingId, responseData.requestId);
              const statusData = statusRes.data || statusRes;
              if (statusData.status === "joined") {
                const tokenValue = statusData.token;
                if (!tokenValue) {
                  toast.error("Invalid LiveKit token from server");
                  setJoinState("error");
                  if (poll) window.clearInterval(poll);
                  return;
                }
                setToken(tokenValue);
                setJoinState("joined");
                if (poll) window.clearInterval(poll);
              }
              if (statusData.status === "denied") {
                setJoinState("denied");
                if (poll) window.clearInterval(poll);
              }
            } catch {
              // ignore transient
            }
          }, 3000);
          return;
        }
      } catch (err: any) {
        const errorMsg = err?.data?.message || err?.message || "Failed to join meeting";
        if (errorMsg.toLowerCase().includes("password")) {
          setJoinState("password-required");
        } else {
          toast.error(errorMsg);
          setJoinState("error");
        }
      }
    };

    join();

    return () => {
      if (poll) window.clearInterval(poll);
    };
  }, [meetingId, displayName, passwordInput]);

  useEffect(() => {
    if (!meetingId || !isHost) return;
    let poll: number | undefined;

    const loadPending = async () => {
      try {
        const res = await meetingsApi.waitingList(meetingId);
        setPending(res.data || []);
      } catch {
        setPending([]);
      }
    };

    loadPending();
    poll = window.setInterval(loadPending, 4000);

    return () => {
      if (poll) window.clearInterval(poll);
    };
  }, [meetingId, isHost]);

  const copyLink = () => {
    const link = `${window.location.origin}/meetings/room/${meetingId}`;
    navigator.clipboard.writeText(link);
    toast.success("Meeting link copied");
  };

  const handleApprove = async (id: string) => {
    if (!meetingId) return;
    await meetingsApi.approveWaiting(meetingId, id);
    setPending((prev) => prev.filter((p) => p.id !== id));
  };

  const handleDeny = async (id: string) => {
    if (!meetingId) return;
    await meetingsApi.denyWaiting(meetingId, id);
    setPending((prev) => prev.filter((p) => p.id !== id));
  };

  const startRecording = async () => {
    if (!meetingId) return;
    try {
      const res = await meetingsApi.startRecording(meetingId);
      setIsRecording(true);
      setRecordingId(res.data?.id ?? null);
      toast.success("Recording started");
    } catch (err: any) {
      toast.error(err?.message || "Failed to start recording");
    }
  };

  const stopRecording = async () => {
    if (!meetingId || !recordingId) return;
    try {
      await meetingsApi.stopRecording(meetingId, recordingId);
      setIsRecording(false);
      setRecordingId(null);
      toast.success("Recording stopped");
    } catch (err: any) {
      toast.error(err?.message || "Failed to stop recording");
    }
  };

  const handleLeaveMeeting = () => {
    toast.success("Left the meeting");
    navigate("/meetings");
  };

  if (!livekitUrl) {
    return (
      <div className="p-6">
        <Card>
          <CardHeader>
            <CardTitle>LiveKit Not Configured</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Set `VITE_LIVEKIT_URL` in `.env.local` to connect to your LiveKit server.
            </p>
            <Button className="mt-4" onClick={() => navigate("/meetings")}>Back to Meetings</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="h-screen w-full bg-[hsl(222,47%,6%)] text-white flex flex-col">
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="border-white/20 text-white/70 text-xs">
            <div className="w-2 h-2 rounded-full bg-green-500 mr-2" /> Live
          </Badge>
          {isRecording && (
            <Badge variant="destructive" className="text-xs animate-pulse">
              <div className="w-2 h-2 rounded-full bg-red-600 mr-2" /> Recording
            </Badge>
          )}
          <div>
            <div className="text-sm font-semibold">{meeting?.title || "Meeting"}</div>
            <div className="text-xs text-white/50 flex items-center gap-2">
              <Users className="h-3 w-3" /> {meeting?.meetingCode}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" className="text-white/70" onClick={copyLink}>
            <Lock className="h-3 w-3 mr-1" /> Copy Link <Copy className="h-3 w-3 ml-1" />
          </Button>
          {isHost && meeting?.recordingEnabled && (
            <Button
              variant={isRecording ? "destructive" : "secondary"}
              size="sm"
              onClick={isRecording ? stopRecording : startRecording}
            >
              <CircleDot className="h-4 w-4 mr-2" /> {isRecording ? "Stop Recording" : "Start Recording"}
            </Button>
          )}
          <Button
            variant={showDetails ? "default" : "secondary"}
            size="sm"
            onClick={() => setShowDetails(!showDetails)}
          >
            <Info className="h-4 w-4 mr-2" /> Details
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={handleLeaveMeeting}
          >
            <LogOut className="h-4 w-4 mr-2" /> Leave Meeting
          </Button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        <div className="flex-1">
          {joinState === "password-required" && (
            <div className="p-6">
              <Card>
                <CardHeader>
                  <CardTitle>Meeting Password Required</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    This meeting is password protected. Please enter the password to join.
                  </p>
                  <Input
                    type="password"
                    placeholder="Enter meeting password"
                    value={passwordInput}
                    onChange={(e) => setPasswordInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") setJoinState("loading"); }}
                  />
                  <Button onClick={() => setJoinState("loading")} className="w-full">Join Meeting</Button>
                  <Button variant="outline" onClick={() => navigate("/meetings")} className="w-full">Cancel</Button>
                </CardContent>
              </Card>
            </div>
          )}

          {joinState === "waiting" && (
            <div className="p-6">
              <Card>
                <CardHeader>
                  <CardTitle>Waiting for approval</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    The host must approve your request before you can join.
                  </p>
                </CardContent>
              </Card>
            </div>
          )}

          {joinState === "denied" && (
            <div className="p-6">
              <Card>
                <CardHeader>
                  <CardTitle>Access denied</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    The host denied your request.
                  </p>
                  <Button className="mt-4" onClick={() => navigate("/meetings")}>Back</Button>
                </CardContent>
              </Card>
            </div>
          )}

          {joinState === "joined" && token && (
            <LiveKitRoom
              token={token}
              serverUrl={livekitUrl}
              connect
              audio
              video
              data-lk-theme="default"
              className="h-full"
            >
              <RoomUI
                isHost={isHost}
                isRecording={isRecording}
                meeting={meeting || undefined}
                startTime={roomStartTime}
              />
            </LiveKitRoom>
          )}
        </div>

        {showDetails && (
          <div className="w-80 border-l border-white/10 bg-[hsl(222,47%,8%)]">
            <div className="p-3 text-sm font-semibold border-b border-white/10 flex items-center gap-2">
              <Info className="h-4 w-4" /> Meeting Details
            </div>
            <ScrollArea className="h-[calc(100%-48px)]">
              <div className="p-4 space-y-4">
                <div>
                  <p className="text-xs text-white/50 mb-1">Meeting Title</p>
                  <p className="text-sm font-medium text-white">{meeting?.title || "Meeting"}</p>
                </div>
                {meeting?.description && (
                  <div>
                    <p className="text-xs text-white/50 mb-1">Description</p>
                    <p className="text-sm text-white/80">{meeting.description}</p>
                  </div>
                )}
                <div>
                  <p className="text-xs text-white/50 mb-1">Meeting Code</p>
                  <p className="text-sm font-mono text-white">{meeting?.meetingCode}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-white/50" />
                  <div>
                    <p className="text-xs text-white/50">Start Time</p>
                    <p className="text-sm text-white">
                      {meeting ? format(new Date(meeting.startTime), "MMM d, yyyy h:mm a") : "-"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-white/50" />
                  <div>
                    <p className="text-xs text-white/50">Duration</p>
                    <p className="text-sm text-white">{meeting?.duration} minutes</p>
                  </div>
                </div>
                <div>
                  <p className="text-xs text-white/50 mb-1">Host</p>
                  <p className="text-sm text-white">{meeting?.hostName}</p>
                </div>
                <div className="pt-2 border-t border-white/10 space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-white/70">Recording Enabled</span>
                    <span className={meeting?.recordingEnabled ? "text-green-400" : "text-red-400"}>
                      {meeting?.recordingEnabled ? "Yes" : "No"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-white/70">Waiting Room</span>
                    <span className={meeting?.waitingRoomMode !== "auto" ? "text-yellow-400" : "text-white/50"}>
                      {meeting?.waitingRoomMode === "auto" ? "Off" : "On"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-white/70">Password Protected</span>
                    <span className={meeting?.isPasswordProtected ? "text-orange-400" : "text-white/50"}>
                      {meeting?.isPasswordProtected ? "Yes" : "No"}
                    </span>
                  </div>
                </div>
              </div>
            </ScrollArea>
          </div>
        )}

        {isHost && meeting?.waitingRoomMode !== "auto" && (
          <EnhancedWaitingRoom
            participants={pending.map((p) => ({
              id: p.id,
              name: p.name,
              joinedAt: new Date(),
            }))}
            isHost={isHost}
            onApprove={handleApprove}
            onDeny={handleDeny}
            mode={meeting?.waitingRoomMode as "host-approve" | "auth-auto"}
          />
        )}
      </div>
    </div>
  );
}
