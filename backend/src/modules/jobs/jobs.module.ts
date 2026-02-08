import { Module } from "@nestjs/common";
import { BullModule } from "@nestjs/bullmq";
import { ConfigService } from "@nestjs/config";
import { AiProcessor } from "./processors/ai.processor";

@Module({
  imports: [
    BullModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        connection: {
          host: configService.get<string>("redis.host"),
          port: configService.get<number>("redis.port")
        }
      })
    }),
    BullModule.registerQueue({ name: "ai" })
  ],
  providers: [AiProcessor],
  exports: [BullModule]
})
export class JobsModule {}
