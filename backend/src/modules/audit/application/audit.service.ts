import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { AuditLogEntity } from "../domain/audit-log.entity";

@Injectable()
export class AuditService {
  constructor(
    @InjectRepository(AuditLogEntity)
    private readonly auditRepo: Repository<AuditLogEntity>
  ) {}

  async record(entry: {
    actorId?: string | null;
    action: string;
    resource: string;
    resourceId?: string | null;
    metadata?: Record<string, unknown> | null;
  }) {
    const audit = this.auditRepo.create(entry);
    return this.auditRepo.save(audit);
  }
}
