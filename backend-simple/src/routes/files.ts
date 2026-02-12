import express, { Request, Response } from 'express';
import multer from 'multer';
import { db } from '../database.js';
import { randomUUID } from 'crypto';
import path from 'path';
import fs from 'fs';

const filesRoutes = express.Router();

// Configure storage
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = path.join(process.cwd(), 'uploads');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + '-' + file.originalname);
    }
});

const upload = multer({ storage: storage });

// Upload file
filesRoutes.post('/upload', upload.single('file'), async (req: Request, res: Response) => {
    try {
        const userId = req.user?.id;
        const { courseId } = req.body;
        const file = req.file;

        if (!userId) return res.status(401).json({ error: 'Unauthorized' });
        if (!file) return res.status(400).json({ error: 'No file uploaded' });

        const id = randomUUID();
        const now = new Date().toISOString();

        await db.query(`
            INSERT INTO files (id, "courseId", filename, path, mimetype, size, "uploadedBy", "createdAt")
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        `, [
            id,
            courseId || null,
            file.originalname,
            file.filename,
            file.mimetype,
            file.size,
            userId,
            now
        ]);

        res.json({
            id,
            filename: file.originalname,
            path: file.filename,
            size: file.size,
            message: 'File uploaded successfully'
        });
    } catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({ error: 'Failed to upload file' });
    }
});

// List files (optional courseId filter)
filesRoutes.get('/', async (req: Request, res: Response) => {
    try {
        const { courseId } = req.query;
        let query = `
            SELECT f.*, u."firstName" || ' ' || u."lastName" as "uploaderName" 
            FROM files f
            JOIN users u ON f."uploadedBy" = u.id
        `;
        const params: any[] = [];

        if (courseId) {
            query += ` WHERE f."courseId" = $1`;
            params.push(courseId);
        }

        query += ` ORDER BY f."createdAt" DESC`;

        const result = await db.query(query, params);
        res.json(result.rows);
    } catch (error) {
        console.error('List files error:', error);
        res.status(500).json({ error: 'Failed to list files' });
    }
});

// Delete file
filesRoutes.delete('/:id', async (req: Request, res: Response) => {
    try {
        const userId = req.user?.id;
        const fileId = req.params.id;

        const result = await db.query('SELECT * FROM files WHERE id = $1', [fileId]);
        const file = result.rows[0];

        if (!file) return res.status(404).json({ error: 'File not found' });

        // Only allow uploader or admin to delete (simplified check)
        if (file.uploadedBy !== userId && req.user?.role !== 'admin') {
            return res.status(403).json({ error: 'Not authorized to delete this file' });
        }

        // Delete from DB
        await db.query('DELETE FROM files WHERE id = $1', [fileId]);

        // Delete from filesystem
        const filePath = path.join(process.cwd(), 'uploads', file.path);
        try {
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }
        } catch (error) {
            console.error('Failed to delete file from filesystem:', error);
            // Continue even if file deletion fails, as DB record is gone
        }

        res.json({ message: 'File deleted successfully' });
    } catch (error) {
        console.error('Delete file error:', error);
        res.status(500).json({ error: 'Failed to delete file' });
    }
});

export { filesRoutes };
