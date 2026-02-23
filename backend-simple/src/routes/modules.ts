import { Router, Request, Response } from 'express';
import { randomUUID } from 'crypto';
import { db } from '../database.js';

export const modulesRoutes = Router();

// Get modules (optionally by course) with embedded lessons
modulesRoutes.get('/', async (req: Request, res: Response) => {
  try {
    const courseId = req.query.courseId as string | undefined;

    let modulesQuery = 'SELECT * FROM modules';
    const params: any[] = [];
    if (courseId) {
      modulesQuery += ' WHERE courseid = $1';
      params.push(courseId);
    }
    modulesQuery += ' ORDER BY courseid, orderindex ASC';

    const modulesResult = await db.query(modulesQuery, params);
    const modules = modulesResult.rows;

    if (modules.length === 0) {
      return res.json([]);
    }

    const moduleIds = modules.map((m: any) => m.id);
    const placeholders = moduleIds.map((_, i) => `$${i + 1}`).join(',');

    const lessonsResult = await db.query(
      `SELECT * FROM lessons WHERE moduleid IN (${placeholders}) ORDER BY orderindex ASC`,
      moduleIds
    );
    const lessons = lessonsResult.rows;

    const lessonsByModule = new Map<string, any[]>();
    lessons.forEach((lesson: any) => {
      const mid = lesson.moduleid ?? lesson.moduleId;
      const list = lessonsByModule.get(mid) ?? [];
      list.push(lesson);
      lessonsByModule.set(mid, list);
    });

    const result = modules.map((m: any) => ({
      id: m.id,
      courseId: m.courseid ?? m.courseId,
      title: m.title,
      description: m.description,
      orderIndex: m.orderindex ?? m.orderIndex,
      createdAt: m.createdat ?? m.createdAt,
      updatedAt: m.updatedat ?? m.updatedAt,
      order: m.orderindex ?? m.orderIndex ?? m.order,
      lessons: (lessonsByModule.get(m.id) ?? []).map((l: any) => ({
        id: l.id,
        moduleId: l.moduleid ?? l.moduleId,
        title: l.title,
        content: l.content,
        type: l.type,
        duration: l.duration,
        orderIndex: l.orderindex ?? l.orderIndex,
        order: l.orderindex ?? l.orderIndex ?? l.order,
        resourceUrl: l.resourceurl ?? l.resourceUrl,
        createdAt: l.createdat ?? l.createdAt,
        updatedAt: l.updatedat ?? l.updatedAt,
      })),
    }));

    res.json(result);
  } catch (error) {
    console.error('Error fetching modules:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Create module
modulesRoutes.post('/', async (req: Request, res: Response) => {
  try {
    const { courseId, title, description, order } = req.body || {};

    if (!courseId || !title) {
      return res.status(400).json({ message: 'courseId and title are required' });
    }

    const courseResult = await db.query('SELECT * FROM courses WHERE id = $1', [courseId]);
    const course = courseResult.rows[0];

    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    const now = new Date().toISOString();
    const id = randomUUID();
    const orderIndex = typeof order === 'number' ? order : 1;

    await db.query(
      `INSERT INTO modules (id, courseId, title, description, orderIndex, createdAt, updatedAt)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [id, courseId, title, description ?? null, orderIndex, now, now]
    );

    res.status(201).json({
      id,
      courseId,
      title,
      description: description ?? null,
      order: orderIndex,
      createdAt: now,
      updatedAt: now,
      lessons: [],
    });
  } catch (error) {
    console.error('Error creating module:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Update module
modulesRoutes.put('/:id', async (req: Request, res: Response) => {
  try {
    const moduleResult = await db.query('SELECT * FROM modules WHERE id = $1', [req.params.id]);
    const moduleRow = moduleResult.rows[0];

    if (!moduleRow) {
      return res.status(404).json({ message: 'Module not found' });
    }

    const { title, description, order } = req.body || {};
    const now = new Date().toISOString();

    await db.query(
      `UPDATE modules
       SET title = COALESCE($1, title),
           description = COALESCE($2, description),
           orderindex = COALESCE($3, orderindex),
           updatedat = $4
       WHERE id = $5`,
      [
        title ?? null,
        description ?? null,
        typeof order === 'number' ? order : null,
        now,
        req.params.id
      ]
    );

    const updatedResult = await db.query('SELECT * FROM modules WHERE id = $1', [req.params.id]);
    const updated = updatedResult.rows[0];

    res.json({
      ...updated,
      order: updated.orderindex ?? updated.orderIndex,
    });
  } catch (error) {
    console.error('Error updating module:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Delete module (and its lessons)
modulesRoutes.delete('/:id', async (req: Request, res: Response) => {
  try {
    await db.query('DELETE FROM lessons WHERE moduleid = $1', [req.params.id]);
    await db.query('DELETE FROM modules WHERE id = $1', [req.params.id]);
    res.json({ message: 'Module deleted' });
  } catch (error) {
    console.error('Error deleting module:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Add lesson to module
modulesRoutes.post('/:moduleId/lessons', async (req: Request, res: Response) => {
  try {
    const moduleResult = await db.query('SELECT * FROM modules WHERE id = $1', [req.params.moduleId]);
    const moduleRow = moduleResult.rows[0];

    if (!moduleRow) {
      return res.status(404).json({ message: 'Module not found' });
    }

    const { title, content, type, duration, order, resourceUrl } = req.body || {};
    if (!title || !type) {
      return res.status(400).json({ message: 'title and type are required' });
    }

    const now = new Date().toISOString();
    const id = randomUUID();
    const orderIndex = typeof order === 'number' ? order : 1;

    await db.query(
      `INSERT INTO lessons (id, moduleId, title, content, type, duration, orderIndex, resourceUrl, createdAt, updatedAt)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      [
        id,
        req.params.moduleId,
        title,
        content ?? null,
        type,
        duration ?? null,
        orderIndex,
        resourceUrl ?? null,
        now,
        now
      ]
    );

    res.status(201).json({
      id,
      moduleId: req.params.moduleId,
      title,
      content: content ?? null,
      type,
      duration: duration ?? null,
      order: orderIndex,
      resourceUrl: resourceUrl ?? null,
      createdAt: now,
      updatedAt: now,
    });
  } catch (error) {
    console.error('Error adding lesson:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Update lesson
modulesRoutes.put('/:moduleId/lessons/:lessonId', async (req: Request, res: Response) => {
  try {
    const lessonResult = await db.query('SELECT * FROM lessons WHERE id = $1 AND moduleid = $2', [req.params.lessonId, req.params.moduleId]);
    const lesson = lessonResult.rows[0];

    if (!lesson) {
      return res.status(404).json({ message: 'Lesson not found' });
    }

    const { title, content, type, duration, order, resourceUrl } = req.body || {};
    const now = new Date().toISOString();

    await db.query(
      `UPDATE lessons
       SET title = COALESCE($1, title),
           content = COALESCE($2, content),
           type = COALESCE($3, type),
           duration = COALESCE($4, duration),
           orderindex = COALESCE($5, orderindex),
           resourceurl = COALESCE($6, resourceurl),
           updatedat = $7
       WHERE id = $8 AND moduleid = $9`,
      [
        title ?? null,
        content ?? null,
        type ?? null,
        duration ?? null,
        typeof order === 'number' ? order : null,
        resourceUrl ?? null,
        now,
        req.params.lessonId,
        req.params.moduleId
      ]
    );

    const updatedResult = await db.query('SELECT * FROM lessons WHERE id = $1 AND moduleid = $2', [req.params.lessonId, req.params.moduleId]);
    const updated = updatedResult.rows[0];

    res.json({
      ...updated,
      order: updated.orderindex ?? updated.orderIndex,
    });
  } catch (error) {
    console.error('Error updating lesson:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Delete lesson
modulesRoutes.delete('/:moduleId/lessons/:lessonId', async (req: Request, res: Response) => {
  try {
    await db.query('DELETE FROM lessons WHERE id = $1 AND moduleid = $2', [req.params.lessonId, req.params.moduleId]);
    res.json({ message: 'Lesson deleted' });
  } catch (error) {
    console.error('Error deleting lesson:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});


