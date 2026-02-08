import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from "typeorm";

@Entity("files")
export class FileEntity {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Index()
  @Column({ type: "uuid" })
  ownerId!: string;

  @Column({ type: "varchar", length: 255 })
  filename!: string;

  @Column({ type: "varchar", length: 255 })
  storageKey!: string;

  @Column({ type: "varchar", length: 128 })
  mimeType!: string;

  @Column({ type: "bigint" })
  size!: number;

  @CreateDateColumn({ type: "timestamptz" })
  createdAt!: Date;
}
