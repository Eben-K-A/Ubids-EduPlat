import { CanActivate, ExecutionContext, Injectable, TooManyRequestsException } from "@nestjs/common";
import { RedisService } from "../../infra/redis/redis.service";

@Injectable()
export class UserRateLimitGuard implements CanActivate {
  constructor(private readonly redis: RedisService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user as { id?: string } | undefined;
    if (!user?.id) return true;

    const key = `rate:user:${user.id}`;
    const count = await this.redis.getClient().incr(key);
    if (count === 1) {
      await this.redis.getClient().expire(key, 60);
    }
    if (count > 300) {
      throw new TooManyRequestsException("User rate limit exceeded");
    }
    return true;
  }
}
