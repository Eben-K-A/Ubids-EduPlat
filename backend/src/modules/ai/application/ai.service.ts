import { Injectable, ServiceUnavailableException } from "@nestjs/common";
import { InjectQueue } from "@nestjs/bullmq";
import type { Queue } from "bullmq";
import { ConfigService } from "@nestjs/config";
import { AiQuotaService } from "./ai-quota.service";
import { AiProvider } from "./providers/types";

@Injectable()
export class AiService {
  constructor(
    @InjectQueue("ai") private readonly aiQueue: Queue,
    private readonly configService: ConfigService,
    private readonly quotaService: AiQuotaService
  ) {}

  async requestAssistance(payload: { userId: string; prompt: string; provider?: AiProvider; model?: string }) {
    await this.quotaService.assertQuota(payload.userId);
    try {
      const job = await this.aiQueue.add("assist", payload, {
        attempts: 3,
        backoff: { type: "exponential", delay: 1000 },
        removeOnComplete: 1000,
        removeOnFail: 1000
      });
      return { jobId: job.id };
    } catch {
      throw new ServiceUnavailableException("AI service unavailable");
    }
  }
}
