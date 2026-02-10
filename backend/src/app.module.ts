import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { ThrottlerGuard, ThrottlerModule, seconds } from "@nestjs/throttler";
import { RedisModule as NestRedisModule, RedisToken } from "@nestjs-redis/client";
import { RedisThrottlerStorage } from "@nestjs-redis/throttler-storage";
import { APP_GUARD } from "@nestjs/core";
import { UserRateLimitGuard } from "./common/guards/user-rate-limit.guard";
import { CacheModule } from "@nestjs/cache-manager";
import { TypeOrmModule } from "@nestjs/typeorm";
import { configuration, validateEnv } from "./config/configuration";
import { typeOrmConfigFactory } from "./database/typeorm.config";
import { redisStore } from "cache-manager-redis-yet";
import { AuthModule } from "./modules/auth/auth.module";
import { UsersModule } from "./modules/users/users.module";
import { CoursesModule } from "./modules/courses/courses.module";
import { AssignmentsModule } from "./modules/assignments/assignments.module";
import { FilesModule } from "./modules/files/files.module";
import { RealtimeModule } from "./modules/realtime/realtime.module";
import { AiModule } from "./modules/ai/ai.module";
import { AnalyticsModule } from "./modules/analytics/analytics.module";
import { AuditModule } from "./modules/audit/audit.module";
import { HealthModule } from "./modules/health/health.module";
import { JobsModule } from "./modules/jobs/jobs.module";
import { RedisModule } from "./infra/redis/redis.module";
import { CommonModule } from "./common/common.module";
import { ObservabilityModule } from "./modules/observability/observability.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      validate: validateEnv
    }),
    NestRedisModule.forRootAsync({
      isGlobal: true,
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const host = configService.get<string>("redis.host") || "127.0.0.1";
        const port = configService.get<number>("redis.port") || 6379;
        return {
          type: "client",
          options: {
            url: `redis://${host}:${port}`
          }
        };
      }
    }),
    ThrottlerModule.forRootAsync({
      inject: [RedisToken(), ConfigService],
      useFactory: (_redis, _configService: ConfigService) => ({
        throttlers: [
          {
            limit: 120,
            ttl: seconds(60)
          }
        ],
        storage: RedisThrottlerStorage.from(_redis)
      })
    }),
    CacheModule.registerAsync({
      isGlobal: true,
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        store: redisStore,
        ttl: 30,
        socket: {
          host: configService.get<string>("redis.host") || "127.0.0.1",
          port: configService.get<number>("redis.port") || 6379
        }
      })
    }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: typeOrmConfigFactory
    }),
    CommonModule,
    RedisModule,
    AuthModule,
    UsersModule,
    CoursesModule,
    AssignmentsModule,
    FilesModule,
    RealtimeModule,
    AiModule,
    AnalyticsModule,
    AuditModule,
    JobsModule,
    HealthModule,
    ObservabilityModule
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard
    },
    {
      provide: APP_GUARD,
      useClass: UserRateLimitGuard
    }
  ]
})
export class AppModule {}
