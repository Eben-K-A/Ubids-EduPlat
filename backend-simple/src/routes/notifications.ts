import { Router, Request, Response } from 'express';
import { randomUUID } from 'crypto';
import { db } from '../database.js';

export const notificationsRoutes = Router();

function requireUser(req: Request, res: Response): boolean {
  if (!req.user) {
    res.status(401).json({ message: 'Unauthorized' });
    return false;
  }
  return true;
}

// List notifications for current user
notificationsRoutes.get('/', async (req: Request, res: Response) => {
  if (!requireUser(req, res)) return;

  try {
    const result = await db.query(
      'SELECT id, title, message, type, read, "createdAt", link FROM notifications WHERE "userId" = $1 ORDER BY "createdAt" DESC',
      [req.user!.id]
    );
    const rows = result.rows;

    const formattedRows = rows.map((n: any) => ({
      ...n,
      read: Boolean(n.read),
    }));

    res.json(formattedRows);
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Create notification for current user
notificationsRoutes.post('/', async (req: Request, res: Response) => {
  if (!requireUser(req, res)) return;
  const { title, message, type, link } = req.body || {};

  if (!String(title || '').trim() || !String(message || '').trim() || !type) {
    return res.status(400).json({ message: 'title, message and type are required' });
  }

  const id = randomUUID();
  const now = new Date().toISOString();

  try {
    await db.query(
      'INSERT INTO notifications (id, "userId", title, message, type, read, link, "createdAt") VALUES ($1, $2, $3, $4, $5, $6, $7, $8)',
      [id, req.user!.id, title, message, type, 0, link ?? null, now]
    );

    res.status(201).json({
      id,
      title,
      message,
      type,
      read: false,
      link: link ?? undefined,
      createdAt: now,
    });
  } catch (error) {
    console.error('Error creating notification:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Mark single notification as read
notificationsRoutes.post('/:id/read', async (req: Request, res: Response) => {
  if (!requireUser(req, res)) return;

  try {
    await db.query('UPDATE notifications SET read = 1 WHERE id = $1 AND "userId" = $2', [
      req.params.id,
      req.user!.id
    ]);
    res.json({ id: req.params.id, read: true });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Mark all notifications as read
notificationsRoutes.post('/read-all', async (req: Request, res: Response) => {
  if (!requireUser(req, res)) return;

  try {
    await db.query('UPDATE notifications SET read = 1 WHERE "userId" = $1', [req.user!.id]);
    res.json({ success: true });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Delete notification
notificationsRoutes.delete('/:id', async (req: Request, res: Response) => {
  if (!requireUser(req, res)) return;

  try {
    await db.query('DELETE FROM notifications WHERE id = $1 AND "userId" = $2', [
      req.params.id,
      req.user!.id
    ]);
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting notification:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});
