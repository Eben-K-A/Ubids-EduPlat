import { ConfigService } from "@nestjs/config";
import axios from "axios";
import { AiProviderRouter } from "../src/modules/ai/application/ai-provider.router";

jest.mock("axios");

const mockedAxios = axios as unknown as { create: jest.Mock };

describe("AiProviderRouter", () => {
  it("routes to OpenAI provider", async () => {
    mockedAxios.create.mockReturnValue({
      post: jest.fn().mockResolvedValue({ data: { choices: [{ message: { content: "hi" } }] } })
    });

    const config = {
      get: (key: string) => {
        if (key === "ai.defaultProvider") return "openai";
        if (key === "ai.timeoutMs") return 10000;
        if (key === "ai.providers.openai") return { apiKey: "k", baseUrl: "https://api.openai.com/v1", model: "gpt-4o-mini" };
        return undefined;
      }
    } as ConfigService;

    const router = new AiProviderRouter(config);
    const result = await router.assist({ prompt: "test", userId: "u1" });
    expect(result.provider).toBe("openai");
    expect(result.output).toBe("hi");
  });
});
