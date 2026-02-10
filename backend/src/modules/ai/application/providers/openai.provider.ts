import axios from "axios";
import { ConfigService } from "@nestjs/config";
import { AiRequest, AiResponse } from "./types";

export class OpenAiProvider {
  constructor(private readonly config: ConfigService) {}

  async assist(req: AiRequest): Promise<AiResponse> {
    const cfg = this.config.get<any>("ai.providers.openai");
    const model = req.model || cfg.model;
    if (!cfg?.apiKey) {
      throw new Error("OpenAI API key not configured");
    }
    const client = axios.create({
      baseURL: cfg.baseUrl,
      headers: {
        Authorization: `Bearer ${cfg.apiKey}`
      },
      timeout: this.config.get<number>("ai.timeoutMs") || 10000
    });

    const response = await client.post("/chat/completions", {
      model,
      messages: [{ role: "user", content: req.prompt }]
    });

    const output = response.data?.choices?.[0]?.message?.content || "";
    return { provider: "openai", model, output, raw: response.data };
  }
}
