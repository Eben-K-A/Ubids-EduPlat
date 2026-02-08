import { Module } from "@nestjs/common";
import { AnalyticsService } from "./application/analytics.service";
import { AnalyticsController } from "./presentation/analytics.controller";

@Module({
  providers: [AnalyticsService],
  controllers: [AnalyticsController]
})
export class AnalyticsModule {}
