import { ConfigService } from "@nestjs/config";
import { AiRequest, AiResponse, AiProvider } from "./providers/types";
import { OpenAiProvider } from "./providers/openai.provider";
import { DeepSeekProvider } from "./providers/deepseek.provider";
import { HuggingFaceProvider } from "./providers/huggingface.provider";

export class AiProviderRouter {
  constructor(private readonly config: ConfigService) {}

  async assist(request: AiRequest & { provider?: AiProvider }): Promise<AiResponse> {
    const provider = request.provider || this.config.get<AiProvider>("ai.defaultProvider") || "openai";
    if (provider === "deepseek") {
      return new DeepSeekProvider(this.config).assist(request);
    }
    if (provider === "huggingface") {
      return new HuggingFaceProvider(this.config).assist(request);
    }
    return new OpenAiProvider(this.config).assist(request);
  }
}
