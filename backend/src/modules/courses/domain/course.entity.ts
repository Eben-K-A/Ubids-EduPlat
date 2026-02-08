import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";

@Entity("courses")
export class CourseEntity {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Index()
  @Column({ type: "varchar", length: 128 })
  code!: string;

  @Column({ type: "varchar", length: 255 })
  title!: string;

  @Column({ type: "text" })
  description!: string;

  @Index()
  @Column({ type: "uuid" })
  lecturerId!: string;

  @Column({ type: "varchar", length: 255 })
  lecturerName!: string;

  @Column({ type: "varchar", length: 32, default: "draft" })
  status!: "draft" | "published" | "archived";

  @Column({ type: "int", default: 0 })
  enrolledCount!: number;

  @CreateDateColumn({ type: "timestamptz" })
  createdAt!: Date;

  @UpdateDateColumn({ type: "timestamptz" })
  updatedAt!: Date;
}
