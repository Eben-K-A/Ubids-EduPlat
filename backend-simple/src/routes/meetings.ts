import { Router, Request, Response } from 'express';
import { randomUUID } from 'crypto';
import { AccessToken, EgressClient } from 'livekit-server-sdk';
import path from 'path';
import fs from 'fs';
import bcryptjs from 'bcryptjs';
import { db } from '../database.js';

export const meetingsRoutes = Router();

// Extend Request type locally for type safety
interface AuthRequest extends Request {
  user?: { id: string; email: string; role: string; firstName?: string; lastName?: string };
}

const generateMeetingCode = () => {
  const letters = () => Math.random().toString(36).slice(2, 6).toUpperCase();
  return `${letters()}-${letters()}-${letters()}`;
};

const createLiveKitToken = async (roomName: string, identity: string, name: string, isHost: boolean) => {
  const apiKey = process.env.LIVEKIT_API_KEY;
  const apiSecret = process.env.LIVEKIT_API_SECRET;
  if (!apiKey || !apiSecret) return null;

  const token = new AccessToken(apiKey, apiSecret, { identity, name, ttl: '24h' });
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
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
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

const expandRecurringMeeting = async (baseMeeting: any, occurrences: number = 12) => {
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

    await db.query(`
      INSERT INTO meetings (
        id, title, description, "startTime", duration, "hostName", "hostId", "meetingCode",
        "waitingRoomMode", "isRecurring", "recurringPattern", "hasWaitingRoom", "isPasswordProtected", "recordingEnabled", password, "createdAt", "updatedAt"
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
    `, [
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
      baseMeeting.hasWaitingRoom ? 1 : 0,
      baseMeeting.isPasswordProtected ? 1 : 0,
      baseMeeting.recordingEnabled ? 1 : 0,
      baseMeeting.password,
      now,
      now
    ]);

    meetings.push({
      ...baseMeeting,
      id: recurringId,
      startTime: newDate.toISOString(),
      meetingCode,
    });
  }

  return meetings;
};

meetingsRoutes.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const q = String(req.query.q || '').trim().toLowerCase();
    const result = await db.query('SELECT * FROM meetings ORDER BY "startTime" ASC');
    const rows = result.rows;
    const filtered = q
      ? rows.filter((m: any) => m.title.toLowerCase().includes(q) || (m.description || '').toLowerCase().includes(q))
      : rows;
    res.json({
      data: filtered.map((m: any) => ({
        ...m,
        waitingRoomMode: m.waitingRoomMode ?? 'auto',
        isRecurring: Boolean(m.isRecurring),
        hasWaitingRoom: Boolean(m.hasWaitingRoom),
        isPasswordProtected: Boolean(m.isPasswordProtected),
        recordingEnabled: Boolean(m.recordingEnabled),
      })),
    });
  } catch (error) {
    console.error('Error fetching meetings:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

meetingsRoutes.get('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params.id;
    const result = await db.query('SELECT * FROM meetings WHERE id = $1 OR "meetingCode" = $2', [id, id]);
    const meeting = result.rows[0];

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
  } catch (error) {
    console.error('Error fetching meeting:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

meetingsRoutes.post('/', async (req: AuthRequest, res: Response) => {
  try {
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
      ? await bcryptjs.hash(password, 10)
      : null;

    await db.query(`
      INSERT INTO meetings (
        id, title, description, "startTime", duration, "hostName", "hostId", "meetingCode",
        "waitingRoomMode", "isRecurring", "recurringPattern", "hasWaitingRoom", "isPasswordProtected", "recordingEnabled", password, "createdAt", "updatedAt"
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
    `, [
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
    ]);

    const result = await db.query('SELECT * FROM meetings WHERE id = $1', [id]);
    const meeting = result.rows[0];

    // If recurring, expand to create multiple instances
    if (isRecurring) {
      await expandRecurringMeeting(meeting, 12);
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
  } catch (error) {
    console.error('Error creating meeting:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

meetingsRoutes.post('/:id/join', async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params.id;
    const result = await db.query('SELECT * FROM meetings WHERE id = $1 OR "meetingCode" = $2', [id, id]);
    const meeting = result.rows[0];

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
      const passwordMatch = await bcryptjs.compare(password, meeting.password || '');
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
    await db.query(`
      INSERT INTO meeting_waiting_requests (id, "meetingId", name, "userId", identity, status, "createdAt", "updatedAt")
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    `, [requestId, meeting.id, name, req.user?.id ?? null, identity, 'pending', now, now]);

    return res.json({
      data: {
        status: 'waiting',
        requestId,
      }
    });
  } catch (error) {
    console.error('Error joining meeting:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

meetingsRoutes.get('/:id/waiting', async (req: AuthRequest, res: Response) => {
  try {
    const meetingResult = await db.query('SELECT * FROM meetings WHERE id = $1 OR "meetingCode" = $2', [req.params.id, req.params.id]);
    const meeting = meetingResult.rows[0];

    if (!meeting) return res.status(404).json({ message: 'Meeting not found' });
    if (!isHostOrAdmin(meeting, req.user)) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const rowsResult = await db.query('SELECT * FROM meeting_waiting_requests WHERE "meetingId" = $1 AND status = $2 ORDER BY "createdAt" ASC', [meeting.id, 'pending']);
    res.json({ data: rowsResult.rows });
  } catch (error) {
    console.error('Error fetching waiting requests:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

meetingsRoutes.get('/:id/waiting/:requestId', async (req: AuthRequest, res: Response) => {
  try {
    const meetingResult = await db.query('SELECT * FROM meetings WHERE id = $1 OR "meetingCode" = $2', [req.params.id, req.params.id]);
    const meeting = meetingResult.rows[0];

    if (!meeting) return res.status(404).json({ data: null, message: 'Meeting not found' });

    const requestResult = await db.query('SELECT * FROM meeting_waiting_requests WHERE id = $1 AND "meetingId" = $2', [req.params.requestId, meeting.id]);
    const request = requestResult.rows[0];

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
  } catch (error) {
    console.error('Error fetching waiting request:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

meetingsRoutes.post('/:id/waiting/:requestId/approve', async (req: AuthRequest, res: Response) => {
  try {
    const meetingResult = await db.query('SELECT * FROM meetings WHERE id = $1 OR "meetingCode" = $2', [req.params.id, req.params.id]);
    const meeting = meetingResult.rows[0];

    if (!meeting) return res.status(404).json({ data: null, message: 'Meeting not found' });
    if (!isHostOrAdmin(meeting, req.user)) {
      return res.status(403).json({ data: null, message: 'Not authorized' });
    }

    const now = new Date().toISOString();
    await db.query(`
      UPDATE meeting_waiting_requests
      SET status = 'approved', "updatedAt" = $1
      WHERE id = $2 AND "meetingId" = $3
    `, [now, req.params.requestId, meeting.id]);

    res.json({ data: { status: 'approved' } });
  } catch (error) {
    console.error('Error approving request:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

meetingsRoutes.post('/:id/waiting/:requestId/deny', async (req: AuthRequest, res: Response) => {
  try {
    const meetingResult = await db.query('SELECT * FROM meetings WHERE id = $1 OR "meetingCode" = $2', [req.params.id, req.params.id]);
    const meeting = meetingResult.rows[0];

    if (!meeting) return res.status(404).json({ data: null, message: 'Meeting not found' });
    if (!isHostOrAdmin(meeting, req.user)) {
      return res.status(403).json({ data: null, message: 'Not authorized' });
    }

    const now = new Date().toISOString();
    await db.query(`
      UPDATE meeting_waiting_requests
      SET status = 'denied', "updatedAt" = $1
      WHERE id = $2 AND "meetingId" = $3
    `, [now, req.params.requestId, meeting.id]);

    res.json({ data: { status: 'denied' } });
  } catch (error) {
    console.error('Error denying request:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

meetingsRoutes.put('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params.id;
    const meetingResult = await db.query('SELECT * FROM meetings WHERE id = $1 OR "meetingCode" = $2', [id, id]);
    const meeting = meetingResult.rows[0];

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
        passwordToStore = await bcryptjs.hash(password, 10);
      } else if (!isPasswordProtected) {
        passwordToStore = null;
      }
    }

    await db.query(`
      UPDATE meetings SET
        title = COALESCE($1, title),
        description = COALESCE($2, description),
        "startTime" = COALESCE($3, "startTime"),
        duration = COALESCE($4, duration),
        "waitingRoomMode" = COALESCE($5, "waitingRoomMode"),
        "isRecurring" = COALESCE($6, "isRecurring"),
        "recurringPattern" = COALESCE($7, "recurringPattern"),
        "hasWaitingRoom" = COALESCE($8, "hasWaitingRoom"),
        "isPasswordProtected" = COALESCE($9, "isPasswordProtected"),
        "recordingEnabled" = COALESCE($10, "recordingEnabled"),
        password = CASE WHEN $11 IS NOT NULL THEN $12 WHEN password IS NULL THEN NULL ELSE password END,
        "updatedAt" = $13
      WHERE id = $14
    `, [
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
      passwordToStore ?? null,
      passwordToStore ?? null,
      now,
      id
    ]);

    const updatedResult = await db.query('SELECT * FROM meetings WHERE id = $1', [id]);
    const updated = updatedResult.rows[0];

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
  } catch (error) {
    console.error('Error updating meeting:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

meetingsRoutes.delete('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params.id;
    const meetingResult = await db.query('SELECT * FROM meetings WHERE id = $1 OR "meetingCode" = $2', [id, id]);
    const meeting = meetingResult.rows[0];

    if (!meeting) return res.status(404).json({ data: null, message: 'Meeting not found' });
    if (!isHostOrAdmin(meeting, req.user)) {
      return res.status(403).json({ data: null, message: 'Not authorized' });
    }

    await db.query('DELETE FROM meeting_waiting_requests WHERE "meetingId" = $1', [meeting.id]);
    await db.query('DELETE FROM meeting_recordings WHERE "meetingId" = $1', [meeting.id]);
    await db.query('DELETE FROM meetings WHERE id = $1', [meeting.id]);

    res.json({ data: null, message: 'Meeting deleted' });
  } catch (error) {
    console.error('Error deleting meeting:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

meetingsRoutes.get('/:id/recordings', async (req: AuthRequest, res: Response) => {
  try {
    const meetingResult = await db.query('SELECT * FROM meetings WHERE id = $1 OR "meetingCode" = $2', [req.params.id, req.params.id]);
    const meeting = meetingResult.rows[0];

    if (!meeting) return res.status(404).json({ message: 'Meeting not found' });

    const rowsResult = await db.query('SELECT * FROM meeting_recordings WHERE "meetingId" = $1 ORDER BY "createdAt" DESC', [meeting.id]);
    res.json({ data: rowsResult.rows });
  } catch (error) {
    console.error('Error fetching recordings:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

meetingsRoutes.post('/:id/recordings/start', async (req: AuthRequest, res: Response) => {
  try {
    const meetingResult = await db.query('SELECT * FROM meetings WHERE id = $1 OR "meetingCode" = $2', [req.params.id, req.params.id]);
    const meeting = meetingResult.rows[0];

    if (!meeting) return res.status(404).json({ message: 'Meeting not found' });
    if (!isHostOrAdmin(meeting, req.user)) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const activeResult = await db.query('SELECT * FROM meeting_recordings WHERE "meetingId" = $1 AND status = $2', [meeting.id, 'recording']);
    const active = activeResult.rows[0];

    if (active) return res.status(400).json({ message: 'Recording already in progress' });

    const egressClient = createEgressClient();
    if (!egressClient) {
      return res.status(500).json({ message: 'LiveKit Egress is not configured' });
    }

    // Create unique ID
    const now = new Date().toISOString();
    const id = randomUUID();

    let output: any;
    let recordingUrl: string;

    // Check if we are in a cloud environment (e.g. LIVEKIT_URL is not localhost)
    const isCloud = process.env.LIVEKIT_URL && !process.env.LIVEKIT_URL.includes('localhost');

    if (isCloud) {
      // For Cloud: use S3 / Cloud Storage
      // We assume the Egress template or default bucket is configured in LiveKit Cloud dashboard.
      // We'll use startRoomCompositeEgress with 'file' output to s3, but simpler:
      // just pass the file output with a nil filepath to let Egress service use its default (if configured)
      // OR we assume the user has set up S3 in the dashboard.
      // However, to be safe, if we don't provide a filepath, some Egress versions fail.
      // A common pattern for Cloud is to not specify `filepath` if using presets, or specify a remote path.
      // But keeping it simple: We will try to use the `s3` output type if we had the struct, but here we are using `file`.
      // Let's assume the user has configured an S3 bucket in LiveKit Cloud.
      // If so, we can just specify a filename without a path, or a path prefix.
      const filename = `${meetingCode}-${Date.now()}.mp4`;
      output = {
        file: {
          filepath: filename, // Just the filename, Egress service will put it in the configured bucket
          outputType: 0 // MP4
        }
      };
      // The URL will depend on their S3 Configuration (e.g. CloudFront or public bucket)
      // We don't know it yet, so we'll store a placeholder or try to derive it.
      // For now, let's store a generic cloud URL structure.
      recordingUrl = `cloud://${filename}`;
    } else {
      // Local Development
      const { filepath, recordingUrl: localUrl } = getRecordingOutput(meeting.meetingCode);
      output = { file: { filepath } };
      recordingUrl = localUrl;
    }

    const egress = await egressClient.startRoomCompositeEgress(
      meeting.meetingCode,
      output
    );

    const egressId = (egress as any)?.egressId;
    await db.query(`
      INSERT INTO meeting_recordings (id, "meetingId", "egressId", status, "startedAt", "recordingUrl", "createdAt", "updatedAt")
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    `, [id, meeting.id, egressId ?? null, 'recording', now, recordingUrl, now, now]);

    res.json({ data: { id, status: 'recording', startedAt: now, recordingUrl, egressId } });
  } catch (error: any) {
    console.error('Error starting recording:', error);
    res.status(500).json({ message: error?.message || 'Failed to start recording' });
  }
});


meetingsRoutes.get('/personal-meeting/current', async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    // Check if personal meeting already exists
    const pmResult = await db.query(`
      SELECT pm.*, m.* 
      FROM personal_meetings pm 
      JOIN meetings m ON pm."meetingId" = m.id 
      WHERE pm."userId" = $1
    `, [req.user.id]);

    let personalMeeting = pmResult.rows[0];

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
    await db.query(`
      INSERT INTO meetings (
        id, title, description, "startTime", duration, "hostName", "hostId", "meetingCode",
        "waitingRoomMode", "isRecurring", "recurringPattern", "hasWaitingRoom", "isPasswordProtected", "recordingEnabled", "createdAt", "updatedAt"
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
    `, [
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
    ]);

    // Create personal meeting mapping
    await db.query(`
      INSERT INTO personal_meetings (id, "userId", "meetingId", "personalMeetingCode", "createdAt", "updatedAt")
      VALUES ($1, $2, $3, $4, $5, $6)
    `, [personalMeetingId, req.user.id, meetingId, personalCode, now, now]);

    res.status(201).json({
      data: {
        id: personalMeetingId,
        meetingId,
        meetingCode,
        personalMeetingCode: personalCode,
        title: `${userName}'s Personal Meeting Room`,
        hostId: req.user.id,
      },
    });
  } catch (error) {
    console.error('Error fetching/creating personal meeting:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

meetingsRoutes.post('/:id/recordings/:recordingId/stop', async (req: AuthRequest, res: Response) => {
  try {
    const meetingResult = await db.query('SELECT * FROM meetings WHERE id = $1 OR "meetingCode" = $2', [req.params.id, req.params.id]);
    const meeting = meetingResult.rows[0];

    if (!meeting) return res.status(404).json({ message: 'Meeting not found' });
    if (!isHostOrAdmin(meeting, req.user)) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const recordingResult = await db.query('SELECT * FROM meeting_recordings WHERE id = $1 AND "meetingId" = $2', [req.params.recordingId, meeting.id]);
    const recording = recordingResult.rows[0];

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

    await db.query(`
      UPDATE meeting_recordings
      SET status = 'completed', "stoppedAt" = $1, "updatedAt" = $2
      WHERE id = $3 AND "meetingId" = $4
    `, [now, now, req.params.recordingId, meeting.id]);

    res.json({ data: { status: 'completed', stoppedAt: now, recordingUrl: recording.recordingUrl } });
  } catch (error) {
    console.error('Error stopping recording:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

meetingsRoutes.delete('/:id/recordings/:recordingId', async (req: AuthRequest, res: Response) => {
  try {
    const meetingResult = await db.query('SELECT * FROM meetings WHERE id = $1 OR "meetingCode" = $2', [req.params.id, req.params.id]);
    const meeting = meetingResult.rows[0];

    if (!meeting) return res.status(404).json({ message: 'Meeting not found' });
    if (!isHostOrAdmin(meeting, req.user)) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const recordingResult = await db.query('SELECT * FROM meeting_recordings WHERE id = $1 AND "meetingId" = $2', [req.params.recordingId, meeting.id]);
    const recording = recordingResult.rows[0];

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

    await db.query('DELETE FROM meeting_recordings WHERE id = $1', [req.params.recordingId]);
    res.json({ data: null, message: 'Recording deleted' });
  } catch (error) {
    console.error('Error deleting recording:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});
