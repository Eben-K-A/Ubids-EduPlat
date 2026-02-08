import { useState, useEffect, useRef, useCallback } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
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
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  MessageSquare,
  Search,
  Send,
  Plus,
  Circle,
  MoreVertical,
  Check,
  CheckCheck,
  Clock,
  Paperclip,
  Smile,
  Phone,
  VideoIcon,
  Image as ImageIcon,
  Reply,
  Pin,
  Trash2,
  Forward,
  Star,
  StarOff,
  Archive,
  Users,
  Mic,
  MicOff,
  X,
  AtSign,
  Hash,
  File,
  Volume2,
  ArrowLeft,
} from "lucide-react";
import { toast } from "sonner";
import { useIsMobile } from "@/hooks/use-mobile";

type DeliveryStatus = "sending" | "sent" | "delivered" | "read";

interface MessageReaction {
  emoji: string;
  count: number;
  byMe: boolean;
}

interface Message {
  id: string;
  senderId: string;
  content: string;
  time: string;
  timestamp: number;
  status: DeliveryStatus;
  replyTo?: { sender: string; content: string };
  reactions: MessageReaction[];
  isPinned?: boolean;
  isVoice?: boolean;
  voiceDuration?: string;
  attachment?: { name: string; type: string; size: string };
}

interface Conversation {
  id: string;
  name: string;
  lastMessage: string;
  time: string;
  unread: number;
  online: boolean;
  isGroup?: boolean;
  isStarred?: boolean;
  isArchived?: boolean;
  members?: string[];
  messages: Message[];
}

const initialConversations: Conversation[] = [
  {
    id: "1",
    name: "Dr. Sarah Johnson",
    lastMessage: "The assignment deadline has been extended to Friday",
    time: "2 min ago",
    unread: 2,
    online: true,
    isStarred: true,
    messages: [
      { id: "1a", senderId: "other", content: "Hi! I wanted to let you know about the assignment.", time: "10:28 AM", timestamp: 1, status: "read", reactions: [] },
      { id: "1b", senderId: "me", content: "Sure, what's the update?", time: "10:30 AM", timestamp: 2, status: "read", reactions: [] },
      { id: "1c", senderId: "other", content: "The assignment deadline has been extended to Friday. Please make sure to submit by 11:59 PM.", time: "10:32 AM", timestamp: 3, status: "read", reactions: [{ emoji: "👍", count: 2, byMe: true }] },
      { id: "1d", senderId: "me", content: "That's great news! Thank you for letting me know.", time: "10:33 AM", timestamp: 4, status: "delivered", reactions: [] },
    ],
  },
  {
    id: "2",
    name: "CS101 Study Group",
    lastMessage: "Alex: Can someone explain the recursion problem?",
    time: "15 min ago",
    unread: 5,
    online: false,
    isGroup: true,
    members: ["You", "Alex Chen", "Emma Williams", "Bob Smith", "Carol Davis"],
    messages: [
      { id: "2a", senderId: "alex", content: "Hey everyone, how's the exam prep going?", time: "9:00 AM", timestamp: 1, status: "read", reactions: [] },
      { id: "2b", senderId: "me", content: "Going well! Stuck on chapter 5 though.", time: "9:05 AM", timestamp: 2, status: "read", reactions: [{ emoji: "😅", count: 3, byMe: false }] },
      { id: "2c", senderId: "emma", content: "I can help with chapter 5! Let's discuss.", time: "9:10 AM", timestamp: 3, status: "read", reactions: [{ emoji: "🙏", count: 1, byMe: true }] },
      { id: "2d", senderId: "alex", content: "Can someone explain the recursion problem?", time: "9:45 AM", timestamp: 4, status: "read", reactions: [] },
    ],
  },
  {
    id: "3",
    name: "Prof. Michael Chen",
    lastMessage: "Your grade has been updated",
    time: "1 hour ago",
    unread: 0,
    online: true,
    messages: [
      { id: "3a", senderId: "other", content: "I've reviewed your latest submission.", time: "9:00 AM", timestamp: 1, status: "read", reactions: [] },
      { id: "3b", senderId: "other", content: "Your grade has been updated. You scored 92/100.", time: "9:01 AM", timestamp: 2, status: "read", reactions: [{ emoji: "🎉", count: 1, byMe: true }] },
      { id: "3c", senderId: "me", content: "Thank you, Professor! I'll review the feedback.", time: "9:15 AM", timestamp: 3, status: "read", reactions: [] },
    ],
  },
  {
    id: "4",
    name: "Emma Williams",
    lastMessage: "Thanks for the notes!",
    time: "Yesterday",
    unread: 0,
    online: false,
    messages: [
      { id: "4a", senderId: "me", content: "Here are the notes from today's lecture.", time: "Yesterday", timestamp: 1, status: "read", reactions: [], attachment: { name: "lecture-notes.pdf", type: "pdf", size: "2.4 MB" } },
      { id: "4b", senderId: "other", content: "Thanks for the notes! These are really helpful.", time: "Yesterday", timestamp: 2, status: "read", reactions: [{ emoji: "❤️", count: 1, byMe: false }] },
      { id: "4c", senderId: "me", content: "No problem! Let me know if you need anything else.", time: "Yesterday", timestamp: 3, status: "delivered", reactions: [] },
    ],
  },
  {
    id: "5",
    name: "Database Project Team",
    lastMessage: "Meeting at 3pm tomorrow",
    time: "Yesterday",
    unread: 0,
    online: false,
    isGroup: true,
    isArchived: false,
    members: ["You", "Mike Johnson", "Lisa Wang", "Tom Brown"],
    messages: [
      { id: "5a", senderId: "mike", content: "I've finished the ER diagram", time: "Yesterday", timestamp: 1, status: "read", reactions: [{ emoji: "👍", count: 3, byMe: true }] },
      { id: "5b", senderId: "lisa", content: "Looks great! Let's discuss normalization next", time: "Yesterday", timestamp: 2, status: "read", reactions: [] },
      { id: "5c", senderId: "me", content: "Meeting at 3pm tomorrow", time: "Yesterday", timestamp: 3, status: "read", reactions: [] },
    ],
  },
];

function DeliveryIndicator({ status }: { status: DeliveryStatus }) {
  switch (status) {
    case "sending":
      return <Clock className="h-3 w-3 text-muted-foreground" />;
    case "sent":
      return <Check className="h-3 w-3 text-muted-foreground" />;
    case "delivered":
      return <CheckCheck className="h-3 w-3 text-muted-foreground" />;
    case "read":
      return <CheckCheck className="h-3 w-3 text-primary" />;
    default:
      return null;
  }
}

function TypingIndicator() {
  return (
    <div className="flex items-center gap-1 px-3 py-2">
      <div className="flex items-center gap-1 bg-muted rounded-full px-3 py-2">
        <span className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
        <span className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
        <span className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
      </div>
    </div>
  );
}

const reactionEmojis = ["👍", "❤️", "😂", "😮", "😢", "🎉", "🙏", "🔥"];

export default function Messages() {
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const [conversations, setConversations] = useState<Conversation[]>(initialConversations);
  const [selectedConversation, setSelectedConversation] = useState<string | null>(isMobile ? null : "1");
  const [searchQuery, setSearchQuery] = useState("");
  const [newMessage, setNewMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [replyingTo, setReplyingTo] = useState<{ sender: string; content: string } | null>(null);
  const [showReactions, setShowReactions] = useState<string | null>(null);
  const [createGroupOpen, setCreateGroupOpen] = useState(false);
  const [messageSearch, setMessageSearch] = useState("");
  const [showMessageSearch, setShowMessageSearch] = useState(false);
  const [filter, setFilter] = useState<"all" | "unread" | "starred" | "groups">("all");
  const [isRecordingVoice, setIsRecordingVoice] = useState(false);
  const [voiceSeconds, setVoiceSeconds] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout>>();

  // On mobile, show list by default
  const showChatView = isMobile ? !!selectedConversation : true;
  const showListView = isMobile ? !selectedConversation : true;

  const activeConversation = conversations.find((c) => c.id === selectedConversation);

  const filteredConversations = conversations.filter((c) => {
    const matchesSearch = c.name.toLowerCase().includes(searchQuery.toLowerCase());
    if (filter === "unread") return matchesSearch && c.unread > 0;
    if (filter === "starred") return matchesSearch && c.isStarred;
    if (filter === "groups") return matchesSearch && c.isGroup;
    return matchesSearch;
  });

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [activeConversation?.messages.length, scrollToBottom]);

  useEffect(() => {
    if (isRecordingVoice) {
      const interval = setInterval(() => setVoiceSeconds((s) => s + 1), 1000);
      return () => clearInterval(interval);
    } else {
      setVoiceSeconds(0);
    }
  }, [isRecordingVoice]);

  const handleSendMessage = () => {
    if (!newMessage.trim() || !selectedConversation) return;

    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    const msgId = crypto.randomUUID();

    const newMsg: Message = {
      id: msgId,
      senderId: "me",
      content: newMessage.trim(),
      time: timeStr,
      timestamp: Date.now(),
      status: "sending",
      replyTo: replyingTo || undefined,
      reactions: [],
    };

    setConversations((prev) =>
      prev.map((c) =>
        c.id === selectedConversation
          ? { ...c, messages: [...c.messages, newMsg], lastMessage: newMessage.trim(), time: "Just now" }
          : c
      )
    );
    setNewMessage("");
    setReplyingTo(null);

    setTimeout(() => {
      setConversations((prev) =>
        prev.map((c) =>
          c.id === selectedConversation
            ? { ...c, messages: c.messages.map((m) => (m.id === msgId ? { ...m, status: "sent" as DeliveryStatus } : m)) }
            : c
        )
      );
    }, 500);

    setTimeout(() => {
      setConversations((prev) =>
        prev.map((c) =>
          c.id === selectedConversation
            ? { ...c, messages: c.messages.map((m) => (m.id === msgId ? { ...m, status: "delivered" as DeliveryStatus } : m)) }
            : c
        )
      );
    }, 1200);

    setTimeout(() => setIsTyping(true), 2000);
    setTimeout(() => {
      setIsTyping(false);
      const replies = [
        "Got it, thanks for letting me know!",
        "That makes sense. I'll look into it.",
        "Great, I appreciate the update!",
        "Sure thing, I'll work on that.",
        "Thanks! This is really helpful.",
        "Absolutely, let's do it! 💪",
        "I'll send you the details shortly.",
      ];
      const reply: Message = {
        id: crypto.randomUUID(),
        senderId: "other",
        content: replies[Math.floor(Math.random() * replies.length)],
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        timestamp: Date.now(),
        status: "read",
        reactions: [],
      };
      setConversations((prev) =>
        prev.map((c) =>
          c.id === selectedConversation
            ? { ...c, messages: [...c.messages, reply], lastMessage: reply.content, time: "Just now" }
            : c
        )
      );
      setTimeout(() => {
        setConversations((prev) =>
          prev.map((c) =>
            c.id === selectedConversation
              ? { ...c, messages: c.messages.map((m) => (m.id === msgId ? { ...m, status: "read" as DeliveryStatus } : m)) }
              : c
          )
        );
      }, 500);
    }, 4000);
  };

  const handleReaction = (messageId: string, emoji: string) => {
    setConversations((prev) =>
      prev.map((c) =>
        c.id === selectedConversation
          ? {
              ...c,
              messages: c.messages.map((m) => {
                if (m.id !== messageId) return m;
                const existing = m.reactions.find((r) => r.emoji === emoji);
                if (existing) {
                  if (existing.byMe) {
                    return { ...m, reactions: m.reactions.filter((r) => r.emoji !== emoji) };
                  }
                  return { ...m, reactions: m.reactions.map((r) => r.emoji === emoji ? { ...r, count: r.count + 1, byMe: true } : r) };
                }
                return { ...m, reactions: [...m.reactions, { emoji, count: 1, byMe: true }] };
              }),
            }
          : c
      )
    );
    setShowReactions(null);
  };

  const toggleStar = (convId: string) => {
    setConversations((prev) =>
      prev.map((c) => (c.id === convId ? { ...c, isStarred: !c.isStarred } : c))
    );
  };

  const sendVoiceMessage = () => {
    if (!selectedConversation) return;
    const duration = `0:${voiceSeconds.toString().padStart(2, "0")}`;
    const msg: Message = {
      id: crypto.randomUUID(),
      senderId: "me",
      content: "🎤 Voice message",
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      timestamp: Date.now(),
      status: "sent",
      reactions: [],
      isVoice: true,
      voiceDuration: duration,
    };
    setConversations((prev) =>
      prev.map((c) =>
        c.id === selectedConversation
          ? { ...c, messages: [...c.messages, msg], lastMessage: "🎤 Voice message", time: "Just now" }
          : c
      )
    );
    setIsRecordingVoice(false);
    toast.success("Voice message sent!");
  };

  const handleSelectConversation = (id: string) => {
    setSelectedConversation(id);
    setConversations((prev) =>
      prev.map((c) => (c.id === id ? { ...c, unread: 0 } : c))
    );
  };

  const handleBackToList = () => {
    setSelectedConversation(null);
  };

  const filteredMessages = activeConversation?.messages.filter(
    (m) => !messageSearch || m.content.toLowerCase().includes(messageSearch.toLowerCase())
  );

  const totalUnread = conversations.reduce((sum, c) => sum + c.unread, 0);

  return (
    <DashboardLayout>
      <div className="h-[calc(100vh-5rem)] sm:h-[calc(100vh-8rem)]">
        <div className="flex h-full gap-0 md:gap-4">
          {/* Conversations List */}
          {showListView && (
            <Card className={`flex flex-col ${isMobile ? "w-full" : "w-80 flex-shrink-0"}`}>
              <CardHeader className="pb-2 px-3 sm:px-6">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">
                    Messages
                    {totalUnread > 0 && (
                      <Badge className="ml-2 h-5 min-w-5 px-1.5 text-[10px]">{totalUnread}</Badge>
                    )}
                  </CardTitle>
                  <div className="flex gap-1">
                    <Dialog open={createGroupOpen} onOpenChange={setCreateGroupOpen}>
                      <DialogTrigger asChild>
                        <Button size="icon" variant="ghost" className="h-8 w-8">
                          <Users className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Create Group</DialogTitle>
                          <DialogDescription>Start a new group conversation</DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Label>Group Name</Label>
                            <Input placeholder="e.g., CS101 Project Team" />
                          </div>
                          <div className="space-y-2">
                            <Label>Add Members</Label>
                            <div className="space-y-2">
                              {["Dr. Sarah Johnson", "Alice Chen", "Bob Williams", "Prof. Michael Chen", "Emma Williams"].map((name) => (
                                <div key={name} className="flex items-center gap-2">
                                  <Checkbox id={name} />
                                  <Label htmlFor={name} className="text-sm">{name}</Label>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                        <DialogFooter>
                          <Button variant="outline" onClick={() => setCreateGroupOpen(false)}>Cancel</Button>
                          <Button onClick={() => { toast.success("Group created!"); setCreateGroupOpen(false); }}>Create Group</Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                    <Button size="icon" variant="ghost" className="h-8 w-8">
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search conversations..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
                {/* Filters */}
                <div className="flex gap-1 pt-1 overflow-x-auto">
                  {(["all", "unread", "starred", "groups"] as const).map((f) => (
                    <Button
                      key={f}
                      variant={filter === f ? "secondary" : "ghost"}
                      size="sm"
                      className="h-7 text-xs capitalize px-2 flex-shrink-0"
                      onClick={() => setFilter(f)}
                    >
                      {f}
                    </Button>
                  ))}
                </div>
              </CardHeader>
              <CardContent className="flex-1 p-0 overflow-hidden">
                <ScrollArea className="h-full">
                  <div className="space-y-1 p-2">
                    {filteredConversations.map((conversation) => (
                      <button
                        key={conversation.id}
                        onClick={() => handleSelectConversation(conversation.id)}
                        className={`w-full p-3 rounded-lg text-left transition-colors ${
                          selectedConversation === conversation.id
                            ? "bg-primary/10"
                            : "hover:bg-muted"
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className="relative flex-shrink-0">
                            <Avatar className="h-10 w-10">
                              <AvatarFallback className={conversation.isGroup ? "bg-accent/20 text-accent" : ""}>
                                {conversation.isGroup ? <Users className="h-4 w-4" /> : conversation.name.split(" ").map((n) => n[0]).join("")}
                              </AvatarFallback>
                            </Avatar>
                            {conversation.online && !conversation.isGroup && (
                              <Circle className="absolute bottom-0 right-0 h-3 w-3 fill-success text-success" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-1 min-w-0">
                                <span className="font-medium text-sm truncate">{conversation.name}</span>
                                {conversation.isStarred && <Star className="h-3 w-3 fill-warning text-warning flex-shrink-0" />}
                              </div>
                              <span className="text-xs text-muted-foreground flex-shrink-0">{conversation.time}</span>
                            </div>
                            <div className="flex items-center gap-1 mt-1">
                              {conversation.messages.length > 0 &&
                                conversation.messages[conversation.messages.length - 1].senderId === "me" && (
                                  <DeliveryIndicator
                                    status={conversation.messages[conversation.messages.length - 1].status}
                                  />
                                )}
                              <p className="text-xs text-muted-foreground truncate">{conversation.lastMessage}</p>
                            </div>
                          </div>
                          {conversation.unread > 0 && (
                            <Badge className="h-5 w-5 p-0 flex items-center justify-center text-xs flex-shrink-0">
                              {conversation.unread}
                            </Badge>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          )}

          {/* Chat Area */}
          {showChatView && (
            <Card className="flex-1 flex flex-col min-w-0">
              {activeConversation ? (
                <>
                  {/* Chat Header */}
                  <CardHeader className="pb-3 border-b px-3 sm:px-6">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                        {isMobile && (
                          <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0" onClick={handleBackToList}>
                            <ArrowLeft className="h-4 w-4" />
                          </Button>
                        )}
                        <Avatar className="h-8 w-8 sm:h-10 sm:w-10 flex-shrink-0">
                          <AvatarFallback className={activeConversation.isGroup ? "bg-accent/20 text-accent text-xs" : "text-xs"}>
                            {activeConversation.isGroup ? <Users className="h-4 w-4" /> : activeConversation.name.split(" ").map((n) => n[0]).join("")}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <p className="font-medium text-sm sm:text-base truncate">{activeConversation.name}</p>
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            {isTyping ? (
                              <span className="text-primary font-medium">typing...</span>
                            ) : activeConversation.isGroup ? (
                              <span className="truncate">{activeConversation.members?.length || 0} members</span>
                            ) : activeConversation.online ? (
                              <>
                                <Circle className="h-2 w-2 fill-success text-success flex-shrink-0" />
                                Online
                              </>
                            ) : (
                              "Offline"
                            )}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-0.5 sm:gap-1 flex-shrink-0">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => setShowMessageSearch(!showMessageSearch)}
                        >
                          <Search className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 hidden sm:flex">
                          <Phone className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 hidden sm:flex">
                          <VideoIcon className="h-4 w-4" />
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem className="sm:hidden" onClick={() => toast.info("Voice call (mock)")}>
                              <Phone className="h-4 w-4 mr-2" />
                              Voice call
                            </DropdownMenuItem>
                            <DropdownMenuItem className="sm:hidden" onClick={() => toast.info("Video call (mock)")}>
                              <VideoIcon className="h-4 w-4 mr-2" />
                              Video call
                            </DropdownMenuItem>
                            <DropdownMenuSeparator className="sm:hidden" />
                            <DropdownMenuItem onClick={() => toggleStar(activeConversation.id)}>
                              {activeConversation.isStarred ? <StarOff className="h-4 w-4 mr-2" /> : <Star className="h-4 w-4 mr-2" />}
                              {activeConversation.isStarred ? "Unstar" : "Star"} conversation
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => toast.info("Pinned messages (mock)")}>
                              <Pin className="h-4 w-4 mr-2" />
                              Pinned messages
                            </DropdownMenuItem>
                            {activeConversation.isGroup && (
                              <DropdownMenuItem>
                                <Users className="h-4 w-4 mr-2" />
                                Group info
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem>
                              <Archive className="h-4 w-4 mr-2" />
                              Archive
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive">
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete chat
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                    {/* Message Search */}
                    {showMessageSearch && (
                      <div className="flex items-center gap-2 mt-2">
                        <div className="relative flex-1">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
                          <Input
                            placeholder="Search in conversation..."
                            value={messageSearch}
                            onChange={(e) => setMessageSearch(e.target.value)}
                            className="pl-8 h-8 text-xs"
                            autoFocus
                          />
                        </div>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => { setShowMessageSearch(false); setMessageSearch(""); }}>
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    )}
                  </CardHeader>

                  {/* Messages */}
                  <CardContent className="flex-1 p-0 overflow-hidden">
                    <ScrollArea className="h-full p-3 sm:p-4">
                      <div className="space-y-3">
                        {(filteredMessages || []).map((message) => {
                          const isMine = message.senderId === "me";
                          return (
                            <div
                              key={message.id}
                              className={`flex ${isMine ? "justify-end" : "justify-start"} group`}
                            >
                              <div className={`max-w-[85%] sm:max-w-[70%] relative`}>
                                {activeConversation.isGroup && !isMine && (
                                  <p className="text-xs text-muted-foreground mb-1 ml-1 capitalize">
                                    {message.senderId}
                                  </p>
                                )}
                                {message.replyTo && (
                                  <div className="mb-1 ml-1 pl-2 border-l-2 border-primary/50">
                                    <p className="text-[10px] text-primary font-medium">{message.replyTo.sender}</p>
                                    <p className="text-[10px] text-muted-foreground truncate">{message.replyTo.content}</p>
                                  </div>
                                )}
                                <div className="relative">
                                  <div
                                    className={`p-2.5 sm:p-3 rounded-2xl ${
                                      isMine
                                        ? "bg-primary text-primary-foreground rounded-br-md"
                                        : "bg-muted rounded-bl-md"
                                    }`}
                                  >
                                    {message.isVoice ? (
                                      <div className="flex items-center gap-2">
                                        <Volume2 className="h-4 w-4" />
                                        <div className="h-1 w-20 sm:w-24 bg-white/30 rounded-full">
                                          <div className="h-1 w-14 sm:w-16 bg-white rounded-full" />
                                        </div>
                                        <span className="text-xs">{message.voiceDuration}</span>
                                      </div>
                                    ) : (
                                      <p className="text-sm break-words">{message.content}</p>
                                    )}
                                    {message.attachment && (
                                      <div className={`flex items-center gap-2 mt-2 p-2 rounded-lg ${isMine ? "bg-white/10" : "bg-background/50"}`}>
                                        <File className="h-4 w-4 flex-shrink-0" />
                                        <div className="flex-1 min-w-0">
                                          <p className="text-xs font-medium truncate">{message.attachment.name}</p>
                                          <p className="text-[10px] opacity-70">{message.attachment.size}</p>
                                        </div>
                                      </div>
                                    )}
                                  </div>

                                  {/* Action buttons on hover */}
                                  <div className={`absolute top-0 ${isMine ? "left-0 -translate-x-full" : "right-0 translate-x-full"} px-1 hidden group-hover:flex items-center gap-0.5`}>
                                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => setShowReactions(message.id)}>
                                      <Smile className="h-3 w-3" />
                                    </Button>
                                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => setReplyingTo({ sender: isMine ? "You" : message.senderId, content: message.content })}>
                                      <Reply className="h-3 w-3" />
                                    </Button>
                                  </div>

                                  {/* Reaction picker */}
                                  {showReactions === message.id && (
                                    <div className={`absolute ${isMine ? "right-0" : "left-0"} -top-10 z-10 flex gap-0.5 bg-card border rounded-full px-2 py-1 shadow-lg`}>
                                      {reactionEmojis.map((emoji) => (
                                        <button
                                          key={emoji}
                                          className="hover:scale-125 transition-transform p-0.5 text-sm"
                                          onClick={() => handleReaction(message.id, emoji)}
                                        >
                                          {emoji}
                                        </button>
                                      ))}
                                    </div>
                                  )}
                                </div>

                                {message.reactions.length > 0 && (
                                  <div className={`flex gap-1 mt-1 flex-wrap ${isMine ? "justify-end" : "justify-start"}`}>
                                    {message.reactions.map((r) => (
                                      <button
                                        key={r.emoji}
                                        onClick={() => handleReaction(message.id, r.emoji)}
                                        className={`flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-xs border ${
                                          r.byMe ? "border-primary bg-primary/10" : "border-border bg-muted"
                                        }`}
                                      >
                                        {r.emoji}
                                        {r.count > 1 && <span className="text-[10px]">{r.count}</span>}
                                      </button>
                                    ))}
                                  </div>
                                )}

                                <div
                                  className={`flex items-center gap-1 mt-1 px-1 ${
                                    isMine ? "justify-end" : "justify-start"
                                  }`}
                                >
                                  <span className="text-[10px] text-muted-foreground">{message.time}</span>
                                  {isMine && <DeliveryIndicator status={message.status} />}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                        {isTyping && (
                          <div className="flex justify-start">
                            <TypingIndicator />
                          </div>
                        )}
                        <div ref={messagesEndRef} />
                      </div>
                    </ScrollArea>
                  </CardContent>

                  {/* Reply Bar */}
                  {replyingTo && (
                    <div className="px-3 sm:px-4 py-2 border-t bg-muted/50 flex items-center gap-2">
                      <Reply className="h-4 w-4 text-primary flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-primary">{replyingTo.sender}</p>
                        <p className="text-xs text-muted-foreground truncate">{replyingTo.content}</p>
                      </div>
                      <Button variant="ghost" size="sm" className="h-6 w-6 p-0 flex-shrink-0" onClick={() => setReplyingTo(null)}>
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  )}

                  {/* Voice Recording Bar */}
                  {isRecordingVoice && (
                    <div className="px-3 sm:px-4 py-3 border-t bg-destructive/5 flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full bg-destructive animate-pulse flex-shrink-0" />
                      <span className="text-sm font-mono">0:{voiceSeconds.toString().padStart(2, "0")}</span>
                      <div className="flex-1 h-1 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-destructive rounded-full animate-pulse" style={{ width: `${Math.min(voiceSeconds * 3, 100)}%` }} />
                      </div>
                      <Button variant="ghost" size="sm" onClick={() => setIsRecordingVoice(false)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                      <Button size="sm" onClick={sendVoiceMessage}>
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>
                  )}

                  {/* Message Input */}
                  {!isRecordingVoice && (
                    <div className="p-2 sm:p-4 border-t">
                      <div className="flex items-end gap-1 sm:gap-2">
                        <div className="flex gap-0.5 sm:gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8 sm:h-9 sm:w-9" onClick={() => toast.info("File picker (mock)")}>
                            <Paperclip className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 sm:h-9 sm:w-9 hidden sm:flex" onClick={() => toast.info("Image picker (mock)")}>
                            <ImageIcon className="h-4 w-4" />
                          </Button>
                        </div>
                        <div className="flex-1 relative">
                          <Input
                            placeholder="Type a message..."
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" && !e.shiftKey) {
                                e.preventDefault();
                                handleSendMessage();
                              }
                            }}
                            className="pr-10 h-9 sm:h-10 text-sm"
                          />
                          <Button
                            variant="ghost"
                            size="icon"
                            className="absolute right-0 top-0 h-full w-8 sm:w-9"
                          >
                            <Smile className="h-4 w-4" />
                          </Button>
                        </div>
                        {newMessage.trim() ? (
                          <Button
                            onClick={handleSendMessage}
                            size="icon"
                            className="h-8 w-8 sm:h-9 sm:w-9 rounded-full flex-shrink-0"
                          >
                            <Send className="h-4 w-4" />
                          </Button>
                        ) : (
                          <Button
                            onClick={() => setIsRecordingVoice(true)}
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 sm:h-9 sm:w-9 rounded-full flex-shrink-0"
                          >
                            <Mic className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground p-4">
                  <MessageSquare className="h-12 w-12 sm:h-16 sm:w-16 mb-4" />
                  <p className="font-medium">Select a conversation</p>
                  <p className="text-sm text-center">Choose from your existing conversations</p>
                </div>
              )}
            </Card>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
