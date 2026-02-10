import { Processor, WorkerHost } from "@nestjs/bullmq";
import type { Job } from "bullmq";
import { ConfigService } from "@nestjs/config";
import { CircuitBreaker } from "../../ai/application/circuit-breaker";
import { AiProviderRouter } from "../../ai/application/ai-provider.router";

@Processor("ai")
export class AiProcessor extends WorkerHost {
  private breaker: CircuitBreaker;

  constructor(private readonly configService: ConfigService) {
    super();
    this.breaker = new CircuitBreaker(
      this.configService.get<number>("ai.circuitFailureThreshold") || 5,
      this.configService.get<number>("ai.circuitOpenSeconds") || 60
    );
  }

  async process(job: Job) {
    if (this.breaker.isOpen()) {
      throw new Error("AI circuit open");
    }

    try {
      const router = new AiProviderRouter(this.configService);
      const result = await router.assist({
        prompt: job.data.prompt,
        userId: job.data.userId,
        provider: job.data.provider,
        model: job.data.model
      });
      this.breaker.recordSuccess();
      return result;
    } catch (err) {
      this.breaker.recordFailure();
      throw err;
    }
  }
}
