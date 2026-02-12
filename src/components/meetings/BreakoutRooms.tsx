import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Users, Clock, Zap } from "lucide-react";

interface BreakoutRoom {
  id: string;
  name: string;
  participants: Array<{ id: string; name: string }>;
  duration: number;
  status: "active" | "ended";
}

interface BreakoutRoomsProps {
  isHost: boolean;
  rooms: BreakoutRoom[];
  onCreateRoom?: (name: string, participants: string[], duration: number) => void;
  onAssignParticipants?: (roomId: string, participantIds: string[]) => void;
  onCloseRooms?: () => void;
  allParticipants: Array<{ id: string; name: string }>;
}

export function BreakoutRooms({
  isHost,
  rooms,
  onCreateRoom,
  onAssignParticipants,
  onCloseRooms,
  allParticipants,
}: BreakoutRoomsProps) {
  const [roomName, setRoomName] = useState("");
  const [roomCount, setRoomCount] = useState("2");
  const [duration, setDuration] = useState("15");
  const [open, setOpen] = useState(false);

  const handleCreate = () => {
    if (roomName.trim() && onCreateRoom) {
      onCreateRoom(roomName, [], Number(duration));
      setRoomName("");
      setRoomCount("2");
      setDuration("15");
      setOpen(false);
    }
  };

  if (!isHost && rooms.length === 0) return null;

  return (
    <div className="w-full space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-white flex items-center gap-2">
          <Zap className="h-4 w-4" /> Breakout Rooms
        </h3>
        {isHost && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm" variant="secondary">
                <Plus className="h-3 w-3 mr-1" /> Create
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Breakout Rooms</DialogTitle>
                <DialogDescription>Set up breakout rooms for group discussions</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Room Name</Label>
                  <Input
                    placeholder="e.g., Group Discussion A"
                    value={roomName}
                    onChange={(e) => setRoomName(e.target.value)}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Number of Rooms</Label>
                    <Select value={roomCount} onValueChange={setRoomCount}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {[2, 3, 4, 5, 6].map(n => (
                          <SelectItem key={n} value={String(n)}>{n}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Duration (min)</Label>
                    <Select value={duration} onValueChange={setDuration}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {[5, 10, 15, 20, 30].map(n => (
                          <SelectItem key={n} value={String(n)}>{n}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <Button onClick={handleCreate} className="w-full">Create Rooms</Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {rooms.length > 0 && (
        <div className="space-y-2">
          {rooms.map(room => (
            <Card key={room.id} className="bg-white/5 border-white/10">
              <CardContent className="p-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-semibold text-white">{room.name}</h4>
                    <Badge variant="outline" className={room.status === "active" ? "bg-green-600/20 text-green-400 border-green-500/30" : ""}>
                      {room.status}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-white/60">
                    <Clock className="h-3 w-3" /> {room.duration}m
                  </div>
                </div>
                <div className="flex items-center gap-1 text-xs text-white/70">
                  <Users className="h-3 w-3" />
                  {room.participants.length} participants
                </div>
              </CardContent>
            </Card>
          ))}
          {isHost && rooms.length > 0 && (
            <Button
              variant="destructive"
              size="sm"
              className="w-full"
              onClick={onCloseRooms}
            >
              Close All Rooms
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
