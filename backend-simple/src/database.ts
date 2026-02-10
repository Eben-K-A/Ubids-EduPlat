import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import bcryptjs from 'bcryptjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.join(__dirname, '..', 'data.db');
export const db = new Database(dbPath);

export function initDatabase() {
  // Create tables
  db.exec(`
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
  `);

  ensureColumn('meetings', 'waitingRoomMode', "waitingRoomMode TEXT NOT NULL DEFAULT 'auto'");
  ensureColumn('meetings', 'recordingEnabled', 'recordingEnabled INTEGER DEFAULT 0');
  ensureColumn('meetings', 'password', 'password TEXT');
  ensureColumn('meeting_recordings', 'egressId', 'egressId TEXT');

  // Seed initial data
  seedDatabase();
  console.log('✅ Database initialized');
}

function ensureColumn(table: string, column: string, ddl: string) {
  const cols = db.prepare(`PRAGMA table_info(${table})`).all() as Array<{ name: string }>;
  if (cols.some((c) => c.name === column)) return;
  db.exec(`ALTER TABLE ${table} ADD COLUMN ${ddl}`);
}

function seedDatabase() {
  // Check if users already exist
  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number };
  if (userCount.count > 0) return;

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

  const insertUser = db.prepare(`
    INSERT INTO users (id, email, password, firstName, lastName, role, createdAt, updatedAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  users.forEach((user) => {
    insertUser.run(user.id, user.email, user.password, user.firstName, user.lastName, user.role, user.createdAt, user.updatedAt);
  });

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

  const insertCourse = db.prepare(`
    INSERT INTO courses (id, title, description, code, lecturerId, lecturerName, enrolledCount, maxEnrollment, status, createdAt, updatedAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  courses.forEach((course) => {
    insertCourse.run(
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
    );
  });

  console.log('✅ Database seeded with test data');
}
