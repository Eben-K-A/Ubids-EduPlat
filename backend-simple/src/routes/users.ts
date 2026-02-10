import { Router, Request, Response } from 'express';
import { db } from '../database.js';

export const usersRoutes = Router();

// Get current user profile
usersRoutes.get('/profile', (req: Request, res: Response) => {
  const user = db.prepare('SELECT id, email, firstName, lastName, role, createdAt, updatedAt FROM users WHERE id = ?').get(req.user?.id);

  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }

  res.json(user);
});

// Update profile
usersRoutes.put('/profile', (req: Request, res: Response) => {
  const { firstName, lastName } = req.body;

  const now = new Date().toISOString();
  db.prepare('UPDATE users SET firstName = ?, lastName = ?, updatedAt = ? WHERE id = ?').run(
    firstName,
    lastName,
    now,
    req.user?.id
  );

  const user = db.prepare('SELECT id, email, firstName, lastName, role, createdAt, updatedAt FROM users WHERE id = ?').get(req.user?.id);

  res.json(user);
});

// Get all users (admin only)
usersRoutes.get('/', (req: Request, res: Response) => {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ message: 'Admin only' });
  }

  const users = db.prepare('SELECT id, email, firstName, lastName, role, createdAt, updatedAt FROM users ORDER BY createdAt DESC').all();
  res.json(users);
});
