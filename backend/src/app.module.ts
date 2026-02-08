import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { ThrottlerGuard, ThrottlerModule } from "@nestjs/throttler";
import { APP_GUARD } from "@nestjs/core";
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

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      validate: validateEnv
    }),
    ThrottlerModule.forRoot({
      ttl: 60,
      limit: 120
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
    HealthModule
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard
    }
  ]
})
export class AppModule {}
