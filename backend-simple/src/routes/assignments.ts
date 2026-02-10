import { Router, Request, Response } from 'express';
import { randomUUID } from 'crypto';
import { db } from '../database.js';

export const assignmentsRoutes = Router();

// Get all assignments
assignmentsRoutes.get('/', (req: Request, res: Response) => {
  const courseId = req.query.courseId as string;
  
  let query = 'SELECT * FROM assignments';
  let params: any[] = [];

  if (courseId) {
    query += ' WHERE courseId = ?';
    params.push(courseId);
  }

  query += ' ORDER BY dueDate ASC';
  
  const assignments = db.prepare(query).all(...params);
  res.json(assignments);
});

// Get single assignment
assignmentsRoutes.get('/:id', (req: Request, res: Response) => {
  const assignment = db.prepare('SELECT * FROM assignments WHERE id = ?').get(req.params.id);
  if (!assignment) {
    return res.status(404).json({ message: 'Assignment not found' });
  }
  res.json(assignment);
});

// Create assignment
assignmentsRoutes.post('/', (req: Request, res: Response) => {
  const { courseId, title, description, dueDate } = req.body;

  if (!courseId || !title || !dueDate) {
    return res.status(400).json({ message: 'courseId, title, and dueDate required' });
  }

  const course = db.prepare('SELECT * FROM courses WHERE id = ?').get(courseId) as any;
  
  if (!course) {
    return res.status(404).json({ message: 'Course not found' });
  }

  if (course.lecturerId !== req.user?.id && req.user?.role !== 'admin') {
    return res.status(403).json({ message: 'Not authorized' });
  }

  const id = randomUUID();
  const now = new Date().toISOString();

  db.prepare(`
    INSERT INTO assignments (id, courseId, title, description, dueDate, createdAt, updatedAt)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(id, courseId, title, description, dueDate, now, now);

  res.json({
    id,
    courseId,
    title,
    description,
    dueDate,
    createdAt: now,
    updatedAt: now,
  });
});

// Update assignment
assignmentsRoutes.put('/:id', (req: Request, res: Response) => {
  const assignment = db.prepare('SELECT * FROM assignments WHERE id = ?').get(req.params.id) as any;

  if (!assignment) {
    return res.status(404).json({ message: 'Assignment not found' });
  }

  const course = db.prepare('SELECT * FROM courses WHERE id = ?').get(assignment.courseId) as any;

  if (course.lecturerId !== req.user?.id && req.user?.role !== 'admin') {
    return res.status(403).json({ message: 'Not authorized' });
  }

  const { title, description, dueDate } = req.body;
  const now = new Date().toISOString();

  db.prepare(`
    UPDATE assignments SET title = ?, description = ?, dueDate = ?, updatedAt = ? WHERE id = ?
  `).run(title || assignment.title, description || assignment.description, dueDate || assignment.dueDate, now, req.params.id);

  res.json({ message: 'Assignment updated' });
});

// Delete assignment
assignmentsRoutes.delete('/:id', (req: Request, res: Response) => {
  const assignment = db.prepare('SELECT * FROM assignments WHERE id = ?').get(req.params.id) as any;

  if (!assignment) {
    return res.status(404).json({ message: 'Assignment not found' });
  }

  const course = db.prepare('SELECT * FROM courses WHERE id = ?').get(assignment.courseId) as any;

  if (course.lecturerId !== req.user?.id && req.user?.role !== 'admin') {
    return res.status(403).json({ message: 'Not authorized' });
  }

  db.prepare('DELETE FROM assignments WHERE id = ?').run(req.params.id);
  res.json({ message: 'Assignment deleted' });
});

// Submit assignment
assignmentsRoutes.post('/:id/submit', (req: Request, res: Response) => {
  const { content } = req.body;

  const assignment = db.prepare('SELECT * FROM assignments WHERE id = ?').get(req.params.id);

  if (!assignment) {
    return res.status(404).json({ message: 'Assignment not found' });
  }

  const existing = db.prepare('SELECT * FROM submissions WHERE assignmentId = ? AND studentId = ?').get(req.params.id, req.user?.id);

  const id = existing ? (existing as any).id : randomUUID();
  const now = new Date().toISOString();

  if (existing) {
    db.prepare('UPDATE submissions SET content = ?, submittedAt = ?, updatedAt = ? WHERE id = ?').run(content, now, now, id);
  } else {
    db.prepare(`
      INSERT INTO submissions (id, assignmentId, studentId, content, submittedAt, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(id, req.params.id, req.user?.id, content, now, now, now);
  }

  res.json({ message: 'Assignment submitted successfully', submissionId: id });
});

// Grade submission
assignmentsRoutes.post('/:id/submissions/:submissionId/grade', (req: Request, res: Response) => {
  const { grade, feedback } = req.body;

  const submission = db.prepare('SELECT * FROM submissions WHERE id = ?').get(req.params.submissionId) as any;

  if (!submission) {
    return res.status(404).json({ message: 'Submission not found' });
  }

  const assignment = db.prepare('SELECT * FROM assignments WHERE id = ?').get(req.params.id) as any;
  const course = db.prepare('SELECT * FROM courses WHERE id = ?').get(assignment.courseId) as any;

  if (course.lecturerId !== req.user?.id && req.user?.role !== 'admin') {
    return res.status(403).json({ message: 'Not authorized' });
  }

  const now = new Date().toISOString();
  db.prepare('UPDATE submissions SET grade = ?, feedback = ?, updatedAt = ? WHERE id = ?').run(grade, feedback, now, req.params.submissionId);

  res.json({ message: 'Submission graded successfully' });
});
