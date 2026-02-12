import pg from 'pg';
const { Pool } = pg;
import path from 'path';
import { fileURLToPath } from 'url';
import bcryptjs from 'bcryptjs';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.warn('⚠️  DATABASE_URL is not set. Defaulting to localhost (this will likely fail with SSL).');
} else {
  // Mask the password for logging
  const maskedUrl = connectionString.replace(/:[^:@]*@/, ':****@');
  console.log('🔌 Connecting to database at:', maskedUrl);
  console.log('🌐 Using Standard/Native PostgreSQL Driver');
}

// Fix: Strip 'channel_binding=require' which can cause issues
const cleanConnectionString = connectionString ? connectionString.replace('&channel_binding=require', '') : connectionString;

export const db = new Pool({
  connectionString: cleanConnectionString,
  ssl: cleanConnectionString && !cleanConnectionString.includes('localhost') ? {
    rejectUnauthorized: false
  } : undefined
});

export async function initDatabase() {
  let client;
  try {
    client = await db.connect();
  } catch (error: any) {
    console.error('❌ Failed to connect to database. Full Error Details:');
    console.error(error); // Log the full object
    if (error.code) console.error('Error Code:', error.code);

    // Verify specific common errors
    if (error.code === '28P01') {
      console.error('👉 Authentication failed. Check your username and password in .env');
    } else if (error.code === 'ENOTFOUND') {
      console.error('👉 Host not found. Check the hostname in DATABASE_URL');
    }

    // Allow application to start without database for now (though it will fail later)
    return;
  }

  try {
    // Create tables
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        firstName TEXT NOT NULL,
        lastName TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'student',
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS courses (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT,
        code TEXT UNIQUE NOT NULL,
        lecturerId TEXT NOT NULL,
        lecturerName TEXT NOT NULL,
        enrolledCount INTEGER DEFAULT 0,
        maxEnrollment INTEGER DEFAULT 60,
        status TEXT DEFAULT 'published',
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL,
        FOREIGN KEY (lecturerId) REFERENCES users(id)
      );

      CREATE TABLE IF NOT EXISTS enrollments (
        id TEXT PRIMARY KEY,
        courseId TEXT NOT NULL,
        studentId TEXT NOT NULL,
        studentName TEXT NOT NULL,
        enrolledAt TEXT NOT NULL,
        status TEXT DEFAULT 'active',
        FOREIGN KEY (courseId) REFERENCES courses(id),
        FOREIGN KEY (studentId) REFERENCES users(id),
        UNIQUE(courseId, studentId)
      );

      CREATE TABLE IF NOT EXISTS assignments (
        id TEXT PRIMARY KEY,
        courseId TEXT NOT NULL,
        title TEXT NOT NULL,
        description TEXT,
        dueDate TEXT NOT NULL,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL,
        FOREIGN KEY (courseId) REFERENCES courses(id)
      );

      CREATE TABLE IF NOT EXISTS submissions (
        id TEXT PRIMARY KEY,
        assignmentId TEXT NOT NULL,
        studentId TEXT NOT NULL,
        content TEXT,
        submittedAt TEXT,
        grade INTEGER,
        feedback TEXT,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL,
        FOREIGN KEY (assignmentId) REFERENCES assignments(id),
        FOREIGN KEY (studentId) REFERENCES users(id)
      );

      CREATE TABLE IF NOT EXISTS modules (
        id TEXT PRIMARY KEY,
        courseId TEXT NOT NULL,
        title TEXT NOT NULL,
        description TEXT,
        orderIndex INTEGER NOT NULL,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL,
        FOREIGN KEY (courseId) REFERENCES courses(id)
      );

      CREATE TABLE IF NOT EXISTS lessons (
        id TEXT PRIMARY KEY,
        moduleId TEXT NOT NULL,
        title TEXT NOT NULL,
        content TEXT,
        type TEXT NOT NULL,
        duration INTEGER,
        orderIndex INTEGER NOT NULL,
        resourceUrl TEXT,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL,
        FOREIGN KEY (moduleId) REFERENCES modules(id)
      );

      CREATE TABLE IF NOT EXISTS quizzes (
        id TEXT PRIMARY KEY,
        courseId TEXT NOT NULL,
        title TEXT NOT NULL,
        description TEXT,
        timeLimit INTEGER,
        dueDate TEXT,
        status TEXT NOT NULL DEFAULT 'draft',
        questionsJson TEXT NOT NULL,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL,
        FOREIGN KEY (courseId) REFERENCES courses(id)
      );

      CREATE TABLE IF NOT EXISTS quiz_attempts (
        id TEXT PRIMARY KEY,
        quizId TEXT NOT NULL,
        studentId TEXT NOT NULL,
        studentName TEXT NOT NULL,
        answersJson TEXT NOT NULL,
        score INTEGER,
        maxScore INTEGER NOT NULL,
        startedAt TEXT NOT NULL,
        completedAt TEXT,
        status TEXT NOT NULL,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL,
        FOREIGN KEY (quizId) REFERENCES quizzes(id),
        FOREIGN KEY (studentId) REFERENCES users(id)
      );

      CREATE TABLE IF NOT EXISTS announcements (
        id TEXT PRIMARY KEY,
        courseId TEXT NOT NULL,
        authorId TEXT NOT NULL,
        authorName TEXT NOT NULL,
        authorRole TEXT NOT NULL,
        content TEXT NOT NULL,
        attachmentsJson TEXT,
        isPinned INTEGER NOT NULL DEFAULT 0,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL,
        FOREIGN KEY (courseId) REFERENCES courses(id)
      );

      CREATE TABLE IF NOT EXISTS announcement_comments (
        id TEXT PRIMARY KEY,
        announcementId TEXT NOT NULL,
        authorId TEXT NOT NULL,
        authorName TEXT NOT NULL,
        authorRole TEXT NOT NULL,
        content TEXT NOT NULL,
        createdAt TEXT NOT NULL,
        FOREIGN KEY (announcementId) REFERENCES announcements(id)
      );

      CREATE TABLE IF NOT EXISTS class_materials (
        id TEXT PRIMARY KEY,
        courseId TEXT NOT NULL,
        topicId TEXT,
        title TEXT NOT NULL,
        description TEXT,
        type TEXT NOT NULL,
        url TEXT NOT NULL,
        createdBy TEXT NOT NULL,
        createdByName TEXT NOT NULL,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL,
        FOREIGN KEY (courseId) REFERENCES courses(id)
      );

      CREATE TABLE IF NOT EXISTS class_topics (
        id TEXT PRIMARY KEY,
        courseId TEXT NOT NULL,
        name TEXT NOT NULL,
        orderIndex INTEGER NOT NULL,
        createdAt TEXT NOT NULL,
        FOREIGN KEY (courseId) REFERENCES courses(id)
      );

      CREATE TABLE IF NOT EXISTS rubrics (
        id TEXT PRIMARY KEY,
        courseId TEXT NOT NULL,
        title TEXT NOT NULL,
        criteriaJson TEXT NOT NULL,
        createdBy TEXT NOT NULL,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL,
        FOREIGN KEY (courseId) REFERENCES courses(id)
      );

      CREATE TABLE IF NOT EXISTS class_invites (
        courseId TEXT PRIMARY KEY,
        code TEXT NOT NULL,
        isActive INTEGER NOT NULL DEFAULT 1,
        createdAt TEXT NOT NULL,
        FOREIGN KEY (courseId) REFERENCES courses(id)
      );

      CREATE TABLE IF NOT EXISTS notifications (
        id TEXT PRIMARY KEY,
        userId TEXT NOT NULL,
        title TEXT NOT NULL,
        message TEXT NOT NULL,
        type TEXT NOT NULL,
        read INTEGER NOT NULL DEFAULT 0,
        link TEXT,
        createdAt TEXT NOT NULL,
        FOREIGN KEY (userId) REFERENCES users(id)
      );

      CREATE TABLE IF NOT EXISTS meetings (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT,
        startTime TEXT NOT NULL,
        duration INTEGER NOT NULL,
        hostName TEXT NOT NULL,
        hostId TEXT,
        meetingCode TEXT UNIQUE NOT NULL,
        waitingRoomMode TEXT NOT NULL DEFAULT 'auto',
        isRecurring INTEGER DEFAULT 0,
        recurringPattern TEXT,
        hasWaitingRoom INTEGER DEFAULT 0,
        isPasswordProtected INTEGER DEFAULT 0,
        recordingEnabled INTEGER DEFAULT 0,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS meeting_waiting_requests (
        id TEXT PRIMARY KEY,
        meetingId TEXT NOT NULL,
        name TEXT NOT NULL,
        userId TEXT,
        identity TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'pending',
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL,
        FOREIGN KEY (meetingId) REFERENCES meetings(id)
      );

      CREATE TABLE IF NOT EXISTS meeting_recordings (
        id TEXT PRIMARY KEY,
        meetingId TEXT NOT NULL,
        egressId TEXT,
        status TEXT NOT NULL,
        startedAt TEXT,
        stoppedAt TEXT,
        recordingUrl TEXT,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL,
        FOREIGN KEY (meetingId) REFERENCES meetings(id)
      );

      CREATE TABLE IF NOT EXISTS personal_meetings (
        id TEXT PRIMARY KEY,
        userId TEXT UNIQUE NOT NULL,
        meetingId TEXT NOT NULL,
        personalMeetingCode TEXT UNIQUE NOT NULL,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL,
        FOREIGN KEY (userId) REFERENCES users(id),
        FOREIGN KEY (meetingId) REFERENCES meetings(id)
      );

      CREATE TABLE IF NOT EXISTS conversations (
        id TEXT PRIMARY KEY,
        type TEXT NOT NULL DEFAULT 'direct', -- 'direct' or 'group'
        name TEXT, -- For group chats
        lastMessageId TEXT,
        unreadCount INTEGER DEFAULT 0,
        updatedAt TEXT NOT NULL,
        createdAt TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS conversation_members (
        conversationId TEXT NOT NULL,
        userId TEXT NOT NULL,
        joinedAt TEXT NOT NULL,
        lastReadMessageId TEXT,
        FOREIGN KEY (conversationId) REFERENCES conversations(id),
        FOREIGN KEY (userId) REFERENCES users(id),
        PRIMARY KEY (conversationId, userId)
      );

      CREATE TABLE IF NOT EXISTS messages (
        id TEXT PRIMARY KEY,
        conversationId TEXT NOT NULL,
        senderId TEXT NOT NULL,
        content TEXT NOT NULL,
        type TEXT NOT NULL DEFAULT 'text', -- 'text', 'image', 'file', 'voice'
        attachmentUrl TEXT,
        attachmentName TEXT,
        attachmentSize INTEGER,
        voiceDuration TEXT,
        replyToId TEXT,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL,
        FOREIGN KEY (conversationId) REFERENCES conversations(id),
        FOREIGN KEY (senderId) REFERENCES users(id),
        FOREIGN KEY (replyToId) REFERENCES messages(id)
      );

      CREATE TABLE IF NOT EXISTS message_reactions (
        messageId TEXT NOT NULL,
        userId TEXT NOT NULL,
        emoji TEXT NOT NULL,
        createdAt TEXT NOT NULL,
        FOREIGN KEY (messageId) REFERENCES messages(id),
        FOREIGN KEY (userId) REFERENCES users(id),
        PRIMARY KEY (messageId, userId, emoji)
      );

      CREATE TABLE IF NOT EXISTS posts (
        id TEXT PRIMARY KEY,
        courseId TEXT, -- NULL for general discussions
        authorId TEXT NOT NULL,
        title TEXT NOT NULL,
        content TEXT NOT NULL,
        isPinned INTEGER DEFAULT 0, -- boolean 0/1
        viewCount INTEGER DEFAULT 0,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL,
        FOREIGN KEY (courseId) REFERENCES courses(id),
        FOREIGN KEY (authorId) REFERENCES users(id)
      );

      CREATE TABLE IF NOT EXISTS post_comments (
        id TEXT PRIMARY KEY,
        postId TEXT NOT NULL,
        authorId TEXT NOT NULL,
        content TEXT NOT NULL,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL,
        FOREIGN KEY (postId) REFERENCES posts(id) ON DELETE CASCADE,
        FOREIGN KEY (authorId) REFERENCES users(id)
      );

      CREATE TABLE IF NOT EXISTS post_likes (
        postId TEXT NOT NULL,
        userId TEXT NOT NULL,
        createdAt TEXT NOT NULL,
        FOREIGN KEY (postId) REFERENCES posts(id) ON DELETE CASCADE,
        FOREIGN KEY (userId) REFERENCES users(id),
        PRIMARY KEY (postId, userId)
      );

      CREATE TABLE IF NOT EXISTS files (
        id TEXT PRIMARY KEY,
        courseId TEXT, -- NULL for general/public files or if not linked to a specific course
        filename TEXT NOT NULL,
        path TEXT NOT NULL,
        mimetype TEXT NOT NULL,
        size INTEGER NOT NULL,
        uploadedBy TEXT NOT NULL,
        createdAt TEXT NOT NULL,
        FOREIGN KEY (courseId) REFERENCES courses(id),
        FOREIGN KEY (uploadedBy) REFERENCES users(id)
      );
    `);

    await ensureColumn('meetings', 'waitingRoomMode', "waitingRoomMode TEXT NOT NULL DEFAULT 'auto'");
    await ensureColumn('meetings', 'recordingEnabled', 'recordingEnabled INTEGER DEFAULT 0');
    // For Meetings password column
    await ensureColumn('meetings', 'password', 'password TEXT');
    await ensureColumn('meeting_recordings', 'egressId', 'egressId TEXT');

    // Seed initial data
    await seedDatabase();
    console.log('✅ Database initialized successfully');
  } catch (error: any) {
    console.error('❌ Error initializing database:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    if (client) client.release();
  }
}

async function ensureColumn(table: string, column: string, ddl: string) {
  try {
    const result = await db.query(
      "SELECT column_name FROM information_schema.columns WHERE table_name = $1 AND column_name = $2",
      [table, column]
    );
    if (result.rows.length > 0) return;
    await db.query(`ALTER TABLE ${table} ADD COLUMN ${ddl}`);
  } catch (error: any) {
    // Silently ignore if column already exists
    if (error.code === '42701') return;
    throw error;
  }
}

async function seedDatabase() {
  // Check if users already exist
  const userCountResult = await db.query('SELECT COUNT(*) as count FROM users');
  const userCount = parseInt(userCountResult.rows[0].count);

  if (userCount > 0) return;

  const now = new Date().toISOString();
  const hashedPassword = bcryptjs.hashSync('password123', 10);

  // Create test users
  const users = [
    {
      id: '1',
      email: 'lecturer@edu.com',
      password: hashedPassword,
      firstName: 'John',
      lastName: 'Smith',
      role: 'lecturer',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: '2',
      email: 'student@edu.com',
      password: hashedPassword,
      firstName: 'Jane',
      lastName: 'Doe',
      role: 'student',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: '3',
      email: 'admin@edu.com',
      password: hashedPassword,
      firstName: 'Admin',
      lastName: 'User',
      role: 'admin',
      createdAt: now,
      updatedAt: now,
    },
  ];

  for (const user of users) {
    await db.query(`
      INSERT INTO users (id, email, password, firstName, lastName, role, createdAt, updatedAt)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    `, [user.id, user.email, user.password, user.firstName, user.lastName, user.role, user.createdAt, user.updatedAt]);
  }

  // Create sample courses
  const courses = [
    {
      id: 'course-1',
      title: 'Introduction to Computer Science',
      description: 'Learn the fundamentals of computer science',
      code: 'CS101',
      lecturerId: '1',
      lecturerName: 'John Smith',
      enrolledCount: 0,
      maxEnrollment: 60,
      status: 'published',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'course-2',
      title: 'Web Development Fundamentals',
      description: 'Master HTML, CSS, and JavaScript',
      code: 'WEB201',
      lecturerId: '1',
      lecturerName: 'John Smith',
      enrolledCount: 0,
      maxEnrollment: 40,
      status: 'published',
      createdAt: now,
      updatedAt: now,
    },
  ];

  for (const course of courses) {
    await db.query(`
      INSERT INTO courses (id, title, description, code, lecturerId, lecturerName, enrolledCount, maxEnrollment, status, createdAt, updatedAt)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
    `, [
      course.id,
      course.title,
      course.description,
      course.code,
      course.lecturerId,
      course.lecturerName,
      course.enrolledCount,
      course.maxEnrollment,
      course.status,
      course.createdAt,
      course.updatedAt
    ]);

    // Initial conversation for testing
    const testConvId = 'conv-1';
    await db.query(`
      INSERT INTO conversations (id, type, name, updatedAt, createdAt)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT DO NOTHING
    `, [testConvId, 'group', 'CS101 Study Group', now, now]);

    // Add lecturer and student to the group
    await db.query(`
      INSERT INTO conversation_members (conversationId, userId, joinedAt)
      VALUES ($1, $2, $3)
      ON CONFLICT DO NOTHING
    `, [testConvId, '1', now]);

    await db.query(`
      INSERT INTO conversation_members (conversationId, userId, joinedAt)
      VALUES ($1, $2, $3)
      ON CONFLICT DO NOTHING
    `, [testConvId, '2', now]);

    await db.query(`
        INSERT INTO messages (id, conversationId, senderId, content, createdAt, updatedAt)
        VALUES ($1, $2, $3, $4, $5, $6)
        ON CONFLICT DO NOTHING
    `, ['msg-1', testConvId, '1', 'Welcome to the study group!', now, now]);
  }

  console.log('✅ Database seeded with test data');
}
