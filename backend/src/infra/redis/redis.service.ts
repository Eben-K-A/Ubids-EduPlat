import { ConfigService } from "@nestjs/config";
import Redis from "ioredis";

export class RedisService {
  private client: Redis;

  constructor(configService: ConfigService) {
    const host = configService.get<string>("redis.host") || "127.0.0.1";
    const port = configService.get<number>("redis.port") || 6379;
    this.client = new Redis({ host, port, maxRetriesPerRequest: 5 });
  }

  getClient() {
    return this.client;
  }
}
