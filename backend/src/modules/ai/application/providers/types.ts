export type AiProvider = "openai" | "deepseek" | "huggingface";

export interface AiRequest {
  prompt: string;
  userId: string;
  model?: string;
}

export interface AiResponse {
  provider: AiProvider;
  model: string;
  output: string;
  raw?: unknown;
}
