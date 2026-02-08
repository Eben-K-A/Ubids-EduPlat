import { Injectable, ServiceUnavailableException } from "@nestjs/common";
import { InjectQueue } from "@nestjs/bullmq";
import type { Queue } from "bullmq";

@Injectable()
export class AiService {
  constructor(@InjectQueue("ai") private readonly aiQueue: Queue) {}

  async requestAssistance(payload: { userId: string; prompt: string }) {
    try {
      const job = await this.aiQueue.add("assist", payload, {
        attempts: 3,
        backoff: { type: "exponential", delay: 1000 }
      });
      return { jobId: job.id };
    } catch {
      throw new ServiceUnavailableException("AI service unavailable");
    }
  }
}
