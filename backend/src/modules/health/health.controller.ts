import { Controller, Get } from "@nestjs/common";
import { DataSource } from "typeorm";
import { RedisService } from "../../infra/redis/redis.service";

@Controller("health")
export class HealthController {
  constructor(private readonly dataSource: DataSource, private readonly redis: RedisService) {}

  @Get("liveness")
  liveness() {
    return { status: "ok" };
  }

  @Get("readiness")
  async readiness() {
    const db = await this.dataSource.query("SELECT 1");
    const redisPing = await this.redis.getClient().ping();
    return { status: "ok", db: !!db, redis: redisPing === "PONG" };
  }
}
