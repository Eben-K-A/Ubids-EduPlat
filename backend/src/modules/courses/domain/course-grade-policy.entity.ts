import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";

@Entity("course_grade_policies")
export class CourseGradePolicyEntity {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Index({ unique: true })
  @Column({ type: "uuid" })
  courseId!: string;

  @Column({ type: "int", default: 0 })
  latePenaltyPercent!: number;

  @Column({ type: "boolean", default: false })
  allowResubmission!: boolean;

  @Column({ type: "int", default: 1 })
  maxAttempts!: number;

  @CreateDateColumn({ type: "timestamptz" })
  createdAt!: Date;

  @UpdateDateColumn({ type: "timestamptz" })
  updatedAt!: Date;
}
