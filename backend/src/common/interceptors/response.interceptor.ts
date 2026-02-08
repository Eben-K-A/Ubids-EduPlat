import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from "@nestjs/common";
import { Observable, map } from "rxjs";

@Injectable()
export class ResponseInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest();
    const requestId = request?.headers?.["x-request-id"];

    return next.handle().pipe(
      map((data) => ({
        data,
        meta: {
          requestId,
          timestamp: new Date().toISOString()
        }
      }))
    );
  }
}
