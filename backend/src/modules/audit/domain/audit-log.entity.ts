import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from "typeorm";

@Entity("audit_logs")
export class AuditLogEntity {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Index()
  @Column({ type: "uuid", nullable: true })
  actorId?: string | null;

  @Index()
  @Column({ type: "varchar", length: 64 })
  action!: string;

  @Column({ type: "varchar", length: 128 })
  resource!: string;

  @Column({ type: "uuid", nullable: true })
  resourceId?: string | null;

  @Column({ type: "jsonb", nullable: true })
  metadata?: Record<string, unknown> | null;

  @CreateDateColumn({ type: "timestamptz" })
  createdAt!: Date;
}
