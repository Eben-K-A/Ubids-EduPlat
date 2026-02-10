import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";

@Entity("submissions")
@Index(["assignmentId", "studentId"], { unique: true })
export class SubmissionEntity {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Index()
  @Column({ type: "uuid" })
  assignmentId!: string;

  @Index()
  @Column({ type: "uuid" })
  studentId!: string;

  @Column({ type: "text" })
  content!: string;

  @Column({ type: "int", default: 1 })
  attemptNumber!: number;

  @Column({ type: "varchar", length: 32, default: "submitted" })
  status!: "submitted" | "graded" | "returned";

  @Column({ type: "varchar", length: 255, nullable: true })
  fileUrl?: string | null;

  @Column({ type: "int", nullable: true })
  rawGrade?: number | null;

  @Column({ type: "int", nullable: true })
  grade?: number | null;

  @Column({ type: "text", nullable: true })
  feedback?: string | null;

  @CreateDateColumn({ type: "timestamptz" })
  createdAt!: Date;

  @Column({ type: "timestamptz", default: () => "now()" })
  submittedAt!: Date;

  @Column({ type: "timestamptz", nullable: true })
  gradedAt?: Date | null;

  @UpdateDateColumn({ type: "timestamptz" })
  updatedAt!: Date;
}
