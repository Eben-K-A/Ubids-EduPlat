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

  @Column({ type: "varchar", length: 255, nullable: true })
  fileUrl?: string | null;

  @Column({ type: "int", nullable: true })
  grade?: number | null;

  @Column({ type: "text", nullable: true })
  feedback?: string | null;

  @CreateDateColumn({ type: "timestamptz" })
  createdAt!: Date;

  @UpdateDateColumn({ type: "timestamptz" })
  updatedAt!: Date;
}
