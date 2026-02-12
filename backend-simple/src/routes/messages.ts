import express, { Request, Response } from 'express';
import { db } from '../database.js';
import { randomUUID } from 'crypto';

export const messagesRoutes = express.Router();

// Get user's conversations
messagesRoutes.get('/conversations', async (req: Request, res: Response) => {
    const userId = req.user?.id;

    if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    try {
        const result = await db.query(`
            SELECT c.*, 
                (SELECT COUNT(*) FROM conversation_members cm2 WHERE cm2.conversationId = c.id) as "memberCount",
                m.content as "lastMessageContent",
                m.senderId as "lastMessageSenderId",
                m.createdAt as "lastMessageTime",
                cm.joinedAt
            FROM conversations c
            JOIN conversation_members cm ON c.id = cm.conversationId
            LEFT JOIN messages m ON c.lastMessageId = m.id
            WHERE cm.userId = $1
            ORDER BY m.createdAt DESC
        `, [userId]);

        const conversations = result.rows;

        // For each conversation, get members and other details
        const enrichedConversations = await Promise.all(conversations.map(async (conv: any) => {
            const membersResult = await db.query(`
                SELECT u.id, u.firstName, u.lastName, u.email, u.role
                FROM users u
                JOIN conversation_members cm ON u.id = cm.userId
                WHERE cm.conversationId = $1
            `, [conv.id]);

            const members = membersResult.rows;

            // Calculate unread count (simplified: count messages after last read)
            // In a real app, track lastReadMessageId per user
            const unread = 0;

            let name = conv.name;
            // If direct chat, name is the other person's name
            if (conv.type === 'direct') {
                const otherMember = members.find((m: any) => m.id !== userId);
                if (otherMember) {
                    name = `${otherMember.firstName} ${otherMember.lastName}`;
                }
            }

            return {
                id: conv.id,
                name: name || 'Unknown Conversation',
                type: conv.type,
                lastMessage: conv.lastMessageContent || 'No messages yet',
                time: conv.lastMessageTime ? new Date(conv.lastMessageTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '',
                timestamp: conv.lastMessageTime ? new Date(conv.lastMessageTime).getTime() : new Date(conv.createdAt).getTime(),
                unread: unread,
                online: false, // Online status would need WS or Redis
                isGroup: conv.type === 'group',
                members: members.map((m: any) => `${m.firstName} ${m.lastName}`),
                memberDetails: members
            };
        }));

        res.json(enrichedConversations);
    } catch (error: any) {
        console.error('Error fetching conversations:', error);
        res.status(500).json({ error: 'Failed to fetch conversations' });
    }
});

// Create new conversation (Group or Direct)
messagesRoutes.post('/conversations', async (req: Request, res: Response) => {
    const userId = req.user?.id;
    const { type, name, participantIds } = req.body; // participantIds includes other users

    if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    if (!participantIds || !Array.isArray(participantIds) || participantIds.length === 0) {
        return res.status(400).json({ error: 'Participants are required' });
    }

    const allMemberIds = Array.from(new Set([...participantIds, userId]));

    const client = await db.connect();
    try {
        await client.query('BEGIN');

        // Check if direct conversation already exists
        if (type === 'direct' && participantIds.length === 1) {
            const otherId = participantIds[0];
            const existingResult = await client.query(`
                SELECT c.id 
                FROM conversations c
                JOIN conversation_members cm1 ON c.id = cm1.conversationId
                JOIN conversation_members cm2 ON c.id = cm2.conversationId
                WHERE c.type = 'direct' AND cm1.userId = $1 AND cm2.userId = $2
            `, [userId, otherId]);

            if (existingResult.rows.length > 0) {
                await client.query('ROLLBACK');
                return res.json({ id: existingResult.rows[0].id });
            }
        }

        const id = randomUUID();
        const now = new Date().toISOString();

        await client.query(`
            INSERT INTO conversations (id, type, name, updatedAt, createdAt)
            VALUES ($1, $2, $3, $4, $5)
        `, [id, type || 'direct', name, now, now]);

        for (const mid of allMemberIds) {
            await client.query(`
                INSERT INTO conversation_members (conversationId, userId, joinedAt)
                VALUES ($1, $2, $3)
            `, [id, mid, now]);
        }

        await client.query('COMMIT');
        res.json({ id });
    } catch (error: any) {
        await client.query('ROLLBACK');
        console.error('Error creating conversation:', error);
        res.status(500).json({ error: 'Failed to create conversation' });
    } finally {
        client.release();
    }
});

// Get messages for a conversation
messagesRoutes.get('/conversations/:id/messages', async (req: Request, res: Response) => {
    const userId = req.user?.id;
    const conversationId = req.params.id;

    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    try {
        // Verify membership
        const isMemberResult = await db.query(`
            SELECT 1 FROM conversation_members WHERE conversationId = $1 AND userId = $2
        `, [conversationId, userId]);

        if (isMemberResult.rows.length === 0) {
            return res.status(403).json({ error: 'Not a member of this conversation' });
        }

        const messagesResult = await db.query(`
            SELECT m.*, u.firstName, u.lastName
            FROM messages m
            JOIN users u ON m.senderId = u.id
            WHERE m.conversationId = $1
            ORDER BY m.createdAt ASC
            LIMIT 100
        `, [conversationId]);

        const messages = messagesResult.rows;

        const formattedMessages = await Promise.all(messages.map(async (m: any) => {
            // Fetch reactions
            const reactionsResult = await db.query(`
                SELECT emoji, COUNT(*) as count, 
                MAX(CASE WHEN userId = $1 THEN 1 ELSE 0 END) as "byMe"
                FROM message_reactions
                WHERE messageId = $2
                GROUP BY emoji
            `, [userId, m.id]);

            const reactions = reactionsResult.rows;

            let replyTo = undefined;
            if (m.replyToId) {
                const replyResult = await db.query('SELECT senderId, content FROM messages WHERE id = $1', [m.replyToId]);
                replyTo = replyResult.rows[0];
            }

            return {
                id: m.id,
                senderId: m.senderId === userId ? 'me' : m.senderId, // simplified for frontend
                senderName: `${m.firstName} ${m.lastName}`, // Added for group chats
                content: m.content,
                time: new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                timestamp: new Date(m.createdAt).getTime(),
                status: 'read', // Simplified
                reactions: reactions.map((r: any) => ({
                    emoji: r.emoji,
                    count: parseInt(r.count),
                    byMe: r.byMe === 1
                })),
                isVoice: m.type === 'voice',
                voiceDuration: m.voiceDuration,
                replyTo
            };
        }));

        res.json(formattedMessages);
    } catch (error: any) {
        console.error('Error fetching messages:', error);
        res.status(500).json({ error: 'Failed to fetch messages' });
    }
});

// Send a message
messagesRoutes.post('/conversations/:id/messages', async (req: Request, res: Response) => {
    const userId = req.user?.id;
    const conversationId = req.params.id;
    const { content, type, voiceDuration, replyToId } = req.body;

    if (!userId) return res.status(401).json({ error: 'Unauthorized' });
    if (!content && type !== 'voice') return res.status(400).json({ error: 'Content is required' });

    const client = await db.connect();
    try {
        const isMemberResult = await client.query(`
            SELECT 1 FROM conversation_members WHERE conversationId = $1 AND userId = $2
        `, [conversationId, userId]);

        if (isMemberResult.rows.length === 0) {
            return res.status(403).json({ error: 'Not a member' });
        }

        const id = randomUUID();
        const now = new Date().toISOString();

        await client.query('BEGIN');

        await client.query(`
            INSERT INTO messages (id, conversationId, senderId, content, type, voiceDuration, replyToId, createdAt, updatedAt)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        `, [id, conversationId, userId, content || '', type || 'text', voiceDuration, replyToId, now, now]);

        await client.query(`
            UPDATE conversations 
            SET lastMessageId = $1, updatedAt = $2 
            WHERE id = $3
        `, [id, now, conversationId]);

        await client.query('COMMIT');

        // Return formatted message
        const newMessage = {
            id,
            senderId: 'me',
            content: content || '',
            type: type || 'text',
            time: new Date(now).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            timestamp: new Date(now).getTime(),
            status: 'sent',
            reactions: [],
            voiceDuration
        };

        res.json(newMessage);
    } catch (error: any) {
        await client.query('ROLLBACK');
        console.error('Error sending message:', error);
        res.status(500).json({ error: 'Failed to send message' });
    } finally {
        client.release();
    }
});

// React to a message
messagesRoutes.post('/messages/:id/react', async (req: Request, res: Response) => {
    const userId = req.user?.id;
    const messageId = req.params.id;
    const { emoji } = req.body;

    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    try {
        const existingResult = await db.query(`
            SELECT 1 FROM message_reactions WHERE messageId = $1 AND userId = $2 AND emoji = $3
        `, [messageId, userId, emoji]);

        const existing = existingResult.rows[0];

        if (existing) {
            await db.query(`DELETE FROM message_reactions WHERE messageId = $1 AND userId = $2 AND emoji = $3`, [messageId, userId, emoji]);
        } else {
            await db.query(`
                INSERT INTO message_reactions (messageId, userId, emoji, createdAt)
                VALUES ($1, $2, $3, $4)
            `, [messageId, userId, emoji, new Date().toISOString()]);
        }

        res.json({ success: true });
    } catch (error: any) {
        console.error('Error reacting:', error);
        res.status(500).json({ error: 'Failed to react' });
    }
});

// Mark conversation as read
messagesRoutes.post('/conversations/:id/read', async (req: Request, res: Response) => {
    const userId = req.user?.id;
    const conversationId = req.params.id;

    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    try {
        // Find the last message in the conversation
        const lastMessageResult = await db.query(`
            SELECT id FROM messages WHERE conversationId = $1 ORDER BY createdAt DESC LIMIT 1
        `, [conversationId]);

        const lastMessage = lastMessageResult.rows[0];

        if (lastMessage) {
            await db.query(`
                UPDATE conversation_members 
                SET lastReadMessageId = $1
                WHERE conversationId = $2 AND userId = $3
            `, [lastMessage.id, conversationId, userId]);
        }

        res.json({ success: true });
    } catch (error: any) {
        console.error('Error marking as read:', error);
        res.status(500).json({ error: 'Failed to mark as read' });
    }
});
