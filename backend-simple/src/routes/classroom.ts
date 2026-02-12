import { Router, Request, Response } from 'express';
import { randomUUID } from 'crypto';
import { db } from '../database.js';

export const classroomRoutes = Router();

function requireUser(req: Request, res: Response): boolean {
  if (!req.user) {
    res.status(401).json({ message: 'Unauthorized' });
    return false;
  }
  return true;
}

function nowIso() {
  return new Date().toISOString();
}

function generateCode(): string {
  const chars = 'abcdefghjkmnpqrstuvwxyz23456789';
  let code = '';
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

// Fetch all classroom data (optionally scoped to a course)
classroomRoutes.get('/state', async (req: Request, res: Response) => {
  if (!requireUser(req, res)) return;

  const courseId = (req.query.courseId as string | undefined) || undefined;
  const params: any[] = [];
  const filter = courseId ? ' WHERE courseId = $1' : '';
  if (courseId) params.push(courseId);

  try {
    const announcementsResult = await db.query(
      `SELECT * FROM announcements${filter} ORDER BY isPinned DESC, createdAt DESC`,
      params
    );
    const announcements = announcementsResult.rows;

    const announcementIds = announcements.map((a: any) => a.id);
    let comments: any[] = [];

    if (announcementIds.length > 0) {
      // Postgres ANY operator is useful here
      const commentsResult = await db.query(
        `SELECT * FROM announcement_comments WHERE announcementId = ANY($1) ORDER BY createdAt ASC`,
        [announcementIds]
      );
      comments = commentsResult.rows;
    }

    const materialsResult = await db.query(
      `SELECT * FROM class_materials${filter} ORDER BY createdAt DESC`,
      params
    );
    const materials = materialsResult.rows;

    const topicsResult = await db.query(
      `SELECT * FROM class_topics${filter} ORDER BY orderIndex ASC`,
      params
    );
    const topics = topicsResult.rows;

    const rubricsResult = await db.query(
      `SELECT * FROM rubrics${filter} ORDER BY createdAt DESC`,
      params
    );
    const rubrics = rubricsResult.rows;

    const invitesResult = await db.query(
      `SELECT * FROM class_invites${filter} ORDER BY createdAt DESC`,
      params
    );
    const invites = invitesResult.rows;

    res.json({
      announcements: announcements.map((a: any) => ({
        ...a,
        attachments: typeof a.attachmentsJson === 'string' ? JSON.parse(a.attachmentsJson) : a.attachmentsJson || [],
        comments: comments
          .filter((c: any) => c.announcementId === a.id)
          .map((c: any) => ({
            id: c.id,
            authorId: c.authorId,
            authorName: c.authorName,
            authorRole: c.authorRole,
            content: c.content,
            createdAt: c.createdAt,
          })),
        isPinned: Boolean(a.isPinned),
      })),
      materials,
      topics: topics.map((t: any) => ({ ...t, order: t.orderIndex })),
      rubrics: rubrics.map((r: any) => ({ ...r, criteria: typeof r.criteriaJson === 'string' ? JSON.parse(r.criteriaJson) : r.criteriaJson })),
      invites: invites.map((i: any) => ({ ...i, isActive: Boolean(i.isActive) })),
    });
  } catch (error) {
    console.error('Error fetching classroom state:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Announcements
classroomRoutes.post('/announcements', async (req: Request, res: Response) => {
  if (!requireUser(req, res)) return;

  const { courseId, content, attachments } = req.body || {};
  if (!courseId || !String(content || '').trim()) {
    return res.status(400).json({ message: 'courseId and content are required' });
  }

  const id = randomUUID();
  const now = nowIso();
  const authorName = `${req.user!.firstName} ${req.user!.lastName}`;

  try {
    await db.query(
      `INSERT INTO announcements (id, courseId, authorId, authorName, authorRole, content, attachmentsJson, isPinned, createdAt, updatedAt)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      [
        id,
        courseId,
        req.user!.id,
        authorName,
        req.user!.role,
        content,
        JSON.stringify(Array.isArray(attachments) ? attachments : []),
        0,
        now,
        now
      ]
    );

    res.status(201).json({
      id,
      courseId,
      authorId: req.user!.id,
      authorName,
      authorRole: req.user!.role,
      content,
      attachments: Array.isArray(attachments) ? attachments : [],
      comments: [],
      isPinned: false,
      createdAt: now,
      updatedAt: now,
    });
  } catch (error) {
    console.error('Error creating announcement:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

classroomRoutes.delete('/announcements/:id', async (req: Request, res: Response) => {
  if (!requireUser(req, res)) return;

  try {
    const rowResult = await db.query('SELECT * FROM announcements WHERE id = $1', [req.params.id]);
    const row = rowResult.rows[0];

    if (!row) return res.status(404).json({ message: 'Announcement not found' });

    await db.query('DELETE FROM announcement_comments WHERE announcementId = $1', [req.params.id]);
    await db.query('DELETE FROM announcements WHERE id = $1', [req.params.id]);
    res.json({ message: 'Announcement deleted' });
  } catch (error) {
    console.error('Error deleting announcement:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

classroomRoutes.post('/announcements/:id/pin', async (req: Request, res: Response) => {
  if (!requireUser(req, res)) return;

  try {
    const rowResult = await db.query('SELECT * FROM announcements WHERE id = $1', [req.params.id]);
    const row = rowResult.rows[0];

    if (!row) return res.status(404).json({ message: 'Announcement not found' });

    const next = row.isPinned ? 0 : 1;
    const now = nowIso();
    await db.query('UPDATE announcements SET isPinned = $1, updatedAt = $2 WHERE id = $3', [next, now, req.params.id]);
    res.json({ id: req.params.id, isPinned: Boolean(next) });
  } catch (error) {
    console.error('Error pinnig announcement:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

classroomRoutes.post('/announcements/:id/comments', async (req: Request, res: Response) => {
  if (!requireUser(req, res)) return;

  try {
    const annResult = await db.query('SELECT * FROM announcements WHERE id = $1', [req.params.id]);
    const ann = annResult.rows[0];

    if (!ann) return res.status(404).json({ message: 'Announcement not found' });

    const { content } = req.body || {};
    if (!String(content || '').trim()) {
      return res.status(400).json({ message: 'content is required' });
    }

    const id = randomUUID();
    const now = nowIso();
    const authorName = `${req.user!.firstName} ${req.user!.lastName}`;

    await db.query(
      `INSERT INTO announcement_comments (id, announcementId, authorId, authorName, authorRole, content, createdAt)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [id, req.params.id, req.user!.id, authorName, req.user!.role, content, now]
    );

    await db.query('UPDATE announcements SET updatedAt = $1 WHERE id = $2', [now, req.params.id]);

    res.status(201).json({
      id,
      authorId: req.user!.id,
      authorName,
      authorRole: req.user!.role,
      content,
      createdAt: now,
    });
  } catch (error) {
    console.error('Error adding comment:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

classroomRoutes.delete('/announcements/:id/comments/:commentId', async (req: Request, res: Response) => {
  if (!requireUser(req, res)) return;

  try {
    await db.query('DELETE FROM announcement_comments WHERE id = $1 AND announcementId = $2', [
      req.params.commentId,
      req.params.id
    ]);
    res.json({ message: 'Comment deleted' });
  } catch (error) {
    console.error('Error deleting comment:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Materials
classroomRoutes.post('/materials', async (req: Request, res: Response) => {
  if (!requireUser(req, res)) return;

  const { courseId, topicId, title, description, type, url } = req.body || {};
  if (!courseId || !title || !type || !url) {
    return res.status(400).json({ message: 'courseId, title, type, url are required' });
  }

  const id = randomUUID();
  const now = nowIso();
  const createdByName = `${req.user!.firstName} ${req.user!.lastName}`;

  try {
    await db.query(
      `INSERT INTO class_materials (id, courseId, topicId, title, description, type, url, createdBy, createdByName, createdAt, updatedAt)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
      [
        id,
        courseId,
        topicId ?? null,
        title,
        description ?? null,
        type,
        url,
        req.user!.id,
        createdByName,
        now,
        now
      ]
    );

    res.status(201).json({
      id,
      courseId,
      topicId: topicId ?? undefined,
      title,
      description: description ?? undefined,
      type,
      url,
      createdBy: req.user!.id,
      createdByName,
      createdAt: now,
      updatedAt: now,
    });
  } catch (error) {
    console.error('Error creating material:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

classroomRoutes.delete('/materials/:id', async (req: Request, res: Response) => {
  if (!requireUser(req, res)) return;
  try {
    await db.query('DELETE FROM class_materials WHERE id = $1', [req.params.id]);
    res.json({ message: 'Material deleted' });
  } catch (error) {
    console.error('Error deleting material:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Topics
classroomRoutes.post('/topics', async (req: Request, res: Response) => {
  if (!requireUser(req, res)) return;

  const { courseId, name } = req.body || {};
  if (!courseId || !String(name || '').trim()) {
    return res.status(400).json({ message: 'courseId and name are required' });
  }

  try {
    const existingResult = await db.query('SELECT COUNT(*) as c FROM class_topics WHERE courseId = $1', [courseId]);
    const orderIndex = Number(existingResult.rows[0]?.c || 0) + 1;

    const id = randomUUID();
    const now = nowIso();
    await db.query(
      'INSERT INTO class_topics (id, courseId, name, orderIndex, createdAt) VALUES ($1, $2, $3, $4, $5)',
      [id, courseId, name, orderIndex, now]
    );

    res.status(201).json({ id, courseId, name, order: orderIndex, createdAt: now });
  } catch (error) {
    console.error('Error creating topic:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

classroomRoutes.delete('/topics/:id', async (req: Request, res: Response) => {
  if (!requireUser(req, res)) return;
  try {
    await db.query('DELETE FROM class_topics WHERE id = $1', [req.params.id]);
    res.json({ message: 'Topic deleted' });
  } catch (error) {
    console.error('Error deleting topic:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

classroomRoutes.post('/topics/reorder', async (req: Request, res: Response) => {
  if (!requireUser(req, res)) return;
  const { courseId, orderedIds } = req.body || {};
  if (!courseId || !Array.isArray(orderedIds)) {
    return res.status(400).json({ message: 'courseId and orderedIds are required' });
  }

  try {
    const client = await db.connect();
    try {
      await client.query('BEGIN');
      for (let i = 0; i < orderedIds.length; i++) {
        await client.query('UPDATE class_topics SET orderIndex = $1 WHERE id = $2 AND courseId = $3', [
          i + 1,
          orderedIds[i],
          courseId
        ]);
      }
      await client.query('COMMIT');
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
    res.json({ message: 'Topics reordered' });
  } catch (error) {
    console.error('Error reordering topics:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Rubrics
classroomRoutes.post('/rubrics', async (req: Request, res: Response) => {
  if (!requireUser(req, res)) return;

  const { courseId, title, criteria } = req.body || {};
  if (!courseId || !String(title || '').trim() || !Array.isArray(criteria)) {
    return res.status(400).json({ message: 'courseId, title, criteria are required' });
  }

  const id = randomUUID();
  const now = nowIso();

  try {
    await db.query(
      `INSERT INTO rubrics (id, courseId, title, criteriaJson, createdBy, createdAt, updatedAt)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [id, courseId, title, JSON.stringify(criteria), req.user!.id, now, now]
    );

    res.status(201).json({
      id,
      courseId,
      title,
      criteria,
      createdBy: req.user!.id,
      createdAt: now,
      updatedAt: now,
    });
  } catch (error) {
    console.error('Error creating rubric:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

classroomRoutes.put('/rubrics/:id', async (req: Request, res: Response) => {
  if (!requireUser(req, res)) return;

  try {
    const rowResult = await db.query('SELECT * FROM rubrics WHERE id = $1', [req.params.id]);
    const row = rowResult.rows[0];

    if (!row) return res.status(404).json({ message: 'Rubric not found' });

    const { title, criteria } = req.body || {};
    const now = nowIso();

    await db.query(
      `UPDATE rubrics
       SET title = COALESCE($1, title),
           criteriaJson = COALESCE($2, criteriaJson),
           updatedAt = $3
       WHERE id = $4`,
      [title ?? null, criteria ? JSON.stringify(criteria) : null, now, req.params.id]
    );

    const updatedResult = await db.query('SELECT * FROM rubrics WHERE id = $1', [req.params.id]);
    const updated = updatedResult.rows[0];

    res.json({ ...updated, criteria: JSON.parse(updated.criteriaJson) });
  } catch (error) {
    console.error('Error updating rubric:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

classroomRoutes.delete('/rubrics/:id', async (req: Request, res: Response) => {
  if (!requireUser(req, res)) return;
  try {
    await db.query('DELETE FROM rubrics WHERE id = $1', [req.params.id]);
    res.json({ message: 'Rubric deleted' });
  } catch (error) {
    console.error('Error deleting rubric:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Class codes / invites
classroomRoutes.post('/invites/generate', async (req: Request, res: Response) => {
  if (!requireUser(req, res)) return;
  const { courseId } = req.body || {};
  if (!courseId) return res.status(400).json({ message: 'courseId is required' });

  try {
    const existingResult = await db.query('SELECT * FROM class_invites WHERE courseId = $1', [courseId]);
    const existing = existingResult.rows[0];

    if (existing && existing.isActive) {
      return res.json({ courseId, code: existing.code, isActive: true, createdAt: existing.createdAt });
    }

    const code = generateCode();
    const now = nowIso();

    await db.query(
      `INSERT INTO class_invites (courseId, code, isActive, createdAt)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT(courseId) DO UPDATE SET code=excluded.code, isActive=excluded.isActive, createdAt=excluded.createdAt`,
      [courseId, code, 1, now]
    );

    res.json({ courseId, code, isActive: true, createdAt: now });
  } catch (error) {
    console.error('Error generating invite:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

classroomRoutes.post('/invites/disable', async (req: Request, res: Response) => {
  if (!requireUser(req, res)) return;
  const { courseId } = req.body || {};
  if (!courseId) return res.status(400).json({ message: 'courseId is required' });

  try {
    await db.query('UPDATE class_invites SET isActive = 0 WHERE courseId = $1', [courseId]);
    res.json({ message: 'Invite disabled' });
  } catch (error) {
    console.error('Error disabling invite:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

classroomRoutes.get('/invites/:courseId', async (req: Request, res: Response) => {
  if (!requireUser(req, res)) return;
  try {
    const rowResult = await db.query('SELECT * FROM class_invites WHERE courseId = $1', [req.params.courseId]);
    const row = rowResult.rows[0];

    if (!row || !row.isActive) return res.json(null);
    res.json({ courseId: row.courseId, code: row.code, isActive: true, createdAt: row.createdAt });
  } catch (error) {
    console.error('Error fetching invite:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Find course by code
classroomRoutes.get('/invites/find/:code', async (req: Request, res: Response) => {
  if (!requireUser(req, res)) return;
  const code = String(req.params.code || '').trim().toLowerCase();

  try {
    const rowResult = await db.query('SELECT * FROM class_invites WHERE LOWER(code) = $1 AND isActive = 1', [code]);
    const row = rowResult.rows[0];

    if (!row) return res.json(null);
    res.json({ courseId: row.courseId });
  } catch (error) {
    console.error('Error finding invite:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});
