import axios from "axios";
import { ConfigService } from "@nestjs/config";
import { AiRequest, AiResponse } from "./types";

export class HuggingFaceProvider {
  constructor(private readonly config: ConfigService) {}

  async assist(req: AiRequest): Promise<AiResponse> {
    const cfg = this.config.get<any>("ai.providers.huggingface");
    const model = req.model || cfg.model;
    if (!cfg?.apiKey) {
      throw new Error("Hugging Face API key not configured");
    }
    const client = axios.create({
      baseURL: cfg.baseUrl,
      headers: {
        Authorization: `Bearer ${cfg.apiKey}`
      },
      timeout: this.config.get<number>("ai.timeoutMs") || 10000
    });

    const response = await client.post(`/models/${model}`, {
      inputs: req.prompt
    });

    const output = Array.isArray(response.data)
      ? response.data?.[0]?.generated_text || ""
      : response.data?.generated_text || "";

    return { provider: "huggingface", model, output, raw: response.data };
  }
}
