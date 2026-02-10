import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import http from 'http';
import path from 'path';
import fs from 'fs';
import { randomUUID } from 'crypto';
import { fileURLToPath } from 'url';
import { WebSocketServer } from 'ws';
import { initDatabase } from './database.js';
import { authRoutes } from './routes/auth.js';
import { coursesRoutes } from './routes/courses.js';
import { assignmentsRoutes } from './routes/assignments.js';
import { usersRoutes } from './routes/users.js';
import { authMiddleware, optionalAuthMiddleware } from './middleware/auth.js';
import { meetingsRoutes } from './routes/meetings.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const app = express();
const PORT = process.env.PORT || 4000;
const RECORDINGS_DIR = process.env.RECORDINGS_DIR || path.join(process.cwd(), 'recordings');

// Middleware
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
fs.mkdirSync(RECORDINGS_DIR, { recursive: true });
app.use('/recordings', express.static(RECORDINGS_DIR));

// Initialize database
initDatabase();

// Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/courses', authMiddleware, coursesRoutes);
app.use('/api/v1/assignments', authMiddleware, assignmentsRoutes);
app.use('/api/v1/users', authMiddleware, usersRoutes);
app.use('/api/v1/meetings', optionalAuthMiddleware, meetingsRoutes);

// Health check
app.get('/api/v1/health/liveness', (req, res) => {
  res.json({ status: 'ok' });
});

const server = http.createServer(app);

type Client = {
  id: string;
  name: string;
  userId?: string;
  roomId: string;
  ws: import('ws').WebSocket;
};

const rooms = new Map<string, Map<string, Client>>();

const wss = new WebSocketServer({ server, path: '/ws' });

const safeJsonParse = (data: string) => {
  try {
    return JSON.parse(data);
  } catch {
    return null;
  }
};

const broadcastToRoom = (roomId: string, payload: unknown, excludeId?: string) => {
  const room = rooms.get(roomId);
  if (!room) return;
  const message = JSON.stringify(payload);
  room.forEach((client) => {
    if (excludeId && client.id === excludeId) return;
    if (client.ws.readyState === client.ws.OPEN) {
      client.ws.send(message);
    }
  });
};

wss.on('connection', (ws) => {
  const clientId = randomUUID();
  let currentRoomId: string | null = null;

  ws.on('message', (raw) => {
    const message = safeJsonParse(raw.toString());
    if (!message?.type) return;

    if (message.type === 'join') {
      const roomId = String(message.roomId || '').trim();
      if (!roomId) return;
      const name = String(message.name || 'Guest').trim() || 'Guest';
      const userId = message.userId ? String(message.userId) : undefined;

      currentRoomId = roomId;
      const room = rooms.get(roomId) ?? new Map<string, Client>();
      const client: Client = { id: clientId, name, userId, roomId, ws };
      room.set(clientId, client);
      rooms.set(roomId, room);

      const peers = Array.from(room.values())
        .filter((c) => c.id !== clientId)
        .map((c) => ({ clientId: c.id, name: c.name, userId: c.userId }));

      ws.send(JSON.stringify({ type: 'joined', clientId, peers }));
      broadcastToRoom(roomId, { type: 'peer-joined', clientId, name, userId }, clientId);
      return;
    }

    if (!currentRoomId) return;

    if (message.type === 'signal') {
      const targetId = String(message.targetId || '');
      const room = rooms.get(currentRoomId);
      const target = room?.get(targetId);
      if (!target) return;
      const payload = {
        type: 'signal',
        fromId: clientId,
        signalType: message.signalType,
        data: message.data,
      };
      if (target.ws.readyState === target.ws.OPEN) {
        target.ws.send(JSON.stringify(payload));
      }
      return;
    }

    if (message.type === 'chat') {
      const text = String(message.text || '').trim();
      if (!text) return;
      const room = rooms.get(currentRoomId);
      const sender = room?.get(clientId);
      if (!sender) return;
      broadcastToRoom(currentRoomId, {
        type: 'chat',
        fromId: clientId,
        name: sender.name,
        text,
        time: new Date().toISOString(),
      });
      return;
    }
  });

  ws.on('close', () => {
    if (!currentRoomId) return;
    const room = rooms.get(currentRoomId);
    if (!room) return;
    room.delete(clientId);
    broadcastToRoom(currentRoomId, { type: 'peer-left', clientId });
    if (room.size === 0) {
      rooms.delete(currentRoomId);
    }
  });
});

server.listen(PORT, () => {
  console.log(`✅ Backend running on http://localhost:${PORT}`);
  console.log(`📚 API Docs: http://localhost:${PORT}/api/v1/health/liveness`);
  console.log(`🛰️  WebSocket signaling: ws://localhost:${PORT}/ws`);
});
