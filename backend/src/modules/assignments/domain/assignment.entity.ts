import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";

@Entity("assignments")
export class AssignmentEntity {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Index()
  @Column({ type: "uuid" })
  courseId!: string;

  @Column({ type: "varchar", length: 255 })
  title!: string;

  @Column({ type: "text" })
  description!: string;

  @Column({ type: "timestamptz" })
  dueDate!: Date;

  @Column({ type: "int", default: 100 })
  points!: number;

  @Column({ type: "varchar", length: 32, default: "draft" })
  status!: "draft" | "published" | "archived";

  @CreateDateColumn({ type: "timestamptz" })
  createdAt!: Date;

  @UpdateDateColumn({ type: "timestamptz" })
  updatedAt!: Date;
}
