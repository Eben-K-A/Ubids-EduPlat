import { Injectable, ForbiddenException } from "@nestjs/common";
import { RedisService } from "../../../infra/redis/redis.service";
import { ConfigService } from "@nestjs/config";

@Injectable()
export class AiQuotaService {
  constructor(private readonly redis: RedisService, private readonly config: ConfigService) {}

  async assertQuota(userId: string) {
    const dailyQuota = this.config.get<number>("ai.dailyQuota") || 1000;
    const key = `ai_quota:${userId}:${new Date().toISOString().slice(0, 10)}`;
    const count = await this.redis.getClient().incr(key);
    if (count === 1) {
      await this.redis.getClient().expire(key, 60 * 60 * 24);
    }
    if (count > dailyQuota) {
      throw new ForbiddenException("AI quota exceeded");
    }
  }
}
