import { Router, Request, Response } from 'express';
import { randomUUID } from 'crypto';
import { db } from '../database.js';

export const coursesRoutes = Router();

// Get all courses
coursesRoutes.get('/', (req: Request, res: Response) => {
  const courses = db.prepare('SELECT * FROM courses ORDER BY createdAt DESC').all();
  res.json(courses);
});

// Get single course
coursesRoutes.get('/:id', (req: Request, res: Response) => {
  const course = db.prepare('SELECT * FROM courses WHERE id = ?').get(req.params.id);
  if (!course) {
    return res.status(404).json({ message: 'Course not found' });
  }
  res.json(course);
});

// Create course
coursesRoutes.post('/', (req: Request, res: Response) => {
  if (req.user?.role !== 'lecturer' && req.user?.role !== 'admin') {
    return res.status(403).json({ message: 'Only lecturers can create courses' });
  }

  const { title, description, code, maxEnrollment = 60 } = req.body;

  if (!title || !code) {
    return res.status(400).json({ message: 'Title and code required' });
  }

  const id = randomUUID();
  const now = new Date().toISOString();

  db.prepare(`
    INSERT INTO courses (id, title, description, code, lecturerId, lecturerName, enrolledCount, maxEnrollment, status, createdAt, updatedAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, title, description, code, req.user.id, `${req.user.firstName} ${req.user.lastName}`, 0, maxEnrollment, 'published', now, now);

  res.json({
    id,
    title,
    description,
    code,
    lecturerId: req.user.id,
    lecturerName: `${req.user.firstName} ${req.user.lastName}`,
    enrolledCount: 0,
    maxEnrollment,
    status: 'published',
    createdAt: now,
    updatedAt: now,
  });
});

// Update course
coursesRoutes.put('/:id', (req: Request, res: Response) => {
  const course = db.prepare('SELECT * FROM courses WHERE id = ?').get(req.params.id) as any;

  if (!course) {
    return res.status(404).json({ message: 'Course not found' });
  }

  if (course.lecturerId !== req.user?.id && req.user?.role !== 'admin') {
    return res.status(403).json({ message: 'Not authorized' });
  }

  const { title, description, maxEnrollment } = req.body;
  const now = new Date().toISOString();

  db.prepare(`
    UPDATE courses SET title = ?, description = ?, maxEnrollment = ?, updatedAt = ? WHERE id = ?
  `).run(title || course.title, description || course.description, maxEnrollment || course.maxEnrollment, now, req.params.id);

  res.json({ message: 'Course updated' });
});

// Delete course
coursesRoutes.delete('/:id', (req: Request, res: Response) => {
  const course = db.prepare('SELECT * FROM courses WHERE id = ?').get(req.params.id) as any;

  if (!course) {
    return res.status(404).json({ message: 'Course not found' });
  }

  if (course.lecturerId !== req.user?.id && req.user?.role !== 'admin') {
    return res.status(403).json({ message: 'Not authorized' });
  }

  db.prepare('DELETE FROM courses WHERE id = ?').run(req.params.id);
  res.json({ message: 'Course deleted' });
});

// Enroll in course
coursesRoutes.post('/:id/enroll', (req: Request, res: Response) => {
  const course = db.prepare('SELECT * FROM courses WHERE id = ?').get(req.params.id) as any;

  if (!course) {
    return res.status(404).json({ message: 'Course not found' });
  }

  const enrollment = db.prepare('SELECT * FROM enrollments WHERE courseId = ? AND studentId = ?').get(req.params.id, req.user?.id);

  if (enrollment) {
    return res.status(400).json({ message: 'Already enrolled' });
  }

  const id = randomUUID();
  const now = new Date().toISOString();

  db.prepare(`
    INSERT INTO enrollments (id, courseId, studentId, studentName, enrolledAt, status)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(id, req.params.id, req.user?.id, `${req.user?.firstName} ${req.user?.lastName}`, now, 'active');

  // Increment course enrollment count
  db.prepare('UPDATE courses SET enrolledCount = enrolledCount + 1 WHERE id = ?').run(req.params.id);

  res.json({
    id,
    courseId: req.params.id,
    studentId: req.user?.id,
    studentName: `${req.user?.firstName} ${req.user?.lastName}`,
    enrolledAt: now,
    status: 'active',
  });
});

// Unenroll from course
coursesRoutes.post('/:id/unenroll', (req: Request, res: Response) => {
  db.prepare('DELETE FROM enrollments WHERE courseId = ? AND studentId = ?').run(req.params.id, req.user?.id);
  db.prepare('UPDATE courses SET enrolledCount = MAX(0, enrolledCount - 1) WHERE id = ?').run(req.params.id);

  res.json({ message: 'Unenrolled successfully' });
});
