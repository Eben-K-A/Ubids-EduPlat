import { Module } from "@nestjs/common";
import { BullModule } from "@nestjs/bullmq";
import { AiService } from "./application/ai.service";
import { AiController } from "./presentation/ai.controller";
import { AiQuotaService } from "./application/ai-quota.service";

@Module({
  imports: [BullModule.registerQueue({ name: "ai" })],
  providers: [AiService, AiQuotaService],
  controllers: [AiController]
})
export class AiModule {}
