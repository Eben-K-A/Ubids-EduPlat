import { Router, Request, Response } from 'express';
import { randomUUID } from 'crypto';
import { db } from '../database.js';
import bcryptjs from 'bcryptjs';
import { generateToken } from '../middleware/auth.js';

export const authRoutes = Router();

authRoutes.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password required' });
    }

    const result = await db.query('SELECT * FROM users WHERE email = $1', [email]);
    const user = result.rows[0];

    if (!user || !bcryptjs.compareSync(password, user.password)) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const token = generateToken({
      id: user.id,
      email: user.email,
      role: user.role,
      firstName: user.firstName,
      lastName: user.lastName
    });

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
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

authRoutes.post('/register', async (req: Request, res: Response) => {
  try {
    const { email, password, firstName, lastName, role = 'student' } = req.body;

    if (!email || !password || !firstName || !lastName) {
      return res.status(400).json({ message: 'All fields required' });
    }

    const existingResult = await db.query('SELECT * FROM users WHERE email = $1', [email]);
    if (existingResult.rows.length > 0) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    const id = randomUUID();
    const now = new Date().toISOString();
    const hashedPassword = bcryptjs.hashSync(password, 10);

    await db.query(`
      INSERT INTO users (id, email, password, firstName, lastName, role, createdAt, updatedAt)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    `, [id, email, hashedPassword, firstName, lastName, role, now, now]);

    const token = generateToken({
      id,
      email,
      role,
      firstName,
      lastName
    });

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
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

authRoutes.post('/logout', (req: Request, res: Response) => {
  res.json({ message: 'Logged out successfully' });
});
