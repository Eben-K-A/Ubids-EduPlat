import { MigrationInterface, QueryRunner } from "typeorm";

export class FileChecksum1700000002000 implements MigrationInterface {
  name = "FileChecksum1700000002000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query("ALTER TABLE files ADD COLUMN IF NOT EXISTS checksum varchar(128) NULL");
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query("ALTER TABLE files DROP COLUMN IF EXISTS checksum");
  }
}
