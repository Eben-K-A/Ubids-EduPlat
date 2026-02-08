import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from "@nestjs/common";
import { Observable, tap } from "rxjs";
import { AuditService } from "../../modules/audit/application/audit.service";

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(private readonly auditService: AuditService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const action = `${request.method} ${request.route?.path || request.url}`;

    return next.handle().pipe(
      tap(() => {
        void this.auditService.record({
          actorId: user?.id || null,
          action,
          resource: request.route?.path || request.url,
          metadata: {
            method: request.method,
            ip: request.ip
          }
        });
      })
    );
  }
}
