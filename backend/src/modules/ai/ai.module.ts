import { Module } from "@nestjs/common";
import { BullModule } from "@nestjs/bullmq";
import { AiService } from "./application/ai.service";
import { AiController } from "./presentation/ai.controller";

@Module({
  imports: [BullModule.registerQueue({ name: "ai" })],
  providers: [AiService],
  controllers: [AiController]
})
export class AiModule {}
