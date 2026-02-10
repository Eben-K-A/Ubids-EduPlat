import { Router, Request, Response } from 'express';
import { randomUUID } from 'crypto';
import { db } from '../database.js';
import bcryptjs from 'bcryptjs';
import { generateToken } from '../middleware/auth.js';

export const authRoutes = Router();

authRoutes.post('/login', (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password required' });
  }

  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email) as any;

  if (!user || !bcryptjs.compareSync(password, user.password)) {
    return res.status(401).json({ message: 'Invalid email or password' });
  }

  const token = generateToken(user.id, user.email, user.role);

  res.json({
    access_token: token,
    refresh_token: token, // Simplified: same as access token
    user: {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      createdAt: user.createdAt,
    },
  });
});

authRoutes.post('/register', (req: Request, res: Response) => {
  const { email, password, firstName, lastName, role = 'student' } = req.body;

  if (!email || !password || !firstName || !lastName) {
    return res.status(400).json({ message: 'All fields required' });
  }

  const existing = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
  if (existing) {
    return res.status(400).json({ message: 'Email already registered' });
  }

  const id = randomUUID();
  const now = new Date().toISOString();
  const hashedPassword = bcryptjs.hashSync(password, 10);

  db.prepare(`
    INSERT INTO users (id, email, password, firstName, lastName, role, createdAt, updatedAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, email, hashedPassword, firstName, lastName, role, now, now);

  const token = generateToken(id, email, role);

  res.json({
    access_token: token,
    user: {
      id,
      email,
      firstName,
      lastName,
      role,
      createdAt: now,
    },
  });
});

authRoutes.post('/logout', (req: Request, res: Response) => {
  res.json({ message: 'Logged out successfully' });
});
