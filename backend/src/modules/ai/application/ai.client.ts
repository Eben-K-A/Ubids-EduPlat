import axios, { AxiosInstance } from "axios";
import { ConfigService } from "@nestjs/config";

export class AiClient {
  private client: AxiosInstance;

  constructor(private readonly configService: ConfigService) {
    const baseURL = this.configService.get<string>("ai.url") || "";
    this.client = axios.create({
      baseURL,
      timeout: this.configService.get<number>("ai.timeoutMs") || 10000,
      headers: this.configService.get<string>("ai.key")
        ? { Authorization: `Bearer ${this.configService.get<string>("ai.key")}` }
        : undefined
    });
  }

  async assist(prompt: string, userId: string) {
    const response = await this.client.post("/assist", {
      prompt,
      userId
    });
    return response.data;
  }
}
