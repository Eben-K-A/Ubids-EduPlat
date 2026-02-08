import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from "typeorm";

@Entity("enrollments")
@Index(["courseId", "studentId"], { unique: true })
export class EnrollmentEntity {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Index()
  @Column({ type: "uuid" })
  courseId!: string;

  @Index()
  @Column({ type: "uuid" })
  studentId!: string;

  @Column({ type: "varchar", length: 255 })
  studentName!: string;

  @Column({ type: "varchar", length: 32, default: "active" })
  status!: "active" | "completed" | "dropped";

  @CreateDateColumn({ type: "timestamptz" })
  enrolledAt!: Date;
}
