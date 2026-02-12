import { Router, Request, Response } from 'express';
import { randomUUID } from 'crypto';
import { db } from '../database.js';

export const quizzesRoutes = Router();

type QuizQuestion = {
  id: string;
  question: string;
  type: 'multiple-choice' | 'true-false' | 'short-answer';
  options?: string[];
  correctAnswer: string | number;
  points: number;
};

// List quizzes (optionally by course)
quizzesRoutes.get('/', async (req: Request, res: Response) => {
  try {
    const courseId = req.query.courseId as string | undefined;

    let query = 'SELECT * FROM quizzes';
    const params: any[] = [];
    if (courseId) {
      query += ' WHERE "courseId" = $1';
      params.push(courseId);
    }
    query += ' ORDER BY "createdAt" DESC';

    const result = await db.query(query, params);
    const rows = result.rows;

    const quizzes = rows.map((q: any) => ({
      ...q,
      questions: typeof q.questionsJson === 'string' ? JSON.parse(q.questionsJson) : q.questionsJson,
    }));

    res.json(quizzes);
  } catch (error) {
    console.error('Error fetching quizzes:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get quiz by id
quizzesRoutes.get('/:id', async (req: Request, res: Response) => {
  try {
    const result = await db.query('SELECT * FROM quizzes WHERE id = $1', [req.params.id]);
    const q = result.rows[0];

    if (!q) return res.status(404).json({ message: 'Quiz not found' });

    res.json({
      ...q,
      questions: typeof q.questionsJson === 'string' ? JSON.parse(q.questionsJson) : q.questionsJson,
    });
  } catch (error) {
    console.error('Error fetching quiz:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Create quiz
quizzesRoutes.post('/', async (req: Request, res: Response) => {
  try {
    const { courseId, title, description, timeLimit, dueDate, status, questions } = req.body || {};

    if (!courseId || !title || !Array.isArray(questions)) {
      return res.status(400).json({ message: 'courseId, title and questions are required' });
    }

    const now = new Date().toISOString();
    const id = randomUUID();
    const questionsJson = JSON.stringify(questions);

    await db.query(
      `INSERT INTO quizzes
        (id, "courseId", title, description, "timeLimit", "dueDate", status, "questionsJson", "createdAt", "updatedAt")
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      [
        id,
        courseId,
        title,
        description ?? null,
        timeLimit ?? null,
        dueDate ?? null,
        status ?? 'published',
        questionsJson,
        now,
        now
      ]
    );

    res.status(201).json({
      id,
      courseId,
      title,
      description: description ?? null,
      timeLimit: timeLimit ?? null,
      dueDate: dueDate ?? null,
      status: status ?? 'published',
      questions,
      createdAt: now,
      updatedAt: now,
    });
  } catch (error) {
    console.error('Error creating quiz:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Update quiz
quizzesRoutes.put('/:id', async (req: Request, res: Response) => {
  try {
    const quizResult = await db.query('SELECT * FROM quizzes WHERE id = $1', [req.params.id]);
    const quiz = quizResult.rows[0];

    if (!quiz) return res.status(404).json({ message: 'Quiz not found' });

    const { title, description, timeLimit, dueDate, status, questions } = req.body || {};
    const now = new Date().toISOString();

    const questionsJson =
      questions !== undefined ? JSON.stringify(questions) : (typeof quiz.questionsJson === 'string' ? quiz.questionsJson : JSON.stringify(quiz.questionsJson));

    await db.query(
      `UPDATE quizzes
       SET title = COALESCE($1, title),
           description = COALESCE($2, description),
           "timeLimit" = COALESCE($3, "timeLimit"),
           "dueDate" = COALESCE($4, "dueDate"),
           status = COALESCE($5, status),
           "questionsJson" = $6,
           "updatedAt" = $7
       WHERE id = $8`,
      [
        title ?? null,
        description ?? null,
        timeLimit ?? null,
        dueDate ?? null,
        status ?? null,
        questionsJson,
        now,
        req.params.id
      ]
    );

    const updatedResult = await db.query('SELECT * FROM quizzes WHERE id = $1', [req.params.id]);
    const updated = updatedResult.rows[0];

    res.json({
      ...updated,
      questions: typeof updated.questionsJson === 'string' ? JSON.parse(updated.questionsJson) : updated.questionsJson,
    });
  } catch (error) {
    console.error('Error updating quiz:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Delete quiz and its attempts
quizzesRoutes.delete('/:id', async (req: Request, res: Response) => {
  try {
    await db.query('DELETE FROM quiz_attempts WHERE "quizId" = $1', [req.params.id]);
    await db.query('DELETE FROM quizzes WHERE id = $1', [req.params.id]);
    res.json({ message: 'Quiz deleted' });
  } catch (error) {
    console.error('Error deleting quiz:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Start attempt
quizzesRoutes.post('/:id/attempts', async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const quizResult = await db.query('SELECT * FROM quizzes WHERE id = $1', [req.params.id]);
    const quiz = quizResult.rows[0];

    if (!quiz) return res.status(404).json({ message: 'Quiz not found' });

    const questions = (typeof quiz.questionsJson === 'string' ? JSON.parse(quiz.questionsJson) : quiz.questionsJson) as QuizQuestion[];
    const maxScore = questions.reduce((sum, q) => sum + (q.points || 0), 0);

    const now = new Date().toISOString();
    const id = randomUUID();

    await db.query(
      `INSERT INTO quiz_attempts
        (id, "quizId", "studentId", "studentName", "answersJson", score, "maxScore", "startedAt", "completedAt", status, "createdAt", "updatedAt")
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
      [
        id,
        quiz.id,
        req.user.id,
        `${req.user.firstName} ${req.user.lastName}`,
        JSON.stringify([]),
        null,
        maxScore,
        now,
        null,
        'in-progress',
        now,
        now
      ]
    );

    res.status(201).json({
      id,
      quizId: quiz.id,
      studentId: req.user.id,
      studentName: `${req.user.firstName} ${req.user.lastName}`,
      answers: [],
      score: null,
      maxScore,
      startedAt: now,
      completedAt: null,
      status: 'in-progress',
    });
  } catch (error) {
    console.error('Error starting attempt:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Submit attempt with auto-grading
quizzesRoutes.post('/attempts/:attemptId/submit', async (req: Request, res: Response) => {
  try {
    const attemptResult = await db.query('SELECT * FROM quiz_attempts WHERE id = $1', [req.params.attemptId]);
    const attempt = attemptResult.rows[0];

    if (!attempt) return res.status(404).json({ message: 'Attempt not found' });

    const quizResult = await db.query('SELECT * FROM quizzes WHERE id = $1', [attempt.quizId]);
    const quiz = quizResult.rows[0];

    if (!quiz) return res.status(404).json({ message: 'Quiz not found' });

    const questions = (typeof quiz.questionsJson === 'string' ? JSON.parse(quiz.questionsJson) : quiz.questionsJson) as QuizQuestion[];
    const answers = (req.body?.answers as any[]) ?? [];

    const gradedAnswers = answers.map((answer) => {
      const question = questions.find((q) => q.id === answer.questionId);
      if (!question) return { ...answer, isCorrect: false, pointsEarned: 0 };

      let isCorrect = false;
      if (question.type === 'short-answer') {
        isCorrect =
          String(answer.answer).toLowerCase().trim() ===
          String(question.correctAnswer).toLowerCase().trim();
      } else {
        isCorrect = answer.answer === question.correctAnswer;
      }

      return {
        ...answer,
        isCorrect,
        pointsEarned: isCorrect ? question.points : 0,
      };
    });

    const score = gradedAnswers.reduce((sum, a) => sum + (a.pointsEarned || 0), 0);
    const now = new Date().toISOString();

    await db.query(
      `UPDATE quiz_attempts
       SET "answersJson" = $1, score = $2, "completedAt" = $3, status = $4, "updatedAt" = $5
       WHERE id = $6`,
      [JSON.stringify(gradedAnswers), score, now, 'completed', now, req.params.attemptId]
    );

    res.json({
      id: attempt.id,
      quizId: attempt.quizId,
      studentId: attempt.studentId,
      studentName: attempt.studentName,
      answers: gradedAnswers,
      score,
      maxScore: attempt.maxScore,
      startedAt: attempt.startedAt,
      completedAt: now,
      status: 'completed',
    });
  } catch (error) {
    console.error('Error submitting attempt:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});


