import { Router, Request, Response } from 'express';
import { db } from '../database.js';

export const usersRoutes = Router();

// Get current user profile
usersRoutes.get('/profile', async (req: Request, res: Response) => {
  try {
    const result = await db.query('SELECT id, email, "firstName", "lastName", role, "createdAt", "updatedAt" FROM users WHERE id = $1', [req.user?.id]);
    const user = result.rows[0];

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Update profile
usersRoutes.put('/profile', async (req: Request, res: Response) => {
  try {
    const { firstName, lastName } = req.body;

    const now = new Date().toISOString();
    await db.query('UPDATE users SET "firstName" = $1, "lastName" = $2, "updatedAt" = $3 WHERE id = $4', [
      firstName,
      lastName,
      now,
      req.user?.id
    ]);

    const result = await db.query('SELECT id, email, "firstName", "lastName", role, "createdAt", "updatedAt" FROM users WHERE id = $1', [req.user?.id]);
    const user = result.rows[0];

    res.json(user);
  } catch (error) {
    console.error('Error updating user profile:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get all users (admin only)
usersRoutes.get('/', async (req: Request, res: Response) => {
  try {
    if (req.user?.role !== 'admin') {
      return res.status(403).json({ message: 'Admin only' });
    }

    const result = await db.query('SELECT id, email, "firstName", "lastName", role, "createdAt", "updatedAt" FROM users ORDER BY "createdAt" DESC');
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});
