export type DeliveryStatus = "sending" | "sent" | "delivered" | "read";

export interface MessageReaction {
    emoji: string;
    count: number;
    byMe: boolean;
}

export interface Message {
    id: string;
    senderId: string;
    senderName?: string;
    content: string;
    time: string;
    timestamp: number;
    status: DeliveryStatus;
    replyTo?: { sender: string; content: string };
    reactions: MessageReaction[];
    isPinned?: boolean;
    isVoice?: boolean;
    voiceDuration?: string;
    attachment?: { name: string; type: string; size: string };
}

export interface Conversation {
    id: string;
    name: string;
    lastMessage: string;
    time: string;
    timestamp: number;
    unread: number;
    online: boolean;
    isGroup?: boolean;
    isStarred?: boolean;
    isArchived?: boolean;
    members?: string[];
    memberDetails?: any[];
}

export interface User {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    role: string;
    avatar?: string;
}

export interface Comment {
    id: string;
    postId: string;
    author: {
        id: string;
        name: string;
        avatar?: string;
    };
    content: string;
    createdAt: string;
}

export interface Post {
    id: string;
    courseId?: string;
    author: {
        id: string;
        name: string;
        avatar?: string;
    };
    title: string;
    content: string;
    isPinned: boolean;
    viewCount: number;
    likeCount: number;
    commentCount?: number;
    isLiked: boolean;
    createdAt: string;
    updatedAt: string;
    comments?: Comment[];
}

export interface CourseFile {
    id: string;
    courseId?: string;
    filename: string;
    path: string;
    mimetype: string;
    size: number;
    uploadedBy: string;
    uploaderName: string;
    createdAt: string;
}
