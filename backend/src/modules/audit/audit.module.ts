import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { AuditLogEntity } from "./domain/audit-log.entity";
import { AuditService } from "./application/audit.service";

@Module({
  imports: [TypeOrmModule.forFeature([AuditLogEntity])],
  providers: [AuditService],
  exports: [AuditService]
})
export class AuditModule {}
