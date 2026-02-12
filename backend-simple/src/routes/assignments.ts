import { Router, Request, Response } from 'express';
import { randomUUID } from 'crypto';
import { db } from '../database.js';

export const assignmentsRoutes = Router();

// Get all assignments
assignmentsRoutes.get('/', async (req: Request, res: Response) => {
  try {
    const courseId = req.query.courseId as string;

    let query = 'SELECT * FROM assignments';
    let params: any[] = [];

    if (courseId) {
      query += ' WHERE "courseId" = $1';
      params.push(courseId);
    }

    query += ' ORDER BY "dueDate" ASC';

    const result = await db.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching assignments:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get single assignment
assignmentsRoutes.get('/:id', async (req: Request, res: Response) => {
  try {
    const result = await db.query('SELECT * FROM assignments WHERE id = $1', [req.params.id]);
    const assignment = result.rows[0];
    if (!assignment) {
      return res.status(404).json({ message: 'Assignment not found' });
    }
    res.json(assignment);
  } catch (error) {
    console.error('Error fetching assignment:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Create assignment
assignmentsRoutes.post('/', async (req: Request, res: Response) => {
  try {
    const { courseId, title, description, dueDate } = req.body;

    if (!courseId || !title || !dueDate) {
      return res.status(400).json({ message: 'courseId, title, and dueDate required' });
    }

    const courseResult = await db.query('SELECT * FROM courses WHERE id = $1', [courseId]);
    const course = courseResult.rows[0];

    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    if (course.lecturerId !== req.user?.id && req.user?.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const id = randomUUID();
    const now = new Date().toISOString();

    await db.query(`
      INSERT INTO assignments (id, "courseId", title, description, "dueDate", "createdAt", "updatedAt")
      VALUES ($1, $2, $3, $4, $5, $6, $7)
    `, [id, courseId, title, description, dueDate, now, now]);

    res.json({
      id,
      courseId,
      title,
      description,
      dueDate,
      createdAt: now,
      updatedAt: now,
    });
  } catch (error) {
    console.error('Error creating assignment:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Update assignment
assignmentsRoutes.put('/:id', async (req: Request, res: Response) => {
  try {
    const assignResult = await db.query('SELECT * FROM assignments WHERE id = $1', [req.params.id]);
    const assignment = assignResult.rows[0];

    if (!assignment) {
      return res.status(404).json({ message: 'Assignment not found' });
    }

    const courseResult = await db.query('SELECT * FROM courses WHERE id = $1', [assignment.courseId]);
    const course = courseResult.rows[0];

    if (course.lecturerId !== req.user?.id && req.user?.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const { title, description, dueDate } = req.body;
    const now = new Date().toISOString();

    await db.query(`
      UPDATE assignments SET title = $1, description = $2, "dueDate" = $3, "updatedAt" = $4 WHERE id = $5
    `, [title || assignment.title, description || assignment.description, dueDate || assignment.dueDate, now, req.params.id]);

    res.json({ message: 'Assignment updated' });
  } catch (error) {
    console.error('Error updating assignment:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Delete assignment
assignmentsRoutes.delete('/:id', async (req: Request, res: Response) => {
  try {
    const assignResult = await db.query('SELECT * FROM assignments WHERE id = $1', [req.params.id]);
    const assignment = assignResult.rows[0];

    if (!assignment) {
      return res.status(404).json({ message: 'Assignment not found' });
    }

    const courseResult = await db.query('SELECT * FROM courses WHERE id = $1', [assignment.courseId]);
    const course = courseResult.rows[0];

    if (course.lecturerId !== req.user?.id && req.user?.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }

    await db.query('DELETE FROM assignments WHERE id = $1', [req.params.id]);
    res.json({ message: 'Assignment deleted' });
  } catch (error) {
    console.error('Error deleting assignment:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Submit assignment
assignmentsRoutes.post('/:id/submit', async (req: Request, res: Response) => {
  try {
    const { content } = req.body;

    const assignResult = await db.query('SELECT * FROM assignments WHERE id = $1', [req.params.id]);
    const assignment = assignResult.rows[0];

    if (!assignment) {
      return res.status(404).json({ message: 'Assignment not found' });
    }

    const existResult = await db.query('SELECT * FROM submissions WHERE "assignmentId" = $1 AND "studentId" = $2', [req.params.id, req.user?.id]);
    const existing = existResult.rows[0];

    const id = existing ? existing.id : randomUUID();
    const now = new Date().toISOString();

    if (existing) {
      await db.query('UPDATE submissions SET content = $1, "submittedAt" = $2, "updatedAt" = $3 WHERE id = $4', [content, now, now, id]);
    } else {
      await db.query(`
        INSERT INTO submissions (id, "assignmentId", "studentId", content, "submittedAt", "createdAt", "updatedAt")
        VALUES ($1, $2, $3, $4, $5, $6, $7)
      `, [id, req.params.id, req.user?.id, content, now, now, now]);
    }

    res.json({ message: 'Assignment submitted successfully', submissionId: id });
  } catch (error) {
    console.error('Error submitting assignment:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Grade submission
assignmentsRoutes.post('/:id/submissions/:submissionId/grade', async (req: Request, res: Response) => {
  try {
    const { grade, feedback } = req.body;

    const subResult = await db.query('SELECT * FROM submissions WHERE id = $1', [req.params.submissionId]);
    const submission = subResult.rows[0];

    if (!submission) {
      return res.status(404).json({ message: 'Submission not found' });
    }

    const assignResult = await db.query('SELECT * FROM assignments WHERE id = $1', [req.params.id]);
    const assignment = assignResult.rows[0];

    const courseResult = await db.query('SELECT * FROM courses WHERE id = $1', [assignment.courseId]);
    const course = courseResult.rows[0];

    if (course.lecturerId !== req.user?.id && req.user?.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const now = new Date().toISOString();
    await db.query('UPDATE submissions SET grade = $1, feedback = $2, "updatedAt" = $3 WHERE id = $4', [grade, feedback, now, req.params.submissionId]);

    res.json({ message: 'Submission graded successfully' });
  } catch (error) {
    console.error('Error grading submission:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});
