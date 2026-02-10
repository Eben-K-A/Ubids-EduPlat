import { CanActivate, ExecutionContext, Injectable } from "@nestjs/common";

@Injectable()
export class ApiKeyGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const apiKey = request.headers["x-internal-api-key"];
    if (!process.env.INTERNAL_API_KEY) return true;
    return apiKey === process.env.INTERNAL_API_KEY;
  }
}
