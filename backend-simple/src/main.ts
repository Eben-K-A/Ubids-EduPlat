import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import http from 'http';
import path from 'path';
import fs from 'fs';
import { randomUUID } from 'crypto';
import { fileURLToPath } from 'url';
import { WebSocketServer } from 'ws';
import { initDatabase, db } from './database.js';
import { authRoutes } from './routes/auth.js';
import { coursesRoutes } from './routes/courses.js';
import { assignmentsRoutes } from './routes/assignments.js';
import { usersRoutes } from './routes/users.js';
import { authMiddleware, optionalAuthMiddleware } from './middleware/auth.js';
import { meetingsRoutes } from './routes/meetings.js';
import { modulesRoutes } from './routes/modules.js';
import { quizzesRoutes } from './routes/quizzes.js';
import { classroomRoutes } from './routes/classroom.js';
import { notificationsRoutes } from './routes/notifications.js';
import { messagesRoutes } from './routes/messages.js';
import { discussionsRoutes } from './routes/discussions.js';
import { filesRoutes } from './routes/files.js';
import { analyticsRoutes } from './routes/analytics.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const app = express();
const PORT = process.env.PORT || 4000;
const RECORDINGS_DIR = process.env.RECORDINGS_DIR || path.join(process.cwd(), 'recordings');
const UPLOADS_DIR = process.env.UPLOADS_DIR || path.join(process.cwd(), 'uploads');

// Middleware
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
fs.mkdirSync(RECORDINGS_DIR, { recursive: true });
fs.mkdirSync(UPLOADS_DIR, { recursive: true });
app.use('/recordings', express.static(RECORDINGS_DIR));
app.use('/uploads', express.static(UPLOADS_DIR));

// Initialize database
(async () => {
  try {
    await initDatabase();
  } catch (error: any) {
    console.warn('⚠️  Database initialization encountered an error, server will continue without database');
  }
})();

// Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/courses', authMiddleware, coursesRoutes);
app.use('/api/v1/assignments', authMiddleware, assignmentsRoutes);
app.use('/api/v1/users', authMiddleware, usersRoutes);
app.use('/api/v1/meetings', optionalAuthMiddleware, meetingsRoutes);
app.use('/api/v1/modules', authMiddleware, modulesRoutes);
app.use('/api/v1/quizzes', authMiddleware, quizzesRoutes);
app.use('/api/v1/classroom', authMiddleware, classroomRoutes);
app.use('/api/v1/notifications', authMiddleware, notificationsRoutes);
app.use('/api/v1/messages', authMiddleware, messagesRoutes);
app.use('/api/v1/discussions', authMiddleware, discussionsRoutes);
app.use('/api/v1/files', authMiddleware, filesRoutes);
app.use('/api/v1/analytics', authMiddleware, analyticsRoutes);

// Health check
app.get('/api/v1/health/liveness', async (req, res) => {
  try {
    // Basic DB check
    const result = await db.query('SELECT 1');
    res.json({
      status: 'ok',
      database: 'connected',
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('Health check failed:', error);
    res.status(500).json({
      status: 'error',
      database: 'disconnected',
      error: error.message,
      code: error.code
    });
  }
});

app.get('/api/v1/health/check', async (req, res) => {
  try {
    await db.query('SELECT 1');
    res.json({ status: 'ok', db: 'connected' });
  } catch (e: any) {
    res.status(500).json({ status: 'error', db: 'disconnected', error: e.message });
  }
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
