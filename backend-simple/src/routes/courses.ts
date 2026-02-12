import { Router, Request, Response } from 'express';
import { randomUUID } from 'crypto';
import { db } from '../database.js';

export const coursesRoutes = Router();

// Get all courses
coursesRoutes.get('/', async (req: Request, res: Response) => {
  try {
    const result = await db.query('SELECT * FROM courses ORDER BY createdAt DESC');
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching courses:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get current user's enrollments
coursesRoutes.get('/enrollments/me', async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const result = await db.query(
      'SELECT id, "courseId", "studentId", "studentName", "enrolledAt", status FROM enrollments WHERE "studentId" = $1 ORDER BY "enrolledAt" DESC',
      [req.user.id]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching enrollments:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get single course
coursesRoutes.get('/:id', async (req: Request, res: Response) => {
  try {
    const result = await db.query('SELECT * FROM courses WHERE id = $1', [req.params.id]);
    const course = result.rows[0];
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }
    res.json(course);
  } catch (error) {
    console.error('Error fetching course:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Create course
coursesRoutes.post('/', async (req: Request, res: Response) => {
  try {
    if (req.user?.role !== 'lecturer' && req.user?.role !== 'admin') {
      return res.status(403).json({ message: 'Only lecturers can create courses' });
    }

    const { title, description, code, maxEnrollment = 60 } = req.body;

    if (!title || !code) {
      return res.status(400).json({ message: 'Title and code required' });
    }

    const id = randomUUID();
    const now = new Date().toISOString();

    await db.query(`
      INSERT INTO courses (id, title, description, code, "lecturerId", "lecturerName", "enrolledCount", "maxEnrollment", status, "createdAt", "updatedAt")
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
    `, [id, title, description, code, req.user.id, `${req.user.firstName} ${req.user.lastName}`, 0, maxEnrollment, 'published', now, now]);

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
  } catch (error) {
    console.error('Error creating course:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Update course
coursesRoutes.put('/:id', async (req: Request, res: Response) => {
  try {
    const result = await db.query('SELECT * FROM courses WHERE id = $1', [req.params.id]);
    const course = result.rows[0];

    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    if (course.lecturerId !== req.user?.id && req.user?.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const { title, description, maxEnrollment } = req.body;
    const now = new Date().toISOString();

    await db.query(`
      UPDATE courses SET title = $1, description = $2, "maxEnrollment" = $3, "updatedAt" = $4 WHERE id = $5
    `, [title || course.title, description || course.description, maxEnrollment || course.maxEnrollment, now, req.params.id]);

    res.json({ message: 'Course updated' });
  } catch (error) {
    console.error('Error updating course:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Delete course
coursesRoutes.delete('/:id', async (req: Request, res: Response) => {
  try {
    const result = await db.query('SELECT * FROM courses WHERE id = $1', [req.params.id]);
    const course = result.rows[0];

    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    if (course.lecturerId !== req.user?.id && req.user?.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }

    await db.query('DELETE FROM courses WHERE id = $1', [req.params.id]);
    res.json({ message: 'Course deleted' });
  } catch (error) {
    console.error('Error deleting course:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Enroll in course
coursesRoutes.post('/:id/enroll', async (req: Request, res: Response) => {
  try {
    const courseResult = await db.query('SELECT * FROM courses WHERE id = $1', [req.params.id]);
    const course = courseResult.rows[0];

    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    const enrollmentResult = await db.query('SELECT * FROM enrollments WHERE "courseId" = $1 AND "studentId" = $2', [req.params.id, req.user?.id]);
    const enrollment = enrollmentResult.rows[0];

    if (enrollment) {
      return res.status(400).json({ message: 'Already enrolled' });
    }

    const id = randomUUID();
    const now = new Date().toISOString();

    await db.query(`
      INSERT INTO enrollments (id, "courseId", "studentId", "studentName", "enrolledAt", status)
      VALUES ($1, $2, $3, $4, $5, $6)
    `, [id, req.params.id, req.user?.id, `${req.user?.firstName} ${req.user?.lastName}`, now, 'active']);

    // Increment course enrollment count
    await db.query('UPDATE courses SET "enrolledCount" = "enrolledCount" + 1 WHERE id = $1', [req.params.id]);

    res.json({
      id,
      courseId: req.params.id,
      studentId: req.user?.id,
      studentName: `${req.user?.firstName} ${req.user?.lastName}`,
      enrolledAt: now,
      status: 'active',
    });
  } catch (error) {
    console.error('Error enrolling in course:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Unenroll from course
coursesRoutes.post('/:id/unenroll', async (req: Request, res: Response) => {
  try {
    await db.query('DELETE FROM enrollments WHERE "courseId" = $1 AND "studentId" = $2', [req.params.id, req.user?.id]);
    await db.query('UPDATE courses SET "enrolledCount" = GREATEST(0, "enrolledCount" - 1) WHERE id = $1', [req.params.id]);

    res.json({ message: 'Unenrolled successfully' });
  } catch (error) {
    console.error('Error unenrolling from course:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});
