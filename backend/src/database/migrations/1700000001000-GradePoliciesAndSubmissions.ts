import { MigrationInterface, QueryRunner } from "typeorm";

export class GradePoliciesAndSubmissions1700000001000 implements MigrationInterface {
  name = "GradePoliciesAndSubmissions1700000001000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS course_grade_policies (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "courseId" uuid NOT NULL UNIQUE REFERENCES courses(id) ON DELETE CASCADE,
        "latePenaltyPercent" int NOT NULL DEFAULT 0,
        "allowResubmission" boolean NOT NULL DEFAULT false,
        "maxAttempts" int NOT NULL DEFAULT 1,
        "createdAt" timestamptz NOT NULL DEFAULT now(),
        "updatedAt" timestamptz NOT NULL DEFAULT now()
      )
    `);

    await queryRunner.query("ALTER TABLE submissions DROP CONSTRAINT IF EXISTS submissions_assignmentId_studentId_key");
    await queryRunner.query("ALTER TABLE submissions DROP CONSTRAINT IF EXISTS submissions_assignmentid_studentid_key");

    await queryRunner.query("ALTER TABLE submissions ADD COLUMN IF NOT EXISTS \"attemptNumber\" int NOT NULL DEFAULT 1");
    await queryRunner.query("ALTER TABLE submissions ADD COLUMN IF NOT EXISTS status varchar(32) NOT NULL DEFAULT 'submitted'");
    await queryRunner.query("ALTER TABLE submissions ADD COLUMN IF NOT EXISTS \"rawGrade\" int NULL");
    await queryRunner.query("ALTER TABLE submissions ADD COLUMN IF NOT EXISTS \"submittedAt\" timestamptz NOT NULL DEFAULT now()");
    await queryRunner.query("ALTER TABLE submissions ADD COLUMN IF NOT EXISTS \"gradedAt\" timestamptz NULL");

    await queryRunner.query("CREATE INDEX IF NOT EXISTS submissions_assignment_student_idx ON submissions(\"assignmentId\", \"studentId\")");
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query("DROP INDEX IF EXISTS submissions_assignment_student_idx");
    await queryRunner.query("ALTER TABLE submissions DROP COLUMN IF EXISTS \"gradedAt\"");
    await queryRunner.query("ALTER TABLE submissions DROP COLUMN IF EXISTS \"submittedAt\"");
    await queryRunner.query("ALTER TABLE submissions DROP COLUMN IF EXISTS \"rawGrade\"");
    await queryRunner.query("ALTER TABLE submissions DROP COLUMN IF EXISTS status");
    await queryRunner.query("ALTER TABLE submissions DROP COLUMN IF EXISTS \"attemptNumber\"");
    await queryRunner.query("DROP TABLE IF EXISTS course_grade_policies");
  }
}
