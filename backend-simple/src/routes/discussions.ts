import express, { Request, Response } from 'express';
import { db } from '../database.js';
import { randomUUID } from 'crypto';

export const discussionsRoutes = express.Router();

// Get all posts (optional filter by courseId)
discussionsRoutes.get('/', async (req: Request, res: Response) => {
    const { courseId } = req.query;
    const userId = req.user?.id;

    try {
        let query = `
            SELECT p.*, 
            u.firstName, u.lastName, u.avatar,
            (SELECT COUNT(*) FROM post_comments pc WHERE pc.postId = p.id) as "commentCount",
            (SELECT COUNT(*) FROM post_likes pl WHERE pl.postId = p.id) as "likeCount",
            (SELECT COUNT(*) FROM post_likes pl WHERE pl.postId = p.id AND pl.userId = $1) as "isLiked"
            FROM posts p
            JOIN users u ON p.authorId = u.id
        `;

        const params: any[] = [userId || ''];

        if (courseId) {
            query += ` WHERE p.courseId = $2`;
            params.push(courseId);
        } else {
            query += ` WHERE p.courseId IS NULL`; // General discussions
        }

        query += ` ORDER BY p.isPinned DESC, p.createdAt DESC`;

        const result = await db.query(query, params);
        const posts = result.rows;

        const formattedPosts = posts.map((p: any) => ({
            id: p.id,
            courseId: p.courseId,
            author: {
                id: p.authorId,
                name: `${p.firstName} ${p.lastName}`,
                avatar: p.avatar
            },
            title: p.title,
            content: p.content,
            isPinned: p.isPinned === 1 || p.isPinned === true,
            viewCount: p.viewCount,
            likeCount: parseInt(p.likeCount),
            commentCount: parseInt(p.commentCount),
            isLiked: parseInt(p.isLiked) > 0,
            createdAt: p.createdAt,
            updatedAt: p.updatedAt
        }));

        res.json(formattedPosts);
    } catch (error: any) {
        console.error('Error fetching posts:', error);
        res.status(500).json({ error: 'Failed to fetch posts' });
    }
});

// Get single post with comments
discussionsRoutes.get('/:id', async (req: Request, res: Response) => {
    const postId = req.params.id;
    const userId = req.user?.id;

    try {
        // Increment view count
        await db.query('UPDATE posts SET viewCount = viewCount + 1 WHERE id = $1', [postId]);

        const postResult = await db.query(`
            SELECT p.*, 
            u.firstName, u.lastName, u.avatar,
            (SELECT COUNT(*) FROM post_likes pl WHERE pl.postId = p.id) as "likeCount",
            (SELECT COUNT(*) FROM post_likes pl WHERE pl.postId = p.id AND pl.userId = $1) as "isLiked"
            FROM posts p
            JOIN users u ON p.authorId = u.id
            WHERE p.id = $2
        `, [userId || '', postId]);

        const post = postResult.rows[0];

        if (!post) return res.status(404).json({ error: 'Post not found' });

        const commentsResult = await db.query(`
            SELECT c.*, u.firstName, u.lastName, u.avatar
            FROM post_comments c
            JOIN users u ON c.authorId = u.id
            WHERE c.postId = $1
            ORDER BY c.createdAt ASC
        `, [postId]);

        const comments = commentsResult.rows;

        const formattedPost = {
            id: post.id,
            courseId: post.courseId,
            author: {
                id: post.authorId,
                name: `${post.firstName} ${post.lastName}`,
                avatar: post.avatar
            },
            title: post.title,
            content: post.content,
            isPinned: post.isPinned === 1 || post.isPinned === true,
            viewCount: post.viewCount,
            likeCount: parseInt(post.likeCount),
            isLiked: parseInt(post.isLiked) > 0,
            createdAt: post.createdAt,
            updatedAt: post.updatedAt,
            comments: comments.map((c: any) => ({
                id: c.id,
                author: {
                    id: c.authorId,
                    name: `${c.firstName} ${c.lastName}`,
                    avatar: c.avatar
                },
                content: c.content,
                createdAt: c.createdAt
            }))
        };

        res.json(formattedPost);
    } catch (error: any) {
        console.error('Error fetching post:', error);
        res.status(500).json({ error: 'Failed to fetch post' });
    }
});

// Create post
discussionsRoutes.post('/', async (req: Request, res: Response) => {
    const userId = req.user?.id;
    const { title, content, courseId } = req.body;

    if (!userId) return res.status(401).json({ error: 'Unauthorized' });
    if (!title || !content) return res.status(400).json({ error: 'Title and content are required' });

    try {
        const id = randomUUID();
        const now = new Date().toISOString();

        await db.query(`
            INSERT INTO posts (id, courseId, authorId, title, content, createdAt, updatedAt)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
        `, [id, courseId || null, userId, title, content, now, now]);

        res.json({ id, message: 'Post created successfully' });
    } catch (error: any) {
        console.error('Error creating post:', error);
        res.status(500).json({ error: 'Failed to create post' });
    }
});

// Add comment
discussionsRoutes.post('/:id/comments', async (req: Request, res: Response) => {
    const userId = req.user?.id;
    const postId = req.params.id;
    const { content } = req.body;

    if (!userId) return res.status(401).json({ error: 'Unauthorized' });
    if (!content) return res.status(400).json({ error: 'Content is required' });

    try {
        const id = randomUUID();
        const now = new Date().toISOString();

        await db.query(`
            INSERT INTO post_comments (id, postId, authorId, content, createdAt, updatedAt)
            VALUES ($1, $2, $3, $4, $5, $6)
        `, [id, postId, userId, content, now, now]);

        // Update post updatedAt
        await db.query('UPDATE posts SET updatedAt = $1 WHERE id = $2', [now, postId]);

        res.json({ id, message: 'Comment added successfully' });
    } catch (error: any) {
        console.error('Error adding comment:', error);
        res.status(500).json({ error: 'Failed to add comment' });
    }
});

// Like/Unlike post
discussionsRoutes.post('/:id/like', async (req: Request, res: Response) => {
    const userId = req.user?.id;
    const postId = req.params.id;

    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    try {
        const existingResult = await db.query('SELECT 1 FROM post_likes WHERE postId = $1 AND userId = $2', [postId, userId]);
        const existing = existingResult.rows[0];

        if (existing) {
            await db.query('DELETE FROM post_likes WHERE postId = $1 AND userId = $2', [postId, userId]);
            res.json({ liked: false });
        } else {
            await db.query('INSERT INTO post_likes (postId, userId, createdAt) VALUES ($1, $2, $3)', [postId, userId, new Date().toISOString()]);
            res.json({ liked: true });
        }
    } catch (error: any) {
        console.error('Error toggling like:', error);
        res.status(500).json({ error: 'Failed to toggle like' });
    }
});
