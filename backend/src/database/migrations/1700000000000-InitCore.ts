import { MigrationInterface, QueryRunner } from "typeorm";

export class InitCore1700000000000 implements MigrationInterface {
  name = "InitCore1700000000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('CREATE EXTENSION IF NOT EXISTS "pgcrypto"');

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS users (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        email varchar(255) NOT NULL UNIQUE,
        "firstName" varchar(120) NOT NULL,
        "lastName" varchar(120) NOT NULL,
        "passwordHash" varchar(255) NOT NULL,
        role varchar(32) NOT NULL,
        "isActive" boolean NOT NULL DEFAULT true,
        "createdAt" timestamptz NOT NULL DEFAULT now(),
        "updatedAt" timestamptz NOT NULL DEFAULT now()
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS refresh_tokens (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "userId" uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        "tokenHash" varchar(255) NOT NULL,
        "expiresAt" timestamptz NOT NULL,
        "createdAt" timestamptz NOT NULL DEFAULT now(),
        "revokedAt" timestamptz NULL
      )
    `);
    await queryRunner.query("CREATE INDEX IF NOT EXISTS refresh_tokens_user_id_idx ON refresh_tokens(\"userId\")");
    await queryRunner.query("CREATE INDEX IF NOT EXISTS refresh_tokens_token_hash_idx ON refresh_tokens(\"tokenHash\")");

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS courses (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        code varchar(128) NOT NULL,
        title varchar(255) NOT NULL,
        description text NOT NULL,
        "lecturerId" uuid NOT NULL,
        "lecturerName" varchar(255) NOT NULL,
        status varchar(32) NOT NULL DEFAULT 'draft',
        "enrolledCount" int NOT NULL DEFAULT 0,
        "createdAt" timestamptz NOT NULL DEFAULT now(),
        "updatedAt" timestamptz NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query("CREATE INDEX IF NOT EXISTS courses_code_idx ON courses(code)");
    await queryRunner.query("CREATE INDEX IF NOT EXISTS courses_lecturer_id_idx ON courses(\"lecturerId\")");

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS enrollments (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "courseId" uuid NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
        "studentId" uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        "studentName" varchar(255) NOT NULL,
        status varchar(32) NOT NULL DEFAULT 'active',
        "enrolledAt" timestamptz NOT NULL DEFAULT now(),
        UNIQUE ("courseId", "studentId")
      )
    `);
    await queryRunner.query("CREATE INDEX IF NOT EXISTS enrollments_course_id_idx ON enrollments(\"courseId\")");
    await queryRunner.query("CREATE INDEX IF NOT EXISTS enrollments_student_id_idx ON enrollments(\"studentId\")");

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS assignments (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "courseId" uuid NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
        title varchar(255) NOT NULL,
        description text NOT NULL,
        "dueDate" timestamptz NOT NULL,
        points int NOT NULL DEFAULT 100,
        status varchar(32) NOT NULL DEFAULT 'draft',
        "createdAt" timestamptz NOT NULL DEFAULT now(),
        "updatedAt" timestamptz NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query("CREATE INDEX IF NOT EXISTS assignments_course_id_idx ON assignments(\"courseId\")");

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS submissions (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "assignmentId" uuid NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
        "studentId" uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        content text NOT NULL,
        "fileUrl" varchar(255) NULL,
        grade int NULL,
        feedback text NULL,
        "createdAt" timestamptz NOT NULL DEFAULT now(),
        "updatedAt" timestamptz NOT NULL DEFAULT now(),
        UNIQUE ("assignmentId", "studentId")
      )
    `);
    await queryRunner.query("CREATE INDEX IF NOT EXISTS submissions_assignment_id_idx ON submissions(\"assignmentId\")");
    await queryRunner.query("CREATE INDEX IF NOT EXISTS submissions_student_id_idx ON submissions(\"studentId\")");

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS files (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "ownerId" uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        filename varchar(255) NOT NULL,
        "storageKey" varchar(255) NOT NULL,
        "mimeType" varchar(128) NOT NULL,
        size bigint NOT NULL,
        "createdAt" timestamptz NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query("CREATE INDEX IF NOT EXISTS files_owner_id_idx ON files(\"ownerId\")");

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS audit_logs (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "actorId" uuid NULL,
        action varchar(64) NOT NULL,
        resource varchar(128) NOT NULL,
        "resourceId" uuid NULL,
        metadata jsonb NULL,
        "createdAt" timestamptz NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query("CREATE INDEX IF NOT EXISTS audit_logs_actor_id_idx ON audit_logs(\"actorId\")");
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query("DROP TABLE IF EXISTS audit_logs");
    await queryRunner.query("DROP TABLE IF EXISTS files");
    await queryRunner.query("DROP TABLE IF EXISTS submissions");
    await queryRunner.query("DROP TABLE IF EXISTS assignments");
    await queryRunner.query("DROP TABLE IF EXISTS enrollments");
    await queryRunner.query("DROP TABLE IF EXISTS courses");
    await queryRunner.query("DROP TABLE IF EXISTS refresh_tokens");
    await queryRunner.query("DROP TABLE IF EXISTS users");
  }
}
