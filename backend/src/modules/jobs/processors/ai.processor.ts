import { Processor, WorkerHost } from "@nestjs/bullmq";
import type { Job } from "bullmq";

@Processor("ai")
export class AiProcessor extends WorkerHost {
  async process(job: Job) {
    return {
      status: "queued",
      input: job.data
    };
  }
}
