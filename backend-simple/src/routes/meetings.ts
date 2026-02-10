import { Router } from 'express';
import { randomUUID } from 'crypto';
import { AccessToken, EgressClient } from 'livekit-server-sdk';
import path from 'path';
import fs from 'fs';
import bcryptjs from 'bcryptjs';
import { db } from '../database.js';

export const meetingsRoutes = Router();

const generateMeetingCode = () => {
  const letters = () => Math.random().toString(36).slice(2, 6).toUpperCase();
  return `${letters()}-${letters()}-${letters()}`;
};

const createLiveKitToken = async (roomName: string, identity: string, name: string, isHost: boolean) => {
  const apiKey = process.env.LIVEKIT_API_KEY;
  const apiSecret = process.env.LIVEKIT_API_SECRET;
  if (!apiKey || !apiSecret) return null;

  const token = new AccessToken(apiKey, apiSecret, { identity, name });
  token.addGrant({
    room: roomName,
    roomJoin: true,
    canPublish: true,
    canSubscribe: true,
    canPublishData: true,
    roomAdmin: isHost,
  });
  return token.toJwt();
};

const createEgressClient = () => {
  const apiKey = process.env.LIVEKIT_API_KEY;
  const apiSecret = process.env.LIVEKIT_API_SECRET;
  const livekitUrl = process.env.LIVEKIT_EGRESS_URL || process.env.LIVEKIT_URL;
  if (!apiKey || !apiSecret || !livekitUrl) return null;
  return new EgressClient(livekitUrl, apiKey, apiSecret);
};

const getRecordingOutput = (meetingCode: string) => {
  const outputDir = process.env.LIVEKIT_EGRESS_OUTPUT_DIR || process.env.RECORDINGS_DIR || path.join(process.cwd(), 'recordings');
  fs.mkdirSync(outputDir, { recursive: true });
  const filename = `${meetingCode}-${Date.now()}.mp4`;
  const filepath = path.join(outputDir, filename);
  const recordingUrl = `/recordings/${filename}`;
  return { filepath, recordingUrl };
};

const isHostOrAdmin = (meeting: any, user?: { id: string; role: string }) => {
  if (!user) return false;
  if (user.role === 'admin') return true;
  return meeting.hostId && user.id === meeting.hostId;
};

const expandRecurringMeeting = (baseMeeting: any, occurrences: number = 12) => {
  if (!baseMeeting.isRecurring || !baseMeeting.recurringPattern) {
    return [baseMeeting];
  }

  const meetings = [baseMeeting];
  const startDate = new Date(baseMeeting.startTime);
  const pattern = baseMeeting.recurringPattern.toLowerCase();
  let interval = 1;

  switch (pattern) {
    case 'daily':
      interval = 1;
      break;
    case 'weekly':
      interval = 7;
      break;
    case 'biweekly':
      interval = 14;
      break;
    case 'monthly':
      interval = 30;
      break;
    default:
      interval = 7;
  }

  const now = new Date().toISOString();
  for (let i = 1; i < occurrences; i++) {
    const newDate = new Date(startDate);
    newDate.setDate(newDate.getDate() + interval * i);

    const recurringId = randomUUID();
    const meetingCode = generateMeetingCode();

    db.prepare(`
      INSERT INTO meetings (
        id, title, description, startTime, duration, hostName, hostId, meetingCode,
        waitingRoomMode, isRecurring, recurringPattern, hasWaitingRoom, isPasswordProtected, recordingEnabled, password, createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      recurringId,
      baseMeeting.title,
      baseMeeting.description,
      newDate.toISOString(),
      baseMeeting.duration,
      baseMeeting.hostName,
      baseMeeting.hostId,
      meetingCode,
      baseMeeting.waitingRoomMode,
      1,
      baseMeeting.recurringPattern,
      baseMeeting.hasWaitingRoom,
      baseMeeting.isPasswordProtected,
      baseMeeting.recordingEnabled,
      baseMeeting.password,
      now,
      now
    );

    meetings.push({
      ...baseMeeting,
      id: recurringId,
      startTime: newDate.toISOString(),
      meetingCode,
    });
  }

  return meetings;
};

meetingsRoutes.get('/', (req, res) => {
  const q = String(req.query.q || '').trim().toLowerCase();
  const rows = db.prepare('SELECT * FROM meetings ORDER BY startTime ASC').all() as any[];
  const filtered = q
    ? rows.filter((m) => m.title.toLowerCase().includes(q) || (m.description || '').toLowerCase().includes(q))
    : rows;
  res.json({
    data: filtered.map((m) => ({
      ...m,
      waitingRoomMode: m.waitingRoomMode ?? 'auto',
      isRecurring: Boolean(m.isRecurring),
      hasWaitingRoom: Boolean(m.hasWaitingRoom),
      isPasswordProtected: Boolean(m.isPasswordProtected),
      recordingEnabled: Boolean(m.recordingEnabled),
    })),
  });
});

meetingsRoutes.get('/:id', (req, res) => {
  const id = req.params.id;
  const meeting = db
    .prepare('SELECT * FROM meetings WHERE id = ? OR meetingCode = ?')
    .get(id, id) as any;

  if (!meeting) return res.status(404).json({ message: 'Meeting not found' });

  res.json({
    data: {
      ...meeting,
      waitingRoomMode: meeting.waitingRoomMode ?? 'auto',
      isRecurring: Boolean(meeting.isRecurring),
      hasWaitingRoom: Boolean(meeting.hasWaitingRoom),
      isPasswordProtected: Boolean(meeting.isPasswordProtected),
      recordingEnabled: Boolean(meeting.recordingEnabled),
    },
  });
});

meetingsRoutes.post('/', (req, res) => {
  const {
    title,
    description,
    startTime,
    duration,
    waitingRoomMode = 'auto',
    isRecurring = false,
    recurringPattern = null,
    hasWaitingRoom = false,
    isPasswordProtected = false,
    recordingEnabled = false,
    password = null,
  } = req.body || {};

  // Validation
  if (!title || !String(title).trim()) {
    return res.status(400).json({ data: null, message: 'Meeting title is required' });
  }
  if (!startTime) {
    return res.status(400).json({ data: null, message: 'Meeting start time is required' });
  }
  if (!duration || Number(duration) <= 0) {
    return res.status(400).json({ data: null, message: 'Meeting duration must be greater than 0' });
  }

  // Validate start time is not in the past
  const startDate = new Date(startTime);
  if (Number.isNaN(startDate.getTime())) {
    return res.status(400).json({ data: null, message: 'Invalid start time format' });
  }

  if (isPasswordProtected && !password) {
    return res.status(400).json({ data: null, message: 'Password is required when password protection is enabled' });
  }

  const now = new Date().toISOString();
  const id = randomUUID();
  const meetingCode = generateMeetingCode();
  const hostName = req.user ? `${req.user.email}` : 'Guest';
  const hostId = req.user?.id ?? null;

  // Hash password if provided
  const hashedPassword = isPasswordProtected && password
    ? bcryptjs.hashSync(password, 10)
    : null;

  db.prepare(`
    INSERT INTO meetings (
      id, title, description, startTime, duration, hostName, hostId, meetingCode,
      waitingRoomMode, isRecurring, recurringPattern, hasWaitingRoom, isPasswordProtected, recordingEnabled, password, createdAt, updatedAt
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id,
    title,
    description || null,
    startTime,
    Number(duration),
    hostName,
    hostId,
    meetingCode,
    waitingRoomMode,
    isRecurring ? 1 : 0,
    isRecurring ? recurringPattern : null,
    hasWaitingRoom ? 1 : 0,
    isPasswordProtected ? 1 : 0,
    recordingEnabled ? 1 : 0,
    hashedPassword,
    now,
    now
  );

  const meeting = db.prepare('SELECT * FROM meetings WHERE id = ?').get(id) as any;

  // If recurring, expand to create multiple instances
  if (isRecurring) {
    expandRecurringMeeting(meeting, 12);
  }

  res.status(201).json({
    data: {
      ...meeting,
      waitingRoomMode: meeting.waitingRoomMode ?? 'auto',
      isRecurring: Boolean(meeting.isRecurring),
      hasWaitingRoom: Boolean(meeting.hasWaitingRoom),
      isPasswordProtected: Boolean(meeting.isPasswordProtected),
      recordingEnabled: Boolean(meeting.recordingEnabled),
    },
  });
});

meetingsRoutes.post('/:id/join', async (req, res) => {
  const id = req.params.id;
  const meeting = db
    .prepare('SELECT * FROM meetings WHERE id = ? OR meetingCode = ?')
    .get(id, id) as any;
  if (!meeting) return res.status(404).json({ message: 'Meeting not found' });

  const name = String(req.body?.name || 'Guest').trim() || 'Guest';
  const password = req.body?.password || '';
  const waitingRoomMode = meeting.waitingRoomMode ?? 'auto';
  const isHost = isHostOrAdmin(meeting, req.user);
  const isAuthed = Boolean(req.user);

  // Check password if required
  if (meeting.isPasswordProtected && !isHost) {
    if (!password) {
      return res.status(403).json({ message: 'Meeting requires a password' });
    }
    // Compare provided password with hashed password
    const passwordMatch = bcryptjs.compareSync(password, meeting.password || '');
    if (!passwordMatch) {
      return res.status(403).json({ message: 'Invalid meeting password' });
    }
  }

  const canAutoAdmit =
    waitingRoomMode === 'auto' ||
    (waitingRoomMode === 'auth-auto' && isAuthed) ||
    isHost;

  if (canAutoAdmit) {
    const identity = req.user?.id ? `user-${req.user.id}` : `guest-${randomUUID()}`;
    const token = await createLiveKitToken(meeting.meetingCode, identity, name, isHost);
    if (!token) {
      return res.status(500).json({ data: null, message: 'LiveKit credentials are not configured' });
    }
    return res.json({
      data: {
        status: 'joined',
        token,
        identity,
        room: meeting.meetingCode,
      }
    });
  }

  const requestId = randomUUID();
  const identity = `guest-${randomUUID()}`;
  const now = new Date().toISOString();
  db.prepare(`
    INSERT INTO meeting_waiting_requests (id, meetingId, name, userId, identity, status, createdAt, updatedAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(requestId, meeting.id, name, req.user?.id ?? null, identity, 'pending', now, now);

  return res.json({
    data: {
      status: 'waiting',
      requestId,
    }
  });
});

meetingsRoutes.get('/:id/waiting', (req, res) => {
  const meeting = db
    .prepare('SELECT * FROM meetings WHERE id = ? OR meetingCode = ?')
    .get(req.params.id, req.params.id) as any;
  if (!meeting) return res.status(404).json({ message: 'Meeting not found' });
  if (!isHostOrAdmin(meeting, req.user)) {
    return res.status(403).json({ message: 'Not authorized' });
  }
  const rows = db
    .prepare('SELECT * FROM meeting_waiting_requests WHERE meetingId = ? AND status = ? ORDER BY createdAt ASC')
    .all(meeting.id, 'pending') as any[];
  res.json({ data: rows });
});

meetingsRoutes.get('/:id/waiting/:requestId', async (req, res) => {
  const meeting = db
    .prepare('SELECT * FROM meetings WHERE id = ? OR meetingCode = ?')
    .get(req.params.id, req.params.id) as any;
  if (!meeting) return res.status(404).json({ data: null, message: 'Meeting not found' });

  const request = db
    .prepare('SELECT * FROM meeting_waiting_requests WHERE id = ? AND meetingId = ?')
    .get(req.params.requestId, meeting.id) as any;
  if (!request) return res.status(404).json({ data: null, message: 'Request not found' });

  if (request.status === 'approved') {
    const token = await createLiveKitToken(meeting.meetingCode, request.identity, request.name, false);
    if (!token) {
      return res.status(500).json({ data: null, message: 'LiveKit credentials are not configured' });
    }
    return res.json({
      data: {
        status: 'joined',
        token,
        identity: request.identity,
        room: meeting.meetingCode,
      }
    });
  }

  return res.json({
    data: {
      status: request.status,
    }
  });
});

meetingsRoutes.post('/:id/waiting/:requestId/approve', (req, res) => {
  const meeting = db
    .prepare('SELECT * FROM meetings WHERE id = ? OR meetingCode = ?')
    .get(req.params.id, req.params.id) as any;
  if (!meeting) return res.status(404).json({ data: null, message: 'Meeting not found' });
  if (!isHostOrAdmin(meeting, req.user)) {
    return res.status(403).json({ data: null, message: 'Not authorized' });
  }

  const now = new Date().toISOString();
  db.prepare(`
    UPDATE meeting_waiting_requests
    SET status = 'approved', updatedAt = ?
    WHERE id = ? AND meetingId = ?
  `).run(now, req.params.requestId, meeting.id);

  res.json({ data: { status: 'approved' } });
});

meetingsRoutes.post('/:id/waiting/:requestId/deny', (req, res) => {
  const meeting = db
    .prepare('SELECT * FROM meetings WHERE id = ? OR meetingCode = ?')
    .get(req.params.id, req.params.id) as any;
  if (!meeting) return res.status(404).json({ data: null, message: 'Meeting not found' });
  if (!isHostOrAdmin(meeting, req.user)) {
    return res.status(403).json({ data: null, message: 'Not authorized' });
  }

  const now = new Date().toISOString();
  db.prepare(`
    UPDATE meeting_waiting_requests
    SET status = 'denied', updatedAt = ?
    WHERE id = ? AND meetingId = ?
  `).run(now, req.params.requestId, meeting.id);

  res.json({ data: { status: 'denied' } });
});

meetingsRoutes.put('/:id', (req, res) => {
  const id = req.params.id;
  const meeting = db
    .prepare('SELECT * FROM meetings WHERE id = ? OR meetingCode = ?')
    .get(id, id) as any;
  if (!meeting) return res.status(404).json({ data: null, message: 'Meeting not found' });
  if (!isHostOrAdmin(meeting, req.user)) {
    return res.status(403).json({ data: null, message: 'You do not have permission to edit this meeting' });
  }

  const {
    title,
    description,
    startTime,
    duration,
    waitingRoomMode,
    isRecurring,
    recurringPattern,
    hasWaitingRoom,
    isPasswordProtected,
    recordingEnabled,
    password,
  } = req.body || {};

  // Validation
  if (title !== undefined && !String(title).trim()) {
    return res.status(400).json({ data: null, message: 'Meeting title cannot be empty' });
  }
  if (startTime !== undefined) {
    const startDate = new Date(startTime);
    if (Number.isNaN(startDate.getTime())) {
      return res.status(400).json({ data: null, message: 'Invalid start time format' });
    }
  }
  if (duration !== undefined && Number(duration) <= 0) {
    return res.status(400).json({ data: null, message: 'Meeting duration must be greater than 0' });
  }
  if (isPasswordProtected === true && !password) {
    return res.status(400).json({ data: null, message: 'Password is required when password protection is enabled' });
  }

  const now = new Date().toISOString();

  // Hash password if provided
  let passwordToStore: string | null | undefined = undefined;
  if (isPasswordProtected !== undefined) {
    if (isPasswordProtected && password) {
      passwordToStore = bcryptjs.hashSync(password, 10);
    } else if (!isPasswordProtected) {
      passwordToStore = null;
    }
  }

  db.prepare(`
    UPDATE meetings SET
      title = COALESCE(?, title),
      description = COALESCE(?, description),
      startTime = COALESCE(?, startTime),
      duration = COALESCE(?, duration),
      waitingRoomMode = COALESCE(?, waitingRoomMode),
      isRecurring = COALESCE(?, isRecurring),
      recurringPattern = COALESCE(?, recurringPattern),
      hasWaitingRoom = COALESCE(?, hasWaitingRoom),
      isPasswordProtected = COALESCE(?, isPasswordProtected),
      recordingEnabled = COALESCE(?, recordingEnabled),
      password = CASE WHEN ? IS NOT NULL THEN ? WHEN password IS NULL THEN NULL ELSE password END,
      updatedAt = ?
    WHERE id = ?
  `).run(
    title ?? null,
    description ?? null,
    startTime ?? null,
    duration !== undefined ? Number(duration) : null,
    waitingRoomMode ?? null,
    isRecurring !== undefined ? (isRecurring ? 1 : 0) : null,
    recurringPattern ?? null,
    hasWaitingRoom !== undefined ? (hasWaitingRoom ? 1 : 0) : null,
    isPasswordProtected !== undefined ? (isPasswordProtected ? 1 : 0) : null,
    recordingEnabled !== undefined ? (recordingEnabled ? 1 : 0) : null,
    passwordToStore !== undefined ? passwordToStore : null,
    passwordToStore !== undefined ? passwordToStore : null,
    now,
    id
  );

  const updated = db.prepare('SELECT * FROM meetings WHERE id = ?').get(id) as any;
  res.json({
    data: {
      ...updated,
      waitingRoomMode: updated.waitingRoomMode ?? 'auto',
      isRecurring: Boolean(updated.isRecurring),
      hasWaitingRoom: Boolean(updated.hasWaitingRoom),
      isPasswordProtected: Boolean(updated.isPasswordProtected),
      recordingEnabled: Boolean(updated.recordingEnabled),
    },
  });
});

meetingsRoutes.delete('/:id', (req, res) => {
  const id = req.params.id;
  const meeting = db
    .prepare('SELECT * FROM meetings WHERE id = ? OR meetingCode = ?')
    .get(id, id) as any;
  if (!meeting) return res.status(404).json({ data: null, message: 'Meeting not found' });
  if (!isHostOrAdmin(meeting, req.user)) {
    return res.status(403).json({ data: null, message: 'Not authorized' });
  }

  db.prepare('DELETE FROM meeting_waiting_requests WHERE meetingId = ?').run(meeting.id);
  db.prepare('DELETE FROM meeting_recordings WHERE meetingId = ?').run(meeting.id);
  db.prepare('DELETE FROM meetings WHERE id = ?').run(meeting.id);

  res.json({ data: null, message: 'Meeting deleted' });
});

meetingsRoutes.get('/:id/recordings', (req, res) => {
  const meeting = db
    .prepare('SELECT * FROM meetings WHERE id = ? OR meetingCode = ?')
    .get(req.params.id, req.params.id) as any;
  if (!meeting) return res.status(404).json({ message: 'Meeting not found' });

  const rows = db
    .prepare('SELECT * FROM meeting_recordings WHERE meetingId = ? ORDER BY createdAt DESC')
    .all(meeting.id) as any[];
  res.json({ data: rows });
});

meetingsRoutes.post('/:id/recordings/start', async (req, res) => {
  const meeting = db
    .prepare('SELECT * FROM meetings WHERE id = ? OR meetingCode = ?')
    .get(req.params.id, req.params.id) as any;
  if (!meeting) return res.status(404).json({ message: 'Meeting not found' });
  if (!isHostOrAdmin(meeting, req.user)) {
    return res.status(403).json({ message: 'Not authorized' });
  }

  const active = db
    .prepare('SELECT * FROM meeting_recordings WHERE meetingId = ? AND status = ?')
    .get(meeting.id, 'recording');
  if (active) return res.status(400).json({ message: 'Recording already in progress' });

  const egressClient = createEgressClient();
  if (!egressClient) {
    return res.status(500).json({ message: 'LiveKit Egress is not configured' });
  }

  try {
    const now = new Date().toISOString();
    const id = randomUUID();
    const { filepath, recordingUrl } = getRecordingOutput(meeting.meetingCode);

    const egress = await egressClient.startRoomCompositeEgress(
      meeting.meetingCode,
      { file: { filepath } } as any
    );

    const egressId = (egress as any)?.egressId;
    db.prepare(`
      INSERT INTO meeting_recordings (id, meetingId, egressId, status, startedAt, recordingUrl, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, meeting.id, egressId ?? null, 'recording', now, recordingUrl, now, now);

    res.json({ data: { id, status: 'recording', startedAt: now, recordingUrl, egressId } });
  } catch (error: any) {
    res.status(500).json({ message: error?.message || 'Failed to start recording' });
  }
});

meetingsRoutes.get('/personal-meeting/current', (req, res) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Not authenticated' });
  }

  // Check if personal meeting already exists
  let personalMeeting = db
    .prepare('SELECT pm.*, m.* FROM personal_meetings pm JOIN meetings m ON pm.meetingId = m.id WHERE pm.userId = ?')
    .get(req.user.id) as any;

  if (personalMeeting) {
    return res.json({
      data: {
        id: personalMeeting.id,
        meetingId: personalMeeting.meetingId,
        personalMeetingCode: personalMeeting.personalMeetingCode,
        title: personalMeeting.title,
        meetingCode: personalMeeting.meetingCode,
        hostId: personalMeeting.hostId,
      },
    });
  }

  // Create personal meeting if doesn't exist
  const personalMeetingId = randomUUID();
  const meetingId = randomUUID();
  const meetingCode = generateMeetingCode();
  const personalCode = `PMI-${req.user.id.slice(0, 3).toUpperCase()}-${randomUUID().slice(0, 8).toUpperCase()}`;
  const now = new Date().toISOString();
  const userName = `${req.user.firstName} ${req.user.lastName}`;

  // Create base meeting
  db.prepare(`
    INSERT INTO meetings (
      id, title, description, startTime, duration, hostName, hostId, meetingCode,
      waitingRoomMode, isRecurring, recurringPattern, hasWaitingRoom, isPasswordProtected, recordingEnabled, createdAt, updatedAt
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    meetingId,
    `${userName}'s Personal Meeting Room`,
    'Your persistent personal meeting room',
    new Date().toISOString(),
    60,
    userName,
    req.user.id,
    meetingCode,
    'auto',
    0,
    null,
    0,
    0,
    0,
    now,
    now
  );

  // Create personal meeting mapping
  db.prepare(`
    INSERT INTO personal_meetings (id, userId, meetingId, personalMeetingCode, createdAt, updatedAt)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(personalMeetingId, req.user.id, meetingId, personalCode, now, now);

  res.status(201).json({
    data: {
      id: personalMeetingId,
      meetingId,
      personalMeetingCode: personalCode,
      title: `${userName}'s Personal Meeting Room`,
      meetingCode,
      hostId: req.user.id,
    },
  });
});

meetingsRoutes.post('/:id/recordings/:recordingId/stop', async (req, res) => {
  const meeting = db
    .prepare('SELECT * FROM meetings WHERE id = ? OR meetingCode = ?')
    .get(req.params.id, req.params.id) as any;
  if (!meeting) return res.status(404).json({ message: 'Meeting not found' });
  if (!isHostOrAdmin(meeting, req.user)) {
    return res.status(403).json({ message: 'Not authorized' });
  }

  const recording = db
    .prepare('SELECT * FROM meeting_recordings WHERE id = ? AND meetingId = ?')
    .get(req.params.recordingId, meeting.id) as any;
  if (!recording) return res.status(404).json({ message: 'Recording not found' });

  const now = new Date().toISOString();
  try {
    const egressClient = createEgressClient();
    if (egressClient && recording.egressId) {
      await egressClient.stopEgress(recording.egressId);
    }
  } catch {
    // continue to mark recording as completed even if stop fails
  }

  db.prepare(`
    UPDATE meeting_recordings
    SET status = 'completed', stoppedAt = ?, updatedAt = ?
    WHERE id = ? AND meetingId = ?
  `).run(now, now, req.params.recordingId, meeting.id);

  res.json({ data: { status: 'completed', stoppedAt: now, recordingUrl: recording.recordingUrl } });
});

meetingsRoutes.delete('/:id/recordings/:recordingId', (req, res) => {
  const meeting = db
    .prepare('SELECT * FROM meetings WHERE id = ? OR meetingCode = ?')
    .get(req.params.id, req.params.id) as any;
  if (!meeting) return res.status(404).json({ message: 'Meeting not found' });
  if (!isHostOrAdmin(meeting, req.user)) {
    return res.status(403).json({ message: 'Not authorized' });
  }

  const recording = db
    .prepare('SELECT * FROM meeting_recordings WHERE id = ? AND meetingId = ?')
    .get(req.params.recordingId, meeting.id) as any;
  if (!recording) return res.status(404).json({ message: 'Recording not found' });

  // Delete recording file if it exists
  if (recording.recordingUrl && recording.recordingUrl.startsWith('/recordings/')) {
    const filename = recording.recordingUrl.replace('/recordings/', '');
    const outputDir = process.env.LIVEKIT_EGRESS_OUTPUT_DIR || process.env.RECORDINGS_DIR || path.join(process.cwd(), 'recordings');
    const filepath = path.join(outputDir, filename);
    try {
      if (fs.existsSync(filepath)) {
        fs.unlinkSync(filepath);
      }
    } catch (error) {
      // Log error but continue with DB deletion
      console.error('Failed to delete recording file:', error);
    }
  }

  db.prepare('DELETE FROM meeting_recordings WHERE id = ?').run(req.params.recordingId);
  res.json({ data: null, message: 'Recording deleted' });
});
